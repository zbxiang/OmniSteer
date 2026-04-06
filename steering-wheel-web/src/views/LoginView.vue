<template>
  <div
    ref="rootRef"
    class="login"
  >
    <!-- 橙色座舱底 + 指针光晕 + 装饰层 -->
    <div class="login__warm-base" aria-hidden="true" />
    <div class="login__pointer-glow" aria-hidden="true" />
    <div class="login__spotlight" aria-hidden="true" />
    <div class="login__blobs" aria-hidden="true">
      <div class="login__blob login__blob--a" />
      <div class="login__blob login__blob--b" />
      <div class="login__blob login__blob--c" />
    </div>
    <div class="login__motion" aria-hidden="true" />
    <div class="login__grid" />
    <div class="login__scan" aria-hidden="true" />
    <div class="login__vignette" aria-hidden="true" />
    <div
      class="login__ripple"
      :class="{ 'login__ripple--on': rippleActive }"
      aria-hidden="true"
    />
    <div
      class="login__fx-hitarea"
      aria-hidden="true"
      @pointerenter="onFxPointerEnter"
      @pointermove="onFxPointerMove"
      @pointerleave="onFxPointerLeave"
      @pointerdown="onFxPointerDown"
    />

    <div class="login__wheel-wrap">
      <div class="login__wheel-ring">
        <svg
          class="login__wheel-svg"
          viewBox="0 0 240 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="wheelMetal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.45" />
              <stop offset="50%" stop-color="currentColor" stop-opacity="0.18" />
              <stop offset="100%" stop-color="currentColor" stop-opacity="0.38" />
            </linearGradient>
            <linearGradient id="wheelRim" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#7c2d12" stop-opacity="0.52" />
              <stop offset="40%" stop-color="#ea580c" stop-opacity="0.42" />
              <stop offset="72%" stop-color="#fb923c" stop-opacity="0.34" />
              <stop offset="100%" stop-color="#fed7aa" stop-opacity="0.28" />
            </linearGradient>
          </defs>
          <circle cx="120" cy="120" r="108" stroke="url(#wheelRim)" stroke-width="3" opacity="0.9" />
          <circle cx="120" cy="120" r="108" stroke="url(#wheelMetal)" stroke-width="10" />
          <circle
            cx="120"
            cy="120"
            r="108"
            stroke="currentColor"
            stroke-opacity="0.08"
            stroke-width="2"
          />
          <circle
            cx="120"
            cy="120"
            r="34"
            stroke="currentColor"
            stroke-opacity="0.2"
            stroke-width="8"
          />
          <path
            d="M120 120V32M120 120V208M120 120H32M120 120H208M120 120L52 52M120 120L188 188M120 120L188 52M120 120L52 188"
            stroke="currentColor"
            stroke-opacity="0.14"
            stroke-width="5"
            stroke-linecap="round"
          />
        </svg>
        <div class="login__wheel-ticks" />
      </div>
    </div>

    <div class="login__main">
      <header class="login__header">
        <p class="login__badge">OmniSteer · 车载系统</p>
        <h1 class="login__title">{{ appStore.systemName }}</h1>
        <p class="login__hint">请验证身份以进入控制台</p>
      </header>

      <div
        ref="panelTiltRef"
        class="login__panel-3d"
      >
        <div class="login__panel">
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-position="top"
            class="login-form"
          >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="form.username"
              placeholder="驾驶员 ID"
              size="large"
              clearable
              autocomplete="username"
            />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="访问密钥"
              size="large"
              show-password
              clearable
              autocomplete="current-password"
              @keyup.enter="onSubmit"
            />
          </el-form-item>
          <div class="login__form-row">
            <el-checkbox v-model="form.remember" class="remember-check">保持会话</el-checkbox>
          </div>
          <el-button
            type="primary"
            size="large"
            class="login-cta login__submit"
            :loading="loading"
            @click="onSubmit"
          >
            启动系统
          </el-button>
        </el-form>
        </div>
      </div>

      <p class="login__demo">DEMO · 默认账号 admin / 123456（密码 ≥ 6 位）</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as Vue from 'vue';
import * as VueRouter from 'vue-router';
import { ElMessage } from 'element-plus';
import { cancelRequest, isRequestCanceled, loginApi, loginErrorMessage } from '@/api';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';

const router = VueRouter.useRouter();
const route = VueRouter.useRoute();
const appStore = useAppStore();
const authStore = useAuthStore();
const LOGIN_CANCEL_KEY = 'POST:/auth/login';

const formRef = Vue.ref<import('element-plus').FormInstance>();
const loading = Vue.ref(false);

