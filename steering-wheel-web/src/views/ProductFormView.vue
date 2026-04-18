<template>
  <div class="product-list product-create">
    <TopBar
      :is-home="route.name === 'home' || route.name === 'productDetail' || route.name === 'productEdit'"
      :is-product-create="route.name === 'productCreate'"
    />

    <div class="product-list__main">
      <div class="product-create__content">
        <AppBreadcrumb
          class="product-create__breadcrumb"
          :current-label="isEdit ? '编辑产品' : '上架产品'"
        />
        <div class="product-create__panel">
          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-position="top"
          >
            <el-form-item
              label="产品图片"
              prop="images"
              class="product-create__images-item"
            >
              <el-upload
                class="product-create__upload"
                v-model:file-list="uploadFiles"
                list-type="picture-card"
                drag
                :auto-upload="false"
                :show-file-list="false"
                :limit="5"
                accept="image/jpeg,image/png"
                :before-upload="beforeImageUpload"
                :on-change="onUploadChange"
                :on-exceed="onUploadExceed"
              >
                <div class="product-create__upload-icon">
                  <el-icon><UploadFilled /></el-icon>
                </div>
                <div class="product-create__upload-title">点击或拖拽上传产品图片</div>
                <p class="product-create__upload-hint">
                  支持 JPG、PNG，单张最大 5MB，最多 5 张
                </p>
              </el-upload>
              <div
                v-if="uploadFiles.length > 0"
                class="product-create__upload-list"
              >
                <div
                  v-for="(file, index) in uploadFiles"
                  :key="file.uid || file.name || index"
                  class="product-create__upload-item"
                >
                  <img
                    v-if="file.url"
                    :src="file.url"
                    :alt="file.name || `产品图${index + 1}`"
                  />
                  <div class="product-create__upload-item-mask">
                    <el-button
                      class="product-create__upload-action product-create__upload-action--preview"
                      @click="onUploadPreview(file)"
                    >
                      预览
                    </el-button>
                    <el-button
                      class="product-create__upload-action product-create__upload-action--delete"
                      @click="removeUploadByIndex(index)"
                    >
                      删除
                    </el-button>
                  </div>
                  <div
                    v-if="isFileUploading(file)"
                    class="product-create__upload-progress"
                  >
                    <div class="product-create__upload-progress-text">
                      上传中 {{ getFileUploadProgress(file) }}%
                    </div>
                    <el-progress
                      :percentage="getFileUploadProgress(file)"
                      :stroke-width="4"
                      :show-text="false"
                      :indeterminate="getFileUploadProgress(file) <= 0"
                      status="warning"
                    />
                  </div>
                  <div
                    v-else-if="getFileUploadError(file)"
                    class="product-create__upload-error"
                  >
                    {{ getFileUploadError(file) }}
                  </div>
                </div>
              </div>
            </el-form-item>

            <el-row :gutter="16">
              <el-col :xs="24" :md="24">
                <el-form-item label="产品名称" prop="name">
                  <el-input
                    v-model="form.name"
                    placeholder="例如：智能方向盘 Pro"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="16">
              <el-col :xs="24" :md="12">
                <el-form-item label="品牌" prop="brand">
                  <el-input
                    v-model="form.brand"
                    placeholder="例如：OmniSteer"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="型号" prop="model">
                  <el-input
                    v-model="form.model"
                    placeholder="例如：OS-PRO-11"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="16">
              <el-col :xs="24" :md="12">
                <el-form-item label="价格（元）" prop="price">
                  <el-input-number
                    class="product-create__price-input"
                    v-model="form.price"
                    :min="1"
                    :step="100"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="状态" prop="state">
                  <el-select
                    v-model="form.state"
                    class="product-create__status-select"
                    popper-class="product-create-status-popper"
                    placeholder="请选择状态"
                    style="width: 100%"
                  >
                    <el-option label="在售" value="UP" />
                    <el-option label="下架" value="DOWN" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="产品描述">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="4"
                placeholder="输入产品亮点、适配车型、材质等信息..."
              />
            </el-form-item>

            <div class="product-create__actions">
              <div class="product-create__actions-meta">
                <span class="product-create__actions-title">{{
                  actionTitle
                }}</span>
                <span class="product-create__actions-sub">{{
                  actionHint
                }}</span>
              </div>
              <div class="product-create__actions-buttons">
                <el-button
                  class="action-btn action-btn--secondary"
                  :class="{ 'product-create__btn-cancel--edit': isEdit }"
                  @click="router.push('/products')"
                >
                  取消
                </el-button>
                <el-button
                  type="primary"
                  class="action-btn action-btn--primary"
                  :loading="loading"
                  :disabled="isSubmitDisabled"
                  @click="submit"
                >
                  {{ submitText }}
                </el-button>
              </div>
            </div>
          </el-form>
        </div>
      </div>
    </div>
    <el-dialog
      v-model="previewVisible"
      class="product-create__preview-dialog"
      modal-class="product-create__preview-modal"
      title="图片预览"
      width="min(720px, 92vw)"
      :close-on-click-modal="true"
      append-to-body
    >
      <img
        v-if="previewImageUrl"
        :src="previewImageUrl"
        class="product-create__preview-image"
        alt="产品图片预览"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import type {
  FormInstance,
  FormRules,
  UploadProps,
  UploadUserFile,
} from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import type { ProductFormData, ProductOut } from '@/types/product';
import { ProductStatusEnum } from '@/enums/product';
import { normalizeProductStateFromOut } from '@/utils/common';
import {
  getProductDetail,
  saveOrUpdateProduct,
  uploadImageFile,
} from '@/api/product';
import { isRequestCanceled, RequestError } from '@/utils/request';
import AppBreadcrumb from '@/components/AppBreadcrumb.vue';
import TopBar from '@/components/topBar.vue';

