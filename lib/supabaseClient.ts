import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { ENV_KEYS } from "@/config/env";

const supabaseUrl = process.env[ENV_KEYS.SUPABASE_URL] ?? "";
const supabaseAnonKey = process.env[ENV_KEYS.SUPABASE_ANON_KEY] ?? "";

/**
 * Reusable Supabase client for server-side and API routes.
 * Uses SUPABASE_URL and SUPABASE_ANON_KEY from environment.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