const form = Vue.reactive({
  username: '',
  password: '',
  remember: true,
});

const rules: import('element-plus').FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
};

const onSubmit = async () => {
  if (!formRef.value) return;
  const isValid = await formRef.value.validate().catch(() => false);
  if (!isValid) return;

  loading.value = true;
  try {
    // 显式取消上一次未完成的登录请求，避免重复提交竞态
    cancelRequest(LOGIN_CANCEL_KEY);
    const res = await loginApi({
      username: form.username,
      password: form.password,
    });
    authStore.setToken(res.token, form.remember, res.username);
    const redirect =
      typeof route.query.redirect === 'string' &&
      route.query.redirect.startsWith('/')
        ? route.query.redirect
        : '/';
    await router.replace(redirect);
  } catch (e) {
    if (isRequestCanceled(e)) return;
    ElMessage.error(loginErrorMessage(e));
  } finally {
    loading.value = false;
  }
};

/** 根容器：指针光晕 --sx/--sy、装饰层视差 --mx/--my（-1…1） */
const rootRef = Vue.ref<HTMLElement | null>(null);
/** 登录卡片 3D 微倾斜（主流「磁吸卡片」交互） */
const panelTiltRef = Vue.ref<HTMLElement | null>(null);
const rippleActive = Vue.ref(false);
let rippleTimer: ReturnType<typeof setTimeout> | null = null;
let fxRafId: number | null = null;
const fxRect = Vue.ref<DOMRect | null>(null);
const fxPending = Vue.reactive({
  clientX: 0,
  clientY: 0,
});

const refreshFxRect = () => {
  const el = rootRef.value;
  if (!el) return;
  fxRect.value = el.getBoundingClientRect();
};

const applyFxPointer = () => {
  fxRafId = null;
  const el = rootRef.value;
  const r = fxRect.value;
  if (!el || !r || r.width <= 0 || r.height <= 0) return;
  const sx = ((fxPending.clientX - r.left) / r.width) * 100;
  const sy = ((fxPending.clientY - r.top) / r.height) * 100;
  const nx = (((fxPending.clientX - r.left) / r.width) * 2) - 1;
  const ny = (((fxPending.clientY - r.top) / r.height) * 2) - 1;
  el.style.setProperty('--sx', `${sx}%`);
  el.style.setProperty('--sy', `${sy}%`);
  el.style.setProperty('--mx', nx.toFixed(4));
  el.style.setProperty('--my', ny.toFixed(4));
};

const onFxPointerEnter = () => {
  refreshFxRect();
};

const onFxPointerMove = (e: PointerEvent) => {
  if (!fxRect.value) refreshFxRect();
  fxPending.clientX = e.clientX;
  fxPending.clientY = e.clientY;
  if (fxRafId !== null) return;
  fxRafId = requestAnimationFrame(applyFxPointer);
};

const onFxPointerLeave = () => {
  if (fxRafId !== null) {
    cancelAnimationFrame(fxRafId);
    fxRafId = null;
  }
  const el = rootRef.value;
  if (!el) return;
  el.style.setProperty('--sx', '50%');
  el.style.setProperty('--sy', '48%');
  el.style.setProperty('--mx', '0');
  el.style.setProperty('--my', '0');
};

const onFxPointerDown = (e: PointerEvent) => {
  const el = rootRef.value;
  if (!el) return;
  const r = el.getBoundingClientRect();
  const rx = ((e.clientX - r.left) / r.width) * 100;
  const ry = ((e.clientY - r.top) / r.height) * 100;
  el.style.setProperty('--rx', `${rx}%`);
  el.style.setProperty('--ry', `${ry}%`);
  rippleActive.value = false;
  requestAnimationFrame(() => {
    rippleActive.value = true;
    if (rippleTimer) clearTimeout(rippleTimer);
    rippleTimer = setTimeout(() => {
      rippleActive.value = false;
    }, 620);
  });
};

Vue.onMounted(() => {
  refreshFxRect();
  onFxPointerLeave();
  window.addEventListener('resize', refreshFxRect);
});

Vue.onUnmounted(() => {
  if (rippleTimer) clearTimeout(rippleTimer);
  if (fxRafId !== null) cancelAnimationFrame(fxRafId);
  window.removeEventListener('resize', refreshFxRect);
  cancelRequest(LOGIN_CANCEL_KEY);
});
</script>

