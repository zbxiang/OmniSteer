<template>
  <div
    class="theme-select"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
  >
    <button v-show="!hovering" class="theme-trigger" type="button" aria-label="切换主题">
      <i class="iconfont icon-setting theme-trigger__icon" aria-hidden="true" />
      <span class="theme-trigger__swatch" :class="`theme-trigger__swatch--${modelValue}`" aria-hidden="true" />
    </button>
    <div v-show="hovering" class="theme-panel">
      <el-select
        class="theme-panel__control"
        :model-value="modelValue"
        size="small"
        popper-class="theme-select-popper"
        @update:model-value="onChange"
      >
        <el-option label="座舱橙" value="cockpit">
          <div class="theme-option">
            <span class="theme-option__swatch theme-option__swatch--cockpit" />
            <span>座舱橙</span>
          </div>
        </el-option>
        <el-option label="琥珀橙" value="amber">
          <div class="theme-option">
            <span class="theme-option__swatch theme-option__swatch--amber" />
            <span>琥珀橙</span>
          </div>
        </el-option>
        <el-option label="靛青色" value="indigo">
          <div class="theme-option">
            <span class="theme-option__swatch theme-option__swatch--indigo" />
            <span>靛青色</span>
          </div>
        </el-option>
      </el-select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { ThemeName } from '@/types';

defineProps<{
  modelValue: ThemeName;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: ThemeName];
}>();

const hovering = ref<boolean>(false);

const onChange = (nextTheme: string): void => {
  if (nextTheme !== 'cockpit' && nextTheme !== 'amber' && nextTheme !== 'indigo') return;
  emit('update:modelValue', nextTheme);
};
</script>

<style scoped lang="scss">
.theme-select {
  min-width: 132px;
}

.theme-trigger {
  height: 34px;
  min-width: 42px;
  border-radius: 999px;
  border: 1px solid var(--color-primary-amber-35);
  background: color-mix(in srgb, var(--color-cockpit-bg-mid-97) 66%, transparent);
  color: var(--color-zinc-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 10px;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.theme-trigger:hover {
  border-color: var(--color-primary-amber-55);
  box-shadow: 0 0 0 3px var(--color-primary-amber-12);
  transform: translateY(-1px);
}

.theme-trigger__icon {
  font-size: 14px;
  line-height: 1;
}

.theme-trigger__swatch {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2) inset;
}

.theme-trigger__swatch--cockpit {
  background: #f97316;
}

.theme-trigger__swatch--amber {
  background: #f59e0b;
}

.theme-trigger__swatch--indigo {
  background: #6366f1;
}

.theme-panel {
  animation: theme-panel-in 0.16s ease;
}

.theme-panel__control {
  width: 132px;
}

:deep(.theme-panel__control .el-select__wrapper) {
  min-height: 32px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--color-cockpit-bg-mid-97) 70%, transparent);
  box-shadow: 0 0 0 1px var(--color-primary-amber-35) inset !important;
}

:deep(.theme-panel__control .el-select__placeholder),
:deep(.theme-panel__control .el-select__selected-item),
:deep(.theme-panel__control .el-select__caret) {
  color: var(--color-zinc-text);
}

:deep(.theme-panel__control.is-focus .el-select__wrapper) {
  box-shadow:
    0 0 0 1px var(--color-primary-amber-55) inset,
    0 0 0 3px var(--color-primary-amber-12) !important;
}

@keyframes theme-panel-in {
  from {
    opacity: 0;
    transform: translateY(-2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<style lang="scss">
.theme-select-popper {
  border: 1px solid var(--color-primary-amber-32);
  border-radius: 10px;
  background: linear-gradient(145deg, var(--color-panel-bg) 0%, var(--color-cockpit-bg-mid-97) 100%);
  box-shadow: 0 14px 34px color-mix(in srgb, var(--color-cockpit-bg-mid-97) 70%, #000);

  .el-popper__arrow::before {
    border-color: var(--color-primary-amber-24) !important;
    background: var(--color-cockpit-bg-mid-97) !important;
  }

  .el-select-dropdown__item {
    color: var(--color-zinc-text);
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  .el-select-dropdown__item:hover {
    background: var(--color-primary-amber-10);
    color: #fff;
  }

  .el-select-dropdown__item.is-selected {
    color: #fff;
    font-weight: 600;
    background: var(--color-primary-amber-24);
  }
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 8px;

  &__swatch {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.45);
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2) inset;
    flex-shrink: 0;
  }

  &__swatch--cockpit {
    background: #f97316;
  }

  &__swatch--amber {
    background: #f59e0b;
  }

  &__swatch--indigo {
    background: #6366f1;
  }
}
</style>
