import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { ENV_KEYS } from "@/config/env";

const supabaseUrl = process.env[ENV_KEYS.SUPABASE_URL] ?? "";
const serviceRoleKey = process.env[ENV_KEYS.SUPABASE_SERVICE_ROLE_KEY] ?? "";
const anonKey = process.env[ENV_KEYS.SUPABASE_ANON_KEY] ?? "";

const key = serviceRoleKey || anonKey;

/**
 * Server-side Supabase client for API routes and server code.
 * Prefer SUPABASE_SERVICE_ROLE_KEY; falls back to anon key.
 */
export const supabaseServer: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  key,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
