import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosProgressEvent,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { ElMessage } from 'element-plus';
import { USER_STATUS } from '@/enums/auth';
import { useAuthStore } from '@/stores/auth';
import { requestTimeout } from '@/constants/common';
import { filterEmptyData, isEmptyData } from '@/utils/common';
import { setStorage } from '@/utils/storage';
import type { ApiResponse, RequestConfig, RequestErrorOptions, RequestMeta } from '@/types/request';
import type { DefineAxiosResponse, DefineInternalRequestConfig } from '@/types/request';

const baseURL =
  import.meta.env.DEV || !import.meta.env.VITE_API_BASE_URL
    ? ''
    : import.meta.env.VITE_API_BASE_URL;

export class RequestError extends Error {
  status?: number;
  code?: string;
  isCanceled: boolean;

  constructor(message: string, options?: RequestErrorOptions) {
    super(message);
    this.name = 'RequestError';
    this.status = options?.status;
    this.code = options?.code;
    this.isCanceled = Boolean(options?.isCanceled);
  }
}

class Request {
  private readonly instance: AxiosInstance;
  // 用于存储请求的控制器
  private readonly pendingControllers = new Map<string, AbortController>();

  constructor() {
    this.instance = axios.create({
      baseURL,
      timeout: requestTimeout,
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });

    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: DefineInternalRequestConfig) => {
        // 生成请求唯一 key: 支持业务自定义 requestKey
        const requestConfig = config as InternalAxiosRequestConfig & RequestMeta;
        const requestKey = requestConfig?.requestKey;

        // 如果该请求已存在，先取消旧请求
        if (requestKey) {
          if (this.pendingControllers.has(requestKey)) {
            this.pendingControllers.get(requestKey)?.abort('取消重复请求');
            this.pendingControllers.delete(requestKey);
          }

          // 创建新的取消令牌
          const controller = new AbortController();
          requestConfig.signal = controller.signal;
          requestConfig.cancelTokenKey = requestKey;
          requestConfig.cancelKey = requestKey;
          this.pendingControllers.set(requestKey, controller);
        }
        return requestConfig;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // 响应拦截器（成功回调里会解包 data，与 Axios 默认类型不完全一致，故对返回值做断言）
    this.instance.interceptors.response.use(
      (response: DefineAxiosResponse<ApiResponse>) => {
        const { config, data, headers } = response;
        const requestKey = config?.requestKey || config?.cancelTokenKey || config?.cancelKey;

        // 清理令牌
        if (requestKey && this.pendingControllers.has(requestKey)) {
          this.pendingControllers.delete(requestKey);
        }

        // 兼容后端多种成功协议：success=true、code=0、code=200、code=00000（含字符串）
        const codeValue = data?.code;
        const normalizedCode = isEmptyData(codeValue) ? '' : String(codeValue);
        const successByCode =
          normalizedCode === '' ||
          normalizedCode === '0' ||
          normalizedCode === '200' ||
          normalizedCode === '00000';
        const successByFlag = data?.success === true;
        const isNotSuccess = !successByFlag && !successByCode;
        if (isNotSuccess) {
          ElMessage.error(data?.message || '数据异常');
          const auth = useAuthStore();
          const permissionCode = Number(codeValue);
          // 用户不存在
          if (permissionCode === 10003) {
            setStorage('userStatus', USER_STATUS.NO_USER);
            auth.toNotPermission();
          }
          if (permissionCode === 10019) {
            setStorage('userStatus', USER_STATUS.LOCKED);
            auth.toNotPermission();
          }
          setStorage('permissionCode', normalizedCode);
          return Promise.reject(
            new RequestError(data?.message || '数据异常', {
              code: normalizedCode,
            }),
          );
        }

        // 下载接口需要从响应中获取文件名
        const fileName = headers['Content-Disposition']?.split('filename=')[1] || headers['Content-Disposition']?.split('filename*=UTF-8\'\'')[1];
        if (fileName) {
          return {
            data: {
              fileName: decodeURIComponent(fileName)?.replace(/"|'/g, ''),
              blobData: data,
            },
          } as unknown as AxiosResponse;
        }
        return data as unknown as AxiosResponse;
      },
      (error) => {
        const config = error.response;
  
        const requestKey = config?.requestKey || config?.cancelTokenKey || config?.cancelKey;

        // 清理取消令牌
        if (requestKey && this.pendingControllers.has(requestKey)) {
          this.pendingControllers.delete(requestKey);
        }

        // 日志接口失败不提示
        const reqType = (config.headers as Record<string, unknown>)?.['x-request-type'];
        if (reqType === 'log') {
          console.log('日志请求失败');
          return Promise.reject(error);
        }

        // 其他状态异常情况
        this.handleRequestError(error);
        return Promise.reject(error);
      },
    );
  }

  private handleRequestError(error: AxiosError<ApiResponse>): void {
    if (!error.response) {
      if (error.request) {
        ElMessage.error('网络错误');
        return;
      }
      ElMessage.error('请求配置错误');
      return;
    }
    const { status, data } = error.response;
    const auth = useAuthStore();
    switch (status) {
      case 401:
        ElMessage.error('未登录或登录已过期，请重新登录');
        auth.toJumpLogin();
        break;
      case 403:
        ElMessage.error('没有权限访问该资源');
        break;
      case 404:
        ElMessage.error('请求地址不存在');
        break;
      case 500:
        ElMessage.error('服务器内部错误');
        break;
      default: {
        const message = data?.message;
        const desc =
          message && typeof message === 'object'
            ? (message as { desc?: string }).desc
            : '';
        ElMessage.error(
          (typeof message === 'string' ? message : desc) || '请求失败',
        );
        break;
      }
    }
  }

  // 获取
  public get = <T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
    isFilterEmpty = true,
  ): Promise<T> => {
    const newData = isFilterEmpty ? filterEmptyData(data) : data;
    return this.instance.get<T, T>(url, {
      ...config,
      params: newData,
    });
  };

