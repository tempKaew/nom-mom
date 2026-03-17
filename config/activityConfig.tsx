import {
  BabyIcon,
  BottleMilkIcon,
  MoonIcon,
  StethoscopeIcon,
  BreastPumpIcon,
  CalendarIcon,
  ToiletIcon,
  DropletsIcon,
  SproutIcon,
  CirclePileIcon,
} from "@/components/icons";
import type {
  MilkLog,
  ExcretionEvent,
  SleepLog,
  PumpingSession,
} from "@/types/app";
import { MESSAGES } from "@/constants/messages";

// ─── Shared Activity type ─────────────────────────────────────────────────────

export type Activity = {
  id: string;
  category: "feeding" | "diaper" | "sleep" | "pumping";
  type: string;
  logged_at: string;
  icon: React.ReactNode;
  label: string;
  detail: string;
  notes?: string | null;
};

// ─── Category styles (bg, text, detail color) ────────────────────────────────

export const CATEGORY_STYLES: Record<
  "feeding" | "diaper" | "sleep" | "pumping",
  { bg: string; text: string; detail: string }
> = {
  feeding: {
    bg: "bg-feeding-bg",
    text: "text-feeding",
    detail: "text-feeding-muted",
  },
  diaper: {
    bg: "bg-diaper-bg",
    text: "text-diaper",
    detail: "text-diaper-muted",
  },
  sleep: { bg: "bg-sleep-bg", text: "text-sleep", detail: "text-sleep-muted" },
  pumping: {
    bg: "bg-feeding-bg",
    text: "text-feeding",
    detail: "text-feeding-muted",
  },
};

// ─── Milk type config ─────────────────────────────────────────────────────────

export const MILK_TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; detail: (l: MilkLog) => string }
> = {
  breast: {
    label: MESSAGES.UI.ACTIVITY_BREASTFEED,
    icon: <BabyIcon size={22} />,
    detail: (l) =>
      [l.duration_minutes ? `${l.duration_minutes} นาที` : null]
        .filter(Boolean)
        .join(" · ") || MESSAGES.UI.ACTIVITY_BREASTFEED,
  },
  bottle: {
    label: MESSAGES.UI.ACTIVITY_BOTTLE,
    icon: <BottleMilkIcon size={22} />,
    detail: (l) =>
      [
        l.amount_ml ? `${l.amount_ml} ml` : null,
        l.duration_minutes ? `${l.duration_minutes} นาที` : null,
      ]
        .filter(Boolean)
        .join(" · ") || MESSAGES.UI.ACTIVITY_BOTTLE,
  },
  pump: {
    label: MESSAGES.UI.ACTIVITY_PUMP,
    icon: <BreastPumpIcon size={22} />,
    detail: (l) =>
      [
        l.amount_ml ? `${l.amount_ml} ml` : null,
        l.duration_minutes ? `${l.duration_minutes} นาที` : null,
      ]
        .filter(Boolean)
        .join(" · ") || MESSAGES.UI.ACTIVITY_PUMP,
  },
  formula: {
    label: MESSAGES.UI.ACTIVITY_FORMULA,
    icon: <BottleMilkIcon size={22} />,
    detail: (l) =>
      l.amount_ml ? `${l.amount_ml} ml` : MESSAGES.UI.ACTIVITY_FORMULA,
  },
  cow_milk: {
    label: "นมวัว",
    icon: <BottleMilkIcon size={22} />,
    detail: (l) => (l.amount_ml ? `${l.amount_ml} ml นมวัว` : "นมวัว"),
  },
  plant_milk: {
    label: "นมพืช",
    icon: <BottleMilkIcon size={22} />,
    detail: (l) => (l.amount_ml ? `${l.amount_ml} ml นมพืช` : "นมพืช"),
  },
  other: {
    label: "นมอื่นๆ",
    icon: <BottleMilkIcon size={22} />,
    detail: (l) => (l.amount_ml ? `${l.amount_ml} ml` : "นมอื่นๆ"),
  },
};

// ─── Excretion event helpers ──────────────────────────────────────────────────

const EXCRETION_TYPE_LABELS: Record<
  string,
  { emoji: React.ReactNode; detail: string }
> = {
  pee: { emoji: <DropletsIcon size={22} />, detail: MESSAGES.UI.DIAPER_WET },
  poop: {
    emoji: <CirclePileIcon size={22} />,
    detail: MESSAGES.UI.DIAPER_DIRTY,
  },
  both: {
    emoji: <SproutIcon size={22} />,
    detail: MESSAGES.UI.DIAPER_BOTH,
  },
};

function excretionDetail(e: ExcretionEvent): string {
  const parts: string[] = [];

  if (e.type === "pee" || e.type === "both") {
    if (e.pee_amount)
      parts.push(
        e.pee_amount === "small"
          ? "ฉี่น้อย"
          : e.pee_amount === "large"
            ? "ฉี่เยอะ"
            : "ฉี่ปกติ",
      );
    if (e.pee_color) parts.push(peeColorLabel(e.pee_color));
  }
  if (e.type === "poop" || e.type === "both") {
    if (e.poop_texture) parts.push(poopTextureLabel(e.poop_texture));
    if (e.poop_color) parts.push(poopColorLabel(e.poop_color));
  }
  if (e.rash) parts.push("มีผื่น");
  if (e.leak) parts.push("รั่ว");

  const base =
    EXCRETION_TYPE_LABELS[e.type]?.detail ?? MESSAGES.UI.ACTIVITY_EXCRETION;
  return parts.length ? `${base} · ${parts.join(" · ")}` : base;
}

function peeColorLabel(c: string): string {
  const map: Record<string, string> = {
    clear: "ฉี่ใส",
    light_yellow: "เหลืองอ่อน",
    dark_yellow: "เหลืองเข้ม",
  };
  return map[c] ?? c;
}

