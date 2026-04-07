<script setup lang="ts">
import * as Vue from 'vue';
import { useAppStore } from '@/stores/app';
import ImageSearchDialog from '@/components/ImageSearchDialog.vue';

type ProductItem = {
  id: number;
  name: string;
  brand: string;
  model: string;
  price: number;
  status: 'on' | 'off';
};

const appStore = useAppStore();
const keyword = Vue.ref('');
const showModal = Vue.ref(false);
const currentPage = Vue.ref(1);
const pageSize = 8;

const products: ProductItem[] = [
  { id: 1, name: '智能方向盘 Pro', brand: 'OmniSteer', model: 'OS-PRO-01', price: 3299, status: 'on' },
  { id: 2, name: '运动方向盘 GT', brand: 'OmniSteer', model: 'OS-GT-02', price: 4599, status: 'on' },
  { id: 3, name: '经典真皮方向盘', brand: 'DriveMax', model: 'DM-LTH-03', price: 2899, status: 'on' },
  { id: 4, name: '轻量化碳纤方向盘', brand: 'RaceCore', model: 'RC-CF-04', price: 5299, status: 'off' },
  { id: 5, name: '城市舒适方向盘', brand: 'UrbanGo', model: 'UG-CM-05', price: 1999, status: 'on' },
  { id: 6, name: '多功能控制方向盘', brand: 'OmniSteer', model: 'OS-MF-06', price: 3799, status: 'on' },
  { id: 7, name: '赛车竞技方向盘', brand: 'RaceCore', model: 'RC-RS-07', price: 6099, status: 'off' },
  { id: 8, name: '商务豪华方向盘', brand: 'LuxAuto', model: 'LA-BZ-08', price: 4899, status: 'on' },
  { id: 9, name: '越野耐用方向盘', brand: 'TrailX', model: 'TX-OF-09', price: 2699, status: 'on' },
  { id: 10, name: '触控智能方向盘', brand: 'OmniSteer', model: 'OS-TC-10', price: 5599, status: 'on' },
];

const filtered = Vue.computed(() => {
  if (!keyword.value) return products;
  const k = keyword.value.toLowerCase();
  return products.filter((p) =>
    p.name.toLowerCase().includes(k) ||
    p.brand.toLowerCase().includes(k) ||
    p.model.toLowerCase().includes(k),
  );
});

const totalPages = Vue.computed(() => Math.ceil(filtered.value.length / pageSize) || 1);
const paged = Vue.computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filtered.value.slice(start, start + pageSize);
});

const search = () => {
  currentPage.value = 1;
};

const onImageSearched = (nextKeyword: string) => {
  keyword.value = nextKeyword;
  search();
};
</script>

<template>
  <div class="product-list">
    <div class="product-list__warm-base" aria-hidden="true" />
    <div class="product-list__vignette" aria-hidden="true" />

    <div class="product-list__content">
      <header class="product-list__header">
        <p class="product-list__badge">OmniSteer · 产品中心</p>
        <h1 class="product-list__title">{{ appStore.systemName }}</h1>
      </header>

      <section class="product-list__toolbar">
        <input
          v-model="keyword"
          class="product-list__search"
          type="text"
          placeholder="搜索产品名称、型号、品牌..."
          @keyup.enter="search"
        >
        <button class="btn btn-primary" @click="search">搜索</button>
        <router-link to="/products/new" class="btn btn-primary">新增产品</router-link>
        <button class="btn btn-outline" @click="showModal = true">以图搜图</button>
      </section>

      <section class="product-grid">
        <div v-for="p in paged" :key="p.id" class="product-card">
          <div class="product-card__img">⚙</div>
          <h3>{{ p.name }}</h3>
          <p class="product-card__price">¥{{ p.price.toLocaleString() }}</p>
          <p class="product-card__meta">
            品牌: {{ p.brand }} · 型号: {{ p.model }}
          </p>
          <span :class="['badge', p.status === 'on' ? 'badge-on' : 'badge-off']">
            {{ p.status === 'on' ? '在售' : '下架' }}
          </span>
          <div class="product-card__actions">
            <router-link class="btn btn-primary" :to="`/products/${p.id}`">详情</router-link>
            <router-link class="btn btn-outline" :to="`/products/${p.id}/edit`">编辑</router-link>
          </div>
        </div>
      </section>

      <div class="pagination" v-if="totalPages > 1">
        <button class="page-btn" @click="currentPage > 1 && currentPage--">&lt;</button>
        <button v-for="n in totalPages" :key="n" class="page-btn" :class="{ active: n === currentPage }" @click="currentPage = n">{{ n }}</button>
        <button class="page-btn" @click="currentPage < totalPages && currentPage++">&gt;</button>
      </div>
    </div>

    <ImageSearchDialog v-model="showModal" :products="products" @searched="onImageSearched" />
  </div>
