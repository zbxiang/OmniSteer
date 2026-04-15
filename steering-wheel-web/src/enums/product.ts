export const ProductStatusEnum = {
  UP: 'UP',
  DOWN: 'DOWN',
} as const;

export type ProductStatus = (typeof ProductStatusEnum)[keyof typeof ProductStatusEnum];