function poopTextureLabel(t: string): string {
  const map: Record<string, string> = {
    watery: "เหลว",
    soft: "นิ่ม",
    normal: "ปกติ",
    hard: "แข็ง",
    mucus: "มีมูก",
  };
  return map[t] ?? t;
}

function poopColorLabel(c: string): string {
  const map: Record<string, string> = {
    yellow: "เหลือง",
    green: "เขียว",
    brown: "น้ำตาล",
    black: "ดำ",
    pale: "ซีด",
  };
  return map[c] ?? c;
}

// ─── Quick action buttons config ─────────────────────────────────────────────

export type QuickBtnType =
  | "feeding"
  | "pump"
  | "appointment"
  | "diaper"
  | "sleep"
  | "medical";

export const QUICK_BTN_CONFIG: Record<
  QuickBtnType,
  {
    label: string;
    icon: React.ReactNode;
    bg: string;
    iconColor: string;
    comingSoon?: boolean;
  }
> = {
  feeding: {
    label: MESSAGES.UI.ACTIVITY_FEEDING,
    icon: <BabyIcon size={22} />,
    bg: "bg-feeding-bg",
    iconColor: "text-feeding",
  },
  pump: {
    label: MESSAGES.UI.ACTIVITY_PUMP,
    icon: <BreastPumpIcon size={22} />,
    bg: "bg-feeding-bg",
    iconColor: "text-feeding",
  },
  appointment: {
    label: MESSAGES.UI.ACTIVITY_APPOINTMENT,
    icon: <CalendarIcon size={22} />,
    bg: "bg-medical-bg",
    iconColor: "text-medical",
  },
  diaper: {
    label: MESSAGES.UI.ACTIVITY_EXCRETION,
    icon: <ToiletIcon size={22} />,
    bg: "bg-diaper-bg",
    iconColor: "text-diaper",
  },
  sleep: {
    label: MESSAGES.UI.ACTIVITY_SLEEP,
    icon: <MoonIcon size={22} />,
    bg: "bg-sleep-bg",
    iconColor: "text-sleep",
  },
  medical: {
    label: MESSAGES.UI.ACTIVITY_MEDICAL,
    icon: <StethoscopeIcon size={22} />,
    bg: "bg-medical-bg",
    iconColor: "text-medical",
    comingSoon: true,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function sleepDurationLabel(log: SleepLog): string {
  const mins = log.duration_minutes;
  if (mins == null || mins <= 0)
    return log.type === "night" ? "นอนกลางคืน" : "งีบ";
  if (mins < 60) return `${mins} นาที`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} ชม. ${m} นาที` : `${h} ชั่วโมง`;
}

const PUMPING_TYPE_LABELS: Record<string, string> = {
  normal: "ปั๊มปกติ",
  power: "Power Pump",
  relieve: "แก้คัดเต้า",
};

const STORAGE_TYPE_LABELS: Record<string, string> = {
  immediate: "ให้เลย",
  room_temp: "ช่องธรรมดา",
  frozen: "แช่แข็ง",
};

function pumpingDetail(s: PumpingSession): string {
  const parts: string[] = [];
  if (s.pumping_type && s.pumping_type !== "normal") {
    parts.push(PUMPING_TYPE_LABELS[s.pumping_type] ?? s.pumping_type);
  }
  if (s.total_volume_ml > 0) parts.push(`${s.total_volume_ml} ml`);
  if (s.duration_minutes) parts.push(`${s.duration_minutes} นาที`);
  if (s.storage_type && s.storage_type !== "immediate") {
    parts.push(STORAGE_TYPE_LABELS[s.storage_type] ?? s.storage_type);
  }
  return parts.join(" · ") || "ปั๊มนม";
}

export function buildActivities(
  milkLogs: MilkLog[],
  excretionEvents: ExcretionEvent[],
  sleepLogs: SleepLog[],
  pumpingSessions: PumpingSession[] = [],
): Activity[] {
  const feeding: Activity[] = milkLogs.map((l) => {
    const cfg = MILK_TYPE_CONFIG[l.type] ?? MILK_TYPE_CONFIG.bottle;
    return {
      id: l.id,
      category: "feeding",
      type: l.type,
      logged_at: l.logged_at,
      icon: cfg.icon,
      label: cfg.label,
      detail: cfg.detail(l),
      notes: l.notes,
    };
  });

  const excretion: Activity[] = excretionEvents.map((e) => {
    const cfg = EXCRETION_TYPE_LABELS[e.type] ?? { emoji: "💧", detail: "" };
    return {
      id: e.id,
      category: "diaper",
      type: e.type,
      logged_at: e.datetime,
      icon: <span className="text-[22px] leading-none">{cfg.emoji}</span>,
      label: MESSAGES.UI.ACTIVITY_EXCRETION,
      detail: excretionDetail(e),
      notes: e.note,
    };
  });

  const sleep: Activity[] = sleepLogs.map((l) => ({
    id: l.id,
    category: "sleep" as const,
    type: l.type,
    logged_at: l.started_at,
    icon: <MoonIcon size={22} />,
    label: l.type === "night" ? "นอนกลางคืน" : "งีบหลับ",
    detail: sleepDurationLabel(l),
    notes: l.notes,
  }));

  const pumping: Activity[] = pumpingSessions.map((s) => ({
    id: s.id,
    category: "pumping" as const,
    type: "pump",
    logged_at: s.start_time,
    icon: <BreastPumpIcon size={22} />,
    label: "ปั๊มนม",
    detail: pumpingDetail(s),
    notes: s.notes,
  }));

  return [...feeding, ...excretion, ...sleep, ...pumping].sort(
    (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime(),
  );
}
