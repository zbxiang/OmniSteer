import type {
  FileUploadApiResponse,
  ProductListQuery,
  ProductListResult,
  ProductOut,
  ProductSaveOrUpdateParams,
} from '@/types/product';
import type { AxiosProgressEvent } from 'axios';
import request from '@/utils/request';

const apiPrefix = import.meta.env.VITE_API_PROXY_PREFIX || '/api';

// 产品分页
export const getProductPage = (
  params: ProductListQuery,
): Promise<ProductListResult> => {
  return request.post<ProductListResult>(`${apiPrefix}/product/page`, params, {
    cancelKey: `POST:${apiPrefix}/product/page`,
  });
};

// 产品新增/编辑（统一保存）
export const saveOrUpdateProduct = (
  params: ProductSaveOrUpdateParams,
): Promise<ProductOut> => {
  return request.post<ProductOut>(`${apiPrefix}/product/saveOrUpdate`, params, {
    cancelKey: `POST:${apiPrefix}/product/saveOrUpdate`,
  });
};

// 产品详情
export const getProductDetail = (productId: number): Promise<ProductOut> => {
  return request.get<ProductOut>(`${apiPrefix}/products/${productId}`, {
    cancelKey: `GET:${apiPrefix}/products/${productId}`,
  });
};

// 上传图片文件
export const uploadImageFile = (
  file: File,
  onProgress?: (_percent: number) => void,
): Promise<FileUploadApiResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  return request.post<FileUploadApiResponse>(`${apiPrefix}/file/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    cancelKey: 'POST:/file/upload',
    onUploadProgress: (evt: AxiosProgressEvent) => {
      if (!onProgress || !evt.total) return;
      onProgress(Math.min(100, Math.round((evt.loaded / evt.total) * 100)));
    },
  });
};