<style lang="scss" scoped>
.login {
  --mx: 0;
  --my: 0;
  --sx: 50%;
  --sy: 48%;
  --rx: 50%;
  --ry: 50%;
  --panel-rx: 0deg;
  --panel-ry: 0deg;

  position: relative;
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 3rem 1rem;
  isolation: isolate;

  &__warm-base {
    pointer-events: none;
    position: absolute;
    inset: 0;
    z-index: 0;
    background:
      radial-gradient(ellipse 120% 70% at 50% 115%, rgba(249, 115, 22, 0.22) 0%, transparent 52%),
      radial-gradient(ellipse 90% 50% at 50% 108%, rgba(251, 146, 60, 0.09) 0%, transparent 48%),
      radial-gradient(ellipse 55% 45% at 10% 15%, rgba(249, 115, 22, 0.12) 0%, transparent 55%),
      radial-gradient(ellipse 50% 40% at 92% 8%, rgba(253, 186, 116, 0.1) 0%, transparent 50%),
      linear-gradient(168deg, v.$cockpit-bg-top 0%, v.$cockpit-bg-mid 48%, v.$cockpit-bg-bottom 100%);
  }

  &__pointer-glow {
    pointer-events: none;
    position: absolute;
    inset: 0;
    z-index: 1;
    background: radial-gradient(
      circle min(72vw, 640px) at var(--sx, 50%) var(--sy, 48%),
      rgba(v.$primary-amber, 0.15) 0%,
      rgba(251, 146, 60, 0.09) 36%,
      rgba(253, 186, 116, 0.06) 50%,
      transparent 62%
    );
    mix-blend-mode: screen;
    opacity: 0.95;
    transition: opacity 0.3s ease;
  }

  &__spotlight {
    pointer-events: none;
    position: absolute;
    inset: 0;
    z-index: 2;
    background: radial-gradient(
      circle min(58vw, 500px) at calc(50% + var(--mx) * 16%) calc(44% + var(--my) * 12%),
      rgba(v.$accent-warm, 0.11) 0%,
      rgba(v.$primary-amber, 0.09) 45%,
      transparent 70%
    );
    mix-blend-mode: screen;
    opacity: 0.75;
  }

  &__blobs {
    pointer-events: none;
    position: absolute;
    inset: -15%;
    z-index: 3;
    overflow: hidden;
    transform: translate(calc(var(--mx) * 28px), calc(var(--my) * 22px));
    will-change: transform;
  }

  &__blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(72px);
    opacity: 0.85;
    mix-blend-mode: screen;
    will-change: transform;

    &--a {
      width: min(55vw, 480px);
      height: min(55vw, 480px);
      top: -8%;
      left: -12%;
      background: radial-gradient(
        circle,
        rgba(v.$primary-amber, 0.45) 0%,
        rgba(v.$primary-amber, 0.08) 45%,
        transparent 70%
      );
      animation: login-blob-a 22s ease-in-out infinite alternate;
    }

    &--b {
      width: min(48vw, 420px);
      height: min(48vw, 420px);
      bottom: -5%;
      right: -15%;
      background: radial-gradient(
        circle,
        rgba(v.$accent-warm, 0.32) 0%,
        rgba(v.$accent-warm, 0.07) 50%,
        transparent 72%
      );
      animation: login-blob-b 28s ease-in-out infinite alternate;
    }

    &--c {
      width: min(70vw, 640px);
      height: min(70vw, 640px);
      left: 50%;
      top: 55%;
      transform: translate(-50%, -50%);
      background: radial-gradient(
        circle,
        rgba(249, 115, 22, 0.15) 0%,
        rgba(251, 146, 60, 0.1) 40%,
        rgba(253, 186, 116, 0.07) 52%,
        transparent 58%
      );
      filter: blur(96px);
      opacity: 0.66;
      mix-blend-mode: screen;
      animation: login-blob-c 18s ease-in-out infinite alternate;
    }
  }

  &__motion {
    pointer-events: none;
    position: absolute;
    inset: 0;
    z-index: 4;
    transform: translate(calc(var(--mx) * -12px), calc(var(--my) * -10px));
    will-change: transform;
    opacity: 0.35;
    background: repeating-linear-gradient(
      -18deg,
      transparent,
      transparent 2px,
      rgba(255, 255, 255, 0.02) 2px,
      rgba(255, 255, 255, 0.02) 3px
    );
    background-size: 14px 14px;
    mask-image: radial-gradient(ellipse 90% 80% at 50% 50%, black 20%, transparent 75%);
    animation: login-motion-drift 10s linear infinite;
  }

  &__grid {
    pointer-events: none;
    position: absolute;
    inset: 0;
    z-index: 5;
    transform: translate(calc(var(--mx) * 14px), calc(var(--my) * 10px))
      rotate(calc(var(--mx) * 0.9deg));
    will-change: transform;
    opacity: 0.055;
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.07) 1px, transparent 1px);
    background-size: 40px 40px;
    background-position: center center;
    mask-image: radial-gradient(ellipse 95% 90% at 50% 45%, black 35%, transparent 78%);
    animation: login-grid-pulse 14s ease-in-out infinite;
  }

  &__scan {
    pointer-events: none;
    position: absolute;
    inset: 0;
    z-index: 6;
    transform: translate(calc(var(--mx) * -6px), calc(var(--my) * 18px));
    will-change: transform;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      rgba(v.$primary-amber, 0.04) 48%,
      rgba(v.$primary-amber, 0.07) 50%,
      rgba(v.$primary-amber, 0.04) 52%,
      transparent 100%
    );
    background-size: 100% 220%;
    animation: login-scan 7.5s ease-in-out infinite;
    opacity: 0.62;
    mix-blend-mode: overlay;
  }

  &__vignette {
    pointer-events: none;
    position: absolute;
    inset: 0;
    z-index: 7;
    box-shadow:
      inset 0 0 100px rgba(0, 0, 0, 0.55),
      inset 0 -80px 120px rgba(0, 0, 0, 0.45);
    background: radial-gradient(
      ellipse 75% 65% at 50% 50%,
      transparent 30%,
      rgba(0, 0, 0, 0.35) 100%
    );
  }

  &__ripple {
    pointer-events: none;
    position: absolute;
    inset: 0;
    z-index: 8;
    opacity: 0;
    transform-origin: var(--rx, 50%) var(--ry, 50%);
    background: radial-gradient(
      circle 26% at var(--rx, 50%) var(--ry, 50%),
      rgba(v.$primary-amber, 0.42),
      transparent 62%
    );
    mix-blend-mode: screen;

    &--on {
      animation: login-ripple-flash 0.62s cubic-bezier(0.22, 0.82, 0.28, 1) forwards;
    }
  }

  &__wheel-wrap {
    pointer-events: none;
    position: absolute;
    z-index: 9;
    left: 50%;
    top: 50%;
    transform: translate(calc(-50% + var(--mx) * -26px), calc(-58% + var(--my) * -20px));
    will-change: transform;
    user-select: none;
  }

  &__fx-hitarea {
    position: absolute;
    inset: 0;
    z-index: 10;
    pointer-events: auto;
  }

  &__wheel-ring {
    position: relative;
    width: min(92vw, 520px);
    height: min(92vw, 520px);
    color: rgba(v.$primary-amber, 0.9);
    animation: login-wheel-drift 14s ease-in-out infinite;
  }

  &__wheel-svg {
    display: block;
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 0 60px rgba(v.$primary-amber, 0.12));
  }

  &__wheel-ticks {
    position: absolute;
    inset: 12%;
    border-radius: 9999px;
    border: 1px solid rgba(v.$primary-amber, 0.14);
    box-shadow: inset 0 0 40px rgba(v.$primary-amber, 0.06);
  }

  &__main {
    position: relative;
    z-index: 20;
    width: 100%;
    max-width: 420px;
    pointer-events: auto;
  }

  &__panel-3d {
    perspective: none;
    transform-style: flat;
    pointer-events: auto;
  }

  &__header {
    margin-bottom: 2rem;
    text-align: center;
  }

  &__badge {
    margin: 0 0 0.5rem;
    font-family: ui-monospace, monospace;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.35em;
    color: rgba(v.$primary-amber, 0.7);
  }

  &__title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: 0.025em;
    background: linear-gradient(to bottom, v.$zinc-text, v.$zinc-label);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;

    @media (min-width: 768px) {
      font-size: 1.875rem;
    }
  }

  &__hint {
    margin: 0.75rem 0 0;
    font-size: 0.875rem;
    color: v.$zinc-muted;
  }

  &__panel {
    border-radius: 1rem;
    border: 1px solid rgba(v.$primary-amber, 0.26);
    padding: 2rem;
    background: linear-gradient(145deg, v.$panel-bg 0%, rgba(v.$cockpit-bg-mid, 0.96) 100%);
    backdrop-filter: blur(20px);
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.45),
      0 24px 80px rgba(0, 0, 0, 0.5);
    transform: none;
    transform-style: flat;
    transition:
      border-color 0.35s ease,
      box-shadow 0.35s ease;
    pointer-events: auto;
    z-index: 30;

    &:hover {
      border-color: rgba(v.$primary-amber, 0.36);
    }

    &:focus-within {
      border-color: rgba(v.$primary-amber, 0.48);
      box-shadow:
        0 0 0 1px rgba(0, 0, 0, 0.35),
        0 24px 80px rgba(0, 0, 0, 0.45),
        0 0 52px rgba(v.$primary-amber, 0.1),
        0 0 1px rgba(v.$accent-warm, 0.2);
    }
  }

  &__form-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  &__submit {
    width: 100%;
    font-weight: 600 !important;
    letter-spacing: 0.2em !important;
  }

  &__demo {
    margin: 2rem 0 0;
    text-align: center;
    font-family: ui-monospace, monospace;
    font-size: 11px;
    line-height: 1.625;
    color: v.$zinc-faint;
  }
}

