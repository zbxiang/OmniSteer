import { createRouter, createWebHashHistory } from 'vue-router';
import type { NavigationGuardReturn, RouteLocationNormalized } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const LoginView = (): Promise<typeof import('@/views/LoginView.vue')> => import('@/views/LoginView.vue');
const SignupView = (): Promise<typeof import('@/views/SignupView.vue')> => import('@/views/SignupView.vue');
const ProductView = (): Promise<typeof import('@/views/ProductView.vue')> => import('@/views/ProductView.vue');
const ProductFormView = (): Promise<typeof import('@/views/ProductFormView.vue')> =>
  import('@/views/ProductFormView.vue');
const ProductDetailView = (): Promise<typeof import('@/views/ProductDetailView.vue')> =>
  import('@/views/ProductDetailView.vue');
const ForbiddenView = (): Promise<typeof import('@/views/ForbiddenView.vue')> => import('@/views/ForbiddenView.vue');
const NotFoundView = (): Promise<typeof import('@/views/NotFoundView.vue')> => import('@/views/NotFoundView.vue');

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { public: true },
    },
    {
      path: '/signup',
      name: 'signup',
      component: SignupView,
      meta: { public: true },
    },
    {
      path: '/403',
      name: 'forbidden',
      component: ForbiddenView,
      meta: { public: true },
    },
    {
      path: '/',
      redirect: '/products',
    },
    {
      path: '/products',
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
    {
      path: '/:pathMatch(.*)*',
      name: 'notFound',
      component: NotFoundView,
      meta: { public: true },
    },
  ],
});

/**
 * 需登录：以路由 meta 为准（合并后的 to.meta + 各 matched 记录，避免单一路径下 meta 异常）
 */
const routeNeedsAuth = (to: RouteLocationNormalized): boolean => {
  if (to.meta.requiresAuth === true) return true;
  return to.matched.some((record) => record.meta.requiresAuth === true);
};

router.beforeEach((to: RouteLocationNormalized): NavigationGuardReturn => {
  const auth = useAuthStore();
  if (routeNeedsAuth(to) && !auth.isAuthenticated()) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if ((to.name === 'login' || to.name === 'signup') && auth.isAuthenticated()) {
    const redirect =
      typeof to.query.redirect === 'string' && to.query.redirect.startsWith('/')
        ? to.query.redirect
        : '/products';
    return redirect;
  }
  return true;
});

export default router;
