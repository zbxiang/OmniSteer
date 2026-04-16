<template>
  <div class="product-list product-detail">
    <TopBar
      :is-home="route.name === 'home' || route.name === 'productDetail' || route.name === 'productEdit'"
      :is-product-create="route.name === 'productCreate'"
    />
    <div class="product-detail__vignette" aria-hidden="true" />

    <div class="product-list__main">
      <div class="product-detail__content">
        <AppBreadcrumb class="product-detail__breadcrumb" current-label="产品详情" />

        <div class="product-detail__panel">
          <div class="product-detail__layout" v-if="product">
            <div class="product-detail__media">
              <div class="product-detail__img">
                <button
                  v-if="productImages.length > 1"
                  type="button"
                  class="product-detail__img-nav product-detail__img-nav--prev"
                  aria-label="上一张图片"
                  @click="showPrevImage"
                >
                  ‹
                </button>
                <img
                  v-if="currentImage"
                  :src="currentImage"
                  :alt="product.name"
                >
                <div v-else class="product-detail__img-placeholder">⚙</div>
                <button
                  v-if="productImages.length > 1"
                  type="button"
                  class="product-detail__img-nav product-detail__img-nav--next"
                  aria-label="下一张图片"
                  @click="showNextImage"
                >
                  ›
                </button>
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
                    { 'product-detail__thumb--active': idx === currentImageIndex },
                  ]"
                  @click="setCurrentImageIndex(idx)"
                >
                  <img :src="imageUrl" :alt="`${product.name} 缩略图 ${idx + 1}`">
                </button>
              </div>
            </div>

            <div class="product-detail__info">
              <h1>{{ product.name }}</h1>
              <p class="product-detail__price">¥{{ productPriceText }}</p>
              <span :class="['status-badge', productState === ProductStatusEnum.UP ? 'status-badge--on' : 'status-badge--off']">
                {{ productState === ProductStatusEnum.UP ? '在售' : '下架' }}
              </span>

              <p class="product-detail__desc">{{ product.description || '暂无描述' }}</p>

              <ul class="product-detail__attrs">
                <li><span>品牌</span><span>{{ product.brand }}</span></li>
                <li><span>型号</span><span>{{ product.model }}</span></li>
                <li><span>材质</span><span>{{ product.material }}</span></li>
                <li><span>直径</span><span>{{ product.diameter }}mm</span></li>
                <li><span>重量</span><span>{{ product.weight }}g</span></li>
                <li><span>安装方式</span><span>{{ product.mount }}</span></li>
                <li><span>上架时间</span><span>{{ createdDateText }}</span></li>
              </ul>

              <div class="product-detail__actions">
                <el-button
                  class="action-btn action-btn--primary"
                  @click="goToEdit(product.id)"
                >
                  <template #icon>
                    <el-icon class="action-btn__icon"><EditPen /></el-icon>
                  </template>
                  编辑
                </el-button>
                <el-button
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
                <el-button class="action-btn action-btn--secondary action-btn--back" @click="goToList">
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
            <el-button class="action-btn action-btn--secondary action-btn--back" @click="goToList">
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
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, EditPen, RemoveFilled } from '@element-plus/icons-vue';
import type { ProductOut } from '@/types/product';
import { ProductStatusEnum } from '@/enums/product';
import { normalizeProductStateFromOut } from '@/utils/productState';
import { getProductDetail, saveOrUpdateProduct } from '@/api/product';
import { isRequestCanceled, RequestError } from '@/utils/request';
import AppBreadcrumb from '@/components/AppBreadcrumb.vue';
import TopBar from '@/components/topBar.vue';

const route = useRoute();
const router = useRouter();
const product = ref<ProductOut | null>(null);
const loading = ref<boolean>(false);
const togglingState = ref<boolean>(false);
const currentImageIndex = ref<number>(0);

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
  parseImageSource((product.value as ProductOut & { imageUrl?: unknown } | null)?.images)
    .concat(parseImageSource((product.value as ProductOut & { imageUrl?: unknown } | null)?.imageUrl))
    .filter((url, index, list) => list.indexOf(url) === index),
);