  // 新增
  public post = <T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
    isFilterEmpty = true,
  ): Promise<T> => {
    const payload = isFilterEmpty ? filterEmptyData(data) : data;
    return this.instance.post<T, T>(url, payload, config);
  };

  // 修改
  public put = <T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
    isFilterEmpty = true,
  ): Promise<T> => {
    const payload = isFilterEmpty ? filterEmptyData(data) : data;
    return this.instance.put<T, T>(url, payload, config);
  };

  // 删除
  public delete = <T = unknown>(
    url: string,
    config?: RequestConfig,
  ): Promise<T> => {
    return this.instance.delete<T, T>(url, config);
  };

  public patch = <T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig,
    isFilterEmpty = true,
  ): Promise<T> => {
    const payload = isFilterEmpty ? filterEmptyData(data) : data;
    return this.instance.patch<T, T>(url, payload, config);
  };

  // 取消指定请求
  public cancelRequest(requestKey: string): void {
    console.log('取消请求');
    if (this.pendingControllers.has(requestKey)) {
      this.pendingControllers.get(requestKey)?.abort();
      this.pendingControllers.delete(requestKey);
    }
  }

  // 取消所有请求
  public cancelAllRequests(): void {
    console.log('取消所有请求');
    this.pendingControllers.forEach((controller) => controller.abort());
    this.pendingControllers.clear();
  }

  // 上传请求（FormData；由 loaded/total 计算进度百分比）
  public uploadRequest = <T = unknown>(
    url: string,
    formData?: FormData,
    onProgress?: (_progress: number) => void,
  ): Promise<T> => {
    return this.instance.post<T, T>(url, formData, {
      // 不传 Content-Type，由运行时带正确 boundary；手写 boundary 会与真实 FormData 不一致
      onUploadProgress: onProgress
        ? (evt: AxiosProgressEvent): void => {
            if (!evt.total) return;
            onProgress(Math.min(100, Math.round((evt.loaded / evt.total) * 100)));
          }
        : undefined,
    });
  };
}

const request = new Request();

export const cancelRequest = (cancelKey: string): void => {
  request.cancelRequest(cancelKey);
};

export const cancelAllRequests = (): void => {
  request.cancelAllRequests();
};

export const isRequestCanceled = (error: unknown): boolean =>
  error instanceof RequestError && error.isCanceled;

export default request;
