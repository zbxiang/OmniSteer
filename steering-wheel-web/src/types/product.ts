import type { ProductStatus } from '@/enums/product';

export type ProductLite = {
  name: string;
  brand: string;
  model: string;
  images?: string[];
};

export type ProductItem = {
  id: number;
  name: string;
  brand: string;
  model: string;
  price: number;
  /** 上架状态：UP 上架 / DOWN 下架 */
  state: ProductStatus;
  images?: string[];
};

export type ProductCardItem = ProductItem & {
  imageUrl?: string;
  images?: string[];
  material?: string;
  diameter?: number;
  weight?: number;
  mount?: string;
  description?: string;
};

export type ProductFormData = {
  name: string;
  brand: string;
  model: string;
  price: number;
  /** 上架状态：UP 上架 / DOWN 下架 */
  state: ProductStatus;
  material: string;
  diameter: number | undefined;
  weight: number | undefined;
  mount: string;
  description: string;
  images: string[];
};

export type ProductEditSeed = Omit<ProductFormData, 'images'> & {
  id: number;
};


export type ProductCreateBody = {
  name: string;
  brand: string;
  model: string;
  price: number;
  state: ProductStatus;
  material?: string;
  diameter?: number;
  weight?: number;
  mount?: string;
  description?: string;
  images: string[];
};

export type ProductSaveOrUpdateParams = ProductCreateBody & {
  id?: number;
};

export type ProductStatusUpdateBody = {
  state: ProductStatus;
};

export type ProductOut = {
  id: number;
  name: string;
  brand: string;
  model: string;
  price: number;
  /** 上架状态：UP / DOWN */
  state?: string;
  /** @deprecated 兼容旧接口，优先使用 state */
  status?: string;
  material: string | null;
  diameter: number | null;
  weight: number | null;
  mount: string | null;
  description: string | null;
  images: string[];
  created_at: string;
};

export type ProductListQuery = {
  keyword?: string;
  imageUrl?: string;
  page?: number;
  size?: number;
};

export type ProductListResult = {
  data: {
    content: ProductOut[];
    totalElements?: number;
    page?: number;
    size?: number;
  };
};

export type ProductImageSearchBody = {
  imageUrl: string;
  limit?: number;
};

export type ProductImageSearchResult = {
  items: ProductOut[];
  total: number;
};

export type FileUploadApiResponse = {
  code?: string;
  success?: boolean;
  data?:
    | string
    | {
        url?: string;
        imageUrl?: string;
        fileUrl?: string;
      };
};
