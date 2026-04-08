import type { LoginBody, LoginResult } from '@/types';
import { encryptPassword } from '@/utils/crypto';
import request, { RequestError } from '../request';

const apiPrefix = import.meta.env.VITE_API_PROXY_PREFIX || '/api';

export async function loginApi(body: LoginBody): Promise<LoginResult> {
  return request.post<LoginResult>(
    `${apiPrefix}/auth/login`,
    {
      ...body,
      password: encryptPassword(body.password),
    },
    {
      cancelKey: 'POST:/auth/login',
    },
  );
}

export function loginErrorMessage(err: unknown): string {
  if (err instanceof RequestError) {
    return err.message;
  }
  return '登录失败，请稍后重试';
}
