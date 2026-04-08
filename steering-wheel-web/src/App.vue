<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
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
</script>
