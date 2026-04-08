<template>
  <el-dialog
    v-model="visible"
    class="image-search-dialog"
    title="以图搜图"
    width="560px"
    :close-on-click-modal="false"
    @closed="resetState"
  >
    <p class="image-search__hint">上传一张方向盘图片，系统将搜索相似产品</p>
    <label class="upload-area">
      <input
        class="upload-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        @change="onImageSelect"
      />
      <div>点击上传产品图片</div>
      <small>支持 JPG、PNG、WEBP，最大 5MB</small>
    </label>

    <div class="img-preview" v-if="imageSearchPreview">
      <img :src="imageSearchPreview" alt="preview" />
      <p>{{ imageSearchFileName }}</p>
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
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = '';
  }
};

const onImageSelect = async (e: Event): Promise<void> => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const okType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
  if (!okType) {
    ElMessage.error('仅支持 JPG / PNG / WEBP 图片');
    input.value = '';
    return;
  }
  const okSize = file.size / 1024 / 1024 <= 5;
  if (!okSize) {
    ElMessage.error('图片不能超过 5MB');
    input.value = '';
    return;
  }
  try {
    imageSearchDataUrl.value = await readFileAsDataUrl(file);
  } catch {
    ElMessage.error('读取图片失败，请重试');
    input.value = '';
    return;
  }
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = URL.createObjectURL(file);
  imageSearchFileName.value = file.name;
  imageSearchPreview.value = previewObjectUrl;
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
  border: 1px solid rgba(v.$primary-amber, 0.32);
  border-radius: 14px;
  background: linear-gradient(
    145deg,
    v.$panel-bg 0%,
    rgba(v.$cockpit-bg-mid, 0.97) 100%
  );
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.45);
}

:deep(.image-search-dialog .el-dialog__header) {
  margin-right: 0;
  padding: 16px 18px 8px;
  border-bottom: 1px solid rgba(v.$primary-amber, 0.16);
}

:deep(.image-search-dialog .el-dialog__title) {
  color: v.$zinc-text;
  font-weight: 600;
}

:deep(.image-search-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: v.$zinc-label;
}

:deep(.image-search-dialog .el-dialog__headerbtn:hover .el-dialog__close) {
  color: v.$primary-amber;
}

:deep(.image-search-dialog .el-dialog__body) {
  padding: 14px 18px 8px;
}

:deep(.image-search-dialog .el-dialog__footer) {
  padding: 8px 18px 16px;
}

.image-search__hint {
  margin: 0 0 0.85rem;
  color: #fff;
  font-size: 13px;
  line-height: 1.6;
  letter-spacing: 0.02em;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 8px 10px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
}

.upload-area {
  display: block;
  border: 1px dashed rgba(v.$primary-amber, 0.35);
  border-radius: 10px;
  padding: 1rem;
  text-align: center;
  cursor: pointer;
  background: rgba(v.$input-bg, 0.55);
  color: rgba(245, 232, 223, 0.92);
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.upload-area:hover {
  border-color: rgba(v.$primary-amber, 0.55);
  background: rgba(v.$input-bg, 0.72);
}

.upload-area small {
  display: block;
  margin-top: 0.35rem;
  color: rgba(201, 175, 160, 0.92);
}

.upload-input {
  display: none;
}

.img-preview {
  margin-top: 0.75rem;
  border: 1px solid rgba(v.$primary-amber, 0.25);
  border-radius: 10px;
  padding: 0.75rem;
  text-align: center;

  img {
    max-width: 100%;
    max-height: 180px;
    border-radius: 8px;
    object-fit: contain;
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
  --el-button-bg-color: rgba(20, 12, 8, 0.65);
  --el-button-border-color: rgba(249, 115, 22, 0.46);
  --el-button-text-color: #fff7f0;
  --el-button-hover-bg-color: rgba(28, 16, 10, 0.78);
  --el-button-hover-border-color: rgba(249, 115, 22, 0.72);
  --el-button-hover-text-color: #ffffff;
  --el-button-active-bg-color: rgba(36, 20, 12, 0.9);
  --el-button-active-border-color: rgba(234, 88, 12, 0.68);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
}

:deep(.image-btn--ghost > span) {
  color: #fff7f0;
  font-weight: 600;
}

:deep(.image-btn--ghost:hover > span) {
  color: #ffffff;
}

.image-btn--primary {
  --el-button-bg-color: rgb(194 65 12);
  --el-button-border-color: rgb(234 88 12);
  --el-button-text-color: #fff;
  --el-button-hover-bg-color: rgb(234 88 12);
  --el-button-hover-border-color: rgb(249 115 22);
  --el-button-hover-text-color: #fff;
  --el-button-active-text-color: #fff;
  box-shadow: 0 0 20px rgba(v.$primary-amber, 0.22);
}

:deep(.image-btn--primary > span),
:deep(.image-btn--primary:hover > span),
:deep(.image-btn--primary:active > span) {
  color: #fff;
}
</style>
