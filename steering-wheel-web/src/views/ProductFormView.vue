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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules, UploadProps, UploadUserFile } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import type { ProductEditSeed, ProductFormData } from '@/types';
import { createProductApi } from '@/api/product';
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

const mockProductsForEdit: ProductEditSeed[] = [
  {
    id: 1,
    name: '智能方向盘 Pro',
    brand: 'OmniSteer',
    model: 'OS-PRO-01',
    price: 3299,
    status: 'on',
    material: '碳纤维 + 真皮',
    diameter: 350,
    weight: 680,
    mount: '通用六孔 + 快拆',
    description: '旗舰款智能方向盘，支持多功能按键与自定义灯效。',
  },
];

onMounted((): void => {
  if (!isEdit.value) return;
  const id = Number(route.params.id);
  const p = mockProductsForEdit.find((x) => x.id === id);
  if (!p) return;
  form.name = p.name;
  form.brand = p.brand;
  form.model = p.model;
  form.price = p.price;
  form.status = p.status as 'on' | 'off';
  form.material = p.material;
  form.diameter = p.diameter;
  form.weight = p.weight;
  form.mount = p.mount;
  form.description = p.description;
});

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
    }
  }
  return urls;
};

const submit = async (): Promise<void> => {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  loading.value = true;
  try {
    if (isEdit.value) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      ElMessage.success('产品修改成功（演示）');
      await router.push('/');
      return;
    }
    const images = await collectImagesForSubmit();
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
    const msg = e instanceof RequestError ? e.message : '提交失败，请稍后重试';
    ElMessage.error(msg);
  } finally {
    loading.value = false;
  }
};

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
    background: radial-gradient(ellipse 95% 60% at 50% 110%, rgba(v.$primary-amber, 0.2) 0%, transparent 55%);
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
    color: rgba(v.$primary-amber, 0.85);
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
    border: 1px solid rgba(v.$primary-amber, 0.24);
    padding: 1rem;
    background: linear-gradient(145deg, v.$panel-bg 0%, rgba(v.$cockpit-bg-mid, 0.96) 100%);
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
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
  box-shadow: 0 0 0 1px rgba(v.$primary-amber, 0.2) inset !important;
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
