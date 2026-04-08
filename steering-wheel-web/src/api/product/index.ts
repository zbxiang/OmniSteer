import type { ProductCreateBody, ProductImageSearchBody, ProductImageSearchResult, ProductListQuery, ProductListResult, ProductOut, ProductStatusUpdateBody, ProductUpdateBody } from '@/types';
import request from '../request';

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
  return request.get<ProductListResult>(`${apiPrefix}/products`, {
    params,
    cancelKey: `GET:${apiPrefix}/products`,
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
