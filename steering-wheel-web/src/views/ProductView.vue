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
        <div
          v-for="p in paged"
          :key="p.id"
          :class="['product-card', { 'product-card--off': p.status === 'off' }]"
        >
          <div class="product-card__img">
            <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name">
            <span v-else>⚙</span>
          </div>
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
            <button
              :class="['btn', 'btn-danger', { 'btn-danger--pending': Boolean(statusUpdatingMap[p.id]) }]"
              :disabled="Boolean(statusUpdatingMap[p.id]) || p.status === 'off'"
              @click="quickOffShelf(p.id)"
            >
              {{ statusUpdatingMap[p.id] ? '处理中...' : (p.status === 'off' ? '已下架' : '下架') }}
            </button>
            <router-link class="btn btn-outline" :to="`/products/${p.id}/edit`">编辑</router-link>
          </div>
        </div>
      </section>
      <p v-if="!loading && paged.length === 0" class="product-list__empty">暂无产品数据</p>

      <div class="pagination" v-if="totalPages > 1">
        <button class="page-btn" :disabled="loading || currentPage <= 1" @click="prevPage">&lt;</button>
        <button
          v-for="n in totalPages"
          :key="n"
          class="page-btn"
          :class="{ active: n === currentPage }"
          :disabled="loading"
          @click="jumpPage(n)"
        >
          {{ n }}
        </button>
        <button class="page-btn" :disabled="loading || currentPage >= totalPages" @click="nextPage">&gt;</button>
      </div>
    </div>

    <ImageSearchDialog v-model="showModal" :products="products" @searched="onImageSearched" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ProductItem, ProductOut } from '@/types';
import { listProductsApi, updateProductStatusApi } from '@/api/product';
import { isRequestCanceled, RequestError } from '@/api/request';
import { ElMessage } from 'element-plus';
import { useAppStore } from '@/stores/app';
import ImageSearchDialog from '@/components/ImageSearchDialog.vue';

const appStore = useAppStore();
const keyword = ref<string>('');
const showModal = ref<boolean>(false);
const currentPage = ref<number>(1);
const pageSize = 8;
const loading = ref<boolean>(false);
const total = ref<number>(0);
const statusUpdatingMap = ref<Record<number, boolean>>({});

const products = ref<ProductItem[]>([]);

const totalPages = computed<number>(() => Math.ceil(total.value / pageSize) || 1);
const paged = computed<ProductItem[]>(() => products.value);

const fetchProducts = async (): Promise<void> => {
  loading.value = true;
  try {
    const res = await listProductsApi({
      keyword: keyword.value.trim() || undefined,
      page: currentPage.value,
      page_size: pageSize,
    });
    products.value = res.items.map((x): ProductItem => ({
      id: x.id,
      name: x.name,
      brand: x.brand,
      model: x.model,
      price: x.price,
      status: x.status === 'off' ? 'off' : 'on',
      imageUrl: x.images[0] || undefined,
    }));
    total.value = res.total;
  } catch (e) {
    if (isRequestCanceled(e)) return;
    const msg = e instanceof RequestError ? e.message : '产品列表加载失败，请稍后重试';
    ElMessage.error(msg);
  } finally {
    loading.value = false;
  }
};

const search = (): void => {
  currentPage.value = 1;
  void fetchProducts();
};

const onImageSearched = (items: ProductOut[]): void => {
  currentPage.value = 1;
  total.value = items.length;
  products.value = items.map((x): ProductItem => ({
    id: x.id,
    name: x.name,
    brand: x.brand,
    model: x.model,
    price: x.price,
    status: x.status === 'off' ? 'off' : 'on',
    imageUrl: x.images[0] || undefined,
  }));
};

const quickOffShelf = async (productId: number): Promise<void> => {
  const item = products.value.find((x): boolean => x.id === productId);
  if (!item) return;
  if (item.status === 'off') {
    ElMessage.info('该产品已下架');
    return;
  }
  statusUpdatingMap.value = {
    ...statusUpdatingMap.value,
    [productId]: true,
  };
  try {
    const next = await updateProductStatusApi(productId, { status: 'off' });
    products.value = products.value.map((x): ProductItem => (x.id === productId
      ? {
          ...x,
          status: next.status === 'off' ? 'off' : 'on',
        }
      : x));
    ElMessage.success('产品已下架');
  } catch (e) {
    if (isRequestCanceled(e)) return;
    const msg = e instanceof RequestError ? e.message : '下架失败，请稍后重试';
    ElMessage.error(msg);
  } finally {
    const rest = { ...statusUpdatingMap.value };
    delete rest[productId];
    statusUpdatingMap.value = rest;
  }
};

const prevPage = (): void => {
  if (currentPage.value <= 1 || loading.value) return;
  currentPage.value -= 1;
  void fetchProducts();
};

const nextPage = (): void => {
  if (currentPage.value >= totalPages.value || loading.value) return;
  currentPage.value += 1;
  void fetchProducts();
};

const jumpPage = (page: number): void => {
  if (page === currentPage.value || loading.value) return;
  currentPage.value = page;
  void fetchProducts();
};