const router = useRouter();
const route = useRoute();

const formRef = ref<FormInstance>();
const loading = ref<boolean>(false);
const uploadingCount = ref<number>(0);
const isEdit = computed<boolean>(() => Boolean(route.params.id));
const submitText = computed<string>(() =>
  isEdit.value ? '保存修改' : '提交上架',
);
const actionTitle = computed<string>(() =>
  isEdit.value ? '确认保存本次修改' : '准备提交上架',
);
const actionHint = computed<string>(() =>
  uploadingCount.value > 0
    ? `图片上传中（${uploadingCount.value}）张，请等待上传完成后提交`
    : isEdit.value
      ? '更新后将立即覆盖当前产品信息'
      : '提交后将在产品列表展示新商品',
);
const isSubmitDisabled = computed<boolean>(() =>
  loading.value || uploadingCount.value > 0,
);

const getUploadFileKey = (file: UploadUserFile): string => {
  return String(file.uid ?? file.name ?? '');
};

const uploadProgressMap = reactive<Record<string, number>>({});
const uploadErrorMap = reactive<Record<string, string>>({});
const uploadRequestMap = reactive<Record<string, number>>({});

const clearUploadStateByKey = (key: string): void => {
  delete uploadProgressMap[key];
  delete uploadErrorMap[key];
  delete uploadRequestMap[key];
};

const normalizeUploadedImageUrl = (uploadRes: unknown): string => {
  const res = uploadRes as
    | { data?: string | { imageUrl?: string; url?: string; fileUrl?: string } }
    | undefined;
  if (!res?.data) return '';
  if (typeof res.data === 'string') return res.data;
  return res.data.imageUrl ?? res.data.url ?? res.data.fileUrl ?? '';
};

const isFileUploading = (file: UploadUserFile): boolean => {
  const key = getUploadFileKey(file);
  return Boolean(key && uploadRequestMap[key]);
};

const getFileUploadProgress = (file: UploadUserFile): number => {
  const key = getUploadFileKey(file);
  return key ? uploadProgressMap[key] ?? 0 : 0;
};

const getFileUploadError = (file: UploadUserFile): string => {
  const key = getUploadFileKey(file);
  return key ? uploadErrorMap[key] ?? '' : '';
};

const uploadImageAndSync = async (uploadFile: UploadUserFile): Promise<void> => {
  if (!uploadFile.raw) return;
  const key = getUploadFileKey(uploadFile);
  if (!key) return;

  if (uploadRequestMap[key]) {
    return;
  }

  const currentRequestId = Date.now();
  uploadRequestMap[key] = currentRequestId;
  uploadProgressMap[key] = 0;
  delete uploadErrorMap[key];
  uploadingCount.value += 1;

  try {
    const uploadRes = await uploadImageFile(uploadFile.raw, (percent): void => {
      if (uploadRequestMap[key] !== currentRequestId) return;
      uploadProgressMap[key] = percent;
    });
    if (uploadRequestMap[key] !== currentRequestId) {
      return;
    }
    if ((uploadRes as { success?: boolean } | undefined)?.success === false) {
      uploadErrorMap[key] = '图片上传失败，请重试';
      return;
    }
    const uploadedUrl = normalizeUploadedImageUrl(uploadRes);
    if (!uploadedUrl) {
      uploadErrorMap[key] = '上传成功但未返回图片地址';
      return;
    }
    if (uploadFile.url && imageObjectUrls.has(uploadFile.url)) {
      URL.revokeObjectURL(uploadFile.url);
      imageObjectUrls.delete(uploadFile.url);
    }
    uploadFile.url = uploadedUrl;
    uploadProgressMap[key] = 100;
    delete uploadErrorMap[key];
  } catch (e) {
    if (isRequestCanceled(e)) return;
    uploadErrorMap[key] = '上传失败，请重新选择图片';
  } finally {
    if (uploadRequestMap[key] === currentRequestId) {
      delete uploadRequestMap[key];
    }
    if (uploadingCount.value > 0) {
      uploadingCount.value -= 1;
    }
    syncFormImages();
  }
};

const form = reactive<ProductFormData>({
  name: '',
  brand: '',
  model: '',
  price: 0,
  state: ProductStatusEnum.UP,
  description: '',
  images: [] as string[],
});

const rules: FormRules = {
  name: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
  brand: [{ required: true, message: '请输入品牌', trigger: 'blur' }],
  model: [{ required: true, message: '请输入型号', trigger: 'blur' }],
  price: [
    { required: true, message: '请输入价格', trigger: 'blur' },
    { type: 'number', min: 1, message: '价格必须大于 0', trigger: 'blur' },
  ],
  images: [
    {
      type: 'array',
      required: true,
      min: 1,
      message: '请至少上传 1 张产品图片',
      trigger: 'change',
    },
  ],
};

const uploadFiles = ref<UploadUserFile[]>([]);
const imageObjectUrls = new Set<string>();
const previewVisible = ref<boolean>(false);
const previewImageUrl = ref<string>('');

const syncFormImages = (): void => {
  form.images = uploadFiles.value
    .map((f) => f.url)
    .filter(
      (url): url is string =>
        typeof url === 'string' &&
        Boolean(url) &&
        !url.startsWith('blob:') &&
        !url.startsWith('data:'),
    );
};

const beforeImageUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const isImage = ['image/jpeg', 'image/png'].includes(rawFile.type);
  if (!isImage) {
    ElMessage.error('仅支持 JPG / PNG 图片');
    return false;
  }
  const isLt5M = rawFile.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    ElMessage.error('单张图片不能超过 5MB');
    return false;
  }
  return true;
};

const onUploadExceed: UploadProps['onExceed'] = () => {
  ElMessage.warning('最多上传 5 张图片');
};

const onUploadChange: UploadProps['onChange'] = (uploadFile) => {
  if (!uploadFile.raw) {
    syncFormImages();
    return;
  }
  const key = getUploadFileKey(uploadFile);
  if (!key) return;
  clearUploadStateByKey(key);
  const objectUrl = URL.createObjectURL(uploadFile.raw);
  imageObjectUrls.add(objectUrl);
  uploadFile.url = objectUrl;
  syncFormImages();
  void uploadImageAndSync(uploadFile);
};

const onUploadRemove = (uploadFile: UploadUserFile): void => {
  const key = getUploadFileKey(uploadFile);
  if (key) clearUploadStateByKey(key);
  if (uploadFile.url && imageObjectUrls.has(uploadFile.url)) {
    URL.revokeObjectURL(uploadFile.url);
    imageObjectUrls.delete(uploadFile.url);
  }
  syncFormImages();
};

const removeUploadByIndex = (index: number): void => {
  const file = uploadFiles.value[index];
  if (!file) return;
  uploadFiles.value.splice(index, 1);
  onUploadRemove(file);
};

const fillFormByDetail = (detail: ProductOut): void => {
  form.name = detail.name;
  form.brand = detail.brand;
  form.model = detail.model;
  form.price = detail.price;
  form.state = normalizeProductStateFromOut(detail);
  form.description = detail.description || '';
  uploadFiles.value = (detail.images || []).map(
      (url, idx): UploadUserFile => ({
        name: `image-${idx + 1}`,
        url,
      }),
    );
  syncFormImages();
};

const loadEditDetail = async (): Promise<void> => {
  if (!isEdit.value) return;
  const routeId = route.params.id;
  const rawId = Array.isArray(routeId) ? routeId[0] : routeId;
  const productId = String(rawId ?? '').trim();
  if (!productId?.trim()) {
    ElMessage.error('产品 ID 无效');
    await router.replace('/');
    return;
  }
  loading.value = true;
  try {
    const detail = await getProductDetail(productId);
    fillFormByDetail(detail);
  } catch (e) {
    if (isRequestCanceled(e)) return;
    if (e instanceof RequestError && e.status === 404) {
      ElMessage.error('产品不存在或已删除');
      await router.replace('/');
      return;
    }
    if (e instanceof RequestError && e.isNotified) return;
    const msg = e instanceof RequestError ? e.message : '加载产品详情失败，请稍后重试';
    ElMessage.error(msg);
  } finally {
    loading.value = false;
  }
};

const onUploadPreview = (uploadFile: UploadUserFile): void => {
  if (!uploadFile.url) {
    ElMessage.warning('当前图片暂不可预览');
    return;
  }
  previewImageUrl.value = uploadFile.url;
  previewVisible.value = true;
};

const submit = async (): Promise<void> => {
  if (uploadingCount.value > 0) {
    ElMessage.warning('图片上传中，请等待上传完成后再提交');
    return;
  }
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  loading.value = true;
  try {
    const images = [...form.images];
    const payload = {
      name: form.name,
      brand: form.brand,
      model: form.model,
      price: form.price,
      state: form.state,
      description: form.description || undefined,
      images,
      ...(isEdit.value ? { id: String(route.params.id) } : {}),
    };
    await saveOrUpdateProduct(payload);
    if (isEdit.value) {
      ElMessage.success('产品修改成功');
      await router.push('/products');
      return;
    }
    ElMessage.success('产品创建成功');
    await router.push('/');
  } catch (e) {
    if (isRequestCanceled(e)) return;
    if (e instanceof RequestError && e.status === 401) {
      ElMessage.warning('登录已过期，请重新登录');
      await router.replace({
        name: 'login',
        query: { redirect: route.fullPath },
      });
      return;
    }
    if (e instanceof RequestError && e.isNotified) return;
    const msg = e instanceof RequestError ? e.message : '提交失败，请稍后重试';
    ElMessage.error(msg);
  } finally {
    loading.value = false;
  }
};

onMounted((): void => {
  void loadEditDetail();
});

onUnmounted((): void => {
  imageObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  imageObjectUrls.clear();
});
</script>

