<template>
  <el-dropdown
    trigger="click"
    :teleported="true"
    :placement="appearance === 'floating' ? 'top-end' : 'bottom-end'"
    popper-class="theme-palette-dropdown"
    @command="onCommand"
  >
    <button
      type="button"
      class="theme-palette-btn"
      :class="{
        'theme-palette-btn--embedded': appearance === 'embedded',
        'theme-palette-btn--floating': appearance === 'floating',
      }"
      aria-label="主题切换"
      aria-haspopup="true"
    >
      <svg
        class="theme-palette-btn__icon"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
        <path
          d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.669-1.648h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
    <template #dropdown>
      <el-dropdown-menu class="theme-palette-menu">
        <el-dropdown-item
          v-for="opt in options"
          :key="opt.value"
          :command="opt.value"
          :class="{ 'is-active': appStore.theme === opt.value }"
        >
          <span
            class="theme-palette-menu__swatch"
            :class="`theme-palette-menu__swatch--${opt.value}`"
            aria-hidden="true"
          />
          <span class="theme-palette-menu__label">{{ opt.label }}</span>
          <el-icon v-if="appStore.theme === opt.value" class="theme-palette-menu__check">
            <Check />
          </el-icon>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { Check } from '@element-plus/icons-vue';
import { useAppStore } from '@/stores/app';
import type { ThemeName } from '@/types/theme';

withDefaults(
  defineProps<{
    /** default：独立按钮；embedded：顶栏内嵌；floating：右下角悬浮 */
    appearance?: 'default' | 'embedded' | 'floating';
  }>(),
  { appearance: 'default' },
);

const appStore = useAppStore();

const options: Array<{ value: ThemeName; label: string }> = [
  { value: 'red', label: '红色' },
  { value: 'orange', label: '橙色' },
  { value: 'amber', label: '琥珀色' },
  { value: 'yellow', label: '黄色' },
  { value: 'lime', label: '酸橙' },
  { value: 'green', label: '绿色' },
  { value: 'emerald', label: '翠色' },
  { value: 'teal', label: '蓝绿色' },
  { value: 'cyan', label: '青色' },
  { value: 'sky', label: '天空' },
  { value: 'blue', label: '蓝色' },
  { value: 'indigo', label: '靛青' },
  { value: 'violet', label: '紫罗兰' },
  { value: 'purple', label: '紫色' },
  { value: 'magenta', label: '紫红色' },
  { value: 'pink', label: '粉色' },
  { value: 'rose', label: '玫瑰' },
  { value: 'stone', label: '石头' },
  { value: 'gray', label: '灰色' },
  { value: 'zinc', label: '锌' },
  { value: 'neutral', label: '中性' },
  { value: 'taupe', label: '灰褐色' },
  { value: 'mist', label: '薄雾' },
  { value: 'olive', label: '橄榄' },
];

const onCommand = (command: string): void => {
  appStore.setTheme(command as ThemeName);
};
</script>

<style scoped lang="scss">
.theme-palette-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: #fff;
  color: var(--color-primary-amber-70);
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    color 0.2s ease,
    transform 0.15s ease;

  &:hover {
    border-color: var(--color-primary-amber-26);
    color: var(--color-primary-amber);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  &:active {
    transform: scale(0.96);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary-amber);
    outline-offset: 2px;
  }
}

.theme-palette-btn__icon {
  width: 18px;
  height: 18px;
  display: block;
}

.theme-palette-btn--embedded {
  width: 28px;
  height: 28px;
  border-color: transparent;
  background: transparent;
  box-shadow: none;
  color: var(--color-primary-amber-70);

  &:hover {
    background: var(--color-primary-amber-08);
    border-color: transparent;
    color: var(--color-primary-amber);
    box-shadow: none;
  }
}

.theme-palette-btn--floating {
  border-radius: 50%;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
}
</style>

<style lang="scss">
.theme-palette-dropdown.el-popper {
  border-radius: 10px !important;
  padding: 6px !important;
  min-width: 760px !important;
  box-shadow:
    0 6px 16px rgba(0, 0, 0, 0.08),
    0 3px 6px rgba(0, 0, 0, 0.04) !important;
  border: 1px solid rgba(0, 0, 0, 0.06) !important;
}

.theme-palette-menu.el-dropdown-menu {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 2px;
  padding: 4px;
  min-width: 720px;
  border: none;
  box-shadow: none;
  background: transparent;
}

.theme-palette-menu .el-dropdown-menu__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  margin: 0;
  line-height: 1.4;
  min-width: 0;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
    color: inherit;
  }

  &.is-active {
    background-color: color-mix(in srgb, var(--color-primary-amber) 12%, transparent);
    color: var(--color-primary-amber);
    font-weight: 500;
  }
}

.theme-palette-menu__swatch {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12) inset;
}

.theme-palette-menu__swatch--blue { background: #3b82f6; }
.theme-palette-menu__swatch--amber { background: #f59e0b; }
.theme-palette-menu__swatch--yellow { background: #eab308; }
.theme-palette-menu__swatch--lime { background: #84cc16; }
.theme-palette-menu__swatch--purple { background: #8b5cf6; }
.theme-palette-menu__swatch--green { background: #10b981; }
.theme-palette-menu__swatch--emerald { background: #10b981; }
.theme-palette-menu__swatch--teal { background: #14b8a6; }
.theme-palette-menu__swatch--cyan { background: #06b6d4; }
.theme-palette-menu__swatch--sky { background: #0ea5e9; }
.theme-palette-menu__swatch--indigo { background: #6366f1; }
.theme-palette-menu__swatch--violet { background: #7c3aed; }
.theme-palette-menu__swatch--magenta { background: #d946ef; }
.theme-palette-menu__swatch--orange { background: #f97316; }
.theme-palette-menu__swatch--pink { background: #ec4899; }
.theme-palette-menu__swatch--red { background: #dc2626; }
.theme-palette-menu__swatch--rose { background: #f43f5e; }
.theme-palette-menu__swatch--stone { background: #78716c; }
.theme-palette-menu__swatch--gray { background: #6b7280; }
.theme-palette-menu__swatch--zinc { background: #71717a; }
.theme-palette-menu__swatch--neutral { background: #737373; }
.theme-palette-menu__swatch--taupe { background: #78716c; }
.theme-palette-menu__swatch--mist { background: #64748b; }
.theme-palette-menu__swatch--olive { background: #6b705c; }

.theme-palette-menu__label {
  flex: 1;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
}

.theme-palette-menu .el-dropdown-menu__item.is-active .theme-palette-menu__label {
  color: inherit;
}

.theme-palette-menu__check {
  flex-shrink: 0;
  font-size: 14px;
}

@media (max-width: 720px) {
  .theme-palette-dropdown.el-popper {
    min-width: 420px !important;
  }

  .theme-palette-menu.el-dropdown-menu {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    min-width: 400px;
  }
}
</style>
