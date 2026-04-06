export type LoginBody = {
  username: string;
  password: string;
};

export type LoginResult = {
  token: string;
  username: string;
  token_type?: string;
};
