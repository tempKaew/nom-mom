import type { UserRow, BabyRow, MemberRow } from "./database";

/** Baby with role info (from /api/me) */
export type BabyWithRole = BabyRow & {
  role: string;
  is_owner: boolean;
};

export type MeData = {
  user: UserRow;
  babies: BabyWithRole[];
};

export type MilkLog = {
  id: string;
  type: string;
  amount_ml: number | null;
  duration_minutes: number | null;
  logged_at: string;
  notes: string | null;
};

/** @deprecated Use ExcretionEvent instead */
export type DiaperLog = {
  id: string;
  type: string;
  method: string;
  logged_at: string;
  notes: string | null;
};

export type ExcretionType = "pee" | "poop" | "both";
export type PeeAmount = "small" | "medium" | "large";
export type PeeColor = "clear" | "light_yellow" | "dark_yellow";
export type PoopColor = "yellow" | "green" | "brown" | "black" | "pale";
export type PoopTexture = "watery" | "soft" | "normal" | "hard" | "mucus";
export type PoopAmount = "small" | "medium" | "large";
export type SmellType = "normal" | "strong" | "unusual";

export type ExcretionEvent = {
  id: string;
  baby_id: string;
  type: ExcretionType;
  datetime: string;
  diaper_used: boolean;
  pee_amount: PeeAmount | null;
  pee_color: PeeColor | null;
  poop_color: PoopColor | null;
  poop_texture: PoopTexture | null;
  poop_amount: PoopAmount | null;
  smell: SmellType | null;
  rash: boolean | null;
  leak: boolean | null;
  note: string | null;
  created_at: string;
};

export type CreateExcretionEventPayload = {
  baby_id: string;
  type: ExcretionType;
  datetime?: string;
  diaper_used?: boolean;
  pee?: { amount?: PeeAmount; color?: PeeColor } | null;
  poop?: { color?: PoopColor; texture?: PoopTexture; amount?: PoopAmount } | null;
  smell?: SmellType | null;
  rash?: boolean | null;
  leak?: boolean | null;
  note?: string | null;
};

export type GrowthRecord = {
  id: string;
  recorded_at: string;
  weight_kg: number | null;
  height_cm: number | null;
  head_circumference_cm: number | null;
  notes: string | null;
};

export type SleepLog = {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  type: string;
  notes: string | null;
};

export type PumpingType = "normal" | "power" | "relieve";
export type BreastCondition = "engorged" | "normal" | "soft";
export type PainLevel = "painful" | "no_pain";
export type StorageType = "immediate" | "room_temp" | "frozen";

export type PumpingSession = {
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

export type Appointment = {
  id: string;
  title: string;
  doctor_name: string | null;
  hospital: string | null;
  appointment_at: string;
  notes: string | null;
  status: string;
};

export type InviteRow = {
  id: string;
  baby_id: string;
  token: string;
  label: string | null;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
};
