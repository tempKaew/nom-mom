export type DevItem = { id: string; label: string };
export type DevGroup = {
  label: string;
  monthStart: number;
  monthEnd: number;
  items: DevItem[];
};

export type CheckedMap = Record<string, string>; // itemId -> ISO datetime
export type PendingTarget = DevItem | null;
export type HowToTarget = DevItem | null;

