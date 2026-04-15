import { isUndefined, isNull } from 'lodash-es';

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
