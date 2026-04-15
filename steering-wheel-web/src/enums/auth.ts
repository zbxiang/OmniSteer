export const USER_STATUS = {
  NORMAL: 'normal', // 正常登录状态
  NO_USER: 'no_user', // 用户不存在
  LOCKED: 'locked', // 账户未启用
  INVALID_PASSWORD: 'invalid_password', // 密码错误
  EXPIRED_PASSWORD: 'expired_password', // 密码过期
  DISABLED: 'disabled', // 账户禁用
  EXPIRED: 'expired', // 账户过期
  NOT_ACTIVATED: 'not_activated', // 账户未激活
  NOT_VERIFIED: 'not_verified', // 账户未验证
  NOT_COMPLETED: 'not_completed', // 账户未完成
} as const;

export const LOGOUT_CODE = {
  LOGOUT: 'logout', // 退出登录
  EXPIRED: 'expired', // 登录过期
  FORCED: 'forced', // 强制退出
  OTHER: 'other', // 其他原因
} as const;

export const UserStatusEnum = USER_STATUS;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export type LogoutCode = (typeof LOGOUT_CODE)[keyof typeof LOGOUT_CODE];
