import type { ProductCreateBody, ProductOut } from '@/types';
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
