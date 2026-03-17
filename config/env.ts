/**
 * Environment variable keys and validation.
 * Use these instead of process.env directly for discoverability.
 */

export const ENV_KEYS = {
  NEXT_PUBLIC_LIFF_ID: "NEXT_PUBLIC_LIFF_ID",
  LIFF_CHANNEL_ID: "LIFF_CHANNEL_ID",
  SUPABASE_URL: "SUPABASE_URL",
  SUPABASE_ANON_KEY: "SUPABASE_ANON_KEY",
  SUPABASE_SERVICE_ROLE_KEY: "SUPABASE_SERVICE_ROLE_KEY",
} as const;

export function getLiffId(): string | undefined {
  return process.env.NEXT_PUBLIC_LIFF_ID?.trim() || undefined;
}

export function getLiffChannelId(): string | undefined {
  return process.env[ENV_KEYS.LIFF_CHANNEL_ID]?.trim() || undefined;
}
