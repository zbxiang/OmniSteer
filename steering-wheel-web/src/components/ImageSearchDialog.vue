<template>
  <el-dialog
    v-model="visible"
    class="image-search-dialog"
    title="以图搜图"
    width="560px"
    :close-on-click-modal="false"
    @closed="resetState"
  >
    <div class="image-search__panel">
      <p class="image-search__hint">上传一张方向盘图片，系统将搜索相似产品</p>
      <label
        class="upload-area"
        :class="{ 'upload-area--dragover': dragOver }"
        @dragover.prevent="onDragOver"
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDropFile"
      >
        <div class="upload-area__icon">⌁</div>
        <div class="upload-area__title">
          {{ dragOver ? '松开即可上传图片' : '点击或拖拽上传产品图片' }}
        </div>
        <small>支持 JPG、PNG、WEBP，最大 5MB</small>
        <span v-if="imageSearchFileName" class="upload-area__file">{{ imageSearchFileName }}</span>
        <input
          class="upload-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          @change="onImageSelect"
        />
      </label>
    </div>

    <div class="img-preview" v-if="imageSearchPreview">
      <img :src="imageSearchPreview" alt="preview" />
      <p>已选择图片：{{ imageSearchFileName }}</p>
    </div>

    <template #footer>
      <div class="modal-actions">
        <el-button class="image-btn image-btn--ghost" @click="onClose"
          >取消</el-button
        >
        <el-button
          class="image-btn image-btn--primary"
          :loading="imageSearching"
          @click="runImageSearch"
        >
          {{ imageSearching ? '识别中...' : '开始搜索' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import type { ProductLite, ProductOut } from '@/types';
import { imageSearchProductsApi } from '@/api/product';
import { isRequestCanceled, RequestError } from '@/api/request';

const props = defineProps<{
  modelValue: boolean;
  products: ProductLite[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  searched: [items: ProductOut[]];
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const imageSearchPreview = ref<string>('');
const imageSearchFileName = ref<string>('');
const imageSearchDataUrl = ref<string>('');
const imageSearching = ref<boolean>(false);
const dragOver = ref<boolean>(false);
let previewObjectUrl: string | null = null;

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise<string>((resolve, reject): void => {
    const reader = new FileReader();
    reader.onload = (): void => resolve(String(reader.result || ''));
    reader.onerror = (): void => reject(reader.error);
    reader.readAsDataURL(file);
  });

const resetState = (): void => {
  imageSearchFileName.value = '';
  imageSearchPreview.value = '';
  imageSearchDataUrl.value = '';
  imageSearching.value = false;
  dragOver.value = false;
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = '';
  }
};

const applySelectedFile = async (file: File): Promise<boolean> => {
  const okType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
  if (!okType) {
    ElMessage.error('仅支持 JPG / PNG / WEBP 图片');
    return false;
  }
  const okSize = file.size / 1024 / 1024 <= 5;
  if (!okSize) {
    ElMessage.error('图片不能超过 5MB');
    return false;
  }
  try {
    imageSearchDataUrl.value = await readFileAsDataUrl(file);
  } catch {
    ElMessage.error('读取图片失败，请重试');
    return false;
  }
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = URL.createObjectURL(file);
  imageSearchFileName.value = file.name;
  imageSearchPreview.value = previewObjectUrl;
  return true;
};

const onImageSelect = async (e: Event): Promise<void> => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const ok = await applySelectedFile(file);
  if (!ok) input.value = '';
};

const onDragOver = (): void => {
  dragOver.value = true;
};

const onDragLeave = (): void => {
  dragOver.value = false;
};

const onDropFile = async (e: DragEvent): Promise<void> => {
  dragOver.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;
  await applySelectedFile(file);
};

const runImageSearch = async (): Promise<void> => {
  if (!imageSearchFileName.value || !imageSearchDataUrl.value) {
    ElMessage.warning('请先上传图片');
    return;
  }
  imageSearching.value = true;
  try {
    const res = await imageSearchProductsApi({
      image: imageSearchDataUrl.value,
      limit: 8,
    });
    emit('searched', res.items);
    visible.value = false;
    resetState();
  } catch (e) {
    if (isRequestCanceled(e)) return;
    const msg = e instanceof RequestError ? e.message : '以图搜图失败，请稍后重试';
    ElMessage.error(msg);
  } finally {
    imageSearching.value = false;
  }
};

const onClose = (): void => {
  visible.value = false;
  resetState();
};

onUnmounted(() => {
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
});
</script>

<style scoped lang="scss">
:deep(.image-search-dialog .el-dialog) {
  border: 1px solid var(--color-primary-amber-32);
  border-radius: 14px;
  background: linear-gradient(
    145deg,
    v.$panel-bg 0%,
    var(--color-cockpit-bg-mid-97) 100%
  );
  box-shadow: 0 24px 70px color-mix(in srgb, var(--color-cockpit-bg-mid-97) 68%, #000);
}

:deep(.image-search-dialog .el-dialog__header) {
  margin-right: 0;
  padding: 16px 18px 8px;
  border-bottom: 1px solid var(--color-primary-amber-16);
}

:deep(.image-search-dialog .el-dialog__title) {
  color: v.$zinc-text;
  font-weight: 600;
}

:deep(.image-search-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: v.$zinc-label;
  transition: color 0.2s ease, filter 0.2s ease;
}

:deep(.image-search-dialog .el-dialog__headerbtn) {
  border-radius: 8px;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

:deep(.image-search-dialog .el-dialog__headerbtn:hover .el-dialog__close) {
  color: v.$primary-amber;
  filter: drop-shadow(0 0 8px var(--color-primary-amber-45));
}

:deep(.image-search-dialog .el-dialog__headerbtn:hover) {
  background: var(--color-primary-amber-10);
  box-shadow: inset 0 0 0 1px var(--color-primary-amber-20);
}

:deep(.image-search-dialog .el-dialog__body) {
  padding: 14px 18px 8px;
}

:deep(.image-search-dialog .el-dialog__footer) {
  padding: 8px 18px 16px;
}

.image-search__hint {
  margin: 0;
  color: v.$zinc-text;
  font-size: 12px;
  line-height: 1.6;
  letter-spacing: 0.04em;
  font-weight: 500;
  background: color-mix(in srgb, var(--color-cockpit-bg-mid-97) 74%, transparent);
  border: 1px solid var(--color-primary-amber-20);
  border-radius: 10px;
  padding: 9px 12px;
  text-shadow: 0 1px 2px color-mix(in srgb, var(--color-cockpit-bg-mid-97) 64%, #000);
}

.image-search__panel {
  display: grid;
  gap: 10px;
}

.upload-area {
  display: grid;
  place-items: center;
  border: 1px dashed var(--color-primary-amber-35);
  border-radius: 12px;
  padding: 1.1rem 1rem 1rem;
  text-align: center;
  cursor: pointer;
  background:
    radial-gradient(circle at 18% 10%, var(--color-primary-amber-10) 0%, transparent 48%),
    var(--color-input-bg-55);
  color: color-mix(in srgb, var(--color-zinc-text) 92%, #fff);
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.upload-area:hover {
  border-color: var(--color-primary-amber-55);
  background: var(--color-input-bg-72);
  transform: translateY(-1px);
  box-shadow: 0 8px 20px var(--color-primary-amber-12);
}

.upload-area--dragover {
  border-color: var(--color-primary-amber-70);
  background: var(--color-input-bg-72);
  box-shadow:
    0 10px 26px var(--color-primary-amber-16),
    inset 0 0 0 1px var(--color-primary-amber-24);
}

.upload-area__icon {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  margin-bottom: 8px;
  color: var(--color-primary-amber);
  font-size: 19px;
  background: var(--color-primary-amber-12);
  border: 1px solid var(--color-primary-amber-28);
}

.upload-area__title {
  font-size: 14px;
  font-weight: 600;
}

.upload-area__file {
  margin-top: 8px;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid var(--color-primary-amber-30);
  background: var(--color-primary-amber-08);
  color: v.$zinc-text;
  font-size: 12px;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-area small {
  display: block;
  margin-top: 0.45rem;
  color: color-mix(in srgb, var(--color-zinc-label) 92%, #fff);
  font-size: 12px;
}

.upload-input {
  display: none;
}

.img-preview {
  margin-top: 0.85rem;
  border: 1px solid var(--color-primary-amber-25);
  border-radius: 12px;
  padding: 0.8rem;
  text-align: center;
  background: color-mix(in srgb, var(--color-cockpit-bg-mid-97) 74%, transparent);

  img {
    max-width: 100%;
    max-height: 210px;
    border-radius: 8px;
    object-fit: contain;
    border: 1px solid var(--color-primary-amber-20);
  }

  p {
    margin: 0.4rem 0 0;
    color: v.$zinc-label;
    font-size: 12px;
    word-break: break-all;
  }
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}

.image-btn {
  min-width: 92px;
  border-radius: 10px;
  font-weight: 600;
}

.image-btn--ghost {
  --el-button-bg-color: color-mix(in srgb, var(--color-cockpit-bg-mid-97) 64%, transparent);
  --el-button-border-color: var(--color-primary-amber-45);
  --el-button-text-color: var(--color-zinc-text);
  --el-button-hover-bg-color: color-mix(in srgb, var(--color-cockpit-bg-mid-97) 78%, transparent);
  --el-button-hover-border-color: var(--color-primary-amber-70);
  --el-button-hover-text-color: #fff;
  --el-button-active-bg-color: color-mix(in srgb, var(--color-cockpit-bg-mid-97) 86%, transparent);
  --el-button-active-border-color: var(--color-primary-amber-55);
  box-shadow: inset 0 0 0 1px var(--color-primary-amber-12);
}

:deep(.image-btn--ghost > span) {
  color: var(--color-zinc-text);
  font-weight: 600;
}

:deep(.image-btn--ghost:hover > span) {
  color: #ffffff;
}

.image-btn--primary {
  --el-button-bg-color: var(--color-primary-amber-85);
  --el-button-border-color: var(--color-primary-amber);
  --el-button-text-color: #fff;
  --el-button-hover-bg-color: var(--color-primary-amber);
  --el-button-hover-border-color: var(--color-accent-warm);
  --el-button-hover-text-color: #fff;
  --el-button-active-text-color: #fff;
  box-shadow: 0 0 20px var(--color-primary-amber-24);
}

:deep(.image-btn--primary > span),
:deep(.image-btn--primary:hover > span),
:deep(.image-btn--primary:active > span) {
  color: #fff;
}
</style>
