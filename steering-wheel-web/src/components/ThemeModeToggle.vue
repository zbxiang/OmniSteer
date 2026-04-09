<template>
  <div
    class="inline-flex items-center rounded-2xl border border-black/10 bg-white/80 p-1 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md dark:border-white/15 dark:bg-neutral-900/80"
    role="group"
    aria-label="Theme mode switcher"
  >
    <button
      v-for="item in options"
      :key="item.value"
      type="button"
      class="relative inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-medium tracking-tight transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:focus-visible:ring-white/30"
      :class="[
        currentMode === item.value
          ? 'text-neutral-900 dark:text-white'
          : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200',
      ]"
      :aria-label="item.label"
      :aria-pressed="currentMode === item.value"
      @click="setMode(item.value)"
    >
      <span
        v-if="currentMode === item.value"
        class="absolute inset-0 -z-10 rounded-xl bg-black/5 transition-all duration-300 dark:bg-white/10"
      />

      <span class="relative h-4 w-4">
        <svg
          v-if="item.value === 'light'"
          class="absolute inset-0 h-4 w-4 transition-all duration-500"
          :class="currentMode === 'light' ? 'scale-100 rotate-0 opacity-100' : 'scale-75 -rotate-45 opacity-70'"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2.2M12 19.8V22M4.93 4.93l1.56 1.56M17.51 17.51l1.56 1.56M2 12h2.2M19.8 12H22M4.93 19.07l1.56-1.56M17.51 6.49l1.56-1.56" />
        </svg>

        <svg
          v-else-if="item.value === 'dark'"
          class="absolute inset-0 h-4 w-4 transition-all duration-500"
          :class="currentMode === 'dark' ? 'scale-100 rotate-0 opacity-100' : 'scale-75 rotate-45 opacity-70'"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>

        <svg
          v-else
          class="absolute inset-0 h-4 w-4 transition-all duration-500"
          :class="currentMode === 'system' ? 'scale-100 opacity-100' : 'scale-90 opacity-70'"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <path d="M8 20h8M12 16v4" />
        </svg>
      </span>

      <span>{{ item.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeOption {
  value: ThemeMode;
  label: string;
}

const props = withDefaults(
  defineProps<{
    modelValue?: ThemeMode;
    storageKey?: string;
  }>(),
  {
    modelValue: 'system',
    storageKey: 'omnisteer-theme-mode',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: ThemeMode];
  change: [resolved: 'light' | 'dark', mode: ThemeMode];
}>();

const options: ThemeOption[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const currentMode = computed<ThemeMode>(() => props.modelValue);

const mediaQuery =
  typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

const resolveTheme = (mode: ThemeMode): 'light' | 'dark' => {
  if (mode === 'system') {
    return mediaQuery?.matches ? 'dark' : 'light';
  }
  return mode;
};

const applyTheme = (mode: ThemeMode): void => {
  if (typeof document === 'undefined') return;
  const resolved = resolveTheme(mode);
  const root = document.documentElement;

  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
  root.setAttribute('data-color-mode', resolved);

  emit('change', resolved, mode);
};

const setMode = (mode: ThemeMode): void => {
  emit('update:modelValue', mode);
  if (typeof window !== 'undefined') {
    localStorage.setItem(props.storageKey, mode);
  }
  applyTheme(mode);
};

const onSystemThemeChange = (): void => {
  if (currentMode.value === 'system') {
    applyTheme('system');
  }
};

onMounted((): void => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(props.storageKey);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      emit('update:modelValue', saved);
      applyTheme(saved);
      return;
    }
  }

  applyTheme(currentMode.value);
  mediaQuery?.addEventListener('change', onSystemThemeChange);
});

onUnmounted((): void => {
  mediaQuery?.removeEventListener('change', onSystemThemeChange);
});
</script>