const currentImage = computed<string>(() => {
  const images = productImages.value;
  if (!images.length) return '';
  const safeIndex = Math.min(Math.max(currentImageIndex.value, 0), images.length - 1);
  return images[safeIndex] || '';
});

const setCurrentImageIndex = (idx: number): void => {
  if (idx < 0 || idx >= productImages.value.length) return;
  currentImageIndex.value = idx;
};

const showPrevImage = (): void => {
  const total = productImages.value.length;
  if (total <= 1) return;
  currentImageIndex.value = (currentImageIndex.value - 1 + total) % total;
};

const showNextImage = (): void => {
  const total = productImages.value.length;
  if (total <= 1) return;
  currentImageIndex.value = (currentImageIndex.value + 1) % total;
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
      id: current.id,
      name: current.name,
      brand: current.brand,
      model: current.model,
      price: current.price,
      state: ProductStatusEnum.DOWN,
      material: current.material || undefined,
      diameter: current.diameter ?? undefined,
      weight: current.weight ?? undefined,
      mount: current.mount || undefined,
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

const createdDateText = computed<string>(() => {
  if (!product.value?.created_at) return '-';
  const date = new Date(product.value.created_at);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
});

const productPriceText = computed<string>(() => {
  const price = product.value?.price;
  return typeof price === 'number' && Number.isFinite(price)
    ? price.toLocaleString()
    : '-';
});

const productState = computed(() =>
  product.value ? normalizeProductStateFromOut(product.value) : ProductStatusEnum.UP,
);

const fetchDetail = async (): Promise<void> => {
  const routeId = route.params.id;
  const productId =
    typeof routeId === 'string' ? routeId : Array.isArray(routeId) ? routeId[0] : '';
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
    const msg = e instanceof RequestError ? e.message : '加载产品详情失败，请稍后重试';
    ElMessage.error(msg);
  } finally {
    loading.value = false;
  }
};

onMounted((): void => {
  void fetchDetail();
});
</script>

