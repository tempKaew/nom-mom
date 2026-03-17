import { supabaseServer } from "@/lib/supabase/server";
import { API_DEFAULTS } from "@/constants/api";

export type SleepLogRow = {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  type: string;
  notes: string | null;
};

const SELECT_FIELDS =
  "id, started_at, ended_at, duration_minutes, type, notes";

export async function getSleepLogsByBabyId(
  babyId: string,
  limit: number = API_DEFAULTS.LOGS_LIMIT_DEFAULT,
  from?: string,
  to?: string
): Promise<SleepLogRow[]> {
  let query = supabaseServer
    .from("sleep_logs")
    .select(SELECT_FIELDS)
    .eq("baby_id", babyId)
    .order("started_at", { ascending: false });

  if (from) query = query.gte("started_at", from);
  if (to) query = query.lte("started_at", to);

  const { data, error } = await query.limit(limit);

  if (error) throw new Error(error.message ?? "Failed to load sleep logs");
  return (data ?? []) as SleepLogRow[];
}

export async function createSleepLog(params: {
  baby_id: string;
  user_id: string;
  started_at: string;
  ended_at?: string | null;
  duration_minutes?: number | null;
  type?: string;
  notes?: string | null;
}): Promise<SleepLogRow | null> {
  const durationMinutes =
    params.duration_minutes ??
    (params.ended_at
      ? Math.round(
          (new Date(params.ended_at).getTime() -
            new Date(params.started_at).getTime()) /
            60000
        )
      : null);

  const { data, error } = await supabaseServer
    .from("sleep_logs")
    // @ts-expect-error - insert type inference with generic Database
    .insert({
      baby_id: params.baby_id,
      user_id: params.user_id,
      started_at: params.started_at,
      ended_at: params.ended_at ?? null,
      duration_minutes: durationMinutes,
      type: params.type ?? "nap",
      notes: params.notes ?? null,
    })
    .select(SELECT_FIELDS)
    .single();

  if (error || !data) {
    console.error("[sleepLogRepository] createSleepLog error:", error);
    return null;
  }
  return data as SleepLogRow;
}
