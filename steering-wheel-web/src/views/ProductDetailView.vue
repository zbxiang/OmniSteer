<template>
  <div class="product-list product-detail">
    <TopBar
      :is-home="
        route.name === 'home' ||
        route.name === 'productDetail' ||
        route.name === 'productEdit'
      "
      :is-product-create="route.name === 'productCreate'"
    />
    <div class="product-detail__vignette" aria-hidden="true" />

    <div class="product-list__main">
      <div class="product-detail__content">
        <AppBreadcrumb
          class="product-detail__breadcrumb"
          current-label="产品详情"
        />

        <div class="product-detail__panel">
          <div class="product-detail__layout" v-if="product">
            <div class="product-detail__media">
              <div class="product-detail__img">
                <img
                  v-if="currentImage"
                  :src="currentImage"
                  :alt="product.name"
                />
                <div v-else class="product-detail__img-placeholder">⚙</div>
                <div
                  v-if="productImages.length > 1"
                  :key="indicatorRenderKey"
                  class="product-detail__indicators"
                  aria-label="产品图片切换下标"
                >
                  <button
                    v-for="(_, idx) in productImages"
                    :key="`indicator-${product.id}-${idx}`"
                    type="button"
                    :class="[
                      'product-detail__indicator',
                      {
                        'product-detail__indicator--active':
                          idx === currentImageIndex,
                      },
                    ]"
                    :aria-label="`切换到第 ${idx + 1} 张图片`"
                    @click="onManualImageSwitch(idx)"
                  />
                </div>
              </div>
              <div
                v-if="productImages.length > 1"
                class="product-detail__thumbs"
                aria-label="产品图片缩略图"
              >
                <button
                  v-for="(imageUrl, idx) in productImages"
                  :key="`${product.id}-${idx}`"
                  type="button"
                  :class="[
                    'product-detail__thumb',
                    {
                      'product-detail__thumb--active':
                        idx === currentImageIndex,
                    },
                  ]"
                  @click="onManualImageSwitch(idx)"
                >
                  <img
                    :src="imageUrl"
                    :alt="`${product.name} 缩略图 ${idx + 1}`"
                  />
                </button>
              </div>
            </div>

            <div class="product-detail__info">
              <h1>{{ product.name }}</h1>
              <p class="product-detail__price">¥{{ productPriceText }}</p>
              <span
                :class="[
                  'status-badge',
                  productState === ProductStatusEnum.UP
                    ? 'status-badge--on'
                    : 'status-badge--off',
                ]"
              >
                {{ productState === ProductStatusEnum.UP ? '在售' : '下架' }}
              </span>

              <p class="product-detail__desc">
                {{ product.description || '暂无描述' }}
              </p>

              <ul class="product-detail__attrs">
                <li>
                  <span>品牌</span><span>{{ product.brand }}</span>
                </li>
                <li>
                  <span>型号</span><span>{{ product.model }}</span>
                </li>
              </ul>

              <div class="product-detail__actions">
                <el-button
                  v-permission="ADMIN_PERMISSION"
                  class="action-btn action-btn--primary"
                  @click="goToEdit(product.id)"
                >
                  <template #icon>
                    <el-icon class="action-btn__icon"><EditPen /></el-icon>
                  </template>
                  编辑
                </el-button>
                <el-button
                  v-permission="ADMIN_PERMISSION"
                  v-if="productState === ProductStatusEnum.UP"
                  class="action-btn action-btn--danger"
                  :loading="togglingState"
                  @click="takeDownProduct"
                >
                  <template #icon>
                    <el-icon class="action-btn__icon"><RemoveFilled /></el-icon>
                  </template>
                  下架
                </el-button>
                <el-button
                  class="action-btn action-btn--secondary action-btn--back"
                  @click="goToList"
                >
                  <template #icon>
                    <el-icon class="action-btn__icon"><ArrowLeft /></el-icon>
                  </template>
                  返回列表
                </el-button>
              </div>
            </div>
          </div>

          <div class="product-detail__empty" v-else-if="!loading">
            <h2>暂无详情</h2>
            <p>未找到该产品信息，可能已下架或数据尚未同步。</p>
            <el-button
              class="action-btn action-btn--secondary action-btn--back"
              @click="goToList"
            >
              <template #icon>
                <el-icon class="action-btn__icon"><ArrowLeft /></el-icon>
              </template>
              返回列表
            </el-button>
          </div>
          <div class="product-detail__empty" v-else>
            <h2>加载中...</h2>
            <p>正在获取产品详情，请稍候。</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, EditPen, RemoveFilled } from '@element-plus/icons-vue';
