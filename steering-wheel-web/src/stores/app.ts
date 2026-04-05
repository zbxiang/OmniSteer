import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', () => {
  const systemName = ref('方向盘产品管理系统');

  const setSystemName = (name: string) => {
    systemName.value = name;
  };

  return {
    systemName,
    setSystemName,
  };
});
