/**
 * API and storage constants.
 */

export const STORAGE_BUCKETS = {
  BABY_AVATARS: "baby-avatars",
} as const;

export const API_DEFAULTS = {
  LOGS_LIMIT_MIN: 1,
  LOGS_LIMIT_MAX: 50,
  LOGS_LIMIT_DEFAULT: 10,
} as const;

export const INVITE_DEFAULTS = {
  ROLE: "member",
  EXPIRES_IN_DAYS: 30,
} as const;

export const AVATAR_SIZE = 160;
