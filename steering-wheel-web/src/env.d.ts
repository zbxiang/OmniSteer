/// <reference types="vite/client" />

interface ImportMetaEnv {
  // 按需扩展构建时环境变量
}
/// <reference types="element-plus/global" />
/// <reference types="vue/jsx-runtime" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}
