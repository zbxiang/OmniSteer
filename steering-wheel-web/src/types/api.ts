export type LoginBody = {
  username: string;
  password: string;
};

export type LoginResult = {
  token: string;
  username: string;
  token_type?: string;
};

export type ProductLite = {
  name: string;
  brand: string;
  model: string;
};
