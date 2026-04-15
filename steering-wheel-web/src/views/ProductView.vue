<template>
  <div class="product-list">
    <TopBar
      :system-name="appStore.systemName"
      :display-name="displayName"
      :user-initial="userInitial"
      :is-home="isHome"
      :is-product-create="isProductCreate"
    />
    <div class="product-list__warm-base" aria-hidden="true" />
    <div class="product-list__vignette" aria-hidden="true" />

    <div class="product-list__content">
      <section
        class="product-list__toolbar wow animate__fadeInUp"
        data-wow-duration="0.55s"
        data-wow-delay="0s"
      >
        <input
          v-model="keyword"
          class="product-list__search"
          type="text"
          placeholder="搜索产品名称、型号、品牌..."
          @keyup.enter="search"
        />
        <button
          class="btn btn-primary product-list__search-btn"
          @click="search"
        >
          <span class="btn__icon" aria-hidden="true"
            ><el-icon><Search /></el-icon
          ></span>
          搜索
        </button>
        <button class="btn btn-outline" @click="showModal = true">
          <span class="btn__icon" aria-hidden="true"
            ><el-icon><Picture /></el-icon
          ></span>
          以图搜图
        </button>
        <button
          class="btn btn-ghost product-list__reset-btn"
          @click="resetFilters"
        >
          <span class="btn__icon" aria-hidden="true"
            ><el-icon><RefreshRight /></el-icon
          ></span>
          重置筛选
        </button>
      </section>

      <div
        class="product-list__result"
        v-loading="loading"
        element-loading-text="加载中..."
        element-loading-background="rgba(10, 12, 16, 0.36)"
        element-loading-custom-class="product-list-loading-mask"
      >
        <section class="product-grid">
          <div
            v-for="(p, idx) in filteredPaged"
            :key="p.id"
            class="wow animate__fadeInUp product-card-wow"
            data-wow-duration="0.55s"
            :data-wow-delay="`${Math.min(idx % 12, 11) * 0.06}s`"
          >
            <div
              :class="[
                'product-card',
                { 'product-card--off': p.state === ProductStatusEnum.DOWN },
              ]"
            >
            <div class="product-card__img">
              <img v-if="p.imageUrl" :src="p.imageUrl" :alt="p.name" />
              <span v-else>⚙</span>
            </div>
            <div class="product-card__title-row">
              <h3 class="product-card__title">{{ p.name }}</h3>
              <div class="product-card__actions">
                <router-link
                  class="product-card__icon-btn"
                  :to="`/products/${p.id}`"
                  aria-label="查看详情"
                  title="详情"
                >
                  <el-icon><View /></el-icon>
                </router-link>
                <router-link
                  class="product-card__icon-btn"
                  :to="`/products/${p.id}/edit`"
                  aria-label="编辑产品"
                  title="编辑"
                >
                  <el-icon><EditPen /></el-icon>
                </router-link>
              </div>
            </div>
            <p class="product-card__price">¥{{ p.price.toLocaleString() }}</p>
            <div class="product-card__meta-row">
              <p class="product-card__meta">
                品牌: {{ p.brand }} · 型号: {{ p.model }}
              </p>
              <span
                :class="[
                  'badge',
                  p.state === ProductStatusEnum.UP ? 'badge-on' : 'badge-off',
                ]"
              >
                {{ p.state === ProductStatusEnum.UP ? '在售' : '下架' }}
              </span>
            </div>
          </div>
          </div>
        </section>
        <p
          v-if="!loading && filteredPaged.length === 0"
          class="product-list__empty"
        >
          暂无符合筛选条件的产品
        </p>

        <div
          v-show="!showModal"
          ref="loadMoreRef"
          class="product-list__load-more-trigger"
        >
          <span class="product-list__load-more-text">
            {{
              hasMore ? (loading ? '加载中...' : '下滑加载更多') : '已加载全部'
            }}
          </span>
        </div>
      </div>
    </div>

    <ImageSearchDialog
      v-model="showModal"
      :products="products"
      @searched="onImageSearched"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  EditPen,
  Picture,
  RefreshRight,
  Search,
  View,
} from '@element-plus/icons-vue';
import type { ProductItem, ProductOut } from '@/types/product';
import { ProductStatusEnum, type ProductStatus } from '@/enums/product';
import { normalizeProductStateFromOut } from '@/utils/productState';
import { listProductsApi } from '@/api/product';
import { isRequestCanceled, RequestError } from '@/utils/request';
import { ElMessage } from 'element-plus';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import ImageSearchDialog from '@/components/ImageSearchDialog.vue';
import TopBar from '@/components/topBar.vue';
import WOW from 'wow.js';
import 'animate.css';

