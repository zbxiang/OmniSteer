export type ProductLite = {
  name: string;
  brand: string;
  model: string;
};

export type ProductItem = {
  id: number;
  name: string;
  brand: string;
  model: string;
  price: number;
  status: 'on' | 'off';
};

export type ProductFormData = {
  name: string;
  brand: string;
  model: string;
  price: number;
  status: 'on' | 'off';
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

export type ProductDetailItem = ProductEditSeed & {
  date: string;
  desc: string;
};

export type ProductCreateBody = {
  name: string;
  brand: string;
  model: string;
  price: number;
  status: 'on' | 'off';
  material?: string;
  diameter?: number;
  weight?: number;
  mount?: string;
  description?: string;
  images: string[];
};

export type ProductOut = {
  id: number;
  name: string;
  brand: string;
  model: string;
  price: number;
  status: string;
  material: string | null;
  diameter: number | null;
  weight: number | null;
  mount: string | null;
  description: string | null;
  images: string[];
  created_at: string;
};
