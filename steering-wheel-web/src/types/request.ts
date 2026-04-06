import type { AxiosRequestConfig } from 'axios';

export type RequestMeta = {
  cancelKey?: string;
};

export type RequestConfig = AxiosRequestConfig & RequestMeta;

export type RequestErrorOptions = {
  status?: number;
  code?: string;
  isCanceled?: boolean;
};
