<template>
  <div class="product-list">
    <TopBar
      :is-home="isHome"
      :is-product-create="isProductCreate"
      @layout-height="onTopBarLayoutHeight"
    />
    <div class="product-list__warm-base" aria-hidden="true" />
    <div class="product-list__vignette" aria-hidden="true" />

    <div class="product-list__content">
      <section
        ref="toolbarRef"
        class="product-list__toolbar wow animate__animated animate__fadeInLift"
        :style="toolbarStickyStyle"
        data-wow-duration="0.42s"
        data-wow-delay="0s"
      >
        <div class="product-list__search-cluster">
          <el-input
            v-model="keyword"
            class="product-list__search"
            placeholder="搜索产品名称、型号、品牌..."
            :prefix-icon="Search"
            clearable
            @keyup.enter="search"
            @clear="search"
          />
          <el-button class="btn btn-outline product-list__image-search-btn" @click="showModal = true">
            <span class="btn__icon" aria-hidden="true"
              ><el-icon><Picture /></el-icon
            ></span>
            以图搜图
          </el-button>
          <el-button
            class="btn btn-primary product-list__search-btn"
            @click="search"
          >
            <span class="btn__icon" aria-hidden="true"
              ><el-icon><Search /></el-icon
            ></span>
            搜索
          </el-button>
        </div>
        <el-button
          class="btn btn-ghost product-list__reset-btn"
          @click="resetFilters"
        >
          <span class="btn__icon" aria-hidden="true"
            ><el-icon><RefreshRight /></el-icon
          ></span>
          重置
        </el-button>
      </section>
      <div
        v-if="imageUrlFilter"
        class="product-list__image-filter wow animate__animated animate__fadeInLift"
        :style="imageFilterStickyStyle"
      >
        <span class="product-list__image-filter-label">以图搜图链接：</span>
        <a
          class="product-list__image-filter-link"
          :href="imageUrlFilter"
          target="_blank"
          rel="noopener noreferrer"
          :title="imageUrlFilter"
        >
          {{ imageUrlFilter }}
        </a>
        <el-button class="product-list__image-filter-btn" @click="copyImageUrl">
          复制链接
        </el-button>
        <el-button class="product-list__image-filter-btn product-list__image-filter-btn--danger" @click="clearImageFilterAndSearch">
          清除搜图
        </el-button>
      </div>

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
            class="wow animate__animated animate__fadeInLift product-card-wow"
            data-wow-duration="0.42s"
            :data-wow-delay="`${Math.min(idx % 12, 11) * 0.04}s`"
          >
            <div
              :class="[
                'product-card',
                { 'product-card--off': p.state === ProductStatusEnum.DOWN },
              ]"
            >
            <div class="product-card__img">
              <div
                v-if="p.imageUrl && !isImageLoaded(p)"
                class="product-card__img-placeholder"
                aria-hidden="true"
              />
              <img
                v-if="p.imageUrl"
                :src="p.imageUrl"
                :alt="p.name"
                loading="lazy"
                decoding="async"
                :class="{ 'product-card__img-el--loaded': isImageLoaded(p) }"
                @load="onProductImageLoad(p)"
              />
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
      @submit="onImageSearchSubmit"
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
import type { ProductCardItem, ProductOut } from '@/types/product';
import { ProductStatusEnum } from '@/enums/product';
import { normalizeProductStateFromOut } from '@/utils/productState';
import { getProductPage } from '@/api/product';
import { isRequestCanceled, RequestError } from '@/utils/request';
import { ElMessage } from 'element-plus';
import ImageSearchDialog from '@/components/ImageSearchDialog.vue';
import TopBar from '@/components/topBar.vue';
import { createWowController } from '@/utils/wow';
import { PRODUCT_VIEW_CONSTANTS } from '@/constants/productView';

const route = useRoute();
const keyword = ref<string>('');
const showModal = ref<boolean>(false);
const imageUrlFilter = ref<string>('');
const currentPage = ref<number>(1);
const loading = ref<boolean>(false);
const total = ref<number>(0);
const loadMoreRef = ref<HTMLElement | null>(null);
let loadMoreObserver: IntersectionObserver | null = null;
const wowController = createWowController();

