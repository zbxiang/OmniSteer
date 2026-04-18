import type { Directive, DirectiveBinding } from 'vue';
import { useAuthStore } from '@/stores/auth';

export const PERMISSIONS = Object.freeze({
  ADMIN: 'admin',
});

type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
type PermissionValue = PermissionKey | string | string[] | undefined;

const normalizePermissions = (value: PermissionValue): string[] => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [PERMISSIONS.ADMIN];
};

export const isAdminUser = (): boolean => {
  const authStore = useAuthStore();
  authStore.ensureValidSession();
  return authStore.userInfo?.admin === true;
};

export const hasPermission = (value?: PermissionValue): boolean => {
  const permissions = normalizePermissions(value);
  if (!permissions.length) return true;
  return permissions.every((permission) => {
    if (permission === PERMISSIONS.ADMIN) return isAdminUser();
    return false;
  });
};

const togglePermissionDisplay = (el: HTMLElement, binding: DirectiveBinding<PermissionValue>): void => {
  const visible = hasPermission(binding.value);
  if (visible) {
    if (el.dataset.permissionDisplay !== undefined) {
      el.style.display = el.dataset.permissionDisplay;
      delete el.dataset.permissionDisplay;
    }
    return;
  }
  if (el.dataset.permissionDisplay === undefined) {
    el.dataset.permissionDisplay = el.style.display;
  }
  el.style.display = 'none';
};

export const permissionDirective: Directive<HTMLElement, PermissionValue> = {
  mounted(el, binding) {
    togglePermissionDisplay(el, binding);
  },
  updated(el, binding) {
    togglePermissionDisplay(el, binding);
  },
};

