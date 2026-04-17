import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { ThemeName } from '@/types/theme';

export const useAppStore = defineStore('app', () => {
  const systemName = ref('方向盘产品管理系统');
  const theme = ref<ThemeName>('white');
  const LOCKED_THEME: ThemeName = 'white';
  const themeList: ThemeName[] = [
    'white',
    'red',
    'orange',
    'amber',
    'yellow',
    'lime',
    'green',
    'emerald',
    'teal',
    'cyan',
    'sky',
    'blue',
    'indigo',
    'violet',
    'purple',
    'magenta',
    'pink',
    'rose',
    'stone',
    'gray',
    'zinc',
    'neutral',
    'taupe',
    'mist',
    'olive',
  ];

  const setSystemName = (name: string): void => {
    systemName.value = name;
  };

  const applyTheme = (nextTheme: ThemeName): void => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const setTheme = (_nextTheme: ThemeName): void => {
    // 锁定为白色主题：忽略任何外部切换请求
    const nextTheme = LOCKED_THEME;
    if (nextTheme === theme.value) return;

    const commit = (): void => {
      theme.value = nextTheme;
      applyTheme(nextTheme);
      localStorage.setItem('omnisteer-theme', nextTheme);
    };

    if (typeof document !== 'undefined' && typeof document.startViewTransition === 'function') {
      const transition = document.startViewTransition(commit);
      // Chromium may reject transition promises with AbortError when it decides to skip animation.
      // Swallow that expected case to avoid noisy "Uncaught (in promise)" in console.
      void transition.finished.catch((error: unknown): void => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        throw error;
      });
    } else {
      commit();
    }
  };

  const initTheme = (): void => {
    // 锁定为白色主题：忽略本地缓存主题
    theme.value = LOCKED_THEME;
    localStorage.setItem('omnisteer-theme', LOCKED_THEME);
    applyTheme(theme.value);
  };

  return {
    systemName,
    theme,
    setSystemName,
    setTheme,
    initTheme,
  };
});