import type { ProductOut } from '@/types/product';
import { ProductStatusEnum } from '@/enums/product';
import { normalizeProductStateFromOut } from '@/utils/common';
import { getProductDetail, saveOrUpdateProduct } from '@/api/product';
import { PERMISSIONS } from '@/utils/auth';
import { isRequestCanceled, RequestError } from '@/utils/request';
import AppBreadcrumb from '@/components/AppBreadcrumb.vue';
import TopBar from '@/components/topBar.vue';

const route = useRoute();
const router = useRouter();
const product = ref<ProductOut | null>(null);
const loading = ref<boolean>(false);
const togglingState = ref<boolean>(false);
const currentImageIndex = ref<number>(0);
let imageAutoSwitchTimer: ReturnType<typeof setInterval> | null = null;
const AUTO_SWITCH_INTERVAL_MS = 5000;
const indicatorRenderKey = ref<number>(0);
const ADMIN_PERMISSION = PERMISSIONS.ADMIN;

const parseImageSource = (source: unknown): string[] => {
  if (Array.isArray(source)) {
    return source
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof source === 'string') {
    return source
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const productImages = computed<string[]>(() =>
  parseImageSource(
    (product.value as (ProductOut & { imageUrl?: unknown }) | null)?.images,
  )
    .concat(
      parseImageSource(
        (product.value as (ProductOut & { imageUrl?: unknown }) | null)
          ?.imageUrl,
      ),
    )
    .filter((url, index, list) => list.indexOf(url) === index),
);

const currentImage = computed<string>(() => {
  const images = productImages.value;
  if (!images.length) return '';
  const safeIndex = Math.min(
    Math.max(currentImageIndex.value, 0),
    images.length - 1,
  );
  return images[safeIndex] || '';
});

const setCurrentImageIndex = (idx: number): void => {
  if (idx < 0 || idx >= productImages.value.length) return;
  currentImageIndex.value = idx;
};

const onManualImageSwitch = (idx: number): void => {
  setCurrentImageIndex(idx);
  startImageAutoSwitch();
};

const showNextImage = (): void => {
  const total = productImages.value.length;
  if (total <= 1) return;
  currentImageIndex.value = (currentImageIndex.value + 1) % total;
};

const stopImageAutoSwitch = (): void => {
  if (!imageAutoSwitchTimer) return;
  clearInterval(imageAutoSwitchTimer);
  imageAutoSwitchTimer = null;
};

const startImageAutoSwitch = (): void => {
  stopImageAutoSwitch();
  // 重新挂载指示器，确保手动切换时进度条动画从头开始
  indicatorRenderKey.value += 1;
  if (productImages.value.length <= 1) return;
  imageAutoSwitchTimer = setInterval((): void => {
    showNextImage();
  }, AUTO_SWITCH_INTERVAL_MS);
};

const goToEdit = (id: string | number): void => {
  void router.push(`/products/${String(id)}/edit`);
};

const goToList = (): void => {
  void router.push('/products');
};

const takeDownProduct = async (): Promise<void> => {
  const current = product.value;
  if (!current || togglingState.value) return;
  if (normalizeProductStateFromOut(current) === ProductStatusEnum.DOWN) return;

  try {
    await ElMessageBox.confirm(
      '确认将该产品下架？下架后将不会在售展示。',
      '确认下架',
      {
        type: 'warning',
        confirmButtonText: '确认下架',
        cancelButtonText: '取消',
        customClass: 'logout-confirm-dialog',
        confirmButtonClass: 'logout-confirm-dialog__confirm-btn',
        cancelButtonClass: 'logout-confirm-dialog__cancel-btn',
      },
    );
  } catch {
    return;
  }

  togglingState.value = true;
  try {
    await saveOrUpdateProduct({
      id: String(current.id),
      name: current.name,
      brand: current.brand,
      model: current.model,
      price: current.price,
      state: ProductStatusEnum.DOWN,
      description: current.description || undefined,
      images: current.images || [],
    });
    product.value = {
      ...current,
      state: ProductStatusEnum.DOWN,
    };
    ElMessage.success('产品已下架');
  } catch (e) {
    if (isRequestCanceled(e)) return;
    if (e instanceof RequestError && e.isNotified) return;
    const msg = e instanceof RequestError ? e.message : '下架失败，请稍后重试';
    ElMessage.error(msg);
  } finally {
    togglingState.value = false;
  }
};

const productPriceText = computed<string>(() => {
  const price = product.value?.price;
  return typeof price === 'number' && Number.isFinite(price)
    ? price.toLocaleString()
    : '-';
});

const productState = computed(() =>
  product.value
    ? normalizeProductStateFromOut(product.value)
    : ProductStatusEnum.UP,
);

const fetchDetail = async (): Promise<void> => {
  const routeId = route.params.id;
  const productId =
    typeof routeId === 'string'
      ? routeId
      : Array.isArray(routeId)
        ? routeId[0]
        : '';
  if (!productId?.trim()) {
    product.value = null;
    return;
  }
  loading.value = true;
  try {
    product.value = await getProductDetail(productId);
    currentImageIndex.value = 0;
  } catch (e) {
    if (isRequestCanceled(e)) return;
    if (e instanceof RequestError && e.status === 404) {
      product.value = null;
      return;
    }
    if (e instanceof RequestError && e.isNotified) return;
    const msg =
      e instanceof RequestError ? e.message : '加载产品详情失败，请稍后重试';
    ElMessage.error(msg);
  } finally {
    loading.value = false;
  }
};

onMounted((): void => {
  void fetchDetail();
  startImageAutoSwitch();
});

watch(
  () => productImages.value.length,
  (): void => {
    startImageAutoSwitch();
  },
);

onUnmounted((): void => {
  stopImageAutoSwitch();
});
</script>

<style scoped lang="scss">
.product-detail {
  position: relative;
  min-height: 100vh;
  overflow-x: clip;
  color: v.$zinc-text;
  background:
    radial-gradient(
      1200px 420px at 50% -140px,
      rgba(24, 24, 27, 0.03) 0%,
      transparent 65%
    ),
    linear-gradient(
      168deg,
      v.$cockpit-bg-top 0%,
      v.$cockpit-bg-mid 48%,
      v.$cockpit-bg-bottom 100%
    );

  &__vignette {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &__vignette {
    box-shadow: none;
  }

  &__content {
    position: relative;
    z-index: 2;
    max-width: 980px;
    min-width: 0;
    margin: 0 auto;
  }

  &__breadcrumb {
    display: inline-flex;
    gap: 0.4rem;
    margin: 8px 0 18px;
    color: v.$zinc-muted;
  }

  &__panel {
    border-radius: 12px;
    border: 1px solid #e4e4e7;
    padding: 1rem;
    max-width: 100%;
    min-width: 0;
    background: #ffffff;
    box-shadow: 0 8px 20px color-mix(in srgb, #000 8%, transparent);
  }

  &__layout {
    display: grid;
    grid-template-columns: 360px 1fr;
    gap: 1rem;
    min-width: 0;

    @media (max-width: 920px) {
      grid-template-columns: 1fr;
    }
  }

  &__img {
    position: relative;
    border-radius: 12px;
    border: 1px solid #e4e4e7;
    background: #fafafa;
    max-width: 100%;
    min-height: 360px;
    display: grid;
    place-items: center;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }

  &__indicators {
    position: absolute;
    left: 50%;
    bottom: 10px;
    transform: translateX(-50%);
    z-index: 2;
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    padding: 6px 10px;
    border-radius: 999px;
    background: color-mix(in srgb, #fff 72%, transparent);
    box-shadow:
      0 4px 10px color-mix(in srgb, #000 12%, transparent),
      inset 0 1px 0 color-mix(in srgb, #fff 60%, transparent);
    backdrop-filter: blur(3px);
    max-width: calc(100% - 16px);
  }

  &__indicator {
    position: relative;
    width: 30px;
    height: 5px;
    border-radius: 999px;
    border: 0;
    background: color-mix(in srgb, #a1a1aa 62%, #e5e7eb);
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition:
      background-color 0.2s ease,
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  &__indicator::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0;
    border-radius: inherit;
    background: linear-gradient(
      90deg,
      color-mix(in srgb, #18181b 84%, #3f3f46) 0%,
      #18181b 100%
    );
    box-shadow: 0 0 8px color-mix(in srgb, #18181b 30%, transparent);
  }

  &__indicator:hover {
    background: #9ca3af;
    transform: scaleY(1.12);
    box-shadow: 0 0 0 1px color-mix(in srgb, #fff 50%, transparent);
  }

  &__indicator--active {
    background: color-mix(in srgb, #18181b 58%, #9ca3af);
    transform: scaleY(1.16);
  }

  &__indicator--active::after {
    animation: product-detail-indicator-progress 5s linear forwards;
  }

  &__thumbs {
    margin-top: 0.65rem;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.5rem;
    width: 100%;
    min-width: 0;
  }

  &__thumb {
    appearance: none;
    border: 1px solid #e4e4e7;
    border-radius: 8px;
    padding: 0;
    background: #ffffff;
    overflow: hidden;
    cursor: pointer;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.2s ease;

    img {
      width: 100%;
      aspect-ratio: 1 / 1;
      object-fit: cover;
      display: block;
    }
  }

  &__thumb:hover {
    border-color: #a1a1aa;
    box-shadow: none;
    transform: none;
  }

  &__thumb--active {
    border-color: #18181b;
    box-shadow: inset 0 0 0 1px #18181b;
  }

  &__img-placeholder {
    font-size: 84px;
    opacity: 0.7;
  }

  &__info {
    border-radius: 12px;
    border: 1px solid #e4e4e7;
    background: #ffffff;
    padding: 1rem;
    min-width: 0;
  }

  &__price {
    margin: 0.4rem 0 0.6rem;
    color: #18181b;
    font-size: 1.4rem;
    font-weight: 700;
  }

  &__desc {
    color: #52525b;
    margin: 1rem 0;
  }

  &__attrs {
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid #e4e4e7;

    li {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.65rem 0;
      border-bottom: 1px solid #f1f5f9;
      color: #52525b;
    }
  }

  &__actions {
    margin-top: 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  &__empty {
    border-radius: 12px;
    border: 1px solid #e4e4e7;
    background: #ffffff;
    padding: 1.5rem;
    text-align: center;

    h2 {
      margin: 0;
      font-size: 1.4rem;
      color: v.$zinc-text;
    }

    p {
      margin: 0.8rem 0 1rem;
      color: #52525b;
    }
  }
}

.status-badge {
  display: inline-block;
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid #d4d4d8;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.status-badge--on {
  color: #ffffff;
  border-color: #18181b;
  background: #18181b;
  box-shadow: none;
}

.status-badge--off {
  color: #52525b;
  border-color: #d4d4d8;
  background: #f4f4f5;
}

.product-detail :deep(.action-btn) {
  min-width: 104px;
  height: 36px;
  border-radius: var(--el-border-radius-base, 4px);
  font-size: 13px;
  font-weight: 500;
  box-shadow: none !important;
  transition:
    border-color 0.14s ease,
    background-color 0.14s ease,
    color 0.14s ease !important;
}

.product-detail :deep(.action-btn--primary),
.product-detail :deep(.action-btn--danger) {
  border: 1px solid #18181b !important;
  background: #18181b !important;
  color: #fff !important;
}

.product-detail :deep(.action-btn--primary:hover),
.product-detail :deep(.action-btn--danger:hover) {
  border-color: #27272a !important;
  background: #27272a !important;
}

.product-detail :deep(.action-btn--secondary) {
  border: 1px solid #d4d4d8 !important;
  background: #ffffff !important;
  color: #3f3f46 !important;
}

.product-detail :deep(.action-btn--secondary:hover) {
  border-color: #a1a1aa !important;
  background: #fafafa !important;
  color: #18181b !important;
}

.product-list__main {
  flex: 1;
  box-sizing: border-box;
  width: 100%;
  max-width: 1280px;
  min-width: 0;
  margin: 0 auto;
  padding: 20px 24px 40px;
}

@media (max-width: 900px) {
  .product-list__main {
    padding: 16px 16px 28px;
  }

  .product-detail__panel {
    padding: 14px;
  }

  .product-detail__img {
    min-height: 300px;
  }
}

@media (max-width: 760px) {
  .product-detail,
  .product-list__main,
  .product-detail__content,
  .product-detail__panel,
  .product-detail__layout,
  .product-detail__media,
  .product-detail__img,
  .product-detail__info {
    max-width: 100%;
    overflow-x: hidden;
  }

  .product-list__main {
    padding: 12px 12px 22px;
  }

  .product-detail__breadcrumb {
    margin: 6px 0 12px;
  }

  .product-detail__panel {
    border-radius: 10px;
    padding: 12px;
  }

  .product-detail__layout {
    gap: 0.8rem;
  }

  .product-detail__img {
    min-height: 0;
    aspect-ratio: 4 / 3;
    border-radius: 10px;
  }

  .product-detail__indicator {
    width: 26px;
  }

  .product-detail__indicators {
    left: 8px;
    right: 8px;
    transform: none;
    justify-content: center;
  }

  .product-detail__thumbs {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.45rem;
    overflow-x: hidden;
    padding-bottom: 2px;
  }

  .product-detail__thumb {
    min-width: 0;
  }

  .product-detail__info {
    border-radius: 10px;
    padding: 0.85rem;
  }

  .product-detail__info h1 {
    margin: 0;
    font-size: 1.2rem;
    line-height: 1.3;
  }

  .product-detail__price {
    margin: 0.35rem 0 0.5rem;
    font-size: 1.2rem;
  }

  .product-detail__desc {
    margin: 0.75rem 0;
    font-size: 13px;
    line-height: 1.5;
  }

  .product-detail__attrs li {
    gap: 0.6rem;
    padding: 0.55rem 0;
    flex-wrap: wrap;
  }

  .product-detail__attrs li > span:first-child {
    min-width: 72px;
  }

  .product-detail__attrs li > span:last-child {
    flex: 1;
    min-width: 0;
    text-align: right;
    word-break: break-word;
  }

  .product-detail__actions {
    margin-top: 0.8rem;
    gap: 0.55rem;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .product-detail__actions .action-btn {
    width: 100%;
    min-width: 0;
    margin-left: 0;
    justify-content: center;
  }

  .product-detail__actions .action-btn--back {
    grid-column: 1 / -1;
  }

  .product-detail__empty {
    border-radius: 10px;
    padding: 1rem 0.85rem;
  }

  .product-detail__empty h2 {
    font-size: 1.15rem;
  }

  .product-detail__empty p {
    margin: 0.65rem 0 0.9rem;
    font-size: 13px;
    line-height: 1.5;
  }

  .product-detail__empty .action-btn {
    width: 100%;
    min-width: 0;
    margin-left: 0;
    justify-content: center;
  }
}

@media (max-width: 520px) {
  .product-detail {
    overflow-x: hidden;
  }

  .product-list__main {
    padding: 10px 8px 18px;
  }

  .product-detail__panel {
    border-radius: 9px;
    padding: 10px;
  }

  .product-detail__img {
    aspect-ratio: 1 / 1;
    border-radius: 9px;
  }

  .product-detail__indicator {
    width: 24px;
    height: 3px;
  }

  .product-detail__thumbs {
    margin-top: 0.5rem;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.4rem;
  }

  .product-detail__thumb {
    min-width: 0;
    border-radius: 7px;
  }

  .product-detail__info {
    border-radius: 9px;
    padding: 0.75rem;
  }

  .product-detail__info h1 {
    font-size: 1.05rem;
  }

  .product-detail__price {
    font-size: 1.08rem;
  }

  .status-badge {
    font-size: 11px;
    padding: 2px 8px;
  }

  .product-detail__desc {
    font-size: 12px;
  }

  .product-detail__attrs li {
    padding: 0.48rem 0;
    font-size: 12px;
  }

  .product-detail__attrs li > span:first-child {
    min-width: 64px;
  }

  .product-detail__empty {
    border-radius: 9px;
    padding: 0.9rem 0.7rem;
  }

  .product-detail__empty h2 {
    font-size: 1.02rem;
  }

  .product-detail__empty p {
    margin: 0.55rem 0 0.8rem;
    font-size: 12px;
  }
}

@keyframes product-detail-indicator-progress {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}
</style>
