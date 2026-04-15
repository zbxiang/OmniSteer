import type { LoginParams } from '@/types/auth';
import type { ApiResponse } from '@/types/request';
import request from '@/utils/request';

const apiPrefix = import.meta.env.VITE_API_PROXY_PREFIX || '/api';

// 登录
export const login = (params: LoginParams): Promise<ApiResponse> => {
  return request.post(`${apiPrefix}/auth/login`, params);
};

// 退出登录
export const loginOut = (): Promise<void> => {
  return request.post(`${apiPrefix}/auth/logout`);
};