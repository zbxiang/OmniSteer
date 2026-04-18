import type { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

export type RequestMeta = {
  /** 自定义请求唯一标识（用于去重/取消） */
  requestKey?: string;
  /** 请求取消令牌（推荐） */
  cancelTokenKey?: string;
  /** 兼容旧字段 */
  cancelKey?: string;
};

export type RequestConfig = AxiosRequestConfig & RequestMeta;

export type RequestErrorOptions = {
  status?: number;
  code?: string;
  isCanceled?: boolean;
  isNotified?: boolean;
};

/** 与后端一致：message 可为字符串或 { code, desc } */
export type ApiMessage =
  | string
  | {
      code?: string | number;
      desc?: string;
      dec?: string;
      msg?: string;
      message?: string;
    };

export type ApiResponse<T = any> = {
  code?: number;
  message?: ApiMessage;
  data?: T;
  success?: boolean;
};

export type DefineInternalRequestConfig = InternalAxiosRequestConfig & RequestMeta;

export type DefineAxiosResponse<T = unknown, D = unknown> = AxiosResponse<T, D> & {
  config: DefineInternalRequestConfig;
};
