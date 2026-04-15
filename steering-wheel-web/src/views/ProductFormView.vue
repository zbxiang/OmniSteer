<template>
  <div class="product-list product-create">
    <TopBar
      :system-name="appStore.systemName"
      :display-name="displayName"
      :user-initial="userInitial"
      :is-home="route.name === 'home'"
      :is-product-create="route.name === 'productCreate'"
    />

    <div class="product-list__main">
      <div class="product-create__content">
        <el-breadcrumb class="product-create__breadcrumb" separator="/">
          <el-breadcrumb-item :to="{ path: '/' }">产品列表</el-breadcrumb-item>
          <el-breadcrumb-item>{{
            isEdit ? '编辑产品' : '上架产品'
          }}</el-breadcrumb-item>
        </el-breadcrumb>
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
                <el-icon><Upload /></el-icon>
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

            <el-row :gutter="16">
              <el-col :xs="24" :md="12">
                <el-form-item label="材质">
                  <el-input
                    v-model="form.material"
                    placeholder="例如：碳纤维 + 翻毛皮"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="直径（mm）">
                  <el-input-number
                    v-model="form.diameter"
                    :min="1"
                    :step="1"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="16">
              <el-col :xs="24" :md="12">
                <el-form-item label="重量（g）">
                  <el-input-number
                    v-model="form.weight"
                    :min="1"
                    :step="10"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :md="12">
                <el-form-item label="安装方式">
                  <el-input
                    v-model="form.mount"
                    placeholder="例如：通用六孔 + 快拆"
                  />
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
                  class="product-create__btn product-create__btn--ghost"
                  @click="router.push('/')"
                  >取消</el-button
                >
                <el-button
                  type="primary"
                  class="product-create__btn product-create__btn--primary"
                  :loading="loading"
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
      title="图片预览"
      width="720px"
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
import { Upload } from '@element-plus/icons-vue';
import type { ProductEditSeed, ProductFormData } from '@/types/product';
import { ProductStatusEnum } from '@/enums/product';
import { normalizeProductStateFromOut } from '@/utils/productState';
import {
  createProductApi,
  getProductDetailApi,
  updateProductApi,
} from '@/api/product';
import { isRequestCanceled, RequestError } from '@/utils/request';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import TopBar from '@/components/topBar.vue';

const appStore = useAppStore();
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const displayName = computed((): string => authStore.username || 'Admin');
const userInitial = computed((): string => {
  const n = displayName.value.trim();
  return n ? n.slice(0, 1).toUpperCase() : 'A';
});

const formRef = ref<FormInstance>();
const loading = ref<boolean>(false);
const isEdit = computed<boolean>(() => Boolean(route.params.id));
const submitText = computed<string>(() =>
  isEdit.value ? '保存修改' : '提交上架',
);
const actionTitle = computed<string>(() =>
  isEdit.value ? '确认保存本次修改' : '准备提交上架',
);
const actionHint = computed<string>(() =>
  isEdit.value
    ? '更新后将立即覆盖当前产品信息'
    : '提交后将在产品列表展示新商品',
);

