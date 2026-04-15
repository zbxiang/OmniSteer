import { ProductStatusEnum, type ProductStatus } from '@/enums/product';

/** 将接口返回的 state / 旧 status 统一为 UP | DOWN */
export function normalizeProductStateFromOut(input: {
  state?: string | null;
  status?: string | null;
}): ProductStatus {
  const raw = input.state ?? input.status ?? '';
  const u = String(raw).trim().toUpperCase();
  if (u === ProductStatusEnum.DOWN || u === 'OFF') {
    return ProductStatusEnum.DOWN;
  }
  return ProductStatusEnum.UP;
}
