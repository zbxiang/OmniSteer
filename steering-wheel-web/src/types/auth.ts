export type LoginParams = {
  userNo: string;
  password: string;
};

export type LoginResult = {
  sessionId: string;
  username?: string;
  admin?: boolean;
  token_type?: string;
  expireTime?: string;
};

export type LoginApiResponse = {
  code: string;
  success: boolean;
  data?: {
    admin?: boolean;
    sessionId?: string;
  };
};

export type LoginForm = {
  userNo: string;
  password: string;
  remember: boolean;
};

export interface UserInfo {
  id?: string;
  userName?: string;
  admin?: boolean;
};