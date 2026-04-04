<script setup lang="ts">
import { useAppStore } from '../stores/app';

import { storeToRefs } from 'pinia';

const store = useAppStore();
const { systemName } = storeToRefs(store);

</script>

<template>
  <div class="min-h-screen bg-slate-100 p-8">
    <div class="mx-auto max-w-5xl">
      <el-card shadow="never" class="rounded-xl">
        <template #header>
          <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-slate-800">{{ systemName }}</h1>
            <el-tag type="success">Vue3 + Vite</el-tag>
          </div>
        </template>

        <el-alert
          title="项目已完成初始化，可直接开始业务开发。"
          type="success"
          :closable="false"
          class="mb-4"
        />

        <div class="grid grid-cols-1 gap-3 text-slate-700 md:grid-cols-2">
          <div class="rounded-lg bg-slate-50 p-4">路由: vue-router</div>
          <div class="rounded-lg bg-slate-50 p-4">状态: pinia</div>
          <div class="rounded-lg bg-slate-50 p-4">请求: axios</div>
          <div class="rounded-lg bg-slate-50 p-4">UI: element-plus + tailwindcss</div>
        </div>
      </el-card>
    </div>
  </div>
</template>