/// <reference types="vite/client" />

interface ImportMetaEnv {
  VITE_PASSWORD_SECRET?: string;
}
/// <reference types="element-plus/global" />
/// <reference types="vue/jsx-runtime" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}
