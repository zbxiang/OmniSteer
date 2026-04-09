<template>
  <div class="app-shell">
    <router-view />
    <div class="theme-switcher">
      <ThemeSelect :model-value="appStore.theme" @update:model-value="switchTheme" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/app';
import ThemeSelect from '@/components/ThemeSelect.vue';
import type { ThemeName } from '@/types';

const auth = useAuthStore();
const appStore = useAppStore();
const route = useRoute();
const router = useRouter();
let sessionTimer: ReturnType<typeof setInterval> | null = null;

const checkSession = (): void => {
  auth.ensureValidSession();
  if (route.name === 'login') return;
  if (!route.meta.requiresAuth) return;
  if (auth.isLoggedIn) return;
  void router.replace({
    name: 'login',
    query: { redirect: route.fullPath },
  });
};

onMounted((): void => {
  checkSession();
  sessionTimer = setInterval(checkSession, 15_000);
});

onUnmounted((): void => {
  if (!sessionTimer) return;
  clearInterval(sessionTimer);
  sessionTimer = null;
});

const switchTheme = (theme: ThemeName): void => {
  appStore.setTheme(theme);
};
</script>

<style scoped lang="scss">
.app-shell {
  position: relative;
}

.theme-switcher {
  position: fixed;
  right: 18px;
  top: 16px;
  z-index: 2200;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 12px;
  border: 1px solid var(--color-primary-amber-28);
  background: var(--color-panel-bg);
  box-shadow: 0 8px 22px color-mix(in srgb, var(--color-cockpit-bg-mid-97) 72%, #000);
}
</style>
