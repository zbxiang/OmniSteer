<template>
  <header class="product-list__topbar">
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
import LogoutAction from '@/components/LogoutAction.vue';
import ThemePaletteButton from '@/components/ThemePaletteButton.vue';

defineProps<{
  systemName: string;
  displayName: string;
  userInitial: string;
  isHome: boolean;
  isProductCreate: boolean;
}>();
</script>

<style scoped lang="scss">
.product-list__topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  flex-shrink: 0;
  background:
    radial-gradient(
      120% 160% at 10% -40%,
      color-mix(in srgb, var(--color-primary-amber-24) 85%, #fff) 0%,
      transparent 52%
    ),
    radial-gradient(
      130% 180% at 100% -70%,
      color-mix(in srgb, var(--color-primary-amber-16) 75%, #fff) 0%,
      transparent 56%
    ),
    linear-gradient(
      160deg,
      color-mix(in srgb, #fff 95%, var(--color-primary-amber-08)) 0%,
      color-mix(in srgb, #fff 92%, var(--color-primary-amber-12)) 48%,
      color-mix(in srgb, #fff 96%, var(--color-primary-amber-06)) 100%
    );
  backdrop-filter: saturate(1.12) blur(8px);
  -webkit-backdrop-filter: saturate(1.12) blur(8px);
  border-bottom: 1px solid color-mix(in srgb, var(--color-primary-amber-30) 80%, #fff);
  box-shadow:
    0 10px 26px rgba(0, 0, 0, 0.06),
    0 1px 0 rgba(255, 255, 255, 0.65) inset;
}

.product-list__topbar::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 1px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.72) 0%,
    rgba(255, 255, 255, 0.2) 100%
  );
  pointer-events: none;
}

.product-list__topbar-inner {
  box-sizing: border-box;
  position: relative;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  min-height: 62px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 20px;
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
  transition: background-color 0.2s ease;
}

.product-list__brand:hover {
  background-color: rgba(0, 0, 0, 0.03);
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
}

.product-list__brand-wheel { width: 19px; height: 19px; display: block; }
.product-list__brand-text { display: flex; flex-direction: column; align-items: flex-start; gap: 1px; min-width: 0; }
.product-list__brand-title { font-size: 15px; font-weight: 600; color: rgba(0, 0, 0, 0.84); letter-spacing: 0.03em; line-height: 1.25; }
.product-list__brand-sub { font-size: 10px; color: rgba(0, 0, 0, 0.42); line-height: 1.2; max-width: min(220px, 28vw); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.product-list__tabs { display: flex; align-items: stretch; justify-self: center; }
.product-list__tab {
  position: relative;
  padding: 18px 20px;
  font-size: 15px;
  color: rgba(0, 0, 0, 0.45);
  text-decoration: none;
  transition: color 0.2s ease;
}
.product-list__tab:hover { color: var(--color-primary-amber); }
.product-list__tab--active {
  color: var(--color-primary-amber);
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
  background: color-mix(in srgb, #fff 78%, var(--color-primary-amber-14));
  border: 1px solid var(--color-primary-amber-16);
  z-index: -1;
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
    var(--color-primary-amber-55) 0%,
    var(--color-primary-amber) 50%,
    var(--color-primary-amber-55) 100%
  );
}

.product-list__user { display: flex; align-items: center; gap: 8px; justify-self: end; }
.product-list__user-sep { width: 1px; height: 18px; background: #e8e8e8; flex-shrink: 0; }
.product-list__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: color-mix(in srgb, #fff 84%, var(--color-primary-amber-20));
  color: var(--color-primary-amber);
  border: 1px solid var(--color-primary-amber-24);
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.product-list__user-name { font-size: 14px; color: rgba(0, 0, 0, 0.88); }

</style>

