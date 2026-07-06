import { supabaseServer } from "@/lib/supabase/server";
import { API_DEFAULTS } from "@/constants/api";

export type GrowthRecordRow = {
  id: string;
  recorded_at: string;
  weight_kg: number | null;
  height_cm: number | null;
  head_circumference_cm: number | null;
  notes: string | null;
};

const SELECT_FIELDS =
  "id, recorded_at, weight_kg, height_cm, head_circumference_cm, notes";

export async function getGrowthRecordsByBabyId(
  babyId: string,
  limit: number = API_DEFAULTS.LOGS_LIMIT_DEFAULT
): Promise<GrowthRecordRow[]> {
  const { data, error } = await supabaseServer
    .from("growth_records")
    .select(SELECT_FIELDS)
    .eq("baby_id", babyId)
    .order("recorded_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message ?? "Failed to load growth records");
  return (data ?? []) as GrowthRecordRow[];
}

export async function createGrowthRecord(params: {
  baby_id: string;
  user_id: string;
  recorded_at?: string;
  weight_kg: number | null;
  height_cm: number | null;
  head_circumference_cm: number | null;
  notes: string | null;
}): Promise<GrowthRecordRow | null> {
  const { data, error } = await supabaseServer
    .from("growth_records")
    .insert({
      baby_id: params.baby_id,
      user_id: params.user_id,
      ...(params.recorded_at ? { recorded_at: params.recorded_at } : {}),
      weight_kg: params.weight_kg,
      height_cm: params.height_cm,
      head_circumference_cm: params.head_circumference_cm,
      notes: params.notes,
    })
    .select(SELECT_FIELDS)
    .single();

  if (error || !data) {
    console.error("[growthRepository] createGrowthRecord error:", error);
    return null;
  }
  return data as GrowthRecordRow;
}

export async function updateGrowthRecord(
  id: string,
  babyId: string,
  fields: Partial<{
    recorded_at: string;
    weight_kg: number | null;
    height_cm: number | null;
    head_circumference_cm: number | null;
    notes: string | null;
  }>
): Promise<GrowthRecordRow | null> {
  const { data, error } = await supabaseServer
    .from("growth_records")
    .update(fields)
    .eq("id", id)
    .eq("baby_id", babyId)
    .select(SELECT_FIELDS)
    .single();

  if (error || !data) {
    console.error("[growthRepository] updateGrowthRecord error:", error);
    return null;
  }
  return data as GrowthRecordRow;
}
