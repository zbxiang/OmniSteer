import { ref } from 'vue';
import { defineStore } from 'pinia';
import { clearStorage, getStorage,removeStorage, setStorage } from '@/utils/storage';
import type { LoginParams, LoginResult, UserInfo } from '@/types/auth';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { USER_STATUS } from '@/enums/auth';
import { debounce } from 'lodash-es';
import { login as sigLogin, loginOut } from '@/api/auth';

// 计时器
let refreshTimer: ReturnType<typeof setInterval> | null = null;
// 提醒刷新时间，27分钟
const tipTime = 27 * 60 * 1000;
// 刷新时间间隔 3分钟
const delay = 3 * 60 * 1000;
const REDIRECT_URL_KEY = 'redirectUrl';
const TOKEN_KEY = 'omnisteer_token';
const THEME_KEY = 'omnisteer-theme';
const LOGIN_REMEMBER_KEY = 'omnisteer-login-remember';

// 页面操作事件
const userEvent = ['click', 'keydown', 'scroll'];

export const useAuthStore = defineStore('auth', () => {
  const userInfo = ref<UserInfo | null>(null);
  const token = ref<string>(getStorage(TOKEN_KEY) || '');
  const redirectUrl = ref<string>(getStorage(REDIRECT_URL_KEY) || '');
  const router = useRouter();
  const fetchPromise = ref<Promise<any> | null>(null); // 当前用户信息请求 Promise
  const appLoading = ref<boolean>(false); // 应用加载状态
  const loggingOut = ref<boolean>(false);

  // 保存用户信息
  const setUserInfo = (data: any): void => {
    setStorage('userInfo', JSON.stringify(data));
    userInfo.value = data;
  };

  /** 兼容旧登录态接口：同步 token 与用户名 */
  const setToken = (value: string, persist = true): void => {
    const storageSetter = persist ? setStorage : setStorage;
    token.value = value;
    if (!value) {
      removeStorage(TOKEN_KEY);
      return;
    }
    storageSetter(TOKEN_KEY, value);
  };

  const clearAuthStorage = (): void => {
    removeStorage(TOKEN_KEY);
    removeStorage('userInfo');
    token.value = '';
    userInfo.value = null;
  };

  const ensureValidSession = (): void => {
    token.value = getStorage(TOKEN_KEY) || '';
    const rawUser = getStorage('userInfo');
    if (!rawUser) return;
    try {
      userInfo.value = JSON.parse(rawUser) as UserInfo;
    } catch {
      userInfo.value = null;
      removeStorage('userInfo');
    }
  };

  const isAuthenticated = (): boolean => {
    ensureValidSession();
    return Boolean(token.value || userInfo.value);
  };

  // 账号密码登录
  const login = async (params: LoginParams, remember = true): Promise<void> => {
    appLoading.value = true;
    clearRefreshTimer();
    const res = await sigLogin(params);
    appLoading.value = false;
    const loginResult = res?.data as LoginResult & { sessionId?: string };
    setToken(loginResult.sessionId || '', remember);
    setUserInfo(loginResult as unknown as UserInfo);
    // 记录登录状态
    setStorage('userStatus', USER_STATUS.NORMAL);
    // 记录过期时间
    const time = (loginResult as unknown as { expireTime?: string }).expireTime;
    if (time) {
      setStorage('expireTime', time);
      // 开启计时器
      startRefreshTimer();
    }

    // 跳转回跳地址
    const redirect =
      typeof router.currentRoute.value.query.redirect === 'string' &&
      router.currentRoute.value.query.redirect.startsWith('/')
        ? router.currentRoute.value.query.redirect
        : '/products';
    await router.replace(redirect);
  };

  // 存储当前路由
  const setRedirectUrl = (): void => {
    const target = router.currentRoute.value.fullPath;
    redirectUrl.value = target;
    if (['/403', '/404'].includes(target)) return;
    setStorage(REDIRECT_URL_KEY, target);
  };

  // 退出登录
  const toLoginOut = async (): Promise<void> => {
    if (loggingOut.value) return;
    loggingOut.value = true;
    try {
      try {
        await loginOut();
      } finally {
        handleClearAll();
      }
      await router.replace({ name: 'login' });
    } catch {
      await router.replace('/login');
    } finally {
      loggingOut.value = false;
    }
  };

  // 统一跳转登录页，并携带当前页回跳地址
  const toJumpLogin = (): void => {
    handleClearAll();
    setRedirectUrl();
    const current = router.currentRoute.value;
    void router.replace({
      name: 'login',
      query: { redirect: current.fullPath },
    });
  };

  // 统一跳转到无权限页面（403）
  const toNotPermission = (): void => {
    void router.replace('/403');
  };

  // 更新时间
  const setStorageTime = (key: 'expireTime' | 'updateTime' | 'startTime', timeValue?: string): void => {
    const time = new Date();
    const timeStr = timeValue || time.toLocaleString();
    setStorage(key, timeStr);
  };

  // 获取时间
  const getStorageTime = (key: 'expireTime' | 'updateTime' | 'startTime'): number => {
    const timeStr = getStorage(key) ?? '';
    if (!timeStr) {
      if (key === 'expireTime') {
        // 退出登录
        toLoginOut();
      } else if (key === 'startTime') {
        // 退出登录
        toLoginOut();
      } else {
        setStorageTime('updateTime');
      }
    }
    const time = new Date(timeStr);
    return time.getTime();
  };

  // 打印登录时间检查日志
  const timeLog = (): void => {
    // noop: 保留函数结构，避免构建时 no-console warning
  };

  // 检查
  const checkTimeOut = (): void => {
    setStorageTime('updateTime');

    // 超时退出登录
    if ((getStorageTime('expireTime') - getStorageTime('updateTime')) >= 0) {
      timeLog();
      ElMessage.error('登录超时，即将退出登录');
      handleClearAll();
    }
  };

  // 检查登录时效
  const startRefreshTimer = (): void => {
    // 清理旧定时器
    clearRefreshTimer();
    // 获取开始时间
    setStorageTime('startTime');
    // 检查是否超时
    checkTimeOut();

    // 2分钟检查一次
    refreshTimer = setInterval(async () => {
      // 检查是否超时
      checkTimeOut();
      timeLog();
      // 无操作后27分钟提示一次
      const tipDom = document.querySelector('.refresh-login-confirm');
      if (((getStorageTime('updateTime') - getStorageTime('startTime')) >= tipTime) && !tipDom) {
        try {
          await ElMessageBox.confirm('已登录27分钟，3分钟后自动退出登录，是否刷新登录状态？', '提示', {
            customClass: 'refresh-login-confirm',
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
            closeOnClickModal: false,
            closeOnPressEscape: false,
          });
          // 退出登录
          toLoginOut();
        } catch {
          // 退出登录
          toLoginOut();
        }
      }
    }, delay);
  };

  // 清理定时器
  const clearRefreshTimer = (): void => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  };

  // 清理
  const handleClearAll = (): void => {
    const themeValue = getStorage(THEME_KEY);
    const loginRememberValue = getStorage(LOGIN_REMEMBER_KEY);
    // 清理存储
    clearStorage();
    if (themeValue) {
      setStorage(THEME_KEY, themeValue);
    }
    if (loginRememberValue) {
      setStorage(LOGIN_REMEMBER_KEY, loginRememberValue);
    }
    clearAuthStorage();
    // 清理定时器
    clearRefreshTimer();
  };

  // 事件操作触发
  const eventOperation = (e: any): void => {
    const isLogin = getStorage('userInfo');
    if (!isLogin) return;
    const tipDom = e?.target?.document.querySelector?.('.refresh-login-confirm');
    if (tipDom) {
      return;
    }
    // 每次操作获取最新过期时间
    toLoginOut();
  };

  const debounceFun = debounce(eventOperation, 700);

  // 监听页面操作事件
  const handleOperation = (): void => {
    userEvent.forEach(item => {
      document.addEventListener(item, debounceFun);
    });
  };

  // 移除页面操作事件
  const removeOperation = (): void => {
    userEvent.forEach(item => {
      document.removeEventListener(item, debounceFun);
    });
    clearRefreshTimer();
  };

  

  return {
    userInfo,
    token,
    appLoading,
    fetchPromise,
    isAuthenticated,
    ensureValidSession,
    setToken,
    clearAuthStorage,
    handleOperation,
    removeOperation,
    setUserInfo,
    toJumpLogin,
    login,
    setRedirectUrl,
    toLoginOut,
    toNotPermission,
  };
});