type ProductCardItem = ProductItem & {
  imageUrl?: string;
};

const appStore = useAppStore();
const authStore = useAuthStore();
const route = useRoute();
const keyword = ref<string>('');
const statusFilter = ref<'all' | ProductStatus>('all');
const showModal = ref<boolean>(false);
const currentPage = ref<number>(1);
const pageSize = 8;
const loading = ref<boolean>(false);
const total = ref<number>(0);
const loadMoreRef = ref<HTMLElement | null>(null);
let loadMoreObserver: IntersectionObserver | null = null;
let wowInstance: InstanceType<typeof WOW> | null = null;

const products = ref<ProductCardItem[]>([]);

const totalPages = computed<number>(
  () => Math.ceil(total.value / pageSize) || 1,
);
const hasMore = computed<boolean>(() => currentPage.value < totalPages.value);
const paged = computed<ProductCardItem[]>(() => products.value);
const filteredPaged = computed<ProductCardItem[]>(() => {
  if (statusFilter.value === 'all') return paged.value;
  return paged.value.filter(
    (item): boolean => item.state === statusFilter.value,
  );
});

const displayName = computed<string>(() => {
  const info = authStore.userInfo;
  const fallback = '管理员';
  if (!info) return fallback;
  return info.userName?.trim() || fallback;
});
const userInitial = computed<string>(() =>
  displayName.value.slice(0, 1).toUpperCase(),
);
const isHome = computed<boolean>(() => route.name === 'home');
const isProductCreate = computed<boolean>(() => route.name === 'productCreate');

const fetchProducts = async (append = false): Promise<void> => {
  if (loading.value) return;
  loading.value = true;
  try {
    const res = await listProductsApi({
      keyword: keyword.value.trim() || undefined,
      page: currentPage.value,
      size: pageSize,
    });
    const list = res.data?.content ?? [];
    const mapped = list.map(
      (x: ProductOut): ProductCardItem => ({
        id: x.id,
        name: x.name,
        brand: x.brand,
        model: x.model,
        price: x.price,
        state: normalizeProductStateFromOut(x),
        imageUrl: x.images?.[0] || undefined,
      }),
    );
    products.value = append ? [...products.value, ...mapped] : mapped;
    total.value = res.data?.totalElements ?? list.length;
  } catch (e) {
    if (isRequestCanceled(e as Error)) return;
    const msg =
      e instanceof RequestError ? e.message : '产品列表加载失败，请稍后重试';
    ElMessage.error(msg);
  } finally {
    loading.value = false;
  }
};

const search = (): void => {
  currentPage.value = 1;
  void fetchProducts(false);
};

const resetFilters = (): void => {
  keyword.value = '';
  statusFilter.value = 'all';
  currentPage.value = 1;
  void fetchProducts(false);
};

const onImageSearched = (items: ProductOut[]): void => {
  currentPage.value = 1;
  total.value = items.length;
  products.value = items.map(
    (x: ProductOut): ProductCardItem => ({
      id: x.id,
      name: x.name,
      brand: x.brand,
      model: x.model,
      price: x.price,
      state: normalizeProductStateFromOut(x),
      imageUrl: x.images?.[0] || undefined,
    }),
  );
};

const loadMore = (): void => {
  if (loading.value || !hasMore.value || showModal.value) return;
  currentPage.value += 1;
  void fetchProducts(true);
};

watch(
  () => filteredPaged.value.map((p) => p.id).join(','),
  (): void => {
    void nextTick(() => {
      wowInstance?.sync();
    });
  },
  { flush: 'post' },
);

