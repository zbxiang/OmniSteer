<template>
  <el-dialog
    v-model="visible"
    class="cockpit-dialog image-search-dialog"
    modal-class="cockpit-dialog-overlay image-search-overlay"
    title="以图搜图"
    :width="dialogWidth"
    :close-on-click-modal="false"
    @closed="resetState"
  >
    <div class="image-search__panel">
      <p class="image-search__hint">上传一张方向盘图片，系统将搜索相似产品</p>
      <el-upload
        class="upload-area"
        drag
        :show-file-list="false"
        :auto-upload="false"
        accept="image/jpeg,image/png,image/webp"
        :before-upload="beforeUpload"
        :on-change="onUploadChange"
      >
        <div class="upload-area__icon">
          <el-icon><UploadFilled /></el-icon>
        </div>
        <div class="upload-area__title">点击或拖拽上传产品图片</div>
        <small>支持 JPG、PNG、WEBP，最大 5MB</small>
        <span v-if="imageSearchFileName" class="upload-area__file">{{
          imageSearchFileName
        }}</span>
      </el-upload>
    </div>

    <div
      class="img-preview"
      :class="{ 'img-preview--error': !!uploadErrorMessage }"
      v-if="imageSearchPreview"
    >
      <el-button
        class="img-preview__remove"
        aria-label="删除已选图片"
        title="删除图片"
        @click="removeSelectedImage"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 7h16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
          <path
            d="M9 4h6"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
          <path
            d="M7 7v11a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
          <path
            d="M10 11v5M14 11v5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        </svg>
      </el-button>
      <div class="img-preview__image-wrap">
        <div
          v-if="uploading || uploadProgress > 0"
          class="img-preview__progress img-preview__progress--overlay"
        >
          <div class="img-preview__progress-track">
            <el-progress
              :percentage="uploadProgress"
              :status="
                uploadProgress === 100 && !uploading ? 'success' : undefined
              "
              :stroke-width="4"
              :show-text="false"
            />
          </div>
        </div>
        <img :src="imageSearchPreview" alt="preview" />
      </div>
      <p v-if="uploadedImageUrl" class="img-preview__uploaded">
        上传成功，已获取图片地址
      </p>
      <div v-if="uploadErrorMessage" class="img-preview__error">
        <span>{{ uploadErrorMessage }}</span>
        <el-button
          class="img-preview__retry"
          :disabled="uploading"
          @click="retryUpload"
        >
          重试上传
        </el-button>
      </div>
    </div>

    <template #footer>
      <div class="modal-actions">
        <el-button
          class="image-btn image-btn--ghost"
          :disabled="imageSearching"
          @click="onClose"
          >取消</el-button
        >
        <el-button
          class="image-btn image-btn--primary"
          :loading="imageSearching"
          :disabled="!canStartSearch"
          @click="runImageSearch"
        >
          {{ imageSearching ? '识别中...' : '开始搜索' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { UploadProps } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import { uploadImageFile } from '@/api/product';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [payload: { imageUrl: string }];
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const viewportWidth = ref<number>(
  typeof window === 'undefined' ? 1024 : window.innerWidth,
);
const dialogWidth = computed<string>(() => {
  if (viewportWidth.value <= 420) return '96vw';
  if (viewportWidth.value <= 768) return '94vw';
  return '520px';
});

const imageSearchPreview = ref<string>('');
const imageSearchFileName = ref<string>('');
const uploadedImageUrl = ref<string>('');
const imageSearching = ref<boolean>(false);
const uploading = ref<boolean>(false);
const uploadProgress = ref<number>(0);
const uploadErrorMessage = ref<string>('');
const selectedImageFile = ref<File | null>(null);
let previewObjectUrl: string | null = null;

const canStartSearch = computed<boolean>(
  () =>
    !imageSearching.value &&
    !uploading.value &&
    !!imageSearchFileName.value &&
    !!imageSearchPreview.value &&
    !!uploadedImageUrl.value,
);

const resetState = (): void => {
  imageSearchFileName.value = '';
  imageSearchPreview.value = '';
  uploadedImageUrl.value = '';
  imageSearching.value = false;
  uploading.value = false;
  uploadProgress.value = 0;
  uploadErrorMessage.value = '';
  selectedImageFile.value = null;
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = '';
  }
};

const applySelectedFile = async (file: File): Promise<boolean> => {
  selectedImageFile.value = file;
  const okType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
  if (!okType) {
    uploadErrorMessage.value = '仅支持 JPG / PNG / WEBP 图片';
    ElMessage.error('仅支持 JPG / PNG / WEBP 图片');
    return false;
  }
  const okSize = file.size / 1024 / 1024 <= 5;
  if (!okSize) {
    uploadErrorMessage.value = '图片不能超过 5MB';
    ElMessage.error('图片不能超过 5MB');
    return false;
  }
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = URL.createObjectURL(file);
  imageSearchFileName.value = file.name;
  imageSearchPreview.value = previewObjectUrl;
  uploadedImageUrl.value = '';
  uploadProgress.value = 0;
  uploadErrorMessage.value = '';
  uploading.value = true;
  try {
    const uploadRes = await uploadImageFile(file, (percent) => {
      uploadProgress.value = percent;
    });
    if (uploadRes?.success === false) {
      uploadErrorMessage.value = '图片上传失败，请重试';
      ElMessage.error('图片上传失败，请重试');
      return false;
    }
    const imageUrl =
      typeof uploadRes?.data === 'string'
        ? uploadRes.data
        : (uploadRes?.data?.imageUrl ??
          uploadRes?.data?.url ??
          uploadRes?.data?.fileUrl);
    if (!imageUrl) {
      uploadErrorMessage.value = '上传成功但未返回图片地址';
      ElMessage.error('上传成功但未返回图片地址');
      return false;
    }
    uploadedImageUrl.value = imageUrl;
    uploadErrorMessage.value = '';
    uploadProgress.value = 100;
  } catch {
    uploadedImageUrl.value = '';
    uploadProgress.value = 0;
    uploadErrorMessage.value = '图片上传失败，请重试';
    ElMessage.error('图片上传失败，请重试');
    return false;
  } finally {
    uploading.value = false;
  }
  return true;
};

const retryUpload = async (): Promise<void> => {
  if (!selectedImageFile.value || uploading.value) return;
  await applySelectedFile(selectedImageFile.value);
};

const beforeUpload: UploadProps['beforeUpload'] = (): boolean => {
  return false;
};

const onUploadChange: UploadProps['onChange'] = async (
  uploadFile,
): Promise<void> => {
  const rawFile = uploadFile.raw as File | undefined;
  if (!rawFile) return;
  await applySelectedFile(rawFile);
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

onUnmounted(() => {
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
});

const syncViewportWidth = (): void => {
  viewportWidth.value = window.innerWidth;
};

onMounted(() => {
  syncViewportWidth();
  window.addEventListener('resize', syncViewportWidth, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener('resize', syncViewportWidth);
});
</script>

<style scoped lang="scss">
.image-search__hint {
  margin: 0;
  color: color-mix(in srgb, var(--color-zinc-text) 90%, #fff);
  font-size: 13px;
  line-height: 1.5;
  font-weight: 500;
  background: color-mix(
    in srgb,
    var(--color-cockpit-bg-mid-97) 92%,
    var(--color-primary-amber-06)
  );
  border: 1px solid
    color-mix(in srgb, var(--color-primary-amber-16) 60%, transparent);
  border-radius: 8px;
  padding: 9px 12px;
  box-shadow: none;
}

.image-search__panel {
  display: grid;
  gap: 8px;
}

.upload-area {
  width: 100%;
}

:deep(.upload-area .el-upload) {
  width: 100%;
}

:deep(.upload-area .el-upload-dragger) {
  border: 1px dashed
    color-mix(in srgb, var(--color-primary-amber-35) 72%, transparent);
  border-radius: 10px;
  padding: 1rem;
  text-align: center;
  background: color-mix(
    in srgb,
    var(--color-cockpit-bg-mid-97) 94%,
    var(--color-primary-amber-05)
  );
  color: var(--color-zinc-text);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

:deep(.upload-area:hover .el-upload-dragger) {
  border-color: var(--color-primary-amber-45);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--color-primary-amber-20) 56%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

:deep(.upload-area.is-dragover .el-upload-dragger) {
  border-color: var(--color-primary-amber-55);
  box-shadow:
    0 10px 20px
      color-mix(in srgb, var(--color-primary-amber-18) 56%, transparent),
    inset 0 0 0 1px var(--color-primary-amber-24);
}

.upload-area__icon {
  width: 42px;
  height: 42px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  color: color-mix(in srgb, var(--color-primary-amber) 88%, #fff);
  font-size: 18px;
  background: color-mix(
    in srgb,
    var(--color-primary-amber-16) 66%,
    rgba(255, 255, 255, 0.06)
  );
  border: 1px solid var(--color-primary-amber-30);
  box-shadow:
    0 4px 10px
      color-mix(in srgb, var(--color-primary-amber-16) 52%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

.upload-area__icon :deep(.el-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.upload-area__title {
  font-size: 13px;
  font-weight: 650;
  letter-spacing: 0.01em;
  color: color-mix(in srgb, var(--color-zinc-text) 96%, #fff);
}

.upload-area__file {
  margin-top: 8px;
  padding: 3px 11px;
  border-radius: 8px;
  border: 1px solid var(--color-primary-amber-26);
  background: color-mix(
    in srgb,
    var(--color-cockpit-bg-mid-97) 82%,
    var(--color-primary-amber-12)
  );
  color: color-mix(in srgb, var(--color-zinc-text) 94%, #fff);
  font-size: 12px;
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-area small {
  display: block;
  margin-top: 0.45rem;
  color: color-mix(
    in srgb,
    var(--color-zinc-text) 72%,
    var(--color-zinc-muted)
  );
  font-size: 12px;
}

.img-preview {
  position: relative;
  margin-top: 0.8rem;
  border: 1px solid var(--color-primary-amber-24);
  border-radius: 10px;
  padding: 0.75rem;
  text-align: center;
  background: color-mix(
    in srgb,
    var(--color-cockpit-bg-mid-97) 93%,
    var(--color-primary-amber-06)
  );
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);

  &__image-wrap {
    position: relative;
    display: inline-block;
    max-width: 100%;
    z-index: 0;
  }

  img {
    max-width: 100%;
    max-height: 180px;
    border-radius: 8px;
    object-fit: contain;
    border: 1px solid var(--color-primary-amber-20);
    background:
      radial-gradient(
        circle at 30% 20%,
        var(--color-primary-amber-16) 0%,
        var(--color-primary-amber-06) 42%,
        transparent 80%
      ),
      color-mix(in srgb, var(--color-cockpit-bg-mid-97) 72%, transparent);
    position: relative;
    z-index: 0;
  }

  p {
    margin: 0.5rem 0 0;
    color: color-mix(in srgb, var(--color-zinc-text) 86%, #fff);
    font-size: 12px;
    word-break: break-all;
  }
}

.img-preview--error {
  border-color: color-mix(in srgb, #ef4444 48%, var(--color-primary-amber-35));
  box-shadow:
    0 0 0 1px color-mix(in srgb, #ef4444 34%, transparent),
    0 10px 22px color-mix(in srgb, #ef4444 18%, transparent);
}

.img-preview__remove {
  --el-button-bg-color: color-mix(
    in srgb,
    var(--color-cockpit-bg-mid-97) 88%,
    var(--color-primary-amber-08)
  );
  --el-button-border-color: var(--color-primary-amber-20);
  --el-button-text-color: var(--color-primary-amber-70);
  --el-button-hover-bg-color: var(--color-primary-amber-85);
  --el-button-hover-border-color: var(--color-primary-amber);
  --el-button-hover-text-color: #fff;
  --el-button-disabled-bg-color: color-mix(
    in srgb,
    var(--color-cockpit-bg-mid-97) 88%,
    var(--color-primary-amber-08)
  );
  --el-button-disabled-border-color: var(--color-primary-amber-20);
  --el-button-disabled-text-color: var(--color-primary-amber-45);
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 4;
  width: 28px;
  height: 28px;
  border: 1px solid var(--color-primary-amber-20);
  border-radius: 7px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    color 0.14s ease,
    border-color 0.14s ease,
    background-color 0.14s ease,
    box-shadow 0.14s ease,
    transform 0.14s ease;
}

.img-preview__remove svg {
  width: 15px;
  height: 15px;
}

.img-preview__remove:hover {
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
  transform: translateY(-1px);
}

.img-preview__uploaded {
  color: color-mix(in srgb, var(--color-primary-amber) 84%, #fff);
  font-weight: 600;
  text-shadow: 0 0 10px var(--color-primary-amber-16);
}

.img-preview__error {
  margin-top: 0.45rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  color: color-mix(in srgb, #fecaca 88%, #fff);
}

.img-preview__retry {
  --el-button-bg-color: color-mix(
    in srgb,
    #7f1d1d 44%,
    var(--color-cockpit-bg-mid-97)
  );
  --el-button-border-color: color-mix(
    in srgb,
    #f87171 70%,
    var(--color-primary-amber-35)
  );
  --el-button-text-color: #fff;
  --el-button-hover-bg-color: color-mix(
    in srgb,
    #991b1b 54%,
    var(--color-cockpit-bg-mid-97)
  );
  --el-button-hover-border-color: color-mix(
    in srgb,
    #fca5a5 76%,
    var(--color-primary-amber-42)
  );
  --el-button-hover-text-color: #fff;
  height: 24px;
  padding: 0 9px;
  border-radius: 7px;
  font-size: 12px;
  cursor: pointer;
}

.img-preview__retry:hover:not(:disabled) {
  transform: translateY(-1px);
}

.img-preview__retry:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.img-preview__progress {
  margin-top: 10px;
}

.img-preview__progress--overlay {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  margin-top: 0;
  z-index: 2;
}

.img-preview__progress-track {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  padding: 0;
}

.img-preview__upload-status {
  color: color-mix(in srgb, var(--color-zinc-text) 82%, #fff);
  font-size: 11px;
}

:deep(.img-preview__progress .el-progress-bar__outer) {
  border-radius: 0;
  background: color-mix(in srgb, var(--color-cockpit-bg-mid-97) 70%, black 30%);
}

:deep(.img-preview__progress .el-progress-bar__inner) {
  border-radius: 0;
  background: linear-gradient(
    90deg,
    var(--color-primary-amber-55) 0%,
    var(--color-primary-amber) 100%
  );
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.55rem;
}

.image-btn {
  min-width: 92px;
  border-radius: 8px;
  height: 34px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.image-btn--ghost {
  --el-button-bg-color: #ffffff;
  --el-button-border-color: #d4d4d8;
  --el-button-text-color: #3f3f46;
  --el-button-hover-bg-color: #fafafa;
  --el-button-hover-border-color: #a1a1aa;
  --el-button-hover-text-color: #18181b;
  --el-button-active-bg-color: #f4f4f5;
  --el-button-active-border-color: #a1a1aa;
  box-shadow: none;
  color: #3f3f46 !important;
}

:deep(.image-btn--ghost.el-button) {
  background: #ffffff !important;
  border-color: #d4d4d8 !important;
}

:deep(.image-btn--ghost.el-button:hover) {
  background: #fafafa !important;
  border-color: #a1a1aa !important;
}

:deep(.image-btn--ghost.el-button:active) {
  background: #f4f4f5 !important;
  border-color: #a1a1aa !important;
}

:deep(.image-btn--ghost.is-disabled),
:deep(.image-btn--ghost.is-disabled:hover) {
  opacity: 0.55;
  box-shadow: none;
  color: color-mix(in srgb, #fff 62%, var(--color-zinc-muted)) !important;
}

:deep(.image-btn--ghost > span) {
  color: var(--color-zinc-text) !important;
  font-weight: 600;
}

:deep(.image-btn--ghost:hover > span) {
  color: var(--color-zinc-text) !important;
}

.image-btn--primary {
  --el-button-bg-color: #18181b;
  --el-button-border-color: #18181b;
  --el-button-text-color: #fff;
  --el-button-hover-bg-color: #27272a;
  --el-button-hover-border-color: #27272a;
  --el-button-hover-text-color: #fff;
  --el-button-active-bg-color: #3f3f46;
  --el-button-active-border-color: #3f3f46;
  --el-button-active-text-color: #fff;
  box-shadow: none;
  color: #fff !important;
}

:deep(.image-btn--primary.el-button) {
  background: #18181b !important;
  border-color: #18181b !important;
}

:deep(.image-btn--primary.el-button:hover) {
  background: #27272a !important;
  border-color: #27272a !important;
}

:deep(.image-btn--primary.el-button:active) {
  background: #3f3f46 !important;
  border-color: #3f3f46 !important;
}

:deep(.image-btn--primary.is-disabled),
:deep(.image-btn--primary.is-disabled:hover) {
  --el-button-bg-color: #e4e4e7;
  --el-button-border-color: #d4d4d8;
  --el-button-text-color: #52525b;
  box-shadow: none;
  color: #52525b !important;
}

:deep(.image-btn--ghost.el-button.is-disabled),
:deep(.image-btn--ghost.el-button.is-disabled:hover) {
  background: color-mix(
    in srgb,
    var(--color-cockpit-bg-mid-97) 90%,
    var(--color-primary-amber-06)
  ) !important;
  border-color: var(--color-primary-amber-24) !important;
}

:deep(.image-btn--primary.el-button.is-disabled),
:deep(.image-btn--primary.el-button.is-disabled:hover) {
  background: #e4e4e7 !important;
  border-color: #d4d4d8 !important;
}

:deep(.image-btn.el-button) {
  transition:
    transform 0.14s ease,
    box-shadow 0.14s ease,
    border-color 0.14s ease,
    background-color 0.14s ease;
}

:deep(.image-btn.el-button:hover) {
  transform: none;
}

:deep(.image-btn.el-button:active) {
  transform: translateY(0);
}

:deep(.image-btn--primary > span),
:deep(.image-btn--primary:hover > span),
:deep(.image-btn--primary:active > span) {
  color: #fff !important;
}

@media (max-width: 768px) {
  :deep(.image-search-dialog.el-dialog) {
    width: 94vw !important;
    max-width: 94vw !important;
  }

  .image-search__hint {
    font-size: 12px;
    padding: 9px 11px;
    border-radius: 8px;
  }

  :deep(.upload-area .el-upload-dragger) {
    padding: 1rem 0.9rem 0.9rem;
    border-radius: 10px;
  }

  .upload-area__icon {
    width: 46px;
    height: 46px;
    margin-bottom: 8px;
    font-size: 20px;
  }

  .upload-area__title {
    font-size: 13px;
  }

  .img-preview {
    margin-top: 0.8rem;
    border-radius: 10px;
    padding: 0.75rem;
  }

  .img-preview img {
    max-height: 180px;
    border-radius: 8px;
  }

  .img-preview__error {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .img-preview__retry {
    width: 100%;
    height: 30px;
  }

  .modal-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    width: 100%;
  }

  .image-btn {
    width: 100%;
    min-width: 0;
    height: 36px;
    border-radius: 8px;
  }
}

@media (max-width: 420px) {
  :deep(.image-search-dialog.el-dialog) {
    width: 96vw !important;
    max-width: 96vw !important;
  }

  .image-search__panel {
    gap: 8px;
  }

  .image-search__hint {
    font-size: 11px;
    line-height: 1.45;
    padding: 8px 9px;
    border-radius: 7px;
  }

  :deep(.upload-area .el-upload-dragger) {
    padding: 0.85rem 0.75rem 0.78rem;
    border-radius: 8px;
  }

  .upload-area__icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }

  .upload-area__title {
    font-size: 12px;
  }

  .upload-area small {
    font-size: 11px;
  }

  .upload-area__file {
    max-width: 100%;
    font-size: 11px;
  }

  .img-preview {
    padding: 0.65rem;
    border-radius: 8px;
  }

  .img-preview img {
    max-height: 148px;
    border-radius: 7px;
  }

  .img-preview__remove {
    top: 7px;
    right: 7px;
    width: 24px;
    height: 24px;
    border-radius: 6px;
  }

  .img-preview__remove svg {
    width: 13px;
    height: 13px;
  }

  .img-preview p {
    font-size: 11px;
  }

  .modal-actions {
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .image-btn {
    height: 34px;
    border-radius: 7px;
    font-size: 12px;
  }
}
</style>