<style scoped lang="scss">
.product-detail {
  position: relative;
  min-height: 100vh;
  color: v.$zinc-text;
  background:
    radial-gradient(
      1200px 420px at 50% -140px,
      var(--color-primary-amber-20) 0%,
      var(--color-primary-amber-08) 45%,
      transparent 78%
    ),
    linear-gradient(168deg, v.$cockpit-bg-top 0%, v.$cockpit-bg-mid 48%, v.$cockpit-bg-bottom 100%);

  &__vignette {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &__vignette {
    box-shadow: inset 0 0 120px rgba(0, 0, 0, 0.5);
  }

  &__content {
    position: relative;
    z-index: 2;
    max-width: 980px;
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
    border: 1px solid var(--color-primary-amber-24);
    padding: 1rem;
    background: linear-gradient(145deg, v.$panel-bg 0%, var(--color-cockpit-bg-mid-96) 100%);
    box-shadow:
      0 14px 30px color-mix(in srgb, var(--color-cockpit-bg-mid-97) 72%, transparent),
      0 1px 0 rgba(255, 255, 255, 0.08) inset;
  }

  &__layout {
    display: grid;
    grid-template-columns: 360px 1fr;
    gap: 1rem;

    @media (max-width: 920px) {
      grid-template-columns: 1fr;
    }
  }

  &__img {
    position: relative;
    border-radius: 12px;
    border: 1px solid var(--color-primary-amber-24);
    background: linear-gradient(145deg, v.$panel-bg 0%, var(--color-cockpit-bg-mid-96) 100%);
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

  &__img-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    width: 34px;
    height: 34px;
    border-radius: 999px;
    border: 1px solid var(--color-primary-amber-30);
    color: #fff;
    font-size: 24px;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: color-mix(in srgb, var(--color-cockpit-bg-mid-97) 76%, var(--color-primary-amber-16));
    box-shadow: 0 8px 16px color-mix(in srgb, #000 36%, transparent);
    transition: all 0.2s ease;
  }

  &__img-nav:hover {
    border-color: var(--color-primary-amber-56);
    background: color-mix(in srgb, var(--color-cockpit-bg-mid-97) 70%, var(--color-primary-amber-25));
  }

  &__img-nav--prev {
    left: 10px;
  }

  &__img-nav--next {
    right: 10px;
  }

  &__thumbs {
    margin-top: 0.65rem;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.5rem;
  }

  &__thumb {
    appearance: none;
    border: 1px solid var(--color-primary-amber-22);
    border-radius: 8px;
    padding: 0;
    background: color-mix(in srgb, var(--color-cockpit-bg-mid-97) 92%, transparent);
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
    border-color: var(--color-primary-amber-48);
    box-shadow: 0 6px 14px color-mix(in srgb, var(--color-primary-amber-18) 50%, transparent);
    transform: translateY(-1px);
  }

  &__thumb--active {
    border-color: var(--color-primary-amber-70);
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--color-primary-amber-28) 72%, transparent),
      0 8px 16px color-mix(in srgb, var(--color-primary-amber-20) 52%, transparent);
  }

  &__img-placeholder {
    font-size: 84px;
    opacity: 0.7;
  }

  &__info {
    border-radius: 12px;
    border: 1px solid var(--color-primary-amber-24);
    background: linear-gradient(145deg, v.$panel-bg 0%, var(--color-cockpit-bg-mid-96) 100%);
    padding: 1rem;
  }

  &__price {
    margin: 0.4rem 0 0.6rem;
    color: v.$accent-warm;
    font-size: 1.4rem;
    font-weight: 700;
  }

  &__desc {
    color: v.$zinc-label;
    margin: 1rem 0;
  }

  &__attrs {
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--color-primary-amber-18);

    li {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.65rem 0;
      border-bottom: 1px solid var(--color-primary-amber-12);
      color: v.$zinc-label;
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
    border: 1px solid var(--color-primary-amber-24);
    background: linear-gradient(145deg, v.$panel-bg 0%, var(--color-cockpit-bg-mid-96) 100%);
    padding: 1.5rem;
    text-align: center;

    h2 {
      margin: 0;
      font-size: 1.4rem;
      color: v.$zinc-text;
    }

    p {
      margin: 0.8rem 0 1rem;
      color: v.$zinc-label;
    }
  }
}

.status-badge {
  display: inline-block;
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.status-badge--on {
  color: #fff;
  border-color: var(--color-primary-amber-55);
  background: linear-gradient(
    145deg,
    var(--color-primary-amber-70) 0%,
    var(--color-primary-amber) 100%
  );
  box-shadow:
    0 6px 12px color-mix(in srgb, var(--color-primary-amber-24) 58%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
}

.status-badge--off {
  color: color-mix(in srgb, #fff 78%, var(--color-zinc-text));
  border-color: var(--color-primary-amber-24);
  background: color-mix(
    in srgb,
    var(--color-cockpit-bg-mid-97) 90%,
    var(--color-primary-amber-10)
  );
}

.product-list__main {
  flex: 1;
  box-sizing: border-box;
  width: 100%;
  max-width: 1280px;
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

  .product-detail__img-nav {
    width: 30px;
    height: 30px;
    font-size: 20px;
  }

  .product-detail__thumbs {
    grid-template-columns: repeat(5, minmax(56px, 1fr));
    gap: 0.45rem;
    overflow-x: auto;
    padding-bottom: 2px;
  }

  .product-detail__thumb {
    min-width: 56px;
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
    grid-template-columns: 1fr 1fr;
  }

  .product-detail__actions .action-btn {
    width: 100%;
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
    margin-left: 0;
    justify-content: center;
  }
}

@media (max-width: 520px) {
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

  .product-detail__img-nav {
    width: 28px;
    height: 28px;
    font-size: 18px;
  }

  .product-detail__thumbs {
    margin-top: 0.5rem;
    grid-template-columns: repeat(5, minmax(52px, 1fr));
    gap: 0.4rem;
  }

  .product-detail__thumb {
    min-width: 52px;
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
</style>
