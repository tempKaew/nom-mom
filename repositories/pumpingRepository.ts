import { supabaseServer } from "@/lib/supabase/server";
import { API_DEFAULTS } from "@/constants/api";
import type { PumpingType, BreastCondition, PainLevel, StorageType } from "@/types/app";

export type PumpingSessionRow = {
  id: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  left_volume_ml: number;
  right_volume_ml: number;
  total_volume_ml: number;
  pumping_type: PumpingType;
  breast_condition: BreastCondition | null;
  pain_level: PainLevel | null;
  storage_type: StorageType;
  note_text: string | null;
  note_tags: string[];
  notes: string | null;
  created_at: string;
};

const SELECT_FIELDS = [
  "id",
  "start_time",
  "end_time",
  "duration_minutes",
  "left_volume_ml",
  "right_volume_ml",
  "total_volume_ml",
  "pumping_type",
  "breast_condition",
  "pain_level",
  "storage_type",
  "note_text",
  "note_tags",
  "notes",
  "created_at",
].join(", ");

export async function getPumpingSessionsByBabyId(
  babyId: string,
  limit: number = API_DEFAULTS.LOGS_LIMIT_DEFAULT,
  from?: string,
  to?: string
): Promise<PumpingSessionRow[]> {
  let query = supabaseServer
    .from("pumping_sessions")
    .select(SELECT_FIELDS)
    .eq("baby_id", babyId)
    .order("start_time", { ascending: false });

  if (from) query = query.gte("start_time", from);
  if (to) query = query.lte("start_time", to);

  const { data, error } = await query.limit(limit);

  if (error) throw new Error(error.message ?? "Failed to load pumping sessions");
  return (data ?? []) as PumpingSessionRow[];
}

export async function createPumpingSession(params: {
  baby_id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  left_volume_ml: number;
  right_volume_ml: number;
  total_volume_ml: number;
  pumping_type: PumpingType;
  breast_condition: BreastCondition | null;
  pain_level: PainLevel | null;
  storage_type: StorageType;
  note_text: string | null;
  note_tags: string[];
  notes: string | null;
}): Promise<PumpingSessionRow | null> {
  const { data, error } = await supabaseServer
    .from("pumping_sessions")
    // @ts-expect-error - insert type inference with generic Database
    .insert({
      baby_id: params.baby_id,
      user_id: params.user_id,
      start_time: params.start_time,
      end_time: params.end_time,
      duration_minutes: params.duration_minutes,
      left_volume_ml: params.left_volume_ml,
      right_volume_ml: params.right_volume_ml,
      total_volume_ml: params.total_volume_ml,
      pumping_type: params.pumping_type,
      breast_condition: params.breast_condition,
      pain_level: params.pain_level,
      storage_type: params.storage_type,
      note_text: params.note_text,
      note_tags: params.note_tags,
      notes: params.notes,
    })
    .select(SELECT_FIELDS)
    .single();

  if (error || !data) {
    console.error("[pumpingRepository] createPumpingSession error:", error);
    return null;
  }
  return data as PumpingSessionRow;
}
