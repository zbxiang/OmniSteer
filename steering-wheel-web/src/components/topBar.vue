<template>
  <header
    ref="headerRef"
    class="product-list__topbar"
    :class="{
      'product-list__topbar--compact': isScrolled,
      'product-list__topbar--menu-open': isMobileMenuOpen,
    }"
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

      <button
        class="product-list__mobile-menu-btn"
        type="button"
        :aria-expanded="isMobileMenuOpen ? 'true' : 'false'"
        aria-controls="topbar-mobile-nav"
        aria-label="切换导航菜单"
        @click="toggleMobileMenu"
      >
        <span class="product-list__mobile-menu-icon" aria-hidden="true" />
      </button>

      <nav id="topbar-mobile-nav" class="product-list__tabs" :class="{ 'product-list__tabs--open': isMobileMenuOpen }" aria-label="主导航">
        <div class="product-list__mobile-section">
          <p class="product-list__mobile-section-title">导航</p>
          <router-link class="product-list__tab" :class="{ 'product-list__tab--active': isHome }" to="/" @click="closeMobileMenu">
            产品列表
          </router-link>
          <router-link class="product-list__tab" :class="{ 'product-list__tab--active': isProductCreate }" to="/products/new" @click="closeMobileMenu">
            上架产品
          </router-link>
        </div>
        <div class="product-list__mobile-user">
          <p class="product-list__mobile-section-title">账户</p>
          <div class="product-list__mobile-user-main">
            <span class="product-list__avatar product-list__avatar--mobile" aria-hidden="true">{{ userInitial }}</span>
            <span class="product-list__user-name product-list__user-name--mobile">{{ displayName }}</span>
          </div>
          <div class="product-list__mobile-user-actions">
            <LogoutAction />
          </div>
        </div>
      </nav>

      <div class="product-list__user">
        <span class="product-list__avatar" aria-hidden="true">{{ userInitial }}</span>
        <span class="product-list__user-name">{{ displayName }}</span>
        <LogoutAction />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import LogoutAction from '@/components/LogoutAction.vue';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/app';

defineProps<{
  isHome: boolean;
  isProductCreate: boolean;
}>();

const authStore = useAuthStore();
const appStore = useAppStore();
const route = useRoute();
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
const isMobileMenuOpen = ref(false);
const MOBILE_BREAKPOINT = 640;

const updateScrolled = (): void => {
  isScrolled.value = window.scrollY > SCROLL_COMPACT_PX;
};

const reportLayoutHeight = (): void => {
  const el = headerRef.value;
  if (!el) return;
  emit('layoutHeight', el.offsetHeight);
};

const closeMobileMenu = (): void => {
  isMobileMenuOpen.value = false;
};

const toggleMobileMenu = (): void => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const syncMobileMenuState = (): void => {
  if (window.innerWidth > MOBILE_BREAKPOINT && isMobileMenuOpen.value) {
    isMobileMenuOpen.value = false;
  }
};

let resizeObserver: ResizeObserver | null = null;

onMounted((): void => {
  updateScrolled();
  syncMobileMenuState();
  window.addEventListener('scroll', updateScrolled, { passive: true });
  window.addEventListener('resize', syncMobileMenuState, { passive: true });

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
  window.removeEventListener('resize', syncMobileMenuState);
  resizeObserver?.disconnect();
  resizeObserver = null;
});

watch(
  () => route.fullPath,
  (): void => {
    closeMobileMenu();
  },
);
</script>

<style scoped lang="scss">
$topbar-ease: cubic-bezier(0.22, 1, 0.36, 1);

.product-list__topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  flex-shrink: 0;
  /* 主题色导航：深色基底 + 主题色柔和泛光 */
  background: var(
    --topbar-bg,
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
    )
  );
  backdrop-filter: saturate(1.04) blur(14px);
  -webkit-backdrop-filter: saturate(1.04) blur(14px);
  border-bottom: 1px solid
    var(--topbar-border-color, color-mix(in srgb, var(--color-primary-amber-35) 48%, transparent));
  box-shadow: var(
    --topbar-shadow,
    0 14px 36px rgba(0, 0, 0, 0.38),
    inset 0 1px 0 color-mix(in srgb, #fff 7%, transparent)
  );
  transition:
    box-shadow 0.32s $topbar-ease,
    border-color 0.32s ease;
}

