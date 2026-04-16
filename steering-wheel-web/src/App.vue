<template>
  <div class="app-shell">
    <!-- 顶栏已包含主题入口；仅在无顶栏场景保留右下角轻量入口 -->
    <div v-if="showFloatingThemeButton" class="app-floating-theme">
      <ThemePaletteButton appearance="floating" />
    </div>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ThemePaletteButton from '@/components/ThemePaletteButton.vue';

const route = useRoute();
const router = useRouter();

const isAuthShellRoute = computed(
  (): boolean =>
    route.name === 'login' ||
    route.name === 'signup' ||
    route.name === 'forbidden' ||
    route.name === 'notFound',
);

const showFloatingThemeButton = computed((): boolean => {
  if (isAuthShellRoute.value) return false;
  const n = route.name;
  return n === 'productEdit';
});

let sessionTimer: ReturnType<typeof setInterval> | null = null;

const routeNeedsAuth = (): boolean =>
  route.matched.some((record) => record.meta.requiresAuth === true);

const checkSession = (): void => {
  if (
    route.name === 'login' ||
    route.name === 'signup' ||
    route.name === 'forbidden' ||
    route.name === 'notFound'
  ) {
    return;
  }
  if (!routeNeedsAuth()) return;
  void router.replace({
    name: 'login',
    query: { redirect: route.fullPath },
  });
};

const onVisibilityChange = (): void => {
  if (document.visibilityState !== 'visible') return;
  checkSession();
};

onMounted((): void => {
  checkSession();
  sessionTimer = setInterval(checkSession, 15_000);
  document.addEventListener('visibilitychange', onVisibilityChange);
});

onUnmounted((): void => {
  document.removeEventListener('visibilitychange', onVisibilityChange);
  if (!sessionTimer) return;
  clearInterval(sessionTimer);
  sessionTimer = null;
});
</script>

<style scoped lang="scss">
.app-shell {
  position: relative;
}

.app-floating-theme {
  position: fixed;
  right: 20px;
  bottom: 22px;
  z-index: 2100;
  pointer-events: none;

  :deep(.theme-palette-btn) {
    pointer-events: auto;
  }
}
</style>
