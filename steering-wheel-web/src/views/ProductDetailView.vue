<template>
  <div class="product-list product-detail">
    <TopBar
      :is-home="route.name === 'home' || route.name === 'productDetail' || route.name === 'productEdit'"
      :is-product-create="route.name === 'productCreate'"
    />
    <div class="product-detail__warm-base" aria-hidden="true" />
    <div class="product-detail__vignette" aria-hidden="true" />

    <div class="product-list__main">
      <div class="product-detail__content">
        <AppBreadcrumb class="product-detail__breadcrumb" current-label="产品详情" />

        <div class="product-detail__panel">
          <div class="product-detail__layout" v-if="product">
            <div class="product-detail__img">
              <img
                v-if="product.images?.[0]"
                :src="product.images[0]"
                :alt="product.name"
              >
              <div v-else class="product-detail__img-placeholder">⚙</div>
            </div>

            <div class="product-detail__info">
              <p class="product-detail__badge">{{ appStore.systemName }}</p>
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
                <router-link
                  :to="`/products/${product.id}/edit`"
                  class="action-btn action-btn--primary"
                >
                  <span class="action-btn__icon" aria-hidden="true">
                    <el-icon><EditPen /></el-icon>
                  </span>
                  编辑
                </router-link>
                <router-link to="/" class="action-btn action-btn--secondary">
                  <span class="action-btn__icon" aria-hidden="true">
                    <el-icon><ArrowLeft /></el-icon>
                  </span>
                  返回列表
                </router-link>
              </div>
            </div>
          </div>

          <div class="product-detail__empty" v-else-if="!loading">
            <h2>暂无详情</h2>
            <p>未找到该产品信息，可能已下架或数据尚未同步。</p>
            <router-link to="/" class="action-btn action-btn--secondary">
              <span class="action-btn__icon" aria-hidden="true">
                <el-icon><ArrowLeft /></el-icon>
              </span>
              返回列表
            </router-link>
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
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft, EditPen } from '@element-plus/icons-vue';
import type { ProductOut } from '@/types/product';
import { ProductStatusEnum } from '@/enums/product';
import { normalizeProductStateFromOut } from '@/utils/productState';
import { getProductDetail } from '@/api/product';
import { isRequestCanceled, RequestError } from '@/utils/request';
import { useAppStore } from '@/stores/app';
import AppBreadcrumb from '@/components/AppBreadcrumb.vue';
import TopBar from '@/components/topBar.vue';

const appStore = useAppStore();
const route = useRoute();
const product = ref<ProductOut | null>(null);
const loading = ref<boolean>(false);

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

  &__badge {
    margin: 0;
    color: var(--color-primary-amber-85);
    letter-spacing: 0.2em;
    font-size: 11px;
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
  padding: 2px 8px;
  border-radius: 999px;
}

.status-badge--on { background: rgba(34, 197, 94, 0.2); color: #86efac; }
.status-badge--off { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }

.product-list__main {
  flex: 1;
  box-sizing: border-box;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px 24px 40px;
}
</style>
