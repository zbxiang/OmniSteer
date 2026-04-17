import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { ThemeName } from '@/types/theme';

export const useAppStore = defineStore('app', () => {
  const systemName = ref('方向盘产品管理系统');
  const theme = ref<ThemeName>('white');
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

  const setTheme = (nextTheme: ThemeName): void => {
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
    const savedTheme = localStorage.getItem('omnisteer-theme');
    if (savedTheme && themeList.includes(savedTheme as ThemeName)) {
      theme.value = savedTheme as ThemeName;
    } else {
      theme.value = 'white';
    }
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