const products = ref<ProductCardItem[]>([]);
const loadedImageKeys = ref<Set<string>>(new Set<string>());

const getImageLoadKey = (product: Pick<ProductCardItem, 'id' | 'imageUrl'>): string =>
  `${product.id}-${product.imageUrl || ''}`;

const totalPages = computed<number>(
  () => Math.ceil(total.value / PRODUCT_VIEW_CONSTANTS.PAGE_SIZE) || 1,
);
const hasMore = computed<boolean>(() => currentPage.value < totalPages.value);
const filteredPaged = computed<ProductCardItem[]>(() => products.value);

const isHome = computed<boolean>(() => route.name === 'home');
const isProductCreate = computed<boolean>(() => route.name === 'productCreate');

/** 与 TopBar 实测 offsetHeight 同步，sticky 搜索条紧贴导航底边 */
const topBarOffsetPx = ref<number>(PRODUCT_VIEW_CONSTANTS.INITIAL_TOPBAR_OFFSET_PX);
const toolbarRef = ref<HTMLElement | null>(null);
const toolbarHeightPx = ref<number>(PRODUCT_VIEW_CONSTANTS.INITIAL_TOOLBAR_HEIGHT_PX);

const onTopBarLayoutHeight = (px: number): void => {
  topBarOffsetPx.value = px;
};

/** 比顶栏实测高度上移 3px，与导航底边叠一层，避免亚像素缝透出列表图 */
const toolbarStickyStyle = computed((): { top: string } => ({
  top: `${Math.max(0, topBarOffsetPx.value - PRODUCT_VIEW_CONSTANTS.TOPBAR_OVERLAP_PX)}px`,
}));

/** 链接条吸附在搜索栏正下方 */
const imageFilterStickyStyle = computed((): { top: string } => ({
  top: `${Math.max(
    0,
    topBarOffsetPx.value -
      PRODUCT_VIEW_CONSTANTS.TOPBAR_OVERLAP_PX +
      toolbarHeightPx.value -
      PRODUCT_VIEW_CONSTANTS.FILTER_BAR_OFFSET_PX,
  )}px`,
}));

const syncToolbarHeight = (): void => {
  if (!toolbarRef.value) return;
  toolbarHeightPx.value = toolbarRef.value.offsetHeight;
};

const fetchProducts = async (append = false): Promise<void> => {
  if (loading.value) return;
  loading.value = true;
  try {
    const res = await getProductPage({
      keyword: keyword.value.trim() || undefined,
      imageUrl: imageUrlFilter.value || undefined,
      page: currentPage.value,
      size: PRODUCT_VIEW_CONSTANTS.PAGE_SIZE,
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
        images: x.images || [],
        imageUrl: x.images?.[0] || undefined,
        material: x.material || '',
        diameter: x.diameter ?? undefined,
        weight: x.weight ?? undefined,
        mount: x.mount || '',
        description: x.description || '',
      }),
    );
    if (!append) {
      const currentKeys = new Set(mapped.map((item) => getImageLoadKey(item)));
      // 保留当前列表仍在使用的已加载图片，避免搜索后节点复用导致 load 不再触发
      loadedImageKeys.value = new Set(
        [...loadedImageKeys.value].filter((key) => currentKeys.has(key)),
      );
    }
    products.value = append ? [...products.value, ...mapped] : mapped;
    total.value = res.data?.totalElements ?? list.length;
  } catch (e) {
    if (isRequestCanceled(e as Error)) return;
    if (e instanceof RequestError && e.isNotified) return;
    const msg =
      e instanceof RequestError ? e.message : '产品列表加载失败，请稍后重试';
    ElMessage.error(msg);
  } finally {
    loading.value = false;
  }
};

const onProductImageLoad = (product: ProductCardItem): void => {
  loadedImageKeys.value.add(getImageLoadKey(product));
};

const isImageLoaded = (product: ProductCardItem): boolean =>
  loadedImageKeys.value.has(getImageLoadKey(product));

