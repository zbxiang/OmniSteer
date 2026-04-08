import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { RequestConfig, RequestErrorOptions, RequestMeta } from '@/types';

const baseURL =
  import.meta.env.DEV || !import.meta.env.VITE_API_BASE_URL
    ? ''
    : import.meta.env.VITE_API_BASE_URL;

/** 与 `stores/auth.ts` 中 TOKEN_KEY 保持一致 */
const TOKEN_KEY = 'omnisteer_token';

const readTokenFromStorage = (): string => {
  if (typeof localStorage === 'undefined') return '';
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY) ?? '';
};

const instance: AxiosInstance = axios.create({
  baseURL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

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

const pendingControllers = new Map<string, AbortController>();

const buildCancelKey = (config: RequestConfig): string | undefined => {
  const method = (config.method || 'GET').toUpperCase();
  if (!config.url) return undefined;
  return `${method}:${config.url}`;
};

const clearCancelKey = (config?: RequestConfig): void => {
  const key = config?.cancelKey || buildCancelKey(config || {});
  if (!key) return;
  pendingControllers.delete(key);
};

const normalizeError = (error: unknown): RequestError => {
  if (error instanceof RequestError) return error;
  if (axios.isCancel(error)) {
    return new RequestError('请求已取消', {
      code: 'REQUEST_ABORTED',
      isCanceled: true,
    });
  }

  const ax = error as AxiosError<{ detail?: unknown; message?: string }>;
  const status = ax.response?.status;
  const detail = ax.response?.data?.detail;
  const dataMessage = ax.response?.data?.message;

  let message = '请求失败，请稍后重试';
  if (typeof detail === 'string') {
    message = detail;
  } else if (Array.isArray(detail)) {
    const parts = detail
      .map((d) => (typeof d === 'object' && d !== null && 'msg' in d ? String((d as { msg: unknown }).msg) : ''))
      .filter(Boolean);
    if (parts.length > 0) message = parts.join('；');
  } else if (typeof dataMessage === 'string' && dataMessage) {
    message = dataMessage;
  } else if (ax.message) {
    message = ax.message;
  }

  return new RequestError(message, {
    status,
    code: ax.code,
    isCanceled: ax.code === 'ERR_CANCELED',
  });
};

instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = readTokenFromStorage();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const requestConfig = config as InternalAxiosRequestConfig & RequestMeta;
  const key = requestConfig.cancelKey || buildCancelKey(requestConfig);
  if (!key) return requestConfig;

  // 相同 key 的请求发起前，先中止前一个（防抖/避免重复提交）
  const prev = pendingControllers.get(key);
  if (prev) {
    prev.abort();
    pendingControllers.delete(key);
  }

  const controller = new AbortController();
  requestConfig.signal = controller.signal;
  requestConfig.cancelKey = key;
  pendingControllers.set(key, controller);
  return requestConfig;
});

instance.interceptors.response.use(
  (response) => {
    clearCancelKey(response.config);
    return response.data;
  },
  (error) => {
    clearCancelKey(error?.config);
    return Promise.reject(normalizeError(error));
  },
);

export const cancelRequest = (cancelKey: string): void => {
  const controller = pendingControllers.get(cancelKey);
  if (!controller) return;
  controller.abort();
  pendingControllers.delete(cancelKey);
};

export const cancelAllRequests = (): void => {
  pendingControllers.forEach((controller) => controller.abort());
  pendingControllers.clear();
};

export const isRequestCanceled = (error: unknown): boolean =>
  error instanceof RequestError && error.isCanceled;

const request = {
  request<T = unknown>(config: RequestConfig): Promise<T> {
    return instance.request<T, T>(config);
  },
  get<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    return instance.get<T, T>(url, config);
  },
  post<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return instance.post<T, T>(url, data, config);
  },
  put<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return instance.put<T, T>(url, data, config);
  },
  patch<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return instance.patch<T, T>(url, data, config);
  },
  delete<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    return instance.delete<T, T>(url, config);
  },
};

export default request;
