import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

const TOKEN_KEY = 'omnisteer_token';
const USERNAME_KEY = 'omnisteer_username';

function readToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY) ?? '';
}

function readUsername(): string {
  return localStorage.getItem(USERNAME_KEY) ?? sessionStorage.getItem(USERNAME_KEY) ?? '';
}

function isTokenExpired(token: string): boolean {
  if (!token) return true;
  const parts = token.split('.');
  if (parts.length < 2) return true;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
    if (!payload.exp) return true;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(readToken());
  const username = ref(readUsername());

  const isLoggedIn = computed(() => Boolean(token.value) && !isTokenExpired(token.value));

  const setToken = (value: string, persist: boolean, displayName?: string): void => {
    token.value = value;
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    sessionStorage.removeItem(USERNAME_KEY);
    if (!value) {
      username.value = '';
      return;
    }
    username.value = displayName ?? '';
    const storage = persist ? localStorage : sessionStorage;
    storage.setItem(TOKEN_KEY, value);
    if (displayName) {
      storage.setItem(USERNAME_KEY, displayName);
    }
  };

  const logout = (): void => {
    setToken('', false);
  };

  const ensureValidSession = (): void => {
    if (!token.value) return;
    if (isTokenExpired(token.value)) {
      setToken('', false);
    }
  };

  return {
    token,
    username,
    isLoggedIn,
    setToken,
    logout,
    ensureValidSession,
  };
});