const refreshFirstPage = (): void => {
  currentPage.value = 1;
  void fetchProducts(false);
};

const search = (): void => {
  refreshFirstPage();
};

const clearImageFilterAndSearch = (): void => {
  imageUrlFilter.value = '';
  refreshFirstPage();
};

const copyImageUrl = async (): Promise<void> => {
  if (!imageUrlFilter.value) return;
  try {
    await navigator.clipboard.writeText(imageUrlFilter.value);
    ElMessage.success('已复制图片链接');
  } catch {
    ElMessage.warning('复制失败，请手动复制');
  }
};

const resetFilters = (): void => {
  keyword.value = '';
  imageUrlFilter.value = '';
  refreshFirstPage();
};

const onImageSearchSubmit = (payload: { imageUrl: string }): void => {
  imageUrlFilter.value = payload.imageUrl;
  refreshFirstPage();
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
      wowController.sync();
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
      rootMargin: PRODUCT_VIEW_CONSTANTS.LOAD_MORE_ROOT_MARGIN,
      threshold: PRODUCT_VIEW_CONSTANTS.LOAD_MORE_THRESHOLD,
    },
  );
  loadMoreObserver.observe(loadMoreRef.value);
};

onMounted((): void => {
  void fetchProducts(false);
  initLoadMoreObserver();
  void nextTick(() => {
    syncToolbarHeight();
  });
  void nextTick(() => {
    wowController.init();
  });
});

onUnmounted((): void => {
  loadMoreObserver?.disconnect();
  loadMoreObserver = null;
  wowController.stop();
});

watch(
  () => [imageUrlFilter.value, keyword.value],
  (): void => {
    void nextTick(() => {
      syncToolbarHeight();
    });
  },
  { flush: 'post' },
);

