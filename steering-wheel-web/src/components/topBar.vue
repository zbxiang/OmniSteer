<template>
  <header
    ref="headerRef"
    class="product-list__topbar"
    :class="{ 'product-list__topbar--compact': isScrolled }"
  >
    <div class="product-list__topbar-inner">
      <router-link class="product-list__brand" to="/" title="返回产品列表">
        <span class="product-list__brand-mark" aria-hidden="true">
          <svg
            class="product-list__brand-wheel"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="8.25" stroke="currentColor" stroke-width="1.65" />
            <circle cx="12" cy="12" r="2.35" fill="currentColor" />
            <path
              d="M12 3.75v3.2M12 17.05v3.2M3.75 12h3.2M17.05 12h3.2"
              stroke="currentColor"
              stroke-width="1.65"
              stroke-linecap="round"
            />
          </svg>
        </span>
        <span class="product-list__brand-text">
          <span class="product-list__brand-title">OmniSteer</span>
          <span class="product-list__brand-sub">{{ systemName }}</span>
        </span>
      </router-link>

      <nav class="product-list__tabs" aria-label="主导航">
        <router-link class="product-list__tab" :class="{ 'product-list__tab--active': isHome }" to="/">
          产品列表
        </router-link>
        <router-link class="product-list__tab" :class="{ 'product-list__tab--active': isProductCreate }" to="/products/new">
          上架产品
        </router-link>
      </nav>

      <div class="product-list__user">
        <ThemePaletteButton appearance="embedded" />
        <span class="product-list__user-sep" aria-hidden="true" />
        <span class="product-list__avatar" aria-hidden="true">{{ userInitial }}</span>
        <span class="product-list__user-name">{{ displayName }}</span>
        <LogoutAction />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import LogoutAction from '@/components/LogoutAction.vue';
import ThemePaletteButton from '@/components/ThemePaletteButton.vue';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/app';

defineProps<{
  isHome: boolean;
  isProductCreate: boolean;
}>();

const authStore = useAuthStore();
const appStore = useAppStore();
const systemName = computed<string>(() => appStore.systemName);
const displayName = computed<string>(() => {
  const fallback = '管理员';
  const name = authStore.userInfo?.userName;
  return typeof name === 'string' && name.trim() ? name : fallback;
});
const userInitial = computed<string>(() => displayName.value.slice(0, 1).toUpperCase());

const emit = defineEmits<{
  /** 整块 header 实际高度（含底边），供下方 sticky 条紧贴定位 */
  layoutHeight: [heightPx: number];
}>();

const headerRef = ref<HTMLElement | null>(null);

/** 页面滚动后顶栏变矮，增加可读区域（阈值小 = 略一滚动即收缩） */
const isScrolled = ref(false);
const SCROLL_COMPACT_PX = 2;

const updateScrolled = (): void => {
  isScrolled.value = window.scrollY > SCROLL_COMPACT_PX;
};

const reportLayoutHeight = (): void => {
  const el = headerRef.value;
  if (!el) return;
  emit('layoutHeight', el.offsetHeight);
};

let resizeObserver: ResizeObserver | null = null;

onMounted((): void => {
  updateScrolled();
  window.addEventListener('scroll', updateScrolled, { passive: true });

  void nextTick((): void => {
    reportLayoutHeight();
    const el = headerRef.value;
    if (!el || typeof ResizeObserver === 'undefined') return;
    resizeObserver = new ResizeObserver((): void => {
      reportLayoutHeight();
    });
    resizeObserver.observe(el);
  });
});

onUnmounted((): void => {
  window.removeEventListener('scroll', updateScrolled);
  resizeObserver?.disconnect();
  resizeObserver = null;
});
</script>

<style scoped lang="scss">
$topbar-ease: cubic-bezier(0.22, 1, 0.36, 1);

