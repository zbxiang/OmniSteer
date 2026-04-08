import { createRouter, createWebHistory } from 'vue-router';
import type { NavigationGuardReturn, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const LoginView = (): Promise<typeof import('@/views/LoginView.vue')> => import('@/views/LoginView.vue');
const ProductView = (): Promise<typeof import('@/views/ProductView.vue')> => import('@/views/ProductView.vue');
const ProductFormView = (): Promise<typeof import('@/views/ProductFormView.vue')> =>
  import('@/views/ProductFormView.vue');
const ProductDetailView = (): Promise<typeof import('@/views/ProductDetailView.vue')> =>
  import('@/views/ProductDetailView.vue');

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { public: true },
    },
    {
      path: '/',
      name: 'home',
      component: ProductView,
      meta: { requiresAuth: true },
    },
    {
      path: '/products/new',
      name: 'productCreate',
      component: ProductFormView,
      meta: { requiresAuth: true },
    },
    {
      path: '/products/:id/edit',
      name: 'productEdit',
      component: ProductFormView,
      meta: { requiresAuth: true },
    },
    {
      path: '/products/:id',
      name: 'productDetail',
      component: ProductDetailView,
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach((to: RouteLocationNormalized): NavigationGuardReturn => {
  const auth = useAuthStore();
  auth.ensureValidSession();
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.name === 'login' && auth.isLoggedIn) {
    const redirect =
      typeof to.query.redirect === 'string' && to.query.redirect.startsWith('/')
        ? to.query.redirect
        : '/';
    return redirect;
  }
  return true;
});

export default router;