void fetchProducts();
</script>

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
    background: radial-gradient(ellipse 95% 60% at 50% 110%, var(--color-primary-amber-20) 0%, transparent 55%);
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
    color: var(--color-primary-amber-85);
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
    border: 1px solid var(--color-primary-amber-28);
    padding: 0 12px;
    color: v.$zinc-text;
    background: v.$input-bg;
    outline: none;
  }

  &__empty {
    margin-top: 1rem;
    text-align: center;
    color: v.$zinc-muted;
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
  background: var(--color-primary-amber-85);
  color: #fff;
  border-color: var(--color-primary-amber);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-amber);
  border-color: var(--color-accent-warm);
  box-shadow: 0 0 16px var(--color-primary-amber-24);
}

.btn-outline {
  background: transparent;
  color: v.$zinc-label;
  border-color: var(--color-primary-amber-35);
}

.btn-outline:hover:not(:disabled) {
  color: v.$zinc-text;
  border-color: var(--color-primary-amber-55);
  background: var(--color-primary-amber-10);
}

.btn-danger {
  background: color-mix(in srgb, var(--color-primary-amber-28) 65%, rgba(127, 29, 29, 0.28));
  color: color-mix(in srgb, #fff 82%, var(--color-accent-warm) 18%);
  border-color: color-mix(in srgb, var(--color-primary-amber-48) 70%, rgba(248, 113, 113, 0.42));
}

.btn-danger:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-primary-amber-35) 60%, rgba(153, 27, 27, 0.32));
  border-color: var(--color-primary-amber-55);
  box-shadow: 0 0 12px var(--color-primary-amber-18);
}

.btn-danger--pending {
  background: color-mix(in srgb, var(--color-primary-amber-35) 72%, rgba(153, 27, 27, 0.35));
  border-color: var(--color-primary-amber-55);
  color: #fff;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  position: relative;
  overflow: hidden;
  border: 1px solid var(--color-primary-amber-24);
  border-radius: 12px;
  padding: 0.9rem;
  background: linear-gradient(145deg, v.$panel-bg 0%, var(--color-cockpit-bg-mid-96) 100%);
  box-shadow: 0 10px 22px color-mix(in srgb, var(--color-cockpit-bg-mid-97) 75%, transparent);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--product-card-sheen);
    opacity: 0.9;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }

  &__img {
    position: relative;
    z-index: 1;
    height: 150px;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background:
      radial-gradient(circle at 30% 20%, var(--color-primary-amber-16) 0%, var(--color-primary-amber-06) 42%, transparent 80%),
      color-mix(in srgb, var(--color-cockpit-bg-mid-97) 72%, transparent);
    border: 1px solid var(--color-primary-amber-20);
    margin-bottom: 0.75rem;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.25s ease;
    }

    span {
      font-size: 34px;
      opacity: 0.75;
    }
  }

  &:hover &__img img {
    transform: scale(1.03);
  }

  &:hover {
    border-color: var(--color-primary-amber-36);
    box-shadow: 0 14px 28px var(--product-card-hover-glow);
    transform: translateY(-1px);
  }

  &:hover::before {
    opacity: 1;
  }

  h3 {
    position: relative;
    z-index: 1;
    margin: 0;
    font-size: 1rem;
  }

  &__price {
    position: relative;
    z-index: 1;
    color: v.$accent-warm;
    font-weight: 700;
  }

  &__meta {
    position: relative;
    z-index: 1;
    color: v.$zinc-muted;
    font-size: 12px;
  }

  &__actions {
    position: relative;
    z-index: 1;
    margin-top: 0.75rem;
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
}

.product-card--off {
  border-color: color-mix(in srgb, var(--color-primary-amber-24) 70%, var(--color-zinc-faint));
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--color-cockpit-bg-mid-97) 88%, var(--color-zinc-faint) 12%) 0%,
    color-mix(in srgb, var(--color-cockpit-bg-mid-97) 92%, black 8%) 100%
  );

  h3,
  .product-card__price {
    color: color-mix(in srgb, var(--color-zinc-text) 86%, #fff);
  }

  .product-card__meta {
    color: color-mix(in srgb, var(--color-zinc-muted) 88%, #9ca3af);
  }

  .product-card__img {
    border-color: color-mix(in srgb, var(--color-primary-amber-20) 78%, #94a3b8);
    filter: saturate(0.72) brightness(0.92);
  }

  .btn-danger {
    background: color-mix(in srgb, var(--color-cockpit-bg-mid-97) 70%, var(--color-primary-amber-16));
    border-color: var(--color-primary-amber-30);
    color: color-mix(in srgb, var(--color-zinc-text) 72%, var(--color-primary-amber));
  }
}

.badge {
  position: relative;
  z-index: 1;
  display: inline-block;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
}

.badge-on { background: rgba(34, 197, 94, 0.2); color: #86efac; }
.badge-off {
  background: color-mix(in srgb, var(--color-primary-amber-20) 72%, var(--color-cockpit-bg-mid-97));
  color: color-mix(in srgb, var(--color-zinc-text) 80%, var(--color-accent-warm));
  border: 1px solid var(--color-primary-amber-45);
  box-shadow: inset 0 0 0 1px var(--color-primary-amber-12);
}

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
  border: 1px solid var(--color-primary-amber-30);
  background: color-mix(in srgb, var(--color-cockpit-bg-mid-97) 78%, var(--color-primary-amber-12));
  color: v.$zinc-text;
}

.page-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.page-btn.active {
  background: var(--color-primary-amber-35);
  border-color: var(--color-primary-amber-48);
  color: #fff;
}

</style>
