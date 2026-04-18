import { ref } from 'vue';
import { defineStore } from 'pinia';

const DEFAULT_DATA_THEME = 'white';

export const useAppStore = defineStore('app', () => {
  const systemName = ref('方向盘产品管理系统');

  const setSystemName = (name: string): void => {
    systemName.value = name;
  };

  /** 应用启动时设置文档主题（固定为默认主题，无切换入口） */
  const initTheme = (): void => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', DEFAULT_DATA_THEME);
  };

  return {
    systemName,
    setSystemName,
    initTheme,
  };
});
