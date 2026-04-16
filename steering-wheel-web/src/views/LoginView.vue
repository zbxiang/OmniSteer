<template>
  <div class="login-page">
    <div class="login-page__card">
      <div class="login-page__header">
        <div class="login-page__brand" aria-label="OmniSteer 品牌标识">
          <span class="login-page__brand-mark" aria-hidden="true">
            <svg
              class="login-page__brand-wheel"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="8.25" stroke="currentColor" stroke-width="1.65" />
              <circle cx="12" cy="12" r="2.35" fill="currentColor" />
              <path
                d="M12 3.75v3.2M12 17.05v3.2M3.75 12h3.2M17.05 12h3.2"
                stroke="currentColor"
                stroke-width="1.65"
                stroke-linecap="round"
              />
            </svg>
          </span>
          <span class="login-page__brand-title">OmniSteer</span>
        </div>
        <h1 class="login-page__title">{{ appStore.systemName }}</h1>
        <p class="login-page__subtitle">登录后继续使用后台管理</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-page__form"
        label-position="top"
        autocomplete="off"
        @submit.prevent="onSubmit"
      >
        <el-form-item
          label="用户名"
          prop="userNo"
          class="login-page__form-item"
        >
          <el-input
            v-model.trim="form.userNo"
            autocomplete="off"
            placeholder="请输入用户名"
            size="large"
          />
        </el-form-item>

        <el-form-item
          label="密码"
          prop="password"
          class="login-page__form-item"
        >
          <el-input
            v-model="form.password"
            type="password"
            autocomplete="new-password"
            placeholder="请输入密码"
            show-password
            size="large"
          />
        </el-form-item>

        <el-form-item class="login-page__form-item">
          <el-checkbox v-model="form.remember">记住我</el-checkbox>
        </el-form-item>

        <el-form-item class="login-page__form-item">
          <el-button
            type="primary"
            native-type="submit"
            :loading="loading"
            class="login-page__submit"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import type { LoginForm } from '@/types/auth';
import {
  RequestError,
  cancelRequest,
  isRequestCanceled,
} from '@/utils/request';
import { requestKey } from '@/constants/common';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';

const appStore = useAppStore();
const authStore = useAuthStore();
const loading = ref<boolean>(false);
const formRef = ref<FormInstance>();
const LOGIN_REMEMBER_KEY = 'omnisteer-login-remember';

const form = reactive<LoginForm>({
  userNo: '',
  password: '',
  remember: true,
});

const rules = reactive<FormRules<LoginForm>>({
  userNo: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
});

const loadRememberedForm = (): void => {
  const raw = localStorage.getItem(LOGIN_REMEMBER_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as {
      userNo?: string;
      password?: string;
      remember?: boolean;
    };
    if (parsed.remember !== true) return;
    form.userNo = parsed.userNo || '';
    form.password = '';
    form.remember = true;
  } catch {
    localStorage.removeItem(LOGIN_REMEMBER_KEY);
  }
};

const persistRememberedForm = (): void => {
  if (!form.remember) {
    localStorage.removeItem(LOGIN_REMEMBER_KEY);
    return;
  }
  localStorage.setItem(
    LOGIN_REMEMBER_KEY,
    JSON.stringify({
      userNo: form.userNo,
      remember: true,
    }),
  );
};

const onSubmit = async (): Promise<void> => {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) {
    return;
  }

  loading.value = true;
  try {
    cancelRequest(requestKey.loginCancelKey);
    await authStore.login(
      {
        userNo: form.userNo,
        password: form.password,
      },
      form.remember,
    );
    persistRememberedForm();
  } catch (e) {
    if (isRequestCanceled(e)) return;
    if (e instanceof RequestError) return;
    ElMessage.error('登录失败');
  } finally {
    loading.value = false;
  }
};

watch(
  () => form.remember,
  (remember) => {
    if (!remember) {
      localStorage.removeItem(LOGIN_REMEMBER_KEY);
    }
  },
);