<style scoped lang="scss">
.product-create {
  --product-create-field-height: 40px;

  position: relative;
  min-height: 100vh;
  color: v.$zinc-text;
  background:
    radial-gradient(
      1200px 420px at 50% -140px,
      var(--color-primary-amber-20) 0%,
      var(--color-primary-amber-08) 45%,
      transparent 78%
    ),
    linear-gradient(
      168deg,
      v.$cockpit-bg-top 0%,
      v.$cockpit-bg-mid 48%,
      v.$cockpit-bg-bottom 100%
    );

  &__content {
    position: relative;
    max-width: 980px;
    margin: 0 auto;
  }

  &__breadcrumb {
    margin: 8px 0 18px;
    padding: 0 2px;
  }

  &__panel {
    border-radius: 12px;
    border: 1px solid var(--color-primary-amber-24);
    padding: 1rem;
    background: linear-gradient(
      145deg,
      v.$panel-bg 0%,
      var(--color-cockpit-bg-mid-96) 100%
    );
    box-shadow:
      0 14px 30px color-mix(in srgb, var(--color-cockpit-bg-mid-97) 72%, transparent),
      0 1px 0 rgba(255, 255, 255, 0.08) inset;
  }

  &__images-item {
    margin-bottom: 18px;
  }

  &__upload-hint {
    margin: 10px 2px 0;
    font-size: 12px;
    color: color-mix(in srgb, var(--color-zinc-muted) 84%, #fff);
    line-height: 1.4;
  }

  &__actions {
    margin-top: 6px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid var(--color-primary-amber-20);
    background: linear-gradient(
      160deg,
      color-mix(in srgb, var(--color-cockpit-bg-mid-97) 90%, var(--color-primary-amber-08)) 0%,
      color-mix(in srgb, var(--color-cockpit-bg-mid-97) 84%, var(--color-primary-amber-12)) 100%
    );
    box-shadow:
      0 8px 18px var(--color-primary-amber-10),
      0 1px 0 rgba(255, 255, 255, 0.08) inset;
  }

  &__actions-meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__actions-title {
    font-size: 14px;
    font-weight: 650;
    color: color-mix(in srgb, var(--color-zinc-text) 94%, #fff);
    letter-spacing: 0.01em;
  }

  &__actions-sub {
    margin-top: 2px;
    font-size: 12px;
    color: color-mix(in srgb, var(--color-zinc-muted) 86%, #fff);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__actions-buttons {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  :deep(.action-btn) {
    min-width: 104px;
    height: 36px;
    border-radius: var(--el-border-radius-base, 4px);
    font-size: 13px;
    font-weight: 500;
    box-shadow: none !important;
    transition:
      border-color 0.14s ease,
      background-color 0.14s ease,
      color 0.14s ease !important;
  }

  :deep(.action-btn--secondary) {
    border: 1px solid var(--color-primary-amber-26) !important;
    background: color-mix(in srgb, var(--color-cockpit-bg-mid-97) 96%, transparent) !important;
    color: var(--color-zinc-text) !important;
  }

  :deep(.action-btn--secondary:hover),
  :deep(.action-btn--secondary:focus-visible) {
    border-color: var(--color-primary-amber-34) !important;
    background: color-mix(in srgb, var(--color-cockpit-bg-mid-97) 94%, transparent) !important;
    color: var(--color-zinc-text) !important;
    box-shadow: none !important;
  }

  :deep(.action-btn--primary) {
    border: 1px solid #18181b !important;
    background: #18181b !important;
    color: #ffffff !important;
  }

  :deep(.action-btn--primary:hover),
  :deep(.action-btn--primary:focus-visible) {
    border-color: #27272a !important;
    background: #27272a !important;
    color: #ffffff !important;
    box-shadow: none !important;
  }

  :deep(.action-btn--primary.is-disabled),
  :deep(.action-btn--primary.is-disabled:hover) {
    border-color: #a1a1aa !important;
    background: #a1a1aa !important;
    color: #fafafa !important;
    box-shadow: none !important;
  }

  &__btn-cancel--edit:hover,
  &__btn-cancel--edit:focus-visible {
    border-color: var(--color-primary-amber-34) !important;
    background: color-mix(in srgb, var(--color-cockpit-bg-mid-97) 94%, transparent) !important;
    color: var(--color-zinc-text) !important;
    box-shadow: none;
  }

  &__preview-image {
    width: 100%;
    max-height: 72vh;
    object-fit: contain;
    display: block;
    border-radius: 10px;
    border: 1px solid var(--color-primary-amber-20);
    background: rgba(0, 0, 0, 0.2);
  }
}

.product-list__main {
  flex: 1;
  box-sizing: border-box;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px 24px 40px;
}

:deep(.el-form-item__label) {
  color: color-mix(in srgb, var(--color-zinc-text) 92%, #fff);
  font-weight: 600;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-input-number .el-input__wrapper) {
  background: color-mix(
    in srgb,
    var(--color-cockpit-bg-mid-97) 94%,
    var(--color-primary-amber-06)
  ) !important;
  color: var(--color-zinc-text) !important;
  box-shadow: 0 0 0 1px var(--color-primary-amber-26) inset !important;
}

:deep(.el-input .el-input__wrapper) {
  min-height: var(--product-create-field-height) !important;
  height: var(--product-create-field-height) !important;
}

:deep(.el-input .el-input__inner) {
  height: 100% !important;
  line-height: calc(var(--product-create-field-height) - 2px) !important;
}

:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  color: var(--color-zinc-text) !important;
}

:deep(.el-input__inner::placeholder),
:deep(.el-textarea__inner::placeholder) {
  color: color-mix(in srgb, var(--color-zinc-muted) 78%, #fff) !important;
}

:deep(.el-input-number) {
  width: 100%;
  height: var(--product-create-field-height);
}

:deep(.el-input-number .el-input) {
  height: var(--product-create-field-height) !important;
}

:deep(.product-create__diameter-input .el-input__wrapper) {
  min-height: var(--product-create-field-height) !important;
  height: var(--product-create-field-height) !important;
}

:deep(.el-input-number .el-input__wrapper) {
  min-height: var(--product-create-field-height) !important;
  height: var(--product-create-field-height) !important;
  border-radius: 0 !important;
  box-shadow:
    inset 0 0 0 1px var(--color-primary-amber-34),
    inset 0 1px 0 rgba(255, 255, 255, 0.03) !important;
  transition:
    box-shadow 0.12s linear,
    background-color 0.12s linear !important;
}

:deep(.el-input-number:hover .el-input__wrapper) {
  box-shadow:
    inset 0 0 0 1px var(--color-primary-amber-46),
    inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
}

:deep(.el-input-number .el-input__wrapper.is-focus),
:deep(.el-input-number.is-controls-right .el-input__wrapper.is-focus) {
  background: color-mix(
    in srgb,
    var(--color-cockpit-bg-mid-97) 86%,
    var(--color-primary-amber-16)
  ) !important;
  box-shadow:
    inset 0 0 0 1px var(--color-primary-amber-62),
    0 0 0 1px color-mix(in srgb, var(--color-primary-amber-28) 55%, transparent) !important;
}

:deep(.el-input-number .el-input__inner) {
  color: color-mix(in srgb, var(--color-zinc-text) 96%, #fff) !important;
  font-weight: 600;
  letter-spacing: 0.2px;
  height: 100%;
  line-height: calc(var(--product-create-field-height) - 2px);
}

:deep(.el-input-number.is-disabled .el-input__wrapper) {
  background: color-mix(in srgb, var(--color-cockpit-bg-mid-97) 96%, transparent) !important;
  box-shadow: inset 0 0 0 1px var(--color-primary-amber-20) !important;
}

:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  color: color-mix(in srgb, var(--color-zinc-text) 92%, #fff) !important;
  background: color-mix(
    in srgb,
    var(--color-cockpit-bg-mid-97) 92%,
    var(--color-primary-amber-08)
  ) !important;
  border-color: color-mix(in srgb, var(--color-primary-amber-16) 22%, transparent) !important;
  width: 32px !important;
  font-size: 16px !important;
  font-weight: 800 !important;
  line-height: 1 !important;
  border-radius: 0 !important;
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--color-primary-amber-50) 78%, transparent),
    0 0 0 1px color-mix(in srgb, var(--color-cockpit-bg-low) 70%, transparent) !important;
  transition:
    color 0.12s linear,
    background-color 0.12s linear,
    border-color 0.12s linear,
    box-shadow 0.12s linear !important;
}

:deep(.el-input-number__decrease .el-icon),
:deep(.el-input-number__increase .el-icon) {
  font-size: 16px !important;
  font-weight: 800 !important;
}

:deep(.el-input-number.is-controls-right .el-input-number__decrease),
:deep(.el-input-number.is-controls-right .el-input-number__increase) {
  height: calc(var(--product-create-field-height) / 2) !important;
  line-height: calc(var(--product-create-field-height) / 2) !important;
}

:deep(.el-input-number__decrease:hover),
:deep(.el-input-number__increase:hover) {
  color: #fff !important;
  background: color-mix(
    in srgb,
    var(--color-primary-amber-70) 72%,
    var(--color-cockpit-bg-mid-97) 28%
  ) !important;
  border-color: color-mix(in srgb, var(--color-primary-amber-24) 32%, transparent) !important;
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--color-primary-amber-45) 46%, transparent),
    0 0 0 1px color-mix(in srgb, var(--color-primary-amber-35) 38%, transparent) !important;
}

:deep(.el-input-number__decrease:active),
:deep(.el-input-number__increase:active) {
  color: #fff !important;
  background: color-mix(
    in srgb,
    var(--color-primary-amber-80) 80%,
    var(--color-cockpit-bg-mid-97) 20%
  ) !important;
  box-shadow:
    inset 0 2px 0 rgba(0, 0, 0, 0.42),
    inset 0 0 0 1px color-mix(in srgb, var(--color-primary-amber-80) 55%, transparent) !important;
}

:deep(.el-input-number.is-controls-right .el-input-number__decrease),
:deep(.el-input-number.is-controls-right .el-input-number__increase) {
  border-left: 1px solid
    color-mix(in srgb, var(--color-primary-amber-12) 18%, transparent) !important;
}

:deep(.el-input-number.is-controls-right:hover .el-input-number__decrease),
:deep(.el-input-number.is-controls-right:hover .el-input-number__increase),
:deep(.el-input-number.is-controls-right .el-input__wrapper.is-focus + .el-input-number__increase),
:deep(.el-input-number.is-controls-right .el-input__wrapper.is-focus ~ .el-input-number__decrease) {
  border-left-color: color-mix(in srgb, var(--color-primary-amber-24) 32%, transparent) !important;
}

:deep(.el-input-number .is-disabled.el-input-number__decrease),
:deep(.el-input-number .is-disabled.el-input-number__increase) {
  color: color-mix(in srgb, var(--color-zinc-muted) 72%, #fff) !important;
  background: color-mix(in srgb, var(--color-cockpit-bg-mid-97) 92%, transparent) !important;
  border-color: var(--color-primary-amber-18) !important;
  box-shadow: none !important;
}

/* 价格输入框：与普通 input 保持一致的极简样式 */
:deep(.product-create__price-input.el-input-number .el-input__wrapper) {
  min-height: var(--product-create-field-height) !important;
  height: var(--product-create-field-height) !important;
  border-radius: var(--el-border-radius-base, 4px) !important;
  background: color-mix(
    in srgb,
    var(--color-cockpit-bg-mid-97) 94%,
    var(--color-primary-amber-06)
  ) !important;
  box-shadow: 0 0 0 1px var(--color-primary-amber-26) inset !important;
}

:deep(.product-create__price-input.el-input-number:hover .el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--color-primary-amber-30) inset !important;
}

:deep(.product-create__price-input.el-input-number .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--color-primary-amber-38) inset !important;
}