@keyframes login-blob-a {
  0% {
    transform: translate(0, 0) scale(1);
  }

  100% {
    transform: translate(12%, 8%) scale(1.08);
  }
}

@keyframes login-blob-b {
  0% {
    transform: translate(0, 0) scale(1.02);
  }

  100% {
    transform: translate(-10%, -6%) scale(1);
  }
}

@keyframes login-blob-c {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.55;
  }

  100% {
    transform: translate(-50%, -52%) scale(1.12);
    opacity: 0.8;
  }
}

@keyframes login-motion-drift {
  0% {
    background-position: 0 0;
  }

  100% {
    background-position: 28px 18px;
  }
}

@keyframes login-grid-pulse {
  0%,
  100% {
    opacity: 0.045;
  }

  50% {
    opacity: 0.075;
  }
}

@keyframes login-scan {
  0%,
  100% {
    background-position: 0 -40%;
  }

  50% {
    background-position: 0 140%;
  }
}

@keyframes login-ripple-flash {
  0% {
    opacity: 0;
    transform: scale(0.88);
  }

  35% {
    opacity: 0.9;
  }

  100% {
    opacity: 0;
    transform: scale(1.35);
  }
}

@keyframes login-wheel-drift {
  0%,
  100% {
    transform: rotate(-2deg) scale(1);
    opacity: 0.95;
  }

  50% {
    transform: rotate(2deg) scale(1.02);
    opacity: 1;
  }
}