const initLoadMoreObserver = (): void => {
  if (!loadMoreRef.value || typeof IntersectionObserver === 'undefined') return;
  if (loadMoreObserver) {
    loadMoreObserver.disconnect();
  }
  loadMoreObserver = new IntersectionObserver(
    (entries): void => {
      if (!entries[0]?.isIntersecting) return;
      loadMore();
    },
    {
      root: null,
      rootMargin: '0px 0px 160px 0px',
      threshold: 0.05,
    },
  );
  loadMoreObserver.observe(loadMoreRef.value);
};

onMounted((): void => {
  void fetchProducts(false);
  initLoadMoreObserver();
  void nextTick(() => {
    wowInstance = new WOW({
      boxClass: 'wow',
      animateClass: 'animate__animated',
      offset: 48,
      mobile: true,
      live: true,
    });
    wowInstance.init();
  });
});

onUnmounted((): void => {
  loadMoreObserver?.disconnect();
  loadMoreObserver = null;
  wowInstance?.stop();
  wowInstance = null;
});
</script>

<style scoped lang="scss">
.product-list {
  position: relative;
  min-height: 100vh;
  padding: 0;
  color: v.$zinc-text;
  background: linear-gradient(
    168deg,
    v.$cockpit-bg-top 0%,
    v.$cockpit-bg-mid 48%,
    v.$cockpit-bg-bottom 100%
  );

  &__warm-base,
  &__vignette {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &__warm-base {
    background: radial-gradient(
      ellipse 95% 60% at 50% 110%,
      var(--color-primary-amber-20) 0%,
      transparent 55%
    );
  }

  &__vignette {
    box-shadow: inset 0 0 120px rgba(0, 0, 0, 0.5);
  }

  &__content {
    position: relative;
    z-index: 2;
    margin: 0 auto;
    padding: 28px 24px 24px;
  }

  &__header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  &__badge {
    margin: 0;
    color: var(--color-primary-amber-85);
    letter-spacing: 0.24em;
    font-size: 10px;
  }

  &__title {
    margin: 0.4rem 0 0;
    font-size: 1.78rem;
    line-height: 1.15;
  }

  &__subtitle {
    margin: 0.5rem 0 0;
    color: v.$zinc-muted;
    font-size: 0.88rem;
  }

  &__header-cta {
    min-width: 108px;
  }

  &__toolbar {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    gap: 0.75rem;
    margin-bottom: 1.35rem;

    @media (max-width: 900px) {
      grid-template-columns: 1fr 1fr;
    }
  }

  &__search {
    height: 40px;
    border-radius: 10px;
    border: 1px solid var(--color-primary-amber-28);
    padding: 0 12px;
    color: v.$zinc-text;
    background: v.$input-bg;
    outline: none;
    font-size: 13px;
  }

  &__empty {
    margin-top: 1.25rem;
    text-align: center;
    color: v.$zinc-muted;
    border: 1px dashed var(--color-primary-amber-24);
    border-radius: 12px;
    padding: 1rem;
    background: color-mix(
      in srgb,
      var(--color-cockpit-bg-mid-97) 86%,
      transparent
    );
  }
}

.product-overview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;

  @media (max-width: 960px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.overview-card {
  border-radius: 12px;
  border: 1px solid var(--color-primary-amber-24);
  padding: 0.75rem 0.9rem;
  background:
    radial-gradient(
      circle at 90% -40%,
      var(--color-primary-amber-16) 0%,
      transparent 62%
    ),
    color-mix(in srgb, var(--color-cockpit-bg-mid-97) 82%, transparent);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.09);

  &__label {
    margin: 0;
    color: v.$zinc-muted;
    font-size: 11px;
    letter-spacing: 0.04em;
  }

  &__value {
    margin: 0.3rem 0 0;
    font-size: 1.16rem;
    line-height: 1.15;
    font-weight: 700;
    color: color-mix(in srgb, var(--color-primary-amber) 58%, #fff);
  }
}

.btn {
  height: 40px;
  border-radius: 10px;
  padding: 0 12px;
  border: 1px solid transparent;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
}

.btn__icon {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  line-height: 1;
  opacity: 0.95;
  transform: translateY(-1px);
  transition:
    transform 0.2s ease,
    opacity 0.2s ease,
    background-color 0.2s ease;
}

.btn-primary .btn__icon {
  background: rgba(255, 255, 255, 0.2);
}

.btn-outline .btn__icon,
.btn-ghost .btn__icon {
  background: color-mix(
    in srgb,
    var(--color-primary-amber-20) 78%,
    transparent
  );
}

.btn:hover .btn__icon {
  opacity: 1;
  transform: translateY(-1px) scale(1.06);
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

.btn-ghost {
  background: linear-gradient(
    145deg,
    color-mix(
        in srgb,
        var(--color-cockpit-bg-mid-97) 80%,
        var(--color-primary-amber-06)
      )
      0%,
    color-mix(in srgb, var(--color-cockpit-bg-mid-97) 90%, transparent) 100%
  );
  color: color-mix(in srgb, var(--color-zinc-muted) 84%, #fff);
  border-color: color-mix(in srgb, var(--color-primary-amber-24) 72%, #94a3b8);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.btn-ghost:hover:not(:disabled) {
  color: v.$zinc-text;
  border-color: var(--color-primary-amber-42);
  background: linear-gradient(
    145deg,
    color-mix(
        in srgb,
        var(--color-cockpit-bg-mid-97) 74%,
        var(--color-primary-amber-14)
      )
      0%,
    color-mix(
        in srgb,
        var(--color-cockpit-bg-mid-97) 84%,
        var(--color-primary-amber-08)
      )
      100%
  );
  box-shadow: 0 8px 16px var(--color-primary-amber-12);
}

.btn-ghost:active:not(:disabled) {
  transform: translateY(1px);
}

.product-list__reset-btn {
  min-width: 104px;
  font-weight: 500;
  letter-spacing: 0.01em;
}

.product-list__search-btn {
  height: 36px;
  padding: 0 11px;
  min-width: 80px;
}

.product-list__search-btn .btn__icon {
  width: 16px;
  height: 16px;
  font-size: 11px;
}

.btn-danger {
  background: color-mix(
    in srgb,
    var(--color-primary-amber-28) 65%,
    rgba(127, 29, 29, 0.28)
  );
  color: color-mix(in srgb, #fff 82%, var(--color-accent-warm) 18%);
  border-color: color-mix(
    in srgb,
    var(--color-primary-amber-48) 70%,
    rgba(248, 113, 113, 0.42)
  );
}

.btn-danger:hover:not(:disabled) {
  background: color-mix(
    in srgb,
    var(--color-primary-amber-35) 60%,
    rgba(153, 27, 27, 0.32)
  );
  border-color: var(--color-primary-amber-55);
  box-shadow: 0 0 12px var(--color-primary-amber-18);
}

.btn-danger--pending {
  background: color-mix(
    in srgb,
    var(--color-primary-amber-35) 72%,
    rgba(153, 27, 27, 0.35)
  );
  border-color: var(--color-primary-amber-55);
  color: #fff;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* WOW.js + animate.css 负责入场；此处仅做无障碍降级 */
@media (prefers-reduced-motion: reduce) {
  .product-list__toolbar.wow,
  .product-card-wow.wow {
    visibility: visible !important;
    animation: none !important;
  }
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}

.product-list__result {
  position: relative;
  min-height: 220px;
}

.product-list__load-more-trigger {
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-list__load-more-text {
  font-size: 12px;
  color: color-mix(in srgb, var(--color-primary-amber-80) 72%, #fff);
  letter-spacing: 0.03em;
}

:deep(.product-list-loading-mask .el-loading-spinner .path) {
  stroke: var(--color-primary-amber);
}

:deep(.product-list-loading-mask .el-loading-text) {
  color: color-mix(in srgb, var(--color-primary-amber) 84%, #fff);
  letter-spacing: 0.02em;
}

.product-list__toolbar .btn {
  height: 38px;
}

.product-filters {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.1rem;
}

.filter-chip {
  height: 28px;
  padding: 0 11px;
  border-radius: 999px;
  border: 1px solid var(--color-primary-amber-24);
  background: color-mix(
    in srgb,
    var(--color-cockpit-bg-mid-97) 82%,
    transparent
  );
  color: v.$zinc-muted;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
}

.filter-chip:hover {
  color: v.$zinc-text;
  border-color: var(--color-primary-amber-38);
}

.filter-chip--active {
  color: #fff;
  border-color: var(--color-primary-amber-55);
  background: linear-gradient(
    135deg,
    var(--color-primary-amber-70) 0%,
    var(--color-primary-amber) 100%
  );
  box-shadow: 0 8px 18px var(--color-primary-amber-18);
}

.product-card {
  --card-padding: 0.9rem;
  display: block;
  text-decoration: none;
  color: inherit;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--color-primary-amber-24);
  border-radius: 12px;
  padding: var(--card-padding);
  background: linear-gradient(
    145deg,
    v.$panel-bg 0%,
    var(--color-cockpit-bg-mid-96) 100%
  );
  box-shadow: 0 10px 22px
    color-mix(in srgb, var(--color-cockpit-bg-mid-97) 75%, transparent);
  will-change: transform, box-shadow, border-color;
  transition:
    border-color 0.3s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.32s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--product-card-sheen);
    opacity: 0.9;
    pointer-events: none;
    transition: opacity 0.32s cubic-bezier(0.22, 1, 0.36, 1);
  }

  &__img {
    position: relative;
    z-index: 1;
    aspect-ratio: 1 / 1;
    min-height: 216px;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background:
      radial-gradient(
        circle at 30% 20%,
        var(--color-primary-amber-16) 0%,
        var(--color-primary-amber-06) 42%,
        transparent 80%
      ),
      color-mix(in srgb, var(--color-cockpit-bg-mid-97) 72%, transparent);
    border: 1px solid var(--color-primary-amber-20);
    margin: calc(-1 * var(--card-padding)) calc(-1 * var(--card-padding))
      0.75rem;
    border-radius: 12px 12px 8px 8px;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.36s cubic-bezier(0.22, 1, 0.36, 1);
    }

    span {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 34px;
      opacity: 0.75;
    }
  }

  &:hover &__img img {
    transform: scale(1.025);
  }

  &:hover {
    border-color: var(--color-primary-amber-36);
    box-shadow: 0 16px 30px var(--product-card-hover-glow);
    transform: translateY(-2px);
  }

  &:hover::before {
    opacity: 1;
  }

  &__title-row {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    min-height: 32px;
  }

  &__title {
    position: relative;
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__price {
    position: relative;
    z-index: 1;
    color: v.$accent-warm;
    font-weight: 700;
    font-size: 0.98rem;
  }

  &__meta {
    position: relative;
    z-index: 1;
    color: v.$zinc-muted;
    font-size: 11px;
  }

  &__meta-row {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__actions {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  &__icon-btn {
    width: 24px;
    height: 24px;
    border-radius: 7px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--color-primary-amber-22);
    color: color-mix(in srgb, var(--color-zinc-muted) 80%, #fff);
    text-decoration: none;
    background: color-mix(
      in srgb,
      var(--color-cockpit-bg-mid-97) 88%,
      transparent
    );
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
    opacity: 0;
    transform: translateX(10px);
    pointer-events: none;
    transition:
      opacity 0.3s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
      color 0.22s ease,
      border-color 0.22s ease,
      background 0.22s ease;
  }

  &__icon-btn :deep(svg) {
    width: 13px;
    height: 13px;
  }

  &:hover &__icon-btn {
    opacity: 1;
    transform: translateX(0);
    pointer-events: auto;
  }

  &:hover &__icon-btn:nth-child(2) {
    transition-delay: 0.06s;
  }

  &__icon-btn:hover {
    color: #fff;
    border-color: var(--color-primary-amber-55);
    background: linear-gradient(
      135deg,
      var(--color-primary-amber-70) 0%,
      var(--color-primary-amber) 100%
    );
  }

  &__icon-btn:focus-visible {
    opacity: 1;
    transform: translateX(0);
    pointer-events: auto;
    outline: 2px solid var(--color-primary-amber-55);
    outline-offset: 2px;
  }
}

.product-card--off {
  border-color: color-mix(
    in srgb,
    var(--color-primary-amber-24) 70%,
    var(--color-zinc-faint)
  );
  background: linear-gradient(
    145deg,
    color-mix(
        in srgb,
        var(--color-cockpit-bg-mid-97) 88%,
        var(--color-zinc-faint) 12%
      )
      0%,
    color-mix(in srgb, var(--color-cockpit-bg-mid-97) 92%, black 8%) 100%
  );

  .product-card__title,
  .product-card__price {
    color: color-mix(in srgb, var(--color-zinc-text) 86%, #fff);
  }

  .product-card__meta {
    color: color-mix(in srgb, var(--color-zinc-muted) 88%, #9ca3af);
  }

  .product-card__img {
    border-color: color-mix(
      in srgb,
      var(--color-primary-amber-20) 78%,
      #94a3b8
    );
    filter: saturate(0.72) brightness(0.92);
  }

  .product-card__icon-btn {
    border-color: color-mix(
      in srgb,
      var(--color-primary-amber-20) 72%,
      #94a3b8
    );
    color: color-mix(in srgb, var(--color-zinc-muted) 85%, #cbd5e1);
  }
}

.badge {
  position: relative;
  z-index: 1;
  display: inline-block;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
}

.badge-on {
  background: linear-gradient(
    135deg,
    var(--color-primary-amber-70) 0%,
    var(--color-primary-amber) 100%
  );
  color: #fff;
  border: 1px solid var(--color-primary-amber-55);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}
.badge-off {
  background: color-mix(
    in srgb,
    var(--color-primary-amber-16) 68%,
    var(--color-cockpit-bg-mid-97)
  );
  color: color-mix(in srgb, var(--color-primary-amber-90) 78%, #fff);
  border: 1px solid var(--color-primary-amber-35);
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
  background: color-mix(
    in srgb,
    var(--color-cockpit-bg-mid-97) 78%,
    var(--color-primary-amber-12)
  );
  color: v.$zinc-text;
  font-size: 12px;
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

@media (min-width: 1440px) {
  .product-list {
    &__content {
      padding: 32px 36px 32px;
    }

    &__title {
      font-size: 1.92rem;
    }

    &__subtitle {
      font-size: 0.92rem;
    }
  }

  .product-overview {
    gap: 0.9rem;
  }

  .overview-card {
    padding: 0.9rem 1rem;

    &__value {
      font-size: 1.2rem;
    }
  }

  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1.1rem;
  }
}

@media (max-width: 1366px) {
  .product-list {
    &__content {
      padding: 20px 16px 18px;
    }

    &__header {
      margin-bottom: 1rem;
    }

    &__title {
      font-size: 1.62rem;
    }

    &__subtitle {
      font-size: 0.84rem;
    }

    &__search {
      height: 36px;
      font-size: 12px;
    }
  }

  .product-overview {
    gap: 0.6rem;
    margin-bottom: 0.85rem;
  }

  .overview-card {
    padding: 0.65rem 0.75rem;

    &__label {
      font-size: 10px;
    }

    &__value {
      font-size: 1.06rem;
    }
  }

  .product-list__toolbar .btn {
    height: 34px;
    padding: 0 10px;
    font-size: 12px;
  }

  .product-list__search-btn {
    min-width: 72px;
  }

  .btn__icon {
    width: 15px;
    height: 15px;
    font-size: 10px;
  }

  .product-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.85rem;
  }

  .product-card {
    --card-padding: 0.75rem;

    &__img {
      min-height: 178px;
    }

    &__title {
      font-size: 0.9rem;
    }

    &__price {
      font-size: 0.92rem;
    }

    &__meta {
      font-size: 10px;
    }
  }

  .filter-chip {
    height: 26px;
    font-size: 11px;
  }
}

@media (max-width: 1180px) {
  .product-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
