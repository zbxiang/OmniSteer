import { isUndefined, isNull } from 'lodash-es';
import { ProductStatusEnum, type ProductStatus } from '@/enums/product';

export const isEmptyData = (params: string | null | undefined | boolean | number): boolean => {
  return isUndefined(params) || isNull(params) || params === '';
};

/** 剔除普通对象中的空字符串与 null、undefined（用于查询参数等） */
export const filterEmptyData = (params: any): any => {
 for (const key in params) {
  if (isEmptyData(params[key])) {
    delete params[key];
  }
 }
 return params;
};

/** 将接口返回的 state / 旧 status 统一为 UP | DOWN */
export function normalizeProductStateFromOut(input: {
  state?: string | null;
  status?: string | null;
}): ProductStatus {
  const raw = input.state ?? input.status ?? '';
  const normalized = String(raw).trim().toUpperCase();
  if (normalized === ProductStatusEnum.DOWN || normalized === 'OFF') {
    return ProductStatusEnum.DOWN;
  }
  return ProductStatusEnum.UP;
}