.product-list__topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  flex-shrink: 0;
  /* 主题色导航：深色基底 + 主题色柔和泛光 */
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, #000 70%, var(--color-primary-amber-20)) 0%,
      color-mix(in srgb, #000 78%, var(--color-primary-amber-12)) 100%
    ),
    radial-gradient(
      118% 150% at 8% -35%,
      color-mix(in srgb, var(--color-primary-amber-35) 38%, transparent) 0%,
      transparent 62%
    ),
    radial-gradient(
      125% 170% at 96% -45%,
      color-mix(in srgb, var(--color-primary-amber-28) 32%, transparent) 0%,
      transparent 68%
    ),
    linear-gradient(
      175deg,
      color-mix(in srgb, var(--color-cockpit-bg-mid-97) 86%, var(--color-primary-amber-14)) 0%,
      color-mix(in srgb, var(--color-cockpit-bg-mid-96) 90%, var(--color-primary-amber-10)) 100%
    );
  backdrop-filter: saturate(1.04) blur(14px);
  -webkit-backdrop-filter: saturate(1.04) blur(14px);
  border-bottom: 1px solid color-mix(in srgb, var(--color-primary-amber-35) 48%, transparent);
  box-shadow:
    0 14px 36px rgba(0, 0, 0, 0.38),
    inset 0 1px 0 color-mix(in srgb, #fff 7%, transparent);
  transition:
    box-shadow 0.32s $topbar-ease,
    border-color 0.32s ease;
}

.product-list__topbar--compact {
  border-bottom-color: rgba(255, 255, 255, 0.06);
  box-shadow:
    0 10px 28px rgba(0, 0, 0, 0.42),
    inset 0 1px 0 color-mix(in srgb, #fff 5%, transparent);
}

.product-list__topbar::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    color-mix(in srgb, #fff 14%, transparent) 50%,
    transparent 100%
  );
  pointer-events: none;
}

/* 左右边距与 ProductView `.product-list__content` 保持一致 */
.product-list__topbar-inner {
  box-sizing: border-box;
  position: relative;
  margin: 0 auto;
  width: 100%;
  padding: 0 24px;
  min-height: 62px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 20px;
  transition: min-height 0.32s $topbar-ease, gap 0.32s $topbar-ease;
}

@media (min-width: 1440px) {
  .product-list__topbar-inner {
    padding: 0 36px;
  }
}

@media (max-width: 1366px) {
  .product-list__topbar-inner {
    padding: 0 16px;
  }
}

.product-list__topbar--compact .product-list__topbar-inner {
  min-height: 48px;
  gap: 14px;
}

.product-list__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-self: start;
  text-decoration: none;
  color: inherit;
  border-radius: 10px;
  padding: 4px 6px 4px 4px;
  margin: -4px -6px -4px -4px;
  transition:
    background-color 0.2s ease,
    gap 0.32s $topbar-ease,
    padding 0.32s $topbar-ease;
}

.product-list__topbar--compact .product-list__brand {
  gap: 8px;
  padding: 2px 6px 2px 2px;
}

.product-list__brand:hover {
  background-color: color-mix(in srgb, #fff 4%, transparent);
}

.product-list__brand:focus-visible {
  outline: 2px solid var(--color-primary-amber);
  outline-offset: 2px;
}

.product-list__brand-mark {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(
    145deg,
    var(--color-primary-amber-70) 0%,
    var(--color-primary-amber) 52%,
    var(--color-primary-amber-85) 100%
  );
  box-shadow:
    0 1px 3px var(--color-primary-amber-45),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
  transition:
    width 0.32s $topbar-ease,
    height 0.32s $topbar-ease,
    border-radius 0.32s $topbar-ease;
}

.product-list__topbar--compact .product-list__brand-mark {
  width: 28px;
  height: 28px;
  border-radius: 8px;
}

.product-list__brand-wheel {
  width: 19px;
  height: 19px;
  display: block;
  transition: width 0.32s $topbar-ease, height 0.32s $topbar-ease;
}

.product-list__topbar--compact .product-list__brand-wheel {
  width: 16px;
  height: 16px;
}
.product-list__brand-text { display: flex; flex-direction: column; align-items: flex-start; gap: 1px; min-width: 0; }
.product-list__brand-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-zinc-text);
  letter-spacing: 0.03em;
  line-height: 1.25;
  transition: font-size 0.32s $topbar-ease;
}

.product-list__topbar--compact .product-list__brand-title {
  font-size: 14px;
}