.product-list__topbar--compact {
  border-bottom-color: var(--topbar-compact-border-color, rgba(255, 255, 255, 0.06));
  box-shadow: var(
    --topbar-compact-shadow,
    0 10px 28px rgba(0, 0, 0, 0.42),
    inset 0 1px 0 color-mix(in srgb, #fff 5%, transparent)
  );
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
  color: var(--topbar-brand-mark-color, #fff);
  background: var(
    --topbar-brand-mark-bg,
    linear-gradient(
      145deg,
      var(--color-primary-amber-70) 0%,
      var(--color-primary-amber) 52%,
      var(--color-primary-amber-85) 100%
    )
  );
  border: var(--topbar-brand-mark-border, none);
  box-shadow: var(
    --topbar-brand-mark-shadow,
    0 1px 3px var(--color-primary-amber-45),
    inset 0 1px 0 rgba(255, 255, 255, 0.24)
  );
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
  color: var(--topbar-brand-title-color, var(--color-zinc-text));
  letter-spacing: 0.03em;
  line-height: 1.25;
  transition: font-size 0.32s $topbar-ease;
}

.product-list__topbar--compact .product-list__brand-title {
  font-size: 14px;
}

.product-list__brand-sub {
  font-size: 10px;
  color: var(--topbar-brand-sub-color, color-mix(in srgb, var(--color-zinc-muted) 88%, transparent));
  line-height: 1.2;
  max-width: min(220px, 28vw);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-list__tabs { display: flex; align-items: stretch; justify-self: center; }
.product-list__mobile-user { display: none; }
.product-list__mobile-section { display: contents; }
.product-list__mobile-section-title { display: none; }
.product-list__mobile-menu-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid #d4d4d8;
  border-radius: 9px;
  background: #ffffff;
  box-shadow: none;
  color: #52525b;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.product-list__mobile-menu-btn:hover {
  border-color: #a1a1aa;
  background: #fafafa;
  color: #27272a;
  box-shadow: none;
}

.product-list__mobile-menu-btn:focus-visible {
  outline: 2px solid var(--color-primary-amber);
  outline-offset: 2px;
}

.product-list__mobile-menu-btn[aria-expanded='true'] {
  transform: none;
  border-color: #18181b;
  background: #ffffff;
  color: #18181b;
  box-shadow: none;
  animation: none;
}

.product-list__mobile-menu-icon {
  width: 14px;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
  position: relative;
}

.product-list__mobile-menu-icon::before,
.product-list__mobile-menu-icon::after {
  content: '';
  position: absolute;
  left: 0;
  width: 14px;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
}

.product-list__mobile-menu-icon::before {
  top: -5px;
}

.product-list__mobile-menu-icon::after {
  top: 5px;
}

.product-list__mobile-menu-btn[aria-expanded='true'] .product-list__mobile-menu-icon {
  background: transparent;
}

.product-list__mobile-menu-btn[aria-expanded='true'] .product-list__mobile-menu-icon::before {
  top: 0;
  transform: rotate(45deg);
}

.product-list__mobile-menu-btn[aria-expanded='true'] .product-list__mobile-menu-icon::after {
  top: 0;
  transform: rotate(-45deg);
}

.product-list__tab {
  position: relative;
  padding: 18px 20px;
  font-size: 15px;
  color: var(--topbar-tab-color, color-mix(in srgb, #fff 68%, var(--color-zinc-muted)));
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
.product-list__tab:hover { color: var(--topbar-tab-hover-color, color-mix(in srgb, #fff 90%, var(--color-primary-amber))); }
.product-list__tab--active {
  color: var(--topbar-tab-active-color, color-mix(in srgb, #fff 88%, var(--color-primary-amber)));
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
  background: var(
    --topbar-tab-active-bg,
    color-mix(
      in srgb,
      var(--color-primary-amber-12) 26%,
      var(--color-cockpit-bg-mid-97) 74%
    )
  );
  border: 1px solid
    var(--topbar-tab-active-border, color-mix(in srgb, rgba(255, 255, 255, 0.24) 55%, transparent));
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
  background: var(
    --topbar-tab-active-underline,
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--color-primary-amber-55) 72%, transparent) 0%,
      color-mix(in srgb, var(--color-primary-amber) 82%, transparent) 50%,
      color-mix(in srgb, var(--color-primary-amber-55) 72%, transparent) 100%
    )
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

@media (max-width: 640px) {
  .product-list__topbar--compact .product-list__mobile-menu-btn {
    width: 31px;
    height: 31px;
    border-radius: 8px;
    border-color: #d4d4d8;
    background: #ffffff;
    box-shadow: none;
  }

  .product-list__topbar--compact .product-list__mobile-menu-icon,
  .product-list__topbar--compact .product-list__mobile-menu-icon::before,
  .product-list__topbar--compact .product-list__mobile-menu-icon::after {
    width: 13px;
  }

  .product-list__topbar--compact .product-list__mobile-menu-icon::before {
    top: -4px;
  }

  .product-list__topbar--compact .product-list__mobile-menu-icon::after {
    top: 4px;
  }

  .product-list__topbar--menu-open {
    border-bottom-color: #e4e4e7;
    box-shadow: none;
  }

  .product-list__topbar--menu-open::after {
    content: none;
  }
}

@media (max-width: 900px) {
  .product-list__topbar-inner {
    grid-template-columns: auto 1fr auto;
    min-height: 54px;
    gap: 10px;
  }

  .product-list__brand-sub,
  .product-list__user-name {
    display: none;
  }

  .product-list__tabs {
    justify-self: stretch;
    min-width: 0;
  }

  .product-list__tab {
    flex: 1;
    min-width: 0;
    text-align: center;
    padding: 12px 10px;
    font-size: 13px;
  }

  .product-list__topbar--compact .product-list__tab {
    padding: 9px 8px;
    font-size: 12px;
  }

  .product-list__user {
    gap: 6px;
  }
}

@media (max-width: 640px) {
  .product-list__topbar-inner {
    grid-template-columns: 1fr auto;
    min-height: 54px;
    padding-top: 5px;
    padding-bottom: 5px;
    gap: 8px;
  }

  .product-list__brand {
    grid-column: 1 / 2;
  }

  .product-list__mobile-menu-btn {
    display: inline-flex;
    grid-column: 2 / 3;
    justify-self: end;
  }

  .product-list__tabs {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 70;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 0 16px;
    border-radius: 0;
    background: #ffffff;
    border: 1px solid #e4e4e7;
    box-shadow: 0 8px 20px color-mix(in srgb, #000 10%, transparent);
    opacity: 0;
    transform: translateY(-6px);
    pointer-events: none;
    transition: opacity 0.2s ease, transform 0.2s ease;
    overflow: hidden;
  }

  #topbar-mobile-nav {
    border-radius: 0;
  }

  .product-list__tabs::before {
    content: none;
  }

  .product-list__tabs::after {
    content: none;
  }

  .product-list__tabs--open {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  .product-list__tabs--open::after {
    opacity: 0;
    animation: none;
  }

  .product-list__user {
    display: none;
  }

  .product-list__tab {
    position: relative;
    display: block;
    width: 100%;
    box-sizing: border-box;
    border-radius: 8px;
    padding: 11px 12px;
    text-align: left;
    font-size: 13px;
    color: #3f3f46;
    background: #ffffff;
    border: 1px solid #e4e4e7;
    transition:
      color 0.2s ease,
      border-color 0.2s ease,
      background-color 0.2s ease,
      transform 0.2s ease;
    z-index: 2;
  }

  .product-list__tab:hover {
    color: #18181b;
    border-color: #a1a1aa;
    background: #fafafa;
    transform: none;
  }

  .product-list__tab--active {
    color: #18181b;
    border-color: #18181b;
    background: #ffffff;
    box-shadow: inset 2px 0 0 #18181b;
    text-shadow: none;
  }

  .product-list__tab--active::selection {
    background: color-mix(in srgb, var(--color-primary-amber-35) 60%, transparent);
  }

  .product-list__tab--active::before,
  .product-list__tab--active::after {
    content: none;
  }

  .product-list__mobile-user {
    padding: 10px 0 0;
    border-top: 1px solid #f1f5f9;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    z-index: 2;
  }

  .product-list__mobile-section {
    display: flex;
    flex-direction: column;
    gap: 6px;
    z-index: 2;
  }

  .product-list__mobile-section-title {
    display: block;
    margin: 0;
    padding: 0 2px;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #a1a1aa;
  }

  .product-list__mobile-user-main {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .product-list__mobile-user-main .product-list__user-name {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .product-list__mobile-user-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex-shrink: 0;
  }

  .product-list__mobile-user-actions :deep(.theme-palette-btn--embedded) {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    margin: 0;
  }

  .product-list__mobile-user-actions :deep(.theme-palette-btn__icon) {
    width: 16px;
    height: 16px;
  }

  .product-list__mobile-user-actions :deep(.product-list__logout) {
    margin-left: 0;
    border-radius: 50%;
    width: 30px;
    height: 30px;
  }

  .product-list__mobile-user-actions :deep(.product-list__logout svg) {
    width: 14px;
    height: 14px;
  }

  .product-list__mobile-user-actions :deep(.theme-palette-btn--embedded) {
    border-radius: 8px;
  }

  .product-list__avatar--mobile {
    width: 24px;
    height: 24px;
    font-size: 10px;
  }

  .product-list__user-name--mobile {
    font-size: 12px;
  }

  .product-list__avatar {
    border-radius: 50%;
  }

  .product-list__brand-title {
    font-size: 14px;
  }
}

@keyframes product-list__panel-scan {
  0% {
    left: -42%;
    opacity: 0;
  }
  18% {
    opacity: 0.9;
  }
  72% {
    opacity: 0.45;
  }
  100% {
    left: 114%;
    opacity: 0;
  }
}

@keyframes product-list__toggle-pulse {
  0% {
    box-shadow:
      0 6px 12px rgba(0, 0, 0, 0.28),
      0 0 0 1px color-mix(in srgb, var(--color-primary-amber-30) 62%, transparent),
      0 0 0 0 color-mix(in srgb, var(--color-primary-amber-22) 0%, transparent),
      inset 0 1px 0 color-mix(in srgb, #fff 24%, transparent);
  }
  100% {
    box-shadow:
      0 8px 14px rgba(0, 0, 0, 0.32),
      0 0 0 1px color-mix(in srgb, var(--color-primary-amber-35) 72%, transparent),
      0 0 0 5px color-mix(in srgb, var(--color-primary-amber-20) 22%, transparent),
      inset 0 1px 0 color-mix(in srgb, #fff 26%, transparent);
  }
}

@media (max-width: 420px) {
  .product-list__topbar-inner {
    padding-left: 8px;
    padding-right: 8px;
    row-gap: 4px;
    min-height: 52px;
  }

  .product-list__brand {
    gap: 6px;
    margin: 0;
    padding: 0;
  }

  .product-list__mobile-menu-btn {
    width: 30px;
    height: 30px;
    border-radius: 8px;
  }

  .product-list__mobile-menu-icon,
  .product-list__mobile-menu-icon::before,
  .product-list__mobile-menu-icon::after {
    width: 12px;
  }

  .product-list__brand-mark {
    width: 24px;
    height: 24px;
    border-radius: 7px;
  }

  .product-list__brand-wheel {
    width: 14px;
    height: 14px;
  }

  .product-list__brand-title {
    font-size: 13px;
  }

  .product-list__tabs {
    left: 0;
    right: 0;
    top: 100%;
    padding: 0 8px;
    gap: 8px;
  }

  .product-list__tab {
    padding: 9px 10px;
    font-size: 12px;
  }

  .product-list__mobile-user {
    gap: 8px;
  }

  .product-list__mobile-user-actions {
    gap: 5px;
  }

  .product-list__mobile-section-title {
    font-size: 9px;
    letter-spacing: 0.06em;
  }

  .product-list__mobile-user-actions :deep(.theme-palette-btn--embedded) {
    width: 28px;
    height: 28px;
  }

  .product-list__mobile-user-actions :deep(.theme-palette-btn__icon) {
    width: 15px;
    height: 15px;
  }

  .product-list__mobile-user-actions :deep(.product-list__logout) {
    width: 28px;
    height: 28px;
  }

  .product-list__mobile-user-actions :deep(.product-list__logout svg) {
    width: 13px;
    height: 13px;
  }

  .product-list__avatar {
    width: 20px;
    height: 20px;
    font-size: 8px;
  }

  :deep(.product-list__logout) {
    width: 24px;
    height: 24px;
  }

  :deep(.product-list__logout svg) {
    width: 12px;
    height: 12px;
  }
}

@media (max-width: 390px) {
  .product-list__topbar-inner {
    padding-left: 6px;
    padding-right: 6px;
    min-height: 48px;
    row-gap: 3px;
  }

  .product-list__brand-mark {
    width: 22px;
    height: 22px;
    border-radius: 6px;
  }

  .product-list__brand-wheel {
    width: 13px;
    height: 13px;
  }

  .product-list__brand-title {
    font-size: 12px;
  }

  .product-list__tabs {
    left: 0;
    right: 0;
    top: 100%;
    gap: 7px;
    padding: 0 6px;
  }

  .product-list__tab {
    padding: 8px 9px;
    font-size: 11px;
  }

  .product-list__avatar {
    width: 18px;
    height: 18px;
    font-size: 7px;
  }

  :deep(.theme-palette-btn--embedded) {
    width: 24px;
    height: 24px;
  }

  :deep(.theme-palette-btn__icon) {
    width: 14px;
    height: 14px;
  }

  .product-list__mobile-user-actions :deep(.theme-palette-btn--embedded) {
    width: 26px;
    height: 26px;
  }

  .product-list__mobile-user-actions :deep(.theme-palette-btn__icon) {
    width: 14px;
    height: 14px;
  }

  :deep(.product-list__logout) {
    width: 22px;
    height: 22px;
  }

  :deep(.product-list__logout svg) {
    width: 11px;
    height: 11px;
  }
}

</style>