:deep(.product-create__price-input.el-input-number .el-input-number__decrease),
:deep(.product-create__price-input.el-input-number .el-input-number__increase) {
  background: transparent !important;
  border-color: color-mix(in srgb, var(--color-primary-amber-12) 42%, transparent) !important;
  color: color-mix(in srgb, var(--color-zinc-text) 78%, #fff) !important;
  border-radius: var(--el-border-radius-base, 4px) !important;
  box-shadow: none !important;
  transition:
    border-color 0.14s ease,
    color 0.14s ease,
    background-color 0.14s ease !important;
}

:deep(.product-create__price-input.el-input-number .el-input-number__decrease:hover),
:deep(.product-create__price-input.el-input-number .el-input-number__increase:hover) {
  background: color-mix(in srgb, var(--color-cockpit-bg-mid-97) 96%, transparent) !important;
  border-color: color-mix(in srgb, var(--color-primary-amber-18) 50%, transparent) !important;
  color: color-mix(in srgb, var(--color-zinc-text) 88%, #fff) !important;
  box-shadow: none !important;
}

:deep(.product-create__price-input.el-input-number .el-input-number__decrease:active),
:deep(.product-create__price-input.el-input-number .el-input-number__increase:active) {
  background: color-mix(in srgb, var(--color-cockpit-bg-mid-97) 94%, transparent) !important;
  border-color: color-mix(in srgb, var(--color-primary-amber-24) 56%, transparent) !important;
  color: color-mix(in srgb, var(--color-zinc-text) 92%, #fff) !important;
  box-shadow: none !important;
}

:deep(.el-segmented) {
  background: color-mix(
    in srgb,
    var(--color-cockpit-bg-mid-97) 84%,
    var(--color-primary-amber-12)
  );
}

:deep(.el-segmented__item-label) {
  color: color-mix(in srgb, var(--color-zinc-muted) 84%, #fff);
}

:deep(.el-segmented__item.is-selected .el-segmented__item-label) {
  color: color-mix(in srgb, var(--color-zinc-text) 92%, #fff);
  font-weight: 600;
}

:deep(.el-upload--picture-card) {
  width: 100% !important;
  min-height: 0;
  height: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  float: none !important;
  border-radius: 14px;
  border: 1px solid var(--color-primary-amber-24);
  background:
    radial-gradient(
      circle at 15% -20%,
      var(--color-primary-amber-18) 0%,
      transparent 46%
    ),
    radial-gradient(
      circle at 100% 120%,
      var(--color-primary-amber-10) 0%,
      transparent 56%
    ),
    color-mix(in srgb, var(--color-cockpit-bg-mid-97) 94%, var(--color-primary-amber-06));
  color: var(--color-primary-amber);
  transition:
    border-color 0.3s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.32s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
  box-shadow: 0 10px 22px
    color-mix(in srgb, var(--color-cockpit-bg-mid-97) 75%, transparent);
}

:deep(.el-upload--picture-card:hover) {
  border-color: var(--color-primary-amber-36);
  transform: translateY(-2px);
  box-shadow: 0 16px 30px var(--color-primary-amber-18);
}

.product-create__upload-icon {
  width: 52px;
  height: 52px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  color: color-mix(in srgb, var(--color-primary-amber) 88%, #fff);
  font-size: 22px;
  background: linear-gradient(
    160deg,
    color-mix(in srgb, #fff 62%, var(--color-primary-amber-24)) 0%,
    color-mix(in srgb, #fff 48%, var(--color-primary-amber-32)) 100%
  );
  border: 1px solid var(--color-primary-amber-35);
  box-shadow:
    0 6px 14px var(--color-primary-amber-16),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.product-create__upload-icon :deep(.el-icon) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.product-create__upload-title {
  font-size: 14px;
  font-weight: 650;
  letter-spacing: 0.01em;
  color: color-mix(in srgb, var(--color-zinc-text) 96%, #fff);
}

:deep(.product-create__status-select .el-select__wrapper) {
  min-height: var(--product-create-field-height) !important;
  height: var(--product-create-field-height) !important;
  background: color-mix(
    in srgb,
    var(--color-cockpit-bg-mid-97) 94%,
    var(--color-primary-amber-06)
  );
  border-radius: var(--el-border-radius-base, 4px) !important;
  box-shadow: 0 0 0 1px var(--color-primary-amber-26) inset !important;
}

:deep(.product-create__status-select .el-select__selected-item),
:deep(.product-create__status-select .el-select__placeholder) {
  color: var(--color-zinc-text) !important;
  font-weight: 500;
}

:deep(.product-create__status-select .el-select__caret) {
  color: color-mix(in srgb, var(--color-zinc-muted) 82%, #fff) !important;
  font-size: 13px !important;
  font-weight: 500 !important;
}

:deep(.product-create__status-select:hover .el-select__wrapper) {
  box-shadow: 0 0 0 1px var(--color-primary-amber-30) inset !important;
}

:deep(.product-create__status-select.is-focus .el-select__wrapper) {
  box-shadow: 0 0 0 1px var(--color-primary-amber-38) inset !important;
}

:deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 100%;
  height: auto;
  float: none !important;
  display: block;
  border-radius: 14px;
  border: 1px solid var(--color-primary-amber-22);
  box-shadow:
    0 8px 20px var(--color-primary-amber-10),
    0 1px 0 rgba(255, 255, 255, 0.08) inset;
}

:deep(.el-upload-list--picture-card .el-upload-list__item-thumbnail) {
  object-fit: contain;
  background:
    radial-gradient(
      circle at 30% 20%,
      var(--color-primary-amber-12) 0%,
      transparent 62%
    ),
    color-mix(in srgb, var(--color-cockpit-bg-mid-97) 72%, transparent);
  padding: 6px;
  box-sizing: border-box;
}

:deep(.el-upload-list--picture-card .el-upload-list__item-actions) {
  border-radius: 14px;
  background: color-mix(in srgb, #000 34%, transparent);
}

:deep(.product-create__upload .el-upload) {
  width: 100%;
}

:deep(.product-create__upload) {
  width: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.product-create__images-item .el-form-item__content) {
  width: 100%;
}

:deep(.product-create__upload .el-upload--picture-card),
:deep(.product-create__upload .el-upload) {
  width: 100% !important;
}

:deep(.product-create__upload .el-upload-dragger) {
  width: 100% !important;
  min-height: 136px;
  height: auto;
  border: none;
  background: transparent;
}

.product-create__upload-list {
  margin-top: 12px;
  display: grid;
  width: 100%;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.product-create__upload-item {
  position: relative;
  min-height: 136px;
  height: auto;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid var(--color-primary-amber-22);
  box-shadow:
    0 8px 20px var(--color-primary-amber-10),
    0 1px 0 rgba(255, 255, 255, 0.75) inset;

  img {
    width: 100%;
    height: auto;
    object-fit: contain;
    background:
      radial-gradient(
        circle at 30% 20%,
        var(--color-primary-amber-12) 0%,
        transparent 62%
      ),
      color-mix(in srgb, var(--color-cockpit-bg-mid-97) 72%, transparent);
    padding: 6px;
    box-sizing: border-box;
    display: block;
  }
}

.product-create__upload-progress {
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 8px;
  z-index: 4;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid var(--color-primary-amber-32);
  background: color-mix(
    in srgb,
    var(--color-cockpit-bg-mid-97) 82%,
    var(--color-primary-amber-14)
  );
  box-shadow:
    0 8px 18px var(--color-primary-amber-14),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.product-create__upload-progress-text {
  margin-bottom: 4px;
  color: color-mix(in srgb, var(--color-zinc-text) 94%, #fff);
  font-size: 12px;
  font-weight: 650;
  line-height: 1.2;
}

.product-create__upload-error {
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 8px;
  z-index: 4;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid rgba(220, 38, 38, 0.38);
  background: rgba(127, 29, 29, 0.66);
  color: #fee2e2;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.25;
}

.product-create__upload-item-mask {
  position: absolute;
  inset: auto 8px 8px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px;
  border-radius: 10px;
  border: 1px solid var(--color-primary-amber-24);
  opacity: 0;
  transform: translateY(6px);
  backdrop-filter: blur(8px);
  background: color-mix(
    in srgb,
    var(--color-cockpit-bg-mid-97) 70%,
    var(--color-primary-amber-10)
  );
  box-shadow:
    0 8px 18px var(--color-primary-amber-16),
    0 1px 0 rgba(255, 255, 255, 0.08) inset;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.product-create__upload-item:hover .product-create__upload-item-mask {
  opacity: 1;
  transform: translateY(0);
}

.product-create__upload-action {
  min-width: 56px;
  height: 28px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid transparent;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.product-create__upload-action--preview {
  color: color-mix(in srgb, var(--color-zinc-text) 90%, #fff);
  background: color-mix(
    in srgb,
    var(--color-cockpit-bg-mid-97) 84%,
    var(--color-primary-amber-10)
  );
  border-color: var(--color-primary-amber-30);
}

.product-create__upload-action--preview:hover {
  color: color-mix(in srgb, var(--color-zinc-text) 96%, #fff);
  background: color-mix(
    in srgb,
    var(--color-cockpit-bg-mid-97) 78%,
    var(--color-primary-amber-16)
  );
  border-color: var(--color-primary-amber-45);
}

.product-create__upload-action--delete {
  color: #fff;
  background: linear-gradient(
    135deg,
    rgba(239, 68, 68, 0.86),
    rgba(220, 38, 38, 0.9)
  );
  border-color: rgba(220, 38, 38, 0.32);
}

.product-create__upload-action--delete:hover {
  background: linear-gradient(
    135deg,
    rgba(248, 113, 113, 0.92),
    rgba(239, 68, 68, 0.94)
  );
}

@media (max-width: 900px) {
  .product-list__main {
    padding: 16px 16px 28px;
  }

  .product-create__panel {
    padding: 14px;
  }

  .product-create__upload-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }
}

@media (max-width: 760px) {
  .product-list__main {
    padding: 12px 12px 22px;
  }

  .product-create {
    --product-create-field-height: 38px;
  }

  .product-create__breadcrumb {
    margin: 6px 0 12px;
  }

  .product-create__panel {
    border-radius: 10px;
    padding: 12px;
  }

  .product-create__upload-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .product-create__upload-item {
    min-height: 120px;
    border-radius: 10px;
  }

  .product-create__upload-item-mask {
    inset: auto 6px 6px 6px;
    opacity: 1;
    transform: none;
  }

  .product-create__actions {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 10px;
    border-radius: 10px;
  }

  .product-create__actions-sub {
    white-space: normal;
  }

  .product-create__actions-buttons {
    width: 100%;
    justify-content: stretch;
    gap: 8px;
  }

  .product-create__actions-buttons .action-btn {
    flex: 1;
    min-width: 0;
  }
}

@media (max-width: 520px) {
  .product-list__main {
    padding: 10px 8px 18px;
  }

  .product-create {
    --product-create-field-height: 36px;
  }

  .product-create__panel {
    padding: 10px;
    border-radius: 9px;
  }

  .product-create__upload-title {
    font-size: 13px;
  }

  .product-create__upload-hint {
    font-size: 11px;
  }

  .product-create__upload-icon {
    width: 44px;
    height: 44px;
    margin-bottom: 8px;
    font-size: 18px;
  }

  .product-create__upload-item {
    min-height: 110px;
  }

  .product-create__upload-action {
    min-width: 0;
    flex: 1;
    height: 26px;
    padding: 0 8px;
    font-size: 11px;
  }

  .product-create__actions-title {
    font-size: 13px;
  }

  .product-create__actions-sub {
    font-size: 11px;
  }

  .product-create__actions-buttons .action-btn {
    height: 34px;
    font-size: 12px;
  }
}
</style>

<style lang="scss">
.product-create-status-popper {
  border: 1px solid var(--color-primary-amber-26) !important;
  border-radius: var(--el-border-radius-base, 4px) !important;
  box-shadow: 0 8px 18px color-mix(in srgb, #000 10%, transparent) !important;
  background: color-mix(
    in srgb,
    var(--color-cockpit-bg-mid-97) 94%,
    var(--color-primary-amber-06)
  );
}

.product-create-status-popper .el-select-dropdown__item {
  color: var(--color-zinc-text);
  font-weight: 500;
  border-bottom: 1px solid color-mix(in srgb, var(--color-primary-amber-12) 36%, transparent);
}

.product-create-status-popper .el-select-dropdown__item.hover,
.product-create-status-popper .el-select-dropdown__item:hover {
  background: color-mix(in srgb, var(--color-cockpit-bg-mid-97) 96%, transparent);
  color: var(--color-zinc-text);
}

.product-create-status-popper .el-select-dropdown__item.is-selected {
  color: var(--color-zinc-text);
  font-weight: 600;
  background: color-mix(in srgb, var(--color-cockpit-bg-mid-97) 94%, var(--color-primary-amber-08));
  box-shadow: inset 0 0 0 1px var(--color-primary-amber-30);
}

.product-create__preview-dialog {
  margin-top: 8vh;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--color-primary-amber-34);
  background: linear-gradient(
    145deg,
    color-mix(in srgb, var(--color-cockpit-bg-mid-97) 94%, var(--color-primary-amber-06)) 0%,
    color-mix(in srgb, var(--color-cockpit-bg-mid-97) 98%, transparent) 100%
  );
  box-shadow:
    0 20px 44px color-mix(in srgb, #000 56%, transparent),
    0 0 0 1px color-mix(in srgb, var(--color-primary-amber-20) 52%, transparent) inset,
    0 0 24px var(--color-primary-amber-12);
}

.product-create__preview-dialog .el-dialog__header {
  margin-right: 0;
  padding: 12px 16px 10px;
  border-bottom: 1px solid var(--color-primary-amber-22);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--color-primary-amber-14) 52%, transparent) 0%,
    transparent 100%
  );
}

.product-create__preview-dialog .el-dialog__title {
  color: color-mix(in srgb, var(--color-primary-amber) 78%, #fff);
  font-weight: 650;
  letter-spacing: 0.01em;
  text-shadow: 0 0 12px color-mix(in srgb, var(--color-primary-amber-20) 72%, transparent);
}

.product-create__preview-dialog .el-dialog__headerbtn .el-dialog__close {
  color: var(--color-primary-amber-70) !important;
  width: 15px !important;
  height: 15px !important;
  transition: color 0.14s ease !important;
}

.product-create__preview-dialog .el-dialog__headerbtn {
  width: 28px !important;
  height: 28px !important;
  top: 14px !important;
  right: 14px !important;
  border: 1px solid var(--color-primary-amber-20) !important;
  border-radius: 7px !important;
  background: color-mix(
    in srgb,
    var(--color-cockpit-bg-mid-97) 88%,
    var(--color-primary-amber-08)
  ) !important;
  transition:
    background-color 0.14s ease,
    box-shadow 0.14s ease,
    transform 0.14s ease,
    border-color 0.14s ease !important;
}

.product-create__preview-dialog .el-dialog__headerbtn:hover {
  border-color: var(--color-primary-amber) !important;
  background: var(--color-primary-amber-85) !important;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14) !important;
  transform: translateY(-1px) !important;
}

.product-create__preview-dialog .el-dialog__headerbtn:hover .el-dialog__close,
.product-create__preview-dialog .el-dialog__headerbtn:focus-visible .el-dialog__close {
  color: #fff !important;
}

.product-create__preview-dialog .el-dialog__headerbtn:active {
  transform: translateY(0) !important;
  background: var(--color-primary-amber) !important;
}

.product-create__preview-dialog .el-dialog__headerbtn:focus-visible {
  outline: none !important;
  box-shadow:
    0 0 0 2px var(--color-primary-amber-18),
    inset 0 0 0 1px rgba(255, 255, 255, 0.14) !important;
}

.product-create__preview-dialog .el-dialog__body {
  padding: 12px;
}

.product-create__preview-modal {
  background: color-mix(in srgb, #05070a 72%, var(--color-primary-amber-10));
  backdrop-filter: blur(2px);
}

@media (max-width: 900px) {
  .product-create__preview-dialog {
    margin-top: 7vh;
  }
}

@media (max-width: 760px) {
  .product-create__preview-dialog {
    width: min(640px, calc(100vw - 20px)) !important;
    margin-top: 6vh;
    border-radius: 10px;
  }

  .product-create__preview-dialog .el-dialog__header {
    padding: 10px 12px 8px;
  }

  .product-create__preview-dialog .el-dialog__body {
    padding: 10px;
  }
}

@media (max-width: 520px) {
  .product-create__preview-dialog {
    width: calc(100vw - 12px) !important;
    margin-top: 3vh;
    border-radius: 9px;
  }

  .product-create__preview-dialog .el-dialog__header {
    padding: 9px 10px 7px;
  }

  .product-create__preview-dialog .el-dialog__title {
    font-size: 14px;
  }

  .product-create__preview-dialog .el-dialog__body {
    padding: 8px;
  }
}
</style>
