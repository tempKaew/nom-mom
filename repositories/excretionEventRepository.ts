import { supabaseServer } from "@/lib/supabase/server";
import type {
  ExcretionEvent,
  CreateExcretionEventPayload,
} from "@/types/app";

// ─── Read ──────────────────────────────────────────────────────────────────────

export async function getExcretionEventsByBabyId(
  babyId: string,
  limit: number,
  from?: string,
  to?: string
): Promise<ExcretionEvent[]> {
  let query = supabaseServer
    .from("excretion_event")
    .select(
      "id, baby_id, type, datetime, diaper_used, pee_amount, pee_color, poop_color, poop_texture, poop_amount, smell, rash, leak, note, created_at"
    )
    .eq("baby_id", babyId)
    .order("datetime", { ascending: false })
    .limit(limit);

  if (from) query = query.gte("datetime", from);
  if (to)   query = query.lte("datetime", to);

  const { data, error } = await query;
  if (error) throw new Error(error.message ?? "Failed to load excretion events");
  return (data ?? []) as ExcretionEvent[];
}

// ─── Write ─────────────────────────────────────────────────────────────────────

export async function updateExcretionEvent(
  id: string,
  babyId: string,
  fields: Partial<{
    type: string;
    datetime: string;
    diaper_used: boolean;
    pee_amount: string | null;
    pee_color: string | null;
    poop_color: string | null;
    poop_texture: string | null;
    poop_amount: string | null;
    smell: string | null;
    rash: boolean | null;
    leak: boolean | null;
    note: string | null;
  }>
): Promise<ExcretionEvent | null> {
  const SELECT =
    "id, baby_id, type, datetime, diaper_used, pee_amount, pee_color, poop_color, poop_texture, poop_amount, smell, rash, leak, note, created_at";

  const { data, error } = await supabaseServer
    .from("excretion_event")
    .update(fields)
    .eq("id", id)
    .eq("baby_id", babyId)
    .select(SELECT)
    .single();

  if (error || !data) {
    console.error("[excretionEventRepository] updateExcretionEvent error:", error);
    return null;
  }
  return data as ExcretionEvent;
}

export async function createExcretionEvent(
  params: CreateExcretionEventPayload & { user_id: string }
): Promise<ExcretionEvent | null> {
  const row = {
    baby_id:      params.baby_id,
    user_id:      params.user_id,
    type:         params.type,
    datetime:     params.datetime ?? new Date().toISOString(),
    diaper_used:  params.diaper_used ?? true,

    pee_amount:   params.pee?.amount   ?? null,
    pee_color:    params.pee?.color    ?? null,

    poop_color:   params.poop?.color   ?? null,
    poop_texture: params.poop?.texture ?? null,
    poop_amount:  params.poop?.amount  ?? null,

    smell: params.smell ?? null,
    rash:  params.rash  ?? null,
    leak:  params.leak  ?? null,
    note:  params.note  ?? null,
  };

  const { data, error } = await supabaseServer
    .from("excretion_event")
    .insert(row)
    .select(
      "id, baby_id, type, datetime, diaper_used, pee_amount, pee_color, poop_color, poop_texture, poop_amount, smell, rash, leak, note, created_at"
    )
    .single();

  if (error || !data) {
    console.error("[excretionEventRepository] createExcretionEvent error:", error);
    return null;
  }
  return data as ExcretionEvent;
}

// ─── Stats ─────────────────────────────────────────────────────────────────────

export async function getDiaperUsageStats(
  babyId: string,
  from?: string,
  to?: string
): Promise<{ diaper_used_count: number; total_count: number }> {
  let query = supabaseServer
    .from("excretion_event")
    .select("diaper_used", { count: "exact", head: false })
    .eq("baby_id", babyId);

  if (from) query = query.gte("datetime", from);
  if (to)   query = query.lte("datetime", to);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message ?? "Failed to load diaper usage stats");

  const diaperUsedCount = (data ?? []).filter((r: { diaper_used: boolean }) => r.diaper_used).length;
  return { diaper_used_count: diaperUsedCount, total_count: count ?? 0 };
}

export async function getExcretionSummary(
  babyId: string,
  from?: string,
  to?: string
): Promise<{ pee_count: number; poop_count: number; both_count: number; total_count: number }> {
  let query = supabaseServer
    .from("excretion_event")
    .select("type")
    .eq("baby_id", babyId);

  if (from) query = query.gte("datetime", from);
  if (to)   query = query.lte("datetime", to);

  const { data, error } = await query;
  if (error) throw new Error(error.message ?? "Failed to load excretion summary");

  const rows = (data ?? []) as { type: string }[];
  return {
    pee_count:   rows.filter((r) => r.type === "pee").length,
    poop_count:  rows.filter((r) => r.type === "poop").length,
    both_count:  rows.filter((r) => r.type === "both").length,
    total_count: rows.length,
  };
}
