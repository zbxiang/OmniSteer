<script setup lang="ts">
import * as Vue from 'vue';
import * as VueRouter from 'vue-router';
import { useAppStore } from '@/stores/app';

type ProductDetail = {
  id: number;
  name: string;
  brand: string;
  model: string;
  material: string;
  diameter: number;
  weight: number;
  mount: string;
  date: string;
  desc: string;
  price: number;
  status: 'on' | 'off';
};

const appStore = useAppStore();
const route = VueRouter.useRoute();

const products: ProductDetail[] = [
  {
    id: 1,
    name: '智能方向盘 Pro',
    brand: 'OmniSteer',
    model: 'OS-PRO-01',
    material: '碳纤维 + 真皮',
    diameter: 350,
    weight: 680,
    mount: '通用六孔 + 快拆',
    date: '2026-03-18',
    desc: '旗舰款智能方向盘，支持多功能按键与自定义灯效，兼顾操控与舒适。',
    price: 3299,
    status: 'on',
  },
  {
    id: 2,
    name: '运动方向盘 GT',
    brand: 'OmniSteer',
    model: 'OS-GT-02',
    material: '铝合金 + 打孔皮',
    diameter: 340,
    weight: 720,
    mount: '快拆基座',
    date: '2026-02-10',
    desc: '偏竞技风格，握感扎实，适用于街道和赛道双场景。',
    price: 4599,
    status: 'on',
  },
];

const product = Vue.computed(() => products.find((p) => p.id === Number(route.params.id)));
</script>

<template>
  <div class="product-detail">
    <div class="product-detail__warm-base" aria-hidden="true" />
    <div class="product-detail__vignette" aria-hidden="true" />

    <div class="product-detail__content">
      <div class="product-detail__breadcrumb">
        <router-link to="/">产品列表</router-link>
        <span>/</span>
        <span>产品详情</span>
      </div>

      <div class="product-detail__layout" v-if="product">
        <div class="product-detail__img">
          <div class="product-detail__img-placeholder">⚙</div>
        </div>

        <div class="product-detail__info">
          <p class="product-detail__badge">{{ appStore.systemName }}</p>
          <h1>{{ product.name }}</h1>
          <p class="product-detail__price">¥{{ product.price.toLocaleString() }}</p>
          <span :class="['status-badge', product.status === 'on' ? 'status-badge--on' : 'status-badge--off']">
            {{ product.status === 'on' ? '在售' : '下架' }}
          </span>

          <p class="product-detail__desc">{{ product.desc }}</p>

          <ul class="product-detail__attrs">
            <li><span>品牌</span><span>{{ product.brand }}</span></li>
            <li><span>型号</span><span>{{ product.model }}</span></li>
            <li><span>材质</span><span>{{ product.material }}</span></li>
            <li><span>直径</span><span>{{ product.diameter }}mm</span></li>
            <li><span>重量</span><span>{{ product.weight }}g</span></li>
            <li><span>安装方式</span><span>{{ product.mount }}</span></li>
            <li><span>上架时间</span><span>{{ product.date }}</span></li>
          </ul>

          <div class="product-detail__actions">
            <router-link :to="`/products/${product.id}/edit`" class="btn btn-primary">编辑</router-link>
            <button class="btn btn-danger">下架</button>
            <router-link to="/" class="btn btn-outline">返回列表</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.product-detail {
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

  &__breadcrumb {
    display: inline-flex;
    gap: 0.4rem;
    margin-bottom: 1rem;
    color: v.$zinc-muted;
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
    border: 1px solid rgba(v.$primary-amber, 0.24);
    background: linear-gradient(145deg, v.$panel-bg 0%, rgba(v.$cockpit-bg-mid, 0.96) 100%);
    min-height: 360px;
    display: grid;
    place-items: center;
  }

  &__img-placeholder {
    font-size: 84px;
    opacity: 0.7;
  }

  &__info {
    border-radius: 12px;
    border: 1px solid rgba(v.$primary-amber, 0.24);
    background: linear-gradient(145deg, v.$panel-bg 0%, rgba(v.$cockpit-bg-mid, 0.96) 100%);
    padding: 1rem;
  }

  &__badge {
    margin: 0;
    color: rgba(v.$primary-amber, 0.85);
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
    border-top: 1px solid rgba(v.$primary-amber, 0.18);

    li {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.65rem 0;
      border-bottom: 1px solid rgba(v.$primary-amber, 0.12);
      color: v.$zinc-label;
    }
  }

  &__actions {
    margin-top: 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
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

.btn {
  height: 40px;
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

.btn-danger {
  background: rgba(185, 28, 28, 0.2);
  color: #fecaca;
  border-color: rgba(248, 113, 113, 0.4);
}
</style>
