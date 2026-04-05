import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

const TOKEN_KEY = 'omnisteer_token';

function readToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY) ?? '';
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(readToken());

  const isLoggedIn = computed(() => Boolean(token.value));

  const setToken = (value: string, persist: boolean) => {
    token.value = value;
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    if (!value) return;
    if (persist) {
      localStorage.setItem(TOKEN_KEY, value);
    } else {
      sessionStorage.setItem(TOKEN_KEY, value);
    }
  };

  const logout = () => {
    setToken('', false);
  };

  return {
    token,
    isLoggedIn,
    setToken,
    logout,
  };
});
