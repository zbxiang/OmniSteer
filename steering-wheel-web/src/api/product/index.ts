import type { ProductCreateBody, ProductImageSearchBody, ProductImageSearchResult, ProductListQuery, ProductListResult, ProductOut, ProductStatusUpdateBody, ProductUpdateBody } from '@/types/product';
import type { AxiosProgressEvent } from 'axios';
import request from '@/utils/request';

const apiPrefix = import.meta.env.VITE_API_PROXY_PREFIX || '/api';

export async function createProductApi(body: ProductCreateBody): Promise<ProductOut> {
  return request.post<ProductOut>(
    `${apiPrefix}/products`,
    {
      ...body,
      material: body.material?.trim() || undefined,
      mount: body.mount?.trim() || undefined,
      description: body.description?.trim() || undefined,
    },
    { cancelKey: `POST:${apiPrefix}/products` },
  );
}

export async function listProductsApi(params: ProductListQuery): Promise<ProductListResult> {
  return request.post<ProductListResult>(`${apiPrefix}/product/page`, params, {
    cancelKey: `POST:${apiPrefix}/product/page`,
  });
}

export async function getProductDetailApi(productId: number): Promise<ProductOut> {
  return request.get<ProductOut>(`${apiPrefix}/products/${productId}`, {
    cancelKey: `GET:${apiPrefix}/products/${productId}`,
  });
}

export async function updateProductApi(productId: number, body: ProductUpdateBody): Promise<ProductOut> {
  return request.put<ProductOut>(
    `${apiPrefix}/products/${productId}`,
    {
      ...body,
      material: body.material?.trim() || undefined,
      mount: body.mount?.trim() || undefined,
      description: body.description?.trim() || undefined,
    },
    { cancelKey: `PUT:${apiPrefix}/products/${productId}` },
  );
}

export async function updateProductStatusApi(
  productId: number,
  body: ProductStatusUpdateBody,
): Promise<ProductOut> {
  return request.patch<ProductOut>(
    `${apiPrefix}/products/${productId}/status`,
    body,
    { cancelKey: `PATCH:${apiPrefix}/products/${productId}/status` },
  );
}

export async function imageSearchProductsApi(body: ProductImageSearchBody): Promise<ProductImageSearchResult> {
  return request.post<ProductImageSearchResult>(
    `${apiPrefix}/products/image-search`,
    body,
    { cancelKey: `POST:${apiPrefix}/products/image-search` },
  );
}

type FileUploadApiResponse = {
  code?: string;
  success?: boolean;
  data?: string | {
    url?: string;
    imageUrl?: string;
    fileUrl?: string;
  };
};

export async function uploadImageFileApi(
  file: File,
  onProgress?: (_percent: number) => void,
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await request.post<FileUploadApiResponse>(`${apiPrefix}/file/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    cancelKey: 'POST:/file/upload',
    onUploadProgress: (evt: AxiosProgressEvent) => {
      if (!onProgress || !evt.total) return;
      onProgress(Math.min(100, Math.round((evt.loaded / evt.total) * 100)));
    },
  });
  if (response?.success === false) {
    throw new Error('图片上传失败');
  }
  const imageUrl = typeof response?.data === 'string'
    ? response.data
    : response?.data?.imageUrl ?? response?.data?.url ?? response?.data?.fileUrl;
  if (!imageUrl) {
    throw new Error('上传成功但未返回图片地址');
  }
  return imageUrl;
}
