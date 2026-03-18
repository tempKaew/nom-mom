import { supabaseServer } from "@/lib/supabase/server";
import { API_DEFAULTS } from "@/constants/api";

export type MilkLogRow = {
  id: string;
  type: string;
  amount_ml: number | null;
  duration_minutes: number | null;
  logged_at: string;
  notes: string | null;
};

export function parseLimitParam(
  value: string | null,
  defaultVal: number = API_DEFAULTS.LOGS_LIMIT_DEFAULT
): number {
  const parsed = parseInt(value ?? "", 10);
  if (Number.isNaN(parsed)) return defaultVal;
  return Math.min(
    Math.max(API_DEFAULTS.LOGS_LIMIT_MIN, parsed),
    API_DEFAULTS.LOGS_LIMIT_MAX
  );
}

export async function getMilkLogsByBabyId(
  babyId: string,
  limit: number,
  from?: string,
  to?: string
): Promise<MilkLogRow[]> {
  let query = supabaseServer
    .from("milk_logs")
    .select("id, type, amount_ml, duration_minutes, logged_at, notes")
    .eq("baby_id", babyId)
    .order("logged_at", { ascending: false });

  if (from) query = query.gte("logged_at", from);
  if (to) query = query.lte("logged_at", to);

  const { data, error } = await query.limit(limit);

  if (error) throw new Error(error.message ?? "Failed to load milk logs");
  return (data ?? []) as MilkLogRow[];
}

export async function updateMilkLog(
  id: string,
  babyId: string,
  fields: {
    type?: string;
    amount_ml?: number | null;
    duration_minutes?: number | null;
    notes?: string | null;
    logged_at?: string;
  }
): Promise<MilkLogRow | null> {
  const { data, error } = await supabaseServer
    .from("milk_logs")
    // @ts-expect-error - update type inference with generic Database
    .update(fields)
    .eq("id", id)
    .eq("baby_id", babyId)
    .select("id, type, amount_ml, duration_minutes, logged_at, notes")
    .single();

  if (error || !data) {
    console.error("[milkLogRepository] updateMilkLog error:", error);
    return null;
  }
  return data as MilkLogRow;
}

export async function createMilkLog(params: {
  baby_id: string;
  user_id: string;
  type: string;
  amount_ml: number | null;
  duration_minutes: number | null;
  notes: string | null;
  logged_at?: string | null;
}): Promise<MilkLogRow | null> {
  const { data, error } = await supabaseServer
    .from("milk_logs")
    // @ts-expect-error - insert type inference with generic Database
    .insert({
      baby_id: params.baby_id,
      user_id: params.user_id,
      type: params.type,
      amount_ml: params.amount_ml,
      duration_minutes: params.duration_minutes,
      notes: params.notes,
      ...(params.logged_at ? { logged_at: params.logged_at } : {}),
    })
    .select("id, type, amount_ml, duration_minutes, logged_at, notes")
    .single();

  if (error || !data) {
    console.error("[milkLogRepository] createMilkLog error:", error);
    return null;
  }
  return data as MilkLogRow;
}