.product-list__brand-sub {
  font-size: 10px;
  color: color-mix(in srgb, var(--color-zinc-muted) 88%, transparent);
  line-height: 1.2;
  max-width: min(220px, 28vw);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-list__tabs { display: flex; align-items: stretch; justify-self: center; }
.product-list__tab {
  position: relative;
  padding: 18px 20px;
  font-size: 15px;
  color: color-mix(in srgb, #fff 68%, var(--color-zinc-muted));
  text-decoration: none;
  transition:
    color 0.2s ease,
    padding 0.32s $topbar-ease,
    font-size 0.32s $topbar-ease;
}

.product-list__topbar--compact .product-list__tab {
  padding: 10px 16px;
  font-size: 14px;
}
.product-list__tab:hover { color: color-mix(in srgb, #fff 90%, var(--color-primary-amber)); }
.product-list__tab--active {
  color: color-mix(in srgb, #fff 88%, var(--color-primary-amber));
  font-weight: 600;
}
.product-list__tab--active::before {
  content: '';
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 8px;
  height: 22px;
  border-radius: 999px;
  background: color-mix(
    in srgb,
    var(--color-primary-amber-12) 26%,
    var(--color-cockpit-bg-mid-97) 74%
  );
  border: 1px solid color-mix(in srgb, rgba(255, 255, 255, 0.24) 55%, transparent);
  z-index: -1;
  transition:
    left 0.32s $topbar-ease,
    right 0.32s $topbar-ease,
    bottom 0.32s $topbar-ease,
    height 0.32s $topbar-ease;
}

.product-list__topbar--compact .product-list__tab--active::before {
  left: 6px;
  right: 6px;
  bottom: 5px;
  height: 18px;
}
.product-list__tab--active::after {
  content: '';
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 0;
  height: 3px;
  border-radius: 2px 2px 0 0;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--color-primary-amber-55) 72%, transparent) 0%,
    color-mix(in srgb, var(--color-primary-amber) 82%, transparent) 50%,
    color-mix(in srgb, var(--color-primary-amber-55) 72%, transparent) 100%
  );
  transition: left 0.32s $topbar-ease, right 0.32s $topbar-ease;
}

.product-list__topbar--compact .product-list__tab--active::after {
  left: 14px;
  right: 14px;
  height: 2px;
}

.product-list__user {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-self: end;
  transition: gap 0.32s $topbar-ease;
}

.product-list__topbar--compact .product-list__user {
  gap: 9px;
}

.product-list__user-sep {
  width: 1px;
  height: 18px;
  background: color-mix(in srgb, var(--color-primary-amber-28) 58%, transparent);
  flex-shrink: 0;
  transition: height 0.32s $topbar-ease;
}

.product-list__topbar--compact .product-list__user-sep {
  height: 14px;
}

/* 退出按钮与头像尺寸对齐（常态 30 / 收缩态 26） */
:deep(.product-list__logout) {
  width: 30px;
  height: 30px;
  border-radius: 50%;
}

:deep(.product-list__logout svg) {
  width: 15px;
  height: 15px;
}

.product-list__topbar--compact :deep(.product-list__logout) {
  width: 26px;
  height: 26px;
  border-radius: 50%;
}

.product-list__topbar--compact :deep(.product-list__logout svg) {
  width: 14px;
  height: 14px;
}

:deep(.product-list__logout) {
  margin-left: 8px;
}

.product-list__topbar--compact :deep(.product-list__logout) {
  margin-left: 6px;
}
.product-list__avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: color-mix(in srgb, #fff 84%, var(--color-primary-amber-20));
  color: var(--color-primary-amber);
  border: 1px solid var(--color-primary-amber-24);
  font-size: 11px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    width 0.32s $topbar-ease,
    height 0.32s $topbar-ease,
    font-size 0.32s $topbar-ease;
}

.product-list__topbar--compact .product-list__avatar {
  width: 22px;
  height: 22px;
  font-size: 9px;
}

.product-list__user-name {
  font-size: 12px;
  color: var(--color-zinc-text);
  transition: font-size 0.32s $topbar-ease;
}

.product-list__topbar--compact .product-list__user-name {
  font-size: 11px;
}

</style>

