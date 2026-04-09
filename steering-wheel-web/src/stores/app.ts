import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { ThemeName } from '@/types';

export const useAppStore = defineStore('app', () => {
  const systemName = ref('方向盘产品管理系统');
  const theme = ref<ThemeName>('cockpit');

  const setSystemName = (name: string): void => {
    systemName.value = name;
  };

  const applyTheme = (nextTheme: ThemeName): void => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const setTheme = (nextTheme: ThemeName): void => {
    theme.value = nextTheme;
    applyTheme(nextTheme);
    localStorage.setItem('omnisteer-theme', nextTheme);
  };

  const initTheme = (): void => {
    const savedTheme = localStorage.getItem('omnisteer-theme');
    if (savedTheme === 'amber' || savedTheme === 'cockpit' || savedTheme === 'indigo' || savedTheme === 'magenta' || savedTheme === 'teal' || savedTheme === 'emerald' || savedTheme === 'lime' || savedTheme === 'yellow' || savedTheme === 'stone' || savedTheme === 'mist' || savedTheme === 'olive') {
      theme.value = savedTheme;
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
