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
      <button
        type="button"
        class="img-preview__remove"
        aria-label="删除已选图片"
        title="删除图片"
        @click="removeSelectedImage"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          <path d="M9 4h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          <path d="M7 7v11a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
          <path d="M10 11v5M14 11v5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </button>
      <div class="img-preview__image-wrap">
        <div v-if="uploading || uploadProgress > 0" class="img-preview__progress img-preview__progress--overlay">
          <div class="img-preview__progress-meta">
            <span>{{ uploading ? '上传中...' : '上传完成' }}</span>
            <span>{{ uploadProgress }}%</span>
          </div>
          <el-progress
            :percentage="uploadProgress"
            :status="uploadProgress === 100 && !uploading ? 'success' : undefined"
            :stroke-width="6"
            :show-text="false"
          />
        </div>
        <img :src="imageSearchPreview" alt="preview" />
      </div>
      <p>已选择图片：{{ imageSearchFileName }}</p>
      <p v-if="uploadedImageUrl" class="img-preview__uploaded">上传成功，已获取图片地址</p>
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
import type { ProductLite } from '@/types/product';
import { uploadImageFileApi } from '@/api/product';

const props = defineProps<{
  modelValue: boolean;
  products: ProductLite[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [payload: { imageUrl: string }];
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const imageSearchPreview = ref<string>('');
const imageSearchFileName = ref<string>('');
const imageSearchDataUrl = ref<string>('');
const uploadedImageUrl = ref<string>('');
const imageSearching = ref<boolean>(false);
const uploading = ref<boolean>(false);
const uploadProgress = ref<number>(0);
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
  uploadedImageUrl.value = '';
  imageSearching.value = false;
  uploading.value = false;
  uploadProgress.value = 0;
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
  uploadedImageUrl.value = '';
  uploadProgress.value = 0;
  uploading.value = true;
  try {
    uploadedImageUrl.value = await uploadImageFileApi(file, (percent) => {
      uploadProgress.value = percent;
    });
    uploadProgress.value = 100;
  } catch {
    uploadedImageUrl.value = '';
    uploadProgress.value = 0;
    ElMessage.error('图片上传失败，请重试');
    return false;
  } finally {
    uploading.value = false;
  }
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
  if (!imageSearchFileName.value || !imageSearchPreview.value) {
    ElMessage.warning('请先上传图片');
    return;
  }
  if (uploading.value) {
    ElMessage.info('图片上传中，请稍候');
    return;
  }
  if (!uploadedImageUrl.value) {
    ElMessage.warning('请先等待图片上传成功');
    return;
  }
  emit('submit', { imageUrl: uploadedImageUrl.value });
  visible.value = false;
  resetState();
};

const onClose = (): void => {
  visible.value = false;
  resetState();
};

const removeSelectedImage = (): void => {
  resetState();
};

const getUploadedImageUrl = (): string => uploadedImageUrl.value;

defineExpose({
  getUploadedImageUrl,
});

onUnmounted(() => {
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
});
</script>

<style scoped lang="scss">
:deep(.image-search-dialog .el-dialog) {
  border: 1px solid var(--color-primary-amber-24);
  border-radius: 18px;
  overflow: hidden;
  background:
    radial-gradient(circle at 12% -30%, var(--color-primary-amber-18) 0%, transparent 52%),
    radial-gradient(circle at 110% -40%, var(--color-primary-amber-12) 0%, transparent 56%),
    linear-gradient(
      160deg,
      color-mix(in srgb, #fff 95%, var(--color-primary-amber-08)) 0%,
      color-mix(in srgb, #fff 90%, var(--color-primary-amber-12)) 45%,
      color-mix(in srgb, #fff 97%, var(--color-primary-amber-06)) 100%
    );
  box-shadow:
    0 26px 70px rgba(0, 0, 0, 0.18),
    0 1px 0 rgba(255, 255, 255, 0.65) inset;
  backdrop-filter: saturate(1.08) blur(8px);
  -webkit-backdrop-filter: saturate(1.08) blur(8px);
}

:deep(.image-search-dialog .el-dialog__header) {
  margin-right: 0;
  padding: 18px 22px 10px;
  border-bottom: 1px solid var(--color-primary-amber-14);
}

:deep(.image-search-dialog .el-dialog__title) {
  color: rgba(0, 0, 0, 0.88);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.01em;
}

:deep(.image-search-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: var(--color-primary-amber);
  transition: color 0.2s ease, filter 0.2s ease;
}

:deep(.image-search-dialog .el-dialog__headerbtn) {
  border-radius: 8px;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

:deep(.image-search-dialog .el-dialog__headerbtn:hover .el-dialog__close) {
  color: var(--color-primary-amber-85);
  filter: drop-shadow(0 0 8px var(--color-primary-amber-32));
}

:deep(.image-search-dialog .el-dialog__headerbtn:hover) {
  background: var(--color-primary-amber-10);
  box-shadow: inset 0 0 0 1px var(--color-primary-amber-20);
}

:deep(.image-search-dialog .el-dialog__body) {
  padding: 16px 22px 12px;
}

:deep(.image-search-dialog .el-dialog__footer) {
  padding: 10px 22px 18px;
}

.image-search__hint {
  margin: 0;
  color: rgba(0, 0, 0, 0.68);
  font-size: 13px;
  line-height: 1.55;
  font-weight: 500;
  background: color-mix(in srgb, #fff 86%, var(--color-primary-amber-06));
  border: 1px solid var(--color-primary-amber-14);
  border-radius: 12px;
  padding: 10px 13px;
}

.image-search__panel {
  display: grid;
  gap: 10px;
}

.upload-area {
  position: relative;
  display: grid;
  place-items: center;
  border: 1px dashed var(--color-primary-amber-35);
  border-radius: 16px;
  padding: 1.25rem 1.1rem 1.1rem;
  text-align: center;
  cursor: pointer;
  background:
    radial-gradient(circle at 15% -20%, var(--color-primary-amber-18) 0%, transparent 46%),
    radial-gradient(circle at 100% 120%, var(--color-primary-amber-10) 0%, transparent 56%),
    color-mix(in srgb, #fff 94%, var(--color-primary-amber-06));
  color: rgba(0, 0, 0, 0.82);
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.upload-area:hover {
  border-color: var(--color-primary-amber-55);
  background:
    radial-gradient(circle at 15% -20%, var(--color-primary-amber-24) 0%, transparent 46%),
    radial-gradient(circle at 100% 120%, var(--color-primary-amber-14) 0%, transparent 56%),
    color-mix(in srgb, #fff 90%, var(--color-primary-amber-08));
  transform: translateY(-1px);
  box-shadow:
    0 10px 24px var(--color-primary-amber-16),
    0 1px 0 rgba(255, 255, 255, 0.75) inset;
}

.upload-area--dragover {
  border-color: var(--color-primary-amber-70);
  background:
    radial-gradient(circle at 15% -20%, var(--color-primary-amber-28) 0%, transparent 46%),
    radial-gradient(circle at 100% 120%, var(--color-primary-amber-18) 0%, transparent 56%),
    color-mix(in srgb, #fff 86%, var(--color-primary-amber-10));
  box-shadow:
    0 12px 28px var(--color-primary-amber-20),
    inset 0 0 0 1px var(--color-primary-amber-24);
}

.upload-area__icon {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  margin-bottom: 10px;
  color: var(--color-primary-amber);
  font-size: 20px;
  background: linear-gradient(
    160deg,
    color-mix(in srgb, #fff 62%, var(--color-primary-amber-24)) 0%,
    color-mix(in srgb, #fff 48%, var(--color-primary-amber-32)) 100%
  );
  border: 1px solid var(--color-primary-amber-35);
  box-shadow: 0 4px 12px var(--color-primary-amber-16);
}

.upload-area__title {
  font-size: 14px;
  font-weight: 650;
  letter-spacing: 0.01em;
}

.upload-area__file {
  margin-top: 9px;
  padding: 3px 11px;
  border-radius: 999px;
  border: 1px solid var(--color-primary-amber-26);
  background: color-mix(in srgb, #fff 82%, var(--color-primary-amber-12));
  color: rgba(0, 0, 0, 0.72);
  font-size: 12px;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-area small {
  display: block;
  margin-top: 0.45rem;
  color: rgba(0, 0, 0, 0.5);
  font-size: 12px;
}

.upload-input {
  display: none;
}

.img-preview {
  position: relative;
  margin-top: 0.95rem;
  border: 1px solid var(--color-primary-amber-20);
  border-radius: 14px;
  padding: 0.9rem;
  text-align: center;
  background: color-mix(in srgb, #fff 92%, var(--color-primary-amber-06));
  box-shadow:
    0 8px 24px var(--color-primary-amber-10),
    0 1px 0 rgba(255, 255, 255, 0.75) inset;

  &__image-wrap {
    position: relative;
    display: inline-block;
    max-width: 100%;
  }

  img {
    max-width: 100%;
    max-height: 210px;
    border-radius: 10px;
    object-fit: contain;
    border: 1px solid var(--color-primary-amber-18);
    background: color-mix(in srgb, #fff 88%, var(--color-primary-amber-04));
  }

  p {
    margin: 0.5rem 0 0;
    color: rgba(0, 0, 0, 0.58);
    font-size: 12px;
    word-break: break-all;
  }
}

.img-preview__remove {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 28px;
  height: 28px;
  border: 1px solid var(--color-primary-amber-20);
  border-radius: 8px;
  background: color-mix(in srgb, #fff 88%, var(--color-primary-amber-08));
  color: var(--color-primary-amber-70);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease,
    transform 0.15s ease;
}

.img-preview__remove svg {
  width: 15px;
  height: 15px;
}

.img-preview__remove:hover {
  color: #fff;
  border-color: var(--color-primary-amber);
  background: var(--color-primary-amber);
  transform: translateY(-1px);
}

.img-preview__uploaded {
  color: var(--color-primary-amber);
  font-weight: 600;
}

.img-preview__progress {
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: color-mix(in srgb, #fff 90%, var(--color-primary-amber-06));
  border: 1px solid var(--color-primary-amber-14);
}

.img-preview__progress--overlay {
  position: absolute;
  left: 10px;
  right: 10px;
  top: 10px;
  margin-top: 0;
  z-index: 2;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.img-preview__progress-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.56);
  letter-spacing: 0.01em;
}

:deep(.img-preview__progress .el-progress-bar__outer) {
  background: color-mix(in srgb, #fff 82%, var(--color-primary-amber-10));
}

:deep(.img-preview__progress .el-progress-bar__inner) {
  background: linear-gradient(
    90deg,
    var(--color-primary-amber-55) 0%,
    var(--color-primary-amber) 100%
  );
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
}

.image-btn {
  min-width: 96px;
  border-radius: 11px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.image-btn--ghost {
  --el-button-bg-color: color-mix(in srgb, #fff 90%, var(--color-primary-amber-06));
  --el-button-border-color: var(--color-primary-amber-30);
  --el-button-text-color: rgba(0, 0, 0, 0.72);
  --el-button-hover-bg-color: color-mix(in srgb, #fff 84%, var(--color-primary-amber-10));
  --el-button-hover-border-color: var(--color-primary-amber-55);
  --el-button-hover-text-color: rgba(0, 0, 0, 0.86);
  --el-button-active-bg-color: color-mix(in srgb, #fff 78%, var(--color-primary-amber-12));
  --el-button-active-border-color: var(--color-primary-amber-55);
  box-shadow:
    0 3px 10px var(--color-primary-amber-10),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

:deep(.image-btn--ghost > span) {
  color: rgba(0, 0, 0, 0.72);
  font-weight: 600;
}

:deep(.image-btn--ghost:hover > span) {
  color: rgba(0, 0, 0, 0.86);
}

.image-btn--primary {
  --el-button-bg-color: var(--color-primary-amber-70);
  --el-button-border-color: var(--color-primary-amber-70);
  --el-button-text-color: #fff;
  --el-button-hover-bg-color: var(--color-primary-amber);
  --el-button-hover-border-color: var(--color-primary-amber);
  --el-button-hover-text-color: #fff;
  --el-button-active-text-color: #fff;
  box-shadow:
    0 10px 24px var(--color-primary-amber-24),
    inset 0 1px 0 rgba(255, 255, 255, 0.28);
}

:deep(.image-btn--primary > span),
:deep(.image-btn--primary:hover > span),
:deep(.image-btn--primary:active > span) {
  color: #fff;
}
</style>
