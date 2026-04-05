import axios, { type AxiosError } from 'axios';

const apiPrefix = import.meta.env.VITE_API_PROXY_PREFIX || '/api';

/** 开发走 Vite 代理；生产用环境变量中的 API 根地址（同域可留空） */
const http = axios.create({
  baseURL:
    import.meta.env.DEV || !import.meta.env.VITE_API_BASE_URL
      ? ''
      : import.meta.env.VITE_API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

export type LoginBody = {
  username: string;
  password: string;
};

export type LoginResult = {
  token: string;
  username: string;
  token_type?: string;
};

export async function loginApi(body: LoginBody): Promise<LoginResult> {
  const { data } = await http.post<LoginResult>(`${apiPrefix}/auth/login`, body);
  return data;
}

export function loginErrorMessage(err: unknown): string {
  const ax = err as AxiosError<{ detail?: unknown }>;
  const detail = ax.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const parts = detail.map((d) =>
      typeof d === 'object' && d !== null && 'msg' in d ? String((d as { msg: unknown }).msg) : '',
    );
    return parts.filter(Boolean).join('；') || '请求参数无效';
  }
  return '登录失败，请稍后重试';
}
