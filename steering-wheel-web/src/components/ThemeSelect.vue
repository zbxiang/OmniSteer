<template>
  <div class="theme-select" role="group" aria-label="主题切换">
    <el-tooltip
      v-for="item in options"
      :key="item.value"
      :content="item.label"
      placement="bottom"
      :show-after="120"
    >
      <button
        type="button"
        class="theme-select__item"
        :class="[
          `theme-select__item--${item.value}`,
          { 'theme-select__item--active': modelValue === item.value },
        ]"
        :aria-label="item.label"
        @click="onChange(item.value)"
      />
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import type { ThemeName } from '@/types';

defineProps<{
  modelValue: ThemeName;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: ThemeName];
}>();

const options: Array<{ value: ThemeName; label: string }> = [
  { value: 'cockpit', label: '座舱橙' },
  { value: 'amber', label: '琥珀橙' },
  { value: 'indigo', label: '靛青色' },
  { value: 'magenta', label: '紫红色' },
  { value: 'teal', label: '蓝绿色' },
  { value: 'emerald', label: '翠色' },
  { value: 'lime', label: '酸橙色' },
  { value: 'yellow', label: '黄色' },
  { value: 'stone', label: '石头色' },
  { value: 'mist', label: '薄雾色' },
  { value: 'olive', label: '橄榄色' },
];

const onChange = (nextTheme: ThemeName): void => {
  emit('update:modelValue', nextTheme);
};
</script>

<style scoped lang="scss">
.theme-select {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid var(--color-primary-amber-24);
  border-radius: 10px;
  background: color-mix(in srgb, var(--color-cockpit-bg-mid-97) 72%, transparent);
}

.theme-select__item {
  width: 12px;
  height: 12px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 999px;
  padding: 0;
  cursor: pointer;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.22) inset;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.theme-select__item:hover {
  transform: scale(1.08);
}

.theme-select__item--active {
  border-color: #fff;
  box-shadow:
    0 0 0 2px var(--color-primary-amber-35),
    0 0 0 1px rgba(0, 0, 0, 0.22) inset;
}

.theme-select__item--cockpit {
  background: #f97316;
}

.theme-select__item--amber {
  background: #f59e0b;
}

.theme-select__item--indigo {
  background: #6366f1;
}

.theme-select__item--magenta {
  background: #d946ef;
}

.theme-select__item--teal {
  background: #14b8a6;
}

.theme-select__item--emerald {
  background: #10b981;
}

.theme-select__item--lime {
  background: #84cc16;
}

.theme-select__item--yellow {
  background: #eab308;
}

.theme-select__item--stone {
  background: #78716c;
}

.theme-select__item--mist {
  background: #94a3b8;
}

.theme-select__item--olive {
  background: #657220;
}
</style>
