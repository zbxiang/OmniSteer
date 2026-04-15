<template>
  <div class="min-h-screen bg-zinc-50 px-4 py-10 text-zinc-900">
    <div
      class="mx-auto max-w-[420px] rounded-2xl border border-zinc-200 bg-white px-6 py-8 shadow-sm sm:px-8"
    >
      <div class="mb-8 text-center">
        <h1 class="text-2xl font-semibold tracking-tight">
          {{ appStore.systemName }}
        </h1>
        <p class="mt-2 text-sm text-zinc-500">登录后继续使用后台管理</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="space-y-5"
        label-position="top"
        @submit.prevent="onSubmit"
      >
        <el-form-item label="用户名" prop="userNo" class="mb-0">
          <el-input
            v-model.trim="form.userNo"
            autocomplete="username"
            placeholder="请输入用户名"
            size="large"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password" class="mb-0">
          <el-input
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            placeholder="请输入密码"
            show-password
            size="large"
          />
        </el-form-item>

        <el-form-item class="mb-0">
          <el-checkbox v-model="form.remember">记住我</el-checkbox>
        </el-form-item>

        <el-form-item class="mb-0">
          <el-button
            type="primary"
            native-type="submit"
            :loading="loading"
            class="h-11! w-full! rounded-lg! border-zinc-900! bg-zinc-900! text-sm! font-medium! transition hover:bg-zinc-800!"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import type { LoginForm } from '@/types/auth';
import {
  RequestError,
  cancelRequest,
  isRequestCanceled,
} from '@/utils/request';
import { requestKey } from '@/constants/common';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';

const appStore = useAppStore();
const authStore = useAuthStore();
const loading = ref<boolean>(false);
const formRef = ref<FormInstance>();

const form = reactive<LoginForm>({
  userNo: '',
  password: '',
  remember: true,
});

const rules = reactive<FormRules<LoginForm>>({
  userNo: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
});

const onSubmit = async (): Promise<void> => {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) {
    return;
  }

  loading.value = true;
  try {
    cancelRequest(requestKey.loginCancelKey);
    await authStore.login(
      {
        userNo: form.userNo,
        password: form.password,
      },
      form.remember,
    );
  } catch (e) {
    if (isRequestCanceled(e)) return;
    if (e instanceof RequestError) return;
    ElMessage.error('登录失败');
  } finally {
    loading.value = false;
  }
};

onUnmounted(() => {
  cancelRequest(requestKey.loginCancelKey);
});
</script>
