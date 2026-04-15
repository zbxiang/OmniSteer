// 获取localStorage
export const getStorage = (key: string): string => {
  return localStorage.getItem(key) ?? '';
};

// 设置localStorage
export const setStorage = (key: string, value: string): void => {
  localStorage.setItem(key, value);
};

// 删除localStorage
export const removeStorage = (key: string): void => {
  localStorage.removeItem(key);
};

// 获取sessionStorage
export const getSessionStorage = (key: string): string => {
  return sessionStorage.getItem(key) ?? '';
};

// 设置sessionStorage
export const setSessionStorage = (key: string, value: string): void => {
  sessionStorage.setItem(key, value);
};

// 删除sessionStorage
export const removeSessionStorage = (key: string): void => {
  sessionStorage.removeItem(key);
};

// 清理存储
export const clearStorage = (): void => {
  localStorage.clear();
};