onMounted(() => {
  loadRememberedForm();
});

onUnmounted(() => {
  cancelRequest(requestKey.loginCancelKey);
});
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  padding: 40px 16px;
  color: var(--color-zinc-text);
  background:
    radial-gradient(
      980px 340px at 50% -120px,
      var(--color-primary-amber-16) 0%,
      var(--color-primary-amber-08) 42%,
      transparent 78%
    ),
    var(--color-cockpit-bg-mid);
  display: flex;
  align-items: center;
}

.login-page__card {
  max-width: clamp(420px, 38vw, 580px);
  width: 100%;
  margin: 0 auto;
  border-radius: 12px;
  border: 1px solid var(--color-primary-amber-24);
  background: color-mix(
    in srgb,
    var(--color-cockpit-bg-mid-96) 94%,
    transparent
  );
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.24),
    0 1px 0 rgba(255, 255, 255, 0.06) inset;
  padding: 30px 24px;
}

@media (min-width: 1440px) {
  .login-page__card {
    max-width: 520px;
    width: 100%;
    padding: 36px 30px;
  }
}

@media (min-width: 1600px) {
  .login-page__card {
    max-width: 580px;
    width: 100%;
    padding: 40px 34px;
  }
}

@media (min-width: 1366px) {
  .login-page__card {
    max-width: 500px;
    width: 100%;
    padding: 34px 28px;
  }
}

.login-page__header {
  margin-bottom: 26px;
  text-align: center;
}

