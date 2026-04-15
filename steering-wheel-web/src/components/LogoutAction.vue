<template>
  <button
    type="button"
    class="product-list__logout"
    aria-label="退出登录"
    title="退出登录"
    @click="onLogout"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 3h-5a2 2 0 0 0-2 2v3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      <path d="M15 21h-5a2 2 0 0 1-2-2v-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      <path
        d="M10 12h10M17 8l4 4-4 4"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();

const onLogout = async (): Promise<void> => {
  try {
    await ElMessageBox.confirm('确认退出当前账号吗？', '退出登录', {
      confirmButtonText: '退出',
      cancelButtonText: '取消',
      type: 'warning',
      customClass: 'logout-confirm-dialog',
      confirmButtonClass: 'logout-confirm-dialog__confirm-btn',
      cancelButtonClass: 'logout-confirm-dialog__cancel-btn',
    });
  } catch {
    return;
  }

  await auth.toLoginOut();
  ElMessage.success('已退出登录');
};
</script>

<style scoped lang="scss">
.product-list__logout {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid var(--color-primary-amber-16);
  border-radius: 10px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, #fff 94%, var(--color-primary-amber-08)) 0%,
    color-mix(in srgb, #fff 88%, var(--color-primary-amber-12)) 100%
  );
  color: var(--color-primary-amber-70);
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.15s ease,
    width 0.32s cubic-bezier(0.22, 1, 0.36, 1),
    height 0.32s cubic-bezier(0.22, 1, 0.36, 1),
    border-radius 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

.product-list__logout svg {
  width: 18px;
  height: 18px;
  display: block;
  filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.35));
  transition:
    width 0.32s cubic-bezier(0.22, 1, 0.36, 1),
    height 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

.product-list__logout:hover {
  color: var(--color-primary-amber);
  border-color: var(--color-primary-amber-30);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, #fff 90%, var(--color-primary-amber-12)) 0%,
    color-mix(in srgb, #fff 82%, var(--color-primary-amber-18)) 100%
  );
  box-shadow:
    0 6px 14px var(--color-primary-amber-24),
    0 1px 0 rgba(255, 255, 255, 0.5) inset;
  transform: translateY(-1px);
}

.product-list__logout:active {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 2px 6px var(--color-primary-amber-20);
}

.product-list__logout:focus-visible {
  outline: none;
  border-color: var(--color-primary-amber-35);
  box-shadow: 0 0 0 2px var(--color-primary-amber-18);
}
</style>

<style lang="scss">
.logout-confirm-dialog .el-message-box__headerbtn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primary-amber-20);
  border-radius: 0;
}

.logout-confirm-dialog.el-message-box {
  border: 1px solid var(--color-primary-amber-26);
  border-radius: 12px;
  background:
    radial-gradient(
      circle at 12% -18%,
      var(--color-primary-amber-16) 0%,
      transparent 48%
    ),
    radial-gradient(
      circle at 100% 120%,
      var(--color-primary-amber-10) 0%,
      transparent 56%
    ),
    color-mix(in srgb, var(--color-cockpit-bg-mid-97) 94%, var(--color-primary-amber-06));
  box-shadow:
    0 16px 34px color-mix(in srgb, var(--color-cockpit-bg-mid-97) 78%, transparent),
    0 1px 0 rgba(255, 255, 255, 0.08) inset;
  overflow: hidden;
}

.logout-confirm-dialog .el-message-box__header {
  padding: 18px 20px 8px;
}

.logout-confirm-dialog .el-message-box__title {
  font-weight: 700;
  letter-spacing: 0.01em;
  color: color-mix(in srgb, var(--color-zinc-text) 96%, #fff);
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.32);
}

.logout-confirm-dialog .el-message-box__content {
  padding: 6px 20px 18px;
  color: color-mix(in srgb, var(--color-zinc-muted) 90%, #fff);
}

.logout-confirm-dialog .el-message-box__message p {
  margin: 0;
  color: inherit;
}

.logout-confirm-dialog .el-message-box__btns {
  padding: 12px 20px 18px;
}

.logout-confirm-dialog .el-message-box__headerbtn,
.logout-confirm-dialog__confirm-btn.el-button--primary,
.logout-confirm-dialog__cancel-btn.el-button {
  box-sizing: border-box;
  height: 32px;
  padding: 0 12px;
  color: color-mix(in srgb, var(--color-zinc-text) 90%, #fff);
  border-radius: 0 !important;
  border: 1px solid var(--color-primary-amber-32) !important;
  background: color-mix(
    in srgb,
    var(--color-cockpit-bg-mid-97) 92%,
    var(--color-primary-amber-06)
  ) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 0 0 1px color-mix(in srgb, var(--color-cockpit-bg-low) 68%, transparent);
  font-weight: 650 !important;
  letter-spacing: 0.01em;
  line-height: 32px;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.logout-confirm-dialog .el-message-box__headerbtn {
  top: 10px;
  right: 10px;
  width: 32px;
  min-width: 32px;
  padding: 0;
  color: var(--color-primary-amber-70);
  border-radius: 8px !important;
}

.logout-confirm-dialog .el-message-box__headerbtn:hover {
  color: var(--color-primary-amber);
  border-color: var(--color-primary-amber-55) !important;
  background-color: color-mix(in srgb, var(--color-primary-amber-16) 78%, transparent) !important;
}

.logout-confirm-dialog .el-message-box__headerbtn:hover .el-icon,
.logout-confirm-dialog .el-message-box__headerbtn:hover .el-message-box__close {
  color: var(--color-primary-amber) !important;
}

.logout-confirm-dialog__confirm-btn.el-button--primary,
.logout-confirm-dialog__cancel-btn.el-button {
  min-width: 82px;
  border-radius: 8px !important;
}

.logout-confirm-dialog__confirm-btn.el-button--primary {
  background: linear-gradient(
    145deg,
    var(--color-primary-amber-70) 0%,
    var(--color-primary-amber) 56%,
    var(--color-primary-amber-85) 100%
  ) !important;
  box-shadow:
    0 2px 8px var(--color-primary-amber-24),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.logout-confirm-dialog__confirm-btn.el-button--primary:hover {
  color: #fff !important;
  border-color: var(--color-primary-amber) !important;
  background: linear-gradient(
    145deg,
    var(--color-primary-amber) 0%,
    var(--color-primary-amber-90) 100%
  ) !important;
  box-shadow:
    0 6px 14px var(--color-primary-amber-26),
    inset 0 1px 0 rgba(255, 255, 255, 0.28) !important;
}

.logout-confirm-dialog__confirm-btn.el-button--primary:focus-visible,
.logout-confirm-dialog__cancel-btn.el-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--color-primary-amber-20);
}

.logout-confirm-dialog__cancel-btn.el-button {
  color: color-mix(in srgb, var(--color-zinc-text) 90%, #fff) !important;
}

.logout-confirm-dialog__cancel-btn.el-button:hover {
  color: #fff !important;
  border-color: var(--color-primary-amber-46) !important;
  background: color-mix(
    in srgb,
    var(--color-cockpit-bg-mid-97) 82%,
    var(--color-primary-amber-16)
  ) !important;
  box-shadow:
    0 6px 14px var(--color-primary-amber-18),
    inset 0 1px 0 rgba(255, 255, 255, 0.18) !important;
}
</style>

