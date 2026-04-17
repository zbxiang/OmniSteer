<template>
  <nav class="app-breadcrumb" aria-label="面包屑导航">
    <router-link class="app-breadcrumb__link" :to="homeTo">
      {{ homeLabel }}
    </router-link>
    <span class="app-breadcrumb__separator" aria-hidden="true">/</span>
    <span class="app-breadcrumb__current">{{ currentLabel }}</span>
  </nav>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    homeLabel?: string;
    homeTo?: string;
    currentLabel: string;
  }>(),
  {
    homeLabel: '产品列表',
    homeTo: '/products',
  },
);
</script>

<style scoped lang="scss">
.app-breadcrumb {
  margin: 8px 0 18px;
  width: fit-content;
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0;
}

.app-breadcrumb__link,
.app-breadcrumb__current,
.app-breadcrumb__separator {
  line-height: 1.2;
  white-space: nowrap;
}

.app-breadcrumb__link {
  color: #71717a;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.18s ease;
}

.app-breadcrumb__link:hover,
.app-breadcrumb__link:focus-visible,
.app-breadcrumb__link:active {
  color: #3f3f46;
}

.app-breadcrumb__separator {
  color: #a1a1aa;
  font-size: 12px;
}

.app-breadcrumb__current {
  color: #18181b;
  font-size: 13px;
  font-weight: 600;
}
</style>