if (typeof ResizeObserver !== 'undefined') {
  let toolbarResizeObserver: ResizeObserver | null = null;
  onMounted((): void => {
    if (!toolbarRef.value) return;
    toolbarResizeObserver = new ResizeObserver((): void => {
      syncToolbarHeight();
    });
    toolbarResizeObserver.observe(toolbarRef.value);
  });
  onUnmounted((): void => {
    toolbarResizeObserver?.disconnect();
    toolbarResizeObserver = null;
  });
}
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
    background: var(
      --product-list-warm-base-bg,
      radial-gradient(
        ellipse 95% 60% at 50% 110%,
        var(--color-primary-amber-20) 0%,
        transparent 55%
      )
    );
  }

  &__vignette {
    box-shadow: var(--product-list-vignette-shadow, inset 0 0 120px rgba(0, 0, 0, 0.5));
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
    position: sticky;
    /* top 由 toolbarStickyStyle 绑定；z-index 低于顶栏 50 */
    z-index: 40;
    isolation: isolate;
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    gap: 0.75rem;
    /* 与 __content 左右 padding 对消，条带铺满内容区宽度 */
    margin-left: -24px;
    margin-right: -24px;
    margin-bottom: 1.35rem;
    padding: 12px 24px 14px;
    border-bottom: 1px solid
      var(--search-toolbar-border, color-mix(in srgb, var(--color-primary-amber-28) 28%, transparent));
    /* 实色座舱底，不用 backdrop-filter，避免列表图透过条带 */
    background: var(
      --search-toolbar-bg,
      linear-gradient(
        180deg,
        rgba(0, 0, 0, 0.22) 0%,
        rgba(0, 0, 0, 0.08) 100%
      ),
      var(--color-cockpit-bg-mid)
    );
    box-shadow: var(--search-toolbar-shadow, 0 10px 28px rgba(0, 0, 0, 0.35));

    /* 向上补一条实色，盖住 sticky 与导航之间可能出现的透光缝 */
    &::before {
      content: '';
      position: absolute;
      z-index: 0;
      left: 0;
      right: 0;
      top: -12px;
      height: 12px;
      background: var(--search-toolbar-cap-bg, var(--color-cockpit-bg-mid));
      pointer-events: none;
    }

    & > * {
      position: relative;
      z-index: 1;
    }

    @media (max-width: 900px) {
      grid-template-columns: 1fr 1fr;
    }
  }

  &__search {
    --el-input-height: 40px;

    :deep(.el-input__wrapper) {
      border-radius: 10px;
      border: 1px solid var(--search-input-border, var(--color-primary-amber-28));
      background: var(--search-input-bg, v.$input-bg);
      box-shadow: none;
      transition:
        border-color 0.18s ease,
        box-shadow 0.18s ease,
        background-color 0.18s ease;
    }

    :deep(.el-input__wrapper.is-focus) {
      border-color: var(--search-input-focus-border, var(--color-primary-amber-45));
      box-shadow: var(
        --search-input-focus-shadow,
        0 0 0 2px var(--color-primary-amber-16),
        inset 0 1px 0 rgba(255, 255, 255, 0.08)
      );
      background: var(
        --search-input-focus-bg,
        color-mix(in srgb, var(--color-cockpit-bg-mid-97) 92%, var(--color-primary-amber-06))
      );
    }

    :deep(.el-input__inner) {
      font-size: 13px;
      color: v.$zinc-text;
    }

    :deep(.el-input__inner::placeholder) {
      color: color-mix(in srgb, #fff 54%, var(--color-zinc-muted));
    }

    :deep(.el-input__prefix-inner) {
      color: color-mix(in srgb, #fff 58%, var(--color-zinc-muted));
    }

    :deep(.el-input__clear) {
      color: color-mix(in srgb, #fff 72%, var(--color-zinc-muted));
    }

    :deep(.el-input__clear:hover) {
      color: #fff;
    }
  }

  &__image-filter {
    position: sticky;
    z-index: 39;
    display: flex;
    align-items: center;
    gap: 10px;
    margin: -0.65rem 0 1rem;
    padding: 9px 12px;
    border-radius: 10px;
    border: 1px solid var(--image-filter-border, var(--color-primary-amber-22));
    background: var(
      --image-filter-bg,
      color-mix(in srgb, var(--color-cockpit-bg-mid-97) 90%, transparent)
    );
    box-shadow: var(--image-filter-shadow, 0 6px 18px rgba(0, 0, 0, 0.24));
  }

  &__image-filter-label {
    flex-shrink: 0;
    font-size: 12px;
    color: var(--image-filter-label-color, color-mix(in srgb, var(--color-primary-amber-80) 80%, #fff));
  }

  &__image-filter-link {
    min-width: 0;
    flex: 1;
    color: var(--image-filter-link-color, v.$zinc-text);
    font-size: 12px;
    text-decoration: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__image-filter-link:hover {
    color: var(--image-filter-link-hover-color, var(--color-primary-amber));
    text-decoration: underline;
  }

  &__image-filter-btn {
    flex-shrink: 0;
    height: 28px;
    padding: 0 10px;
    border-radius: 8px;
    border: 1px solid var(--image-filter-btn-border, var(--color-primary-amber-28));
    background: var(
      --image-filter-btn-bg,
      color-mix(in srgb, var(--color-primary-amber-12) 70%, transparent)
    );
    color: var(--image-filter-btn-color, v.$zinc-text);
    font-size: 12px;
    cursor: pointer;
  }

  &__image-filter-btn:hover {
    border-color: var(--image-filter-btn-hover-border, var(--color-primary-amber-48));
    background: var(
      --image-filter-btn-hover-bg,
      color-mix(in srgb, var(--color-primary-amber-18) 72%, transparent)
    );
  }

  &__image-filter-btn--danger {
    border-color: var(
      --image-filter-btn-danger-border,
      color-mix(in srgb, var(--color-primary-amber-35) 72%, #ef4444)
    );
    color: var(--image-filter-btn-danger-color, color-mix(in srgb, #fff 84%, #fda4af));
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
  line-height: 1;
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
  transform: translateY(0.5px);
  flex-shrink: 0;
  transition:
    transform 0.2s ease,
    opacity 0.2s ease,
    background-color 0.2s ease;
}

.btn__icon :deep(.el-icon) {
  width: 1em;
  height: 1em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
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
  transform: translateY(0.5px) scale(1.06);
}

:deep(.btn.el-button > span) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  line-height: 1;
}

.btn-primary {
  background: var(--search-btn-primary-bg, var(--color-primary-amber-85));
  color: var(--search-btn-primary-color, #fff);
  border-color: var(--search-btn-primary-border, var(--color-primary-amber));
}

.btn-primary:hover:not(:disabled) {
  background: var(--search-btn-primary-hover-bg, var(--color-primary-amber));
  border-color: var(--search-btn-primary-hover-border, var(--color-accent-warm));
  box-shadow: var(--search-btn-primary-hover-shadow, 0 0 16px var(--color-primary-amber-24));
}

.btn-outline {
  background: var(--search-btn-outline-bg, transparent);
  color: var(--search-btn-outline-color, v.$zinc-label);
  border-color: var(--search-btn-outline-border, var(--color-primary-amber-35));
}

.btn-outline:hover:not(:disabled) {
  color: var(--search-btn-outline-hover-color, v.$zinc-text);
  border-color: var(--search-btn-outline-hover-border, var(--color-primary-amber-55));
  background: var(--search-btn-outline-hover-bg, var(--color-primary-amber-10));
}

.btn-ghost {
  background: var(--search-btn-ghost-bg, linear-gradient(
    145deg,
    color-mix(
        in srgb,
        var(--color-cockpit-bg-mid-97) 80%,
        var(--color-primary-amber-06)
      )
      0%,
    color-mix(in srgb, var(--color-cockpit-bg-mid-97) 90%, transparent) 100%
  ));
  color: var(--search-btn-ghost-color, color-mix(in srgb, var(--color-zinc-muted) 84%, #fff));
  border-color: var(--search-btn-ghost-border, color-mix(in srgb, var(--color-primary-amber-24) 72%, #94a3b8));
  box-shadow: var(--search-btn-ghost-shadow, inset 0 1px 0 rgba(255, 255, 255, 0.08));
}

.btn-ghost:hover:not(:disabled) {
  color: var(--search-btn-ghost-hover-color, v.$zinc-text);
  border-color: var(--search-btn-ghost-hover-border, var(--color-primary-amber-42));
  background: var(--search-btn-ghost-hover-bg, linear-gradient(
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
  ));
  box-shadow: var(--search-btn-ghost-hover-shadow, 0 8px 16px var(--color-primary-amber-12));
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

/* 轻量入场：淡入 + 约 8px 上移（弱于 animate 默认 fadeInUp） */
@keyframes product-fade-in-lift {
  from {
    opacity: 0;
    transform: translate3d(0, 8px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

.animate__fadeInLift {
  animation-name: product-fade-in-lift;
  animation-timing-function: cubic-bezier(0.22, 0.61, 0.36, 1);
}

/* WOW.js + 自定义 animate；无障碍降级 */
@media (prefers-reduced-motion: reduce) {
  .product-list__toolbar.wow,
  .product-card-wow.wow {
    visibility: visible !important;
    animation: none !important;
  }
}

.product-grid {
  column-count: 4;
  column-gap: 1rem;
}

.product-card-wow {
  break-inside: avoid;
  margin-bottom: 1rem;
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

.product-list__search-cluster {
  display: contents;
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
      0.65rem;
    border-radius: 12px 12px 8px 8px;

    img {
      width: 100%;
      height: auto;
      object-fit: contain;
      display: block;
      opacity: 0;
      transition:
        transform 0.36s cubic-bezier(0.22, 1, 0.36, 1),
        opacity 0.28s ease;
    }

    .product-card__img-el--loaded {
      opacity: 1;
    }

    .product-card__img-placeholder {
      position: absolute;
      inset: 0;
      background:
        linear-gradient(
          100deg,
          color-mix(in srgb, var(--color-cockpit-bg-mid-97) 88%, transparent) 0%,
          color-mix(in srgb, var(--color-primary-amber-12) 56%, transparent) 46%,
          color-mix(in srgb, var(--color-cockpit-bg-mid-97) 88%, transparent) 100%
        ),
        radial-gradient(
          circle at 30% 20%,
          var(--color-primary-amber-10) 0%,
          transparent 60%
        );
      background-size: 240% 100%, 100% 100%;
      animation: product-image-placeholder-shimmer 1.25s ease-in-out infinite;
      pointer-events: none;
      z-index: 0;
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
    margin-bottom: 0.28rem;
  }

  &__title {
    position: relative;
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.28;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__price {
    position: relative;
    z-index: 1;
    margin: 0 0 0.42rem;
    padding: 0;
    color: v.$accent-warm;
    font-weight: 700;
    font-size: 0.98rem;
    line-height: 1.25;
  }

  &__meta {
    position: relative;
    z-index: 1;
    margin: 0;
    color: v.$zinc-muted;
    font-size: 11px;
    line-height: 1.45;
  }

  &__meta-row {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
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

@keyframes product-image-placeholder-shimmer {
  0% {
    background-position:
      100% 0,
      0 0;
  }
  100% {
    background-position:
      -100% 0,
      0 0;
  }
}

@media (min-width: 1440px) {
  .product-list {
    &__content {
      padding: 32px 36px 32px;
    }

    &__toolbar {
      margin-left: -36px;
      margin-right: -36px;
      padding-left: 36px;
      padding-right: 36px;
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
    column-count: 4;
    column-gap: 1.1rem;
  }
}

@media (max-width: 1366px) {
  .product-list {
    &__content {
      padding: 20px 16px 18px;
    }

    &__toolbar {
      margin-left: -16px;
      margin-right: -16px;
      padding-left: 16px;
      padding-right: 16px;
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
    column-count: 4;
    column-gap: 0.85rem;
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
    column-count: 3;
  }
}

@media (max-width: 900px) {
  .product-list {
    &__toolbar {
      grid-template-columns: 1fr 1fr;
      gap: 0.6rem;
    }

    &__search-wrap {
      grid-column: 1 / -1;
    }

    &__image-filter {
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: start;
      gap: 8px;
      padding: 10px;
      border-radius: 10px;
      border-color: color-mix(in srgb, var(--color-primary-amber-16) 52%, rgba(255, 255, 255, 0.02));
      background: color-mix(in srgb, var(--color-cockpit-bg-mid-97) 96%, transparent);
      box-shadow: none;
    }

    &__image-filter-label {
      grid-column: 1 / -1;
      font-size: 11px;
      letter-spacing: 0.02em;
      color: color-mix(in srgb, var(--color-primary-amber-85) 82%, #fff);
    }

    &__image-filter-link {
      grid-column: 1 / -1;
      padding: 8px 9px;
      border-radius: 8px;
      border: 1px solid color-mix(in srgb, var(--color-primary-amber-10) 56%, transparent);
      background: color-mix(in srgb, var(--color-cockpit-bg-mid-97) 98%, transparent);
      box-sizing: border-box;
      box-shadow: none;
    }

    &__image-filter-btn {
      min-width: 0;
      width: 100%;
      justify-content: center;
      border-color: color-mix(in srgb, var(--color-primary-amber-20) 58%, transparent);
      background: color-mix(in srgb, var(--color-cockpit-bg-mid-97) 94%, var(--color-primary-amber-06));
      box-shadow: none;
      margin-left: 0 !important;
      white-space: nowrap;
    }

    &__image-filter-btn:hover {
      border-color: var(--color-primary-amber-42);
      background: color-mix(in srgb, var(--color-cockpit-bg-mid-97) 90%, var(--color-primary-amber-12));
    }
  }

  .product-grid {
    column-count: 2;
    column-gap: 0.85rem;
  }
}

@media (max-width: 768px) {
  .product-list {
    &__content {
      padding: 14px 16px 14px;
    }

    &__toolbar {
      position: static;
      margin-left: 0;
      margin-right: 0;
      padding: 0;
      grid-template-columns: minmax(0, 1fr) auto;
      grid-auto-rows: 32px;
      gap: 0.4rem;
      align-items: center;
      min-height: 32px;
      height: 32px;
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
      box-sizing: border-box;
      overflow: visible;

      &::before {
        content: none;
      }
    }

    &__search-cluster {
      grid-column: 1 / 2;
      grid-row: 1;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto auto;
      align-items: center;
      min-height: 32px;
      height: 32px;
      border: 1px solid #e4e4e7;
      border-radius: 8px;
      background: #fff;
      box-sizing: border-box;
      overflow: hidden;
    }

    &__search {
      grid-column: 1 / 2;
      grid-row: 1;
      height: 26px;
      --el-input-height: 26px;

      :deep(.el-input__wrapper) {
        border-radius: 8px 0 0 8px;
        border: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }

      :deep(.el-input__inner) {
        font-size: 13px;
      }
    }

    &__search-btn {
      grid-column: 3 / 4;
      grid-row: 1;
      width: auto;
      min-width: 32px;
      padding: 0 6px;
      justify-self: end;
      border-radius: 0 8px 8px 0;
      border: 0;
      border-left: 1px solid #18181b;
      background: #18181b;
      color: #ffffff;
      box-shadow: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    &__search-btn:hover {
      border-left-color: #27272a;
      background: #27272a;
      color: #ffffff;
    }

    &__image-search-btn {
      grid-column: 2 / 3;
      grid-row: 1;
      width: auto;
      min-width: 30px;
      padding: 0 4px;
      border-radius: 0;
      border: 0;
      border-left: 1px solid #e4e4e7;
      background: transparent;
      color: #71717a;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    &__reset-btn {
      grid-column: 2 / 3;
      grid-row: 1;
      width: auto;
      min-width: 34px;
      padding: 0 8px;
      justify-self: end;
      border-radius: 8px;
      border: 1px solid #e4e4e7;
      background: #fff;
      color: #52525b;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    &__image-filter {
      position: static;
      margin-top: 0.55rem;
      gap: 7px;
    }

    &__image-filter-btn {
      height: 30px;
    }
  }

  .product-list__toolbar .btn {
    width: auto;
    justify-content: center;
    min-width: 0;
    font-size: 0;
    border-radius: 0;
    line-height: 1;
  }

  .product-list__image-search-btn {
    border-color: transparent;
    box-shadow: none;
  }

  .product-list__image-search-btn:hover {
    border-color: transparent;
    box-shadow: none;
    background: transparent;
    color: #71717a;
  }

  .product-list__image-search-btn:active,
  .product-list__image-search-btn:focus-visible {
    border-color: transparent;
    box-shadow: none;
    background: transparent;
    color: #71717a;
  }

  .product-list__reset-btn:hover {
    border-color: #d4d4d8;
    background: #fafafa;
    box-shadow: none;
    color: #3f3f46;
  }

  .product-list__search-btn .btn__icon + :not(.btn__icon),
  .product-list__image-search-btn .btn__icon + :not(.btn__icon),
  .product-list__reset-btn .btn__icon + :not(.btn__icon) {
    display: none;
  }

  .product-list__image-search-btn .btn__icon {
    width: 24px;
    height: 24px;
    font-size: 16px;
    background: transparent;
  }

  .product-list__search-btn .btn__icon {
    background: transparent;
  }

  :deep(.product-list__search-btn.el-button > span) {
    gap: 0 !important;
  }

  :deep(.product-list__image-search-btn.el-button > span) {
    gap: 0 !important;
  }

  :deep(.product-list__reset-btn.el-button > span) {
    gap: 0 !important;
  }

  .product-grid {
    column-count: 2;
    column-gap: 0.85rem;
  }

  .product-card {
    --card-padding: 0.7rem;

    &__img {
      min-height: 0;
      aspect-ratio: auto;
    }

    /* 手机端无 hover，直接显示操作按钮 */
    &__icon-btn {
      opacity: 1;
      transform: translateX(0);
      pointer-events: auto;
    }

    &__meta-row {
      align-items: center;
      flex-direction: row;
      gap: 8px;
    }

    &__meta {
      flex: 1;
      min-width: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

@media (max-width: 560px) {
  .product-list {
    &__content {
      padding: 12px 16px 12px;
    }

    &__toolbar {
      margin-left: 0;
      margin-right: 0;
      padding: 0;
    }
  }

  .product-grid {
    column-count: 2;
    column-gap: 0.85rem;
  }

  .product-list__toolbar .btn { height: 26px; padding: 0 12px; border-radius: 10px; }

}

@media (max-width: 420px) {
  .product-list {
    &__content {
      padding: 10px 8px 12px;
    }

    &__toolbar {
      margin-left: 0;
      margin-right: 0;
      padding: 0;
      margin-bottom: 0.85rem;
    }

    &__image-filter {
      margin-top: 0.45rem;
      padding: 8px;
      border-radius: 8px;
      gap: 6px;
    }

    &__image-filter-label,
    &__image-filter-link {
      font-size: 11px;
    }

    &__image-filter-link {
      padding: 6px 7px;
      border-radius: 6px;
    }

    &__image-filter-btn {
      height: 28px;
      padding: 0 6px;
      border-radius: 7px;
      font-size: 11px;
      flex-basis: calc(50% - 3px);
    }
  }

  .product-list__toolbar .btn { height: 26px; padding: 0 12px; border-radius: 10px; }

  .btn__icon {
    width: 14px;
    height: 14px;
    font-size: 10px;
  }

  .product-card {
    --card-padding: 0.62rem;
    border-radius: 10px;

    &__img {
      min-height: 0;
      aspect-ratio: auto;
      margin-bottom: 0.55rem;
      border-radius: 10px 10px 7px 7px;
    }

    &__title {
      font-size: 0.86rem;
    }

    &__price {
      font-size: 0.9rem;
      margin-bottom: 0.35rem;
    }

    &__meta {
      font-size: 10px;
      line-height: 1.35;
    }

    &__icon-btn {
      width: 22px;
      height: 22px;
      border-radius: 6px;
    }
  }

  .badge {
    font-size: 10px;
    padding: 2px 7px;
  }
}

@media (max-width: 390px) {
  .product-list {
    &__content {
      padding: 8px 6px 10px;
    }

    &__toolbar {
      margin-left: 0;
      margin-right: 0;
      padding: 0;
      margin-bottom: 0.7rem;
    }

    &__image-filter {
      margin-top: 0.35rem;
      padding: 7px 8px;
    }

    &__image-filter-label,
    &__image-filter-link {
      font-size: 10px;
    }

    &__image-filter-btn {
      height: 26px;
      font-size: 10px;
      padding: 0 6px;
      flex-basis: calc(50% - 3px);
      border-radius: 6px;
    }
  }

  .product-list__toolbar .btn { height: 26px; padding: 0 12px; border-radius: 10px; }

  .btn__icon {
    width: 13px;
    height: 13px;
    font-size: 9px;
  }

  .product-card {
    --card-padding: 0.56rem;

    &__img {
      min-height: 0;
      aspect-ratio: auto;
      margin-bottom: 0.45rem;
    }

    &__title {
      font-size: 0.82rem;
    }

    &__price {
      font-size: 0.86rem;
      margin-bottom: 0.3rem;
    }

    &__meta {
      font-size: 9px;
      line-height: 1.3;
    }

    &__icon-btn {
      width: 20px;
      height: 20px;
    }
  }

  .badge {
    font-size: 9px;
    padding: 2px 6px;
  }
}

/* 小屏紧凑工具条：覆盖后续通用 .btn padding，缩小搜索与图搜按钮间距 */
@media (max-width: 768px) {
  .product-list__search-btn {
    min-width: 30px !important;
    padding: 0 4px !important;
  }

  .product-list__image-search-btn {
    min-width: 26px !important;
    padding: 0 2px !important;
  }

  .product-list__reset-btn {
    min-width: 30px !important;
    padding: 0 4px !important;
  }

  .product-list__search-btn.btn-primary .btn__icon {
    background: transparent !important;
    box-shadow: none !important;
  }

  .product-list__reset-btn.btn-ghost .btn__icon {
    background: transparent !important;
    box-shadow: none !important;
  }
}
</style>
