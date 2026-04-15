<template>
  <div class="not-found-page flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 text-zinc-900">
    <div class="max-w-md text-center">
      <p class="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">404</p>
      <h1 class="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">页面不存在</h1>
      <p class="mt-3 text-[15px] leading-relaxed text-zinc-600">
        链接可能有误或页面已被移动。请检查地址，或从首页重新进入。
      </p>
      <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          @click="goHome"
        >
          返回首页
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-zinc-900/10"
          @click="goBack"
        >
          返回上一页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const goHome = (): void => {
  void router.replace({ name: 'home' });
};

const goBack = (): void => {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  void router.replace({ name: 'home' });
};
</script>