</template>

<style scoped lang="scss">
.product-list {
  position: relative;
  min-height: 100vh;
  padding: 2rem 1rem 3rem;
  color: v.$zinc-text;
  background: linear-gradient(168deg, v.$cockpit-bg-top 0%, v.$cockpit-bg-mid 48%, v.$cockpit-bg-bottom 100%);

  &__warm-base,
  &__vignette {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &__warm-base {
    background: radial-gradient(ellipse 95% 60% at 50% 110%, rgba(v.$primary-amber, 0.2) 0%, transparent 55%);
  }

  &__vignette {
    box-shadow: inset 0 0 120px rgba(0, 0, 0, 0.5);
  }

  &__content {
    position: relative;
    z-index: 2;
    max-width: 1100px;
    margin: 0 auto;
  }

  &__header {
    margin-bottom: 1.25rem;
  }

  &__badge {
    margin: 0;
    color: rgba(v.$primary-amber, 0.85);
    letter-spacing: 0.24em;
    font-size: 11px;
  }

  &__title {
    margin: 0.4rem 0 0;
    font-size: 1.6rem;
  }

  &__toolbar {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    gap: 0.75rem;
    margin-bottom: 1.25rem;

    @media (max-width: 900px) {
      grid-template-columns: 1fr 1fr;
    }
  }

  &__search {
    height: 42px;
    border-radius: 10px;
    border: 1px solid rgba(v.$primary-amber, 0.28);
    padding: 0 12px;
    color: v.$zinc-text;
    background: v.$input-bg;
    outline: none;
  }
}

.btn {
  height: 42px;
  border-radius: 10px;
  padding: 0 14px;
  border: 1px solid transparent;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background: rgb(194 65 12);
  color: #fff;
  border-color: rgb(234 88 12);
}

.btn-outline {
  background: transparent;
  color: v.$zinc-label;
  border-color: rgba(v.$primary-amber, 0.35);
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}

.product-card {
  display: block;
  text-decoration: none;
  color: inherit;
  border: 1px solid rgba(v.$primary-amber, 0.24);
  border-radius: 12px;
  padding: 0.9rem;
  background: linear-gradient(145deg, v.$panel-bg 0%, rgba(v.$cockpit-bg-mid, 0.96) 100%);

  &__img {
    height: 100px;
    border-radius: 8px;
    display: grid;
    place-items: center;
    font-size: 30px;
    background: rgba(v.$primary-amber, 0.1);
    margin-bottom: 0.75rem;
  }

  h3 {
    margin: 0;
    font-size: 1rem;
  }

  &__price {
    color: v.$accent-warm;
    font-weight: 700;
  }

  &__meta {
    color: v.$zinc-muted;
    font-size: 12px;
  }

  &__actions {
    margin-top: 0.75rem;
    display: flex;
    justify-content: flex-end;
  }
}

.badge {
  display: inline-block;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
}

.badge-on { background: rgba(34, 197, 94, 0.2); color: #86efac; }
.badge-off { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }

.pagination {
  display: flex;
  gap: 6px;
  justify-content: center;
  margin-top: 1rem;
}

.page-btn {
  min-width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid rgba(v.$primary-amber, 0.3);
  background: rgba(0, 0, 0, 0.2);
  color: v.$zinc-text;
}

.page-btn.active {
  background: rgba(v.$primary-amber, 0.35);
}

</style>