:deep(.login-form .el-form-item__label) {
  color: v.$zinc-label;
  font-size: 12px;
  letter-spacing: 0.08em;
}

:deep(.login-form .el-input__wrapper) {
  background-color: v.$input-bg !important;
  box-shadow:
    0 0 0 1px rgba(v.$primary-amber, 0.22) inset,
    0 1px 0 rgba(255, 255, 255, 0.04) inset !important;
  border-radius: 10px;
}

:deep(.login-form .el-input__wrapper:hover) {
  box-shadow:
    0 0 0 1px rgba(v.$primary-amber, 0.38) inset,
    0 0 20px rgba(v.$primary-amber, 0.06) !important;
}

:deep(.login-form .el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px rgba(v.$primary-amber, 0.55) inset,
    0 0 24px rgba(v.$primary-amber, 0.12) !important;
}

:deep(.login-form .el-input__inner) {
  color: v.$zinc-text;
}

:deep(.login-form .el-input__inner::placeholder) {
  color: v.$zinc-faint;
}

:deep(.remember-check .el-checkbox__label) {
  color: v.$zinc-label;
  font-size: 13px;
}

:deep(.remember-check .el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: v.$primary-amber;
  border-color: v.$primary-amber;
}

.login-cta {
  --el-button-bg-color: rgb(194 65 12);
  --el-button-border-color: rgb(234 88 12);
  --el-button-hover-bg-color: rgb(234 88 12);
  --el-button-hover-border-color: #{v.$primary-amber};
  --el-button-active-bg-color: rgb(154 52 18);
  border-radius: 10px;
  box-shadow: 0 0 22px rgba(v.$primary-amber, 0.28);
  transition:
    transform 0.2s ease,
    box-shadow 0.25s ease;

  &:hover:not(:disabled) {
    box-shadow: 0 0 34px rgba(v.$primary-amber, 0.38);
  }

  &:active:not(:disabled) {
    transform: scale(0.985);
  }
}

@media (prefers-reduced-motion: reduce) {
  .login__blob,
  .login__motion,
  .login__grid,
  .login__scan,
  .login__wheel-ring {
    animation: none !important;
  }

  .login__ripple {
    display: none;
  }

  .login__pointer-glow {
    opacity: 0.35;
  }

  .login__panel {
    transform: none !important;
    transition: border-color 0.35s ease, box-shadow 0.35s ease !important;
  }

  .login__blobs,
  .login__motion,
  .login__grid,
  .login__scan,
  .login__wheel-wrap,
  .login__main {
    transform: none !important;
  }

  .login__spotlight {
    opacity: 0.35;
  }
}
</style>
