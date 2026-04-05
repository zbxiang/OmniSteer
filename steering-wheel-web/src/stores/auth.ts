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

export const useAuthStore = defineStore('auth', () => {
  const token = ref(readToken());
  const username = ref(readUsername());

  const isLoggedIn = computed(() => Boolean(token.value));

  const setToken = (value: string, persist: boolean, displayName?: string) => {
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

  const logout = () => {
    setToken('', false);
  };

  return {
    token,
    username,
    isLoggedIn,
    setToken,
    logout,
  };
});
