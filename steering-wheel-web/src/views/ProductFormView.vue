<template>
  <div class="product-create">
    <div class="product-create__warm-base" aria-hidden="true" />
    <div class="product-create__vignette" aria-hidden="true" />

    <div class="product-create__content">
      <header class="product-create__header">
        <p class="product-create__badge">OmniSteer · 产品管理</p>
        <h1 class="product-create__title">{{ pageTitle }}</h1>
        <p class="product-create__hint">{{ appStore.systemName }}</p>
      </header>

      <div class="product-create__panel">
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
          <el-row :gutter="16">
            <el-col :xs="24" :md="12">
              <el-form-item label="产品名称" prop="name">
                <el-input v-model="form.name" placeholder="例如：智能方向盘 Pro" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item label="品牌" prop="brand">
                <el-input v-model="form.brand" placeholder="例如：OmniSteer" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :xs="24" :md="12">
              <el-form-item label="型号" prop="model">
                <el-input v-model="form.model" placeholder="例如：OS-PRO-11" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item label="价格（元）" prop="price">
                <el-input-number v-model="form.price" :min="1" :step="100" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="状态">
            <el-segmented
              v-model="form.status"
              :options="[
                { label: '在售', value: 'on' },
                { label: '下架', value: 'off' },
              ]"
            />
          </el-form-item>

          <el-form-item label="产品描述">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="4"
              placeholder="输入产品亮点、适配车型、材质等信息..."
            />
          </el-form-item>

          <el-row :gutter="16">
            <el-col :xs="24" :md="12">
              <el-form-item label="材质">
                <el-input v-model="form.material" placeholder="例如：碳纤维 + 翻毛皮" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item label="直径（mm）">
                <el-input-number v-model="form.diameter" :min="1" :step="1" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :xs="24" :md="12">
              <el-form-item label="重量（g）">
                <el-input-number v-model="form.weight" :min="1" :step="10" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item label="安装方式">
                <el-input v-model="form.mount" placeholder="例如：通用六孔 + 快拆" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="产品图片" prop="images">
            <el-upload
              v-model:file-list="uploadFiles"
              list-type="picture-card"
              :auto-upload="false"
              :limit="6"
              accept="image/jpeg,image/png,image/webp"
              :before-upload="beforeImageUpload"
              :on-change="onUploadChange"
              :on-remove="onUploadRemove"
              :on-preview="onUploadPreview"
            >
              <el-icon><Plus /></el-icon>
            </el-upload>
          </el-form-item>

          <div class="product-create__actions">
            <el-button @click="router.push('/')">取消</el-button>
            <el-button type="primary" :loading="loading" @click="submit">{{ submitText }}</el-button>
          </div>
        </el-form>
      </div>
    </div>
    <el-dialog
      v-model="previewVisible"
      title="图片预览"
      width="720px"
      :close-on-click-modal="true"
      append-to-body
    >
      <img v-if="previewImageUrl" :src="previewImageUrl" class="product-create__preview-image" alt="产品图片预览">
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules, UploadProps, UploadUserFile } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import type { ProductEditSeed, ProductFormData } from '@/types';
import { createProductApi, getProductDetailApi, updateProductApi } from '@/api/product';
import { isRequestCanceled, RequestError } from '@/api/request';
import { useAppStore } from '@/stores/app';

const appStore = useAppStore();
const router = useRouter();
const route = useRoute();

const formRef = ref<FormInstance>();
const loading = ref<boolean>(false);
const isEdit = computed<boolean>(() => Boolean(route.params.id));
const pageTitle = computed<string>(() => (isEdit.value ? '编辑产品' : '上架新产品'));
const submitText = computed<string>(() => (isEdit.value ? '保存修改' : '提交上架'));

const form = reactive<ProductFormData>({
  name: '',
  brand: '',
  model: '',
  price: 0,
  status: 'on',
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
  images: [{ type: 'array', required: true, min: 1, message: '请至少上传 1 张产品图片', trigger: 'change' }],
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
  form.status = p.status;
  form.material = p.material;
  form.diameter = p.diameter;
  form.weight = p.weight;
  form.mount = p.mount;
  form.description = p.description;
  uploadFiles.value = (p.images || []).map((url, idx): UploadUserFile => ({
    name: `image-${idx + 1}`,
    url,
  }));
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
      status: p.status === 'off' ? 'off' : 'on',
      material: p.material || '',
      diameter: p.diameter ?? undefined,
      weight: p.weight ?? undefined,
      mount: p.mount || '',
      description: p.description || '',
      images: p.images,
    });
  } catch (e) {
    if (isRequestCanceled(e)) return;
    const msg = e instanceof RequestError ? e.message : '加载产品失败，请稍后重试';
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
  const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(rawFile.type);
  if (!isImage) {
    ElMessage.error('仅支持 JPG / PNG / WEBP 图片');
    return false;
  }
  const isLt5M = rawFile.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    ElMessage.error('单张图片不能超过 5MB');
    return false;
  }
  return true;
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

const onUploadRemove: UploadProps['onRemove'] = (uploadFile) => {
  if (uploadFile.url && imageObjectUrls.has(uploadFile.url)) {
    URL.revokeObjectURL(uploadFile.url);
    imageObjectUrls.delete(uploadFile.url);
  }
  syncFormImages();
};

const onUploadPreview: UploadProps['onPreview'] = (uploadFile): void => {
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
        status: form.status,
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
      status: form.status as 'on' | 'off',
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
  padding: 2rem 1rem 3rem;
  color: v.$zinc-text;
  background: linear-gradient(168deg, v.$cockpit-bg-top 0%, v.$cockpit-bg-mid 48%, v.$cockpit-bg-bottom 100%);

  &__warm-base,
  &__vignette {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &__warm-base {
    background: radial-gradient(ellipse 95% 60% at 50% 110%, var(--color-primary-amber-20) 0%, transparent 55%);
  }

  &__vignette {
    box-shadow: inset 0 0 120px rgba(0, 0, 0, 0.5);
  }

  &__content {
    position: relative;
    z-index: 2;
    max-width: 980px;
    margin: 0 auto;
  }

  &__header {
    margin-bottom: 1rem;
  }

  &__badge {
    margin: 0;
    color: var(--color-primary-amber-85);
    letter-spacing: 0.24em;
    font-size: 11px;
  }

  &__title {
    margin: 0.4rem 0 0;
    font-size: 1.6rem;
  }

  &__hint {
    margin: 0.4rem 0 0;
    color: v.$zinc-muted;
  }

  &__panel {
    border-radius: 12px;
    border: 1px solid var(--color-primary-amber-24);
    padding: 1rem;
    background: linear-gradient(145deg, v.$panel-bg 0%, var(--color-cockpit-bg-mid-96) 100%);
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
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

:deep(.el-form-item__label) {
  color: v.$zinc-label;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-input-number .el-input__wrapper) {
  background: v.$input-bg !important;
  color: v.$zinc-text !important;
  box-shadow: 0 0 0 1px var(--color-primary-amber-20) inset !important;
}

:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  color: v.$zinc-text !important;
}

:deep(.el-button--primary) {
  --el-button-bg-color: rgb(194 65 12);
  --el-button-border-color: rgb(234 88 12);
  --el-button-hover-bg-color: rgb(234 88 12);
  --el-button-hover-border-color: rgb(249 115 22);
}
</style>