.login-page__brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.login-page__brand-mark {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(
    145deg,
    var(--color-primary-amber-70) 0%,
    var(--color-primary-amber) 52%,
    var(--color-primary-amber-85) 100%
  );
  box-shadow:
    0 1px 3px var(--color-primary-amber-45),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.login-page__brand-wheel {
  width: 18px;
  height: 18px;
}

.login-page__brand-text {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  text-align: left;
}

.login-page__brand-title {
  font-size: 18px;
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.login-page__brand-sub {
  font-size: 11px;
  color: var(--color-zinc-muted);
  line-height: 1.2;
}

.login-page__title {
  margin: 0;
  font-size: 22px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.login-page__subtitle {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--color-zinc-muted);
}

.login-page__form-item {
  margin-bottom: 16px;
}

.login-page__form-item:last-child {
  margin-bottom: 0;
}

.login-page__submit {
  width: 100%;
  height: 42px;
  border-radius: 8px;
  border: 1px solid var(--color-primary-amber-55);
  background: var(--color-primary-amber-85);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.login-page__submit:hover {
  border-color: var(--color-primary-amber);
  background: var(--color-primary-amber);
  box-shadow: 0 6px 14px
    color-mix(in srgb, var(--color-primary-amber-22) 62%, transparent);
}

.login-page__submit:active {
  transform: translateY(1px);
  box-shadow: none;
}

:deep(.login-page__form .el-form-item__label),
:deep(.login-page__form .el-checkbox__label) {
  color: var(--color-zinc-label);
}

:deep(.login-page__form .el-checkbox__input .el-checkbox__inner) {
  border-color: var(--color-primary-amber-35);
  background: transparent;
}

:deep(.login-page__form .el-checkbox__input:hover .el-checkbox__inner) {
  border-color: var(--color-primary-amber-55);
}

:deep(.login-page__form .el-checkbox__input.is-checked .el-checkbox__inner) {
  border-color: var(--color-primary-amber);
  background-color: var(--color-primary-amber);
}

:deep(.login-page__form .el-checkbox__input.is-focus .el-checkbox__inner) {
  box-shadow: 0 0 0 2px
    color-mix(in srgb, var(--color-primary-amber-18) 72%, transparent);
}

:deep(.login-page__form .el-checkbox__input.is-checked + .el-checkbox__label) {
  color: var(--color-zinc-text);
}

:deep(.login-page__form .el-input__wrapper) {
  background: var(--color-input-bg);
  border: 1px solid var(--color-primary-amber-22);
  border-radius: 8px;
  box-shadow: none;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

:deep(.login-page__form .el-input__inner) {
  background: transparent;
  color: var(--color-zinc-text);
}

:deep(.login-page__form .el-input__inner::placeholder) {
  color: var(--color-zinc-muted);
}

:deep(.login-page__form .el-input__wrapper),
:deep(.login-page__form .el-input__inner) {
  background-color: transparent !important;
}

:deep(.login-page__form .el-input__wrapper) {
  background-color: var(--color-input-bg) !important;
}

:deep(.login-page__form input.el-input__inner:-webkit-autofill),
:deep(.login-page__form input.el-input__inner:-webkit-autofill:hover),
:deep(.login-page__form input.el-input__inner:-webkit-autofill:focus),
:deep(.login-page__form input.el-input__inner:-webkit-autofill:active) {
  -webkit-text-fill-color: var(--color-zinc-text) !important;
  caret-color: var(--color-zinc-text);
  -webkit-box-shadow: 0 0 0 1000px var(--color-input-bg) inset !important;
  box-shadow: 0 0 0 1000px var(--color-input-bg) inset !important;
  background-color: var(--color-input-bg) !important;
}

:deep(.login-page__form .el-input__wrapper:hover) {
  border-color: var(--color-primary-amber-35);
}

:deep(.login-page__form .el-input__wrapper.is-focus) {
  border-color: var(--color-primary-amber-55);
  box-shadow: 0 0 0 1px
    color-mix(in srgb, var(--color-primary-amber-24) 72%, transparent);
}

@media (max-width: 560px) {
  .login-page {
    padding: 18px 12px;
    align-items: flex-start;
  }

  .login-page__card {
    max-width: none;
    width: 100%;
    padding: 24px 18px;
    border-radius: 10px;
  }

  .login-page__header {
    margin-bottom: 18px;
  }

  .login-page__brand {
    margin-bottom: 8px;
    gap: 8px;
  }

  .login-page__brand-mark {
    width: 28px;
    height: 28px;
    border-radius: 8px;
  }

  .login-page__brand-wheel {
    width: 16px;
    height: 16px;
  }

  .login-page__brand-title {
    font-size: 16px;
  }

  .login-page__title {
    font-size: 19px;
  }

  .login-page__subtitle {
    margin-top: 6px;
    font-size: 12px;
  }

  .login-page__form-item {
    margin-bottom: 12px;
  }

  .login-page__submit {
    height: 40px;
    border-radius: 8px;
    font-size: 14px;
  }

  :deep(.login-page__form .el-form-item__label) {
    padding-bottom: 4px;
    line-height: 1.3;
    font-size: 13px;
  }

  :deep(.login-page__form .el-input__wrapper) {
    min-height: 40px;
    border-radius: 8px;
  }

  :deep(.login-page__form .el-input__inner) {
    font-size: 13px;
  }
}

@media (max-width: 420px) {
  .login-page {
    padding: 12px 8px;
  }

  .login-page__card {
    max-width: none;
    width: 100%;
    padding: 18px 12px;
    border-radius: 9px;
  }

  .login-page__header {
    margin-bottom: 14px;
  }

  .login-page__brand-mark {
    width: 26px;
    height: 26px;
    border-radius: 7px;
  }

  .login-page__brand-wheel {
    width: 14px;
    height: 14px;
  }

  .login-page__brand-title {
    font-size: 15px;
  }

  .login-page__title {
    font-size: 17px;
  }

  .login-page__subtitle {
    font-size: 11px;
  }

  .login-page__submit {
    height: 38px;
    font-size: 13px;
  }

  :deep(.login-page__form .el-checkbox__label) {
    font-size: 12px;
  }

  :deep(.login-page__form .el-input__wrapper) {
    min-height: 38px;
  }
}
</style>