const form = reactive<ProductFormData>({
  name: '',
  brand: '',
  model: '',
  price: 0,
  state: ProductStatusEnum.UP,
  material: '',
  diameter: undefined as number | undefined,
  weight: undefined as number | undefined,
  mount: '',
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

const fillFormByDetail = (p: ProductEditSeed & { images?: string[] }): void => {
  form.name = p.name;
  form.brand = p.brand;
  form.model = p.model;
  form.price = p.price;
  form.state = p.state;
  form.material = p.material;
  form.diameter = p.diameter;
  form.weight = p.weight;
  form.mount = p.mount;
  form.description = p.description;
  uploadFiles.value = (p.images || []).map(
    (url, idx): UploadUserFile => ({
      name: `image-${idx + 1}`,
      url,
    }),
  );
  syncFormImages();
};

const loadEditDetail = async (): Promise<void> => {
  if (!isEdit.value) return;
  const id = Number(route.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    ElMessage.error('产品 ID 无效');
    void router.replace('/');
    return;
  }
  loading.value = true;
  try {
    const p = await getProductDetailApi(id);
    fillFormByDetail({
      id: p.id,
      name: p.name,
      brand: p.brand,
      model: p.model,
      price: p.price,
      state: normalizeProductStateFromOut(p),
      material: p.material || '',
      diameter: p.diameter ?? undefined,
      weight: p.weight ?? undefined,
      mount: p.mount || '',
      description: p.description || '',
      images: p.images,
    });
  } catch (e) {
    if (isRequestCanceled(e)) return;
    const msg =
      e instanceof RequestError ? e.message : '加载产品失败，请稍后重试';
    ElMessage.error(msg);
    void router.replace('/');
  } finally {
    loading.value = false;
  }
};

const syncFormImages = (): void => {
  form.images = uploadFiles.value
    .map((f) => f.url)
    .filter((url): url is string => Boolean(url));
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
  const objectUrl = URL.createObjectURL(uploadFile.raw);
  imageObjectUrls.add(objectUrl);
  uploadFile.url = objectUrl;
  syncFormImages();
};

const onUploadRemove = (uploadFile: UploadUserFile): void => {
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

const onUploadPreview = (uploadFile: UploadUserFile): void => {
  if (!uploadFile.url) {
    ElMessage.warning('当前图片暂不可预览');
    return;
  }
  previewImageUrl.value = uploadFile.url;
  previewVisible.value = true;
};

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise<string>((resolve, reject): void => {
    const reader = new FileReader();
    reader.onload = (): void => resolve(String(reader.result));
    reader.onerror = (): void => reject(reader.error);
    reader.readAsDataURL(file);
  });

const collectImagesForSubmit = async (): Promise<string[]> => {
  const urls: string[] = [];
  for (const f of uploadFiles.value) {
    if (f.raw) {
      urls.push(await readFileAsDataUrl(f.raw));
      continue;
    }
    if (f.url) urls.push(f.url);
  }
  return urls;
};

const submit = async (): Promise<void> => {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  loading.value = true;
  try {
    const images = await collectImagesForSubmit();
    if (isEdit.value) {
      const id = Number(route.params.id);
      await updateProductApi(id, {
        name: form.name,
        brand: form.brand,
        model: form.model,
        price: form.price,
        state: form.state,
        material: form.material || undefined,
        diameter: form.diameter,
        weight: form.weight,
        mount: form.mount || undefined,
        description: form.description || undefined,
        images,
      });
      ElMessage.success('产品修改成功');
      await router.push('/');
      return;
    }
    await createProductApi({
      name: form.name,
      brand: form.brand,
      model: form.model,
      price: form.price,
      state: form.state,
      material: form.material || undefined,
      diameter: form.diameter,
      weight: form.weight,
      mount: form.mount || undefined,
      description: form.description || undefined,
      images,
    });
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
  position: relative;
  min-height: 100vh;
  color: v.$zinc-text;
  background-color: var(--color-primary-amber-12);
  background:
    radial-gradient(
      1200px 420px at 50% -120px,
      var(--color-primary-amber-20) 0%,
      var(--color-primary-amber-08) 45%,
      transparent 78%
    ),
    linear-gradient(
      180deg,
      var(--color-primary-amber-12) 0%,
      var(--color-primary-amber-06) 24%,
      #f5f5f5 56%
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
      color-mix(in srgb, #fff 94%, var(--color-primary-amber-06)) 0%,
      color-mix(in srgb, #fff 88%, var(--color-primary-amber-10)) 100%
    );
    box-shadow:
      0 10px 28px var(--color-primary-amber-12),
      0 1px 0 rgba(255, 255, 255, 0.7) inset;
  }

  &__images-item {
    margin-bottom: 18px;
  }

  &__upload-hint {
    margin: 10px 2px 0;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.56);
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
      color-mix(in srgb, #fff 90%, var(--color-primary-amber-08)) 0%,
      color-mix(in srgb, #fff 84%, var(--color-primary-amber-12)) 100%
    );
    box-shadow:
      0 8px 18px var(--color-primary-amber-10),
      0 1px 0 rgba(255, 255, 255, 0.7) inset;
  }

  &__actions-meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__actions-title {
    font-size: 14px;
    font-weight: 650;
    color: rgba(0, 0, 0, 0.78);
    letter-spacing: 0.01em;
  }

  &__actions-sub {
    margin-top: 2px;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.54);
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

  &__btn {
    min-width: 104px;
    border-radius: 10px;
    font-weight: 600;
    letter-spacing: 0.01em;
  }

  &__btn--ghost {
    --el-button-bg-color: color-mix(
      in srgb,
      #fff 92%,
      var(--color-primary-amber-06)
    );
    --el-button-border-color: var(--color-primary-amber-30);
    --el-button-text-color: var(--color-primary-amber);
    --el-button-hover-bg-color: color-mix(
      in srgb,
      #fff 86%,
      var(--color-primary-amber-10)
    );
    --el-button-hover-border-color: var(--color-primary-amber-50);
    --el-button-hover-text-color: var(--color-primary-amber);
    --el-button-active-text-color: var(--color-primary-amber);
  }

  &__btn--primary {
    --el-button-bg-color: var(--color-primary-amber-70);
    --el-button-border-color: var(--color-primary-amber-70);
    --el-button-hover-bg-color: var(--color-primary-amber);
    --el-button-hover-border-color: var(--color-primary-amber);
    box-shadow:
      0 8px 18px var(--color-primary-amber-20),
      inset 0 1px 0 rgba(255, 255, 255, 0.24);
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

:deep(.product-create__breadcrumb .el-breadcrumb__inner) {
  color: rgba(0, 0, 0, 0.56);
  font-size: 13px;
}

:deep(
  .product-create__breadcrumb
    .el-breadcrumb__item:last-child
    .el-breadcrumb__inner
) {
  color: var(--color-primary-amber);
  font-weight: 600;
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
  color: rgba(0, 0, 0, 0.82);
  font-weight: 600;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-input-number .el-input__wrapper) {
  background: color-mix(
    in srgb,
    #fff 94%,
    var(--color-primary-amber-06)
  ) !important;
  color: rgba(0, 0, 0, 0.88) !important;
  box-shadow: 0 0 0 1px var(--color-primary-amber-26) inset !important;
}

:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  color: rgba(0, 0, 0, 0.88) !important;
}

:deep(.el-input__inner::placeholder),
:deep(.el-textarea__inner::placeholder) {
  color: rgba(0, 0, 0, 0.44) !important;
}

:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  color: rgba(0, 0, 0, 0.68) !important;
}

:deep(.el-segmented) {
  background: color-mix(in srgb, #fff 84%, var(--color-primary-amber-12));
}

:deep(.el-segmented__item-label) {
  color: rgba(0, 0, 0, 0.76);
}

:deep(.el-segmented__item.is-selected .el-segmented__item-label) {
  color: rgba(0, 0, 0, 0.9);
  font-weight: 600;
}

:deep(.el-upload--picture-card) {
  width: 100% !important;
  min-height: 136px;
  height: 136px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  float: none !important;
  border-radius: 14px;
  border: 1px dashed var(--color-primary-amber-35);
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
    color-mix(in srgb, #fff 94%, var(--color-primary-amber-06));
  color: var(--color-primary-amber);
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

:deep(.el-upload--picture-card:hover) {
  border-color: var(--color-primary-amber-55);
  background:
    radial-gradient(
      circle at 15% -20%,
      var(--color-primary-amber-24) 0%,
      transparent 46%
    ),
    radial-gradient(
      circle at 100% 120%,
      var(--color-primary-amber-14) 0%,
      transparent 56%
    ),
    color-mix(in srgb, #fff 90%, var(--color-primary-amber-08));
  transform: translateY(-1px);
  box-shadow:
    0 10px 24px var(--color-primary-amber-16),
    0 1px 0 rgba(255, 255, 255, 0.75) inset;
}

:deep(.product-create__status-select .el-select__wrapper) {
  background: color-mix(in srgb, #fff 94%, var(--color-primary-amber-08));
  box-shadow: 0 0 0 1px var(--color-primary-amber-26) inset !important;
}

:deep(.product-create__status-select:hover .el-select__wrapper) {
  box-shadow: 0 0 0 1px var(--color-primary-amber-45) inset !important;
}

:deep(.product-create__status-select.is-focus .el-select__wrapper) {
  box-shadow:
    0 0 0 1px var(--color-primary-amber-55) inset,
    0 0 0 3px var(--color-primary-amber-16) !important;
}

:deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 100%;
  height: 136px;
  float: none !important;
  display: block;
  border-radius: 14px;
  border: 1px solid var(--color-primary-amber-22);
  box-shadow:
    0 8px 20px var(--color-primary-amber-10),
    0 1px 0 rgba(255, 255, 255, 0.75) inset;
}

:deep(.el-upload-list--picture-card .el-upload-list__item-thumbnail) {
  object-fit: cover;
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
  height: 136px;
  border: none;
  background: transparent;
}

.product-create__upload-list {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.product-create__upload-item {
  position: relative;
  height: 136px;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid var(--color-primary-amber-22);
  box-shadow:
    0 8px 20px var(--color-primary-amber-10),
    0 1px 0 rgba(255, 255, 255, 0.75) inset;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
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
  background: color-mix(in srgb, #fff 70%, var(--color-primary-amber-10));
  box-shadow:
    0 8px 18px var(--color-primary-amber-16),
    0 1px 0 rgba(255, 255, 255, 0.72) inset;
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
  color: rgba(0, 0, 0, 0.78);
  background: color-mix(in srgb, #fff 84%, var(--color-primary-amber-10));
  border-color: var(--color-primary-amber-30);
}

.product-create__upload-action--preview:hover {
  color: #000;
  background: color-mix(in srgb, #fff 78%, var(--color-primary-amber-16));
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

@media (max-width: 760px) {
  .product-create__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .product-create__actions-sub {
    white-space: normal;
  }

  .product-create__actions-buttons {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>

<style lang="scss">
.product-create-status-popper {
  border: 1px solid var(--color-primary-amber-24) !important;
  box-shadow:
    0 10px 28px var(--color-primary-amber-18),
    0 1px 0 rgba(255, 255, 255, 0.76) inset !important;
  background: color-mix(in srgb, #fff 94%, var(--color-primary-amber-06));
}

.product-create-status-popper .el-select-dropdown__item {
  color: rgba(0, 0, 0, 0.76);
}

.product-create-status-popper .el-select-dropdown__item.hover,
.product-create-status-popper .el-select-dropdown__item:hover {
  background: color-mix(in srgb, #fff 82%, var(--color-primary-amber-14));
  color: rgba(0, 0, 0, 0.88);
}

.product-create-status-popper .el-select-dropdown__item.is-selected {
  color: var(--color-primary-amber);
  font-weight: 700;
  background: color-mix(in srgb, #fff 74%, var(--color-primary-amber-20));
}
</style>
