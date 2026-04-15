<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 text-center">
    <p class="text-lg font-medium text-zinc-800">Sign up</p>
    <p class="mt-2 text-sm text-zinc-500">注册功能即将开放，请返回登录。</p>
    <router-link
      :to="{ name: 'login' }"
      class="mt-6 text-sm font-medium text-violet-600 hover:text-violet-700"
    >
      Back to log in
    </router-link>
  </div>
</template>

<script setup lang="ts">
</script>
