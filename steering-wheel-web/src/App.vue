<template>
  <div class="app-shell">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

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
  if (authStore.isAuthenticated()) return;
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
</style>
