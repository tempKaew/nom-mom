"use client";

import { calcAge } from "@/utils/time";
import { PlusIcon } from "@/components/icons";
import { MESSAGES } from "@/constants/messages";

type Metric = { label: string; unit: string; value: string | null };

type Props = {
  babyName?: string;
  birthDate?: string | null;
  metrics: Metric[];
  onAdd: () => void;
};

export function GrowthHeader({ babyName, birthDate, metrics, onAdd }: Props) {
  return (
    <header
      className="px-4 pt-5 pb-6"
      style={{ background: "linear-gradient(135deg, #eefbeb 0%, #d3f5cc 100%)" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-green-900">
            {MESSAGES.UI.NAV_GROWTH}
          </h1>
          {birthDate && babyName && (
            <p className="text-sm text-green-600 mt-0.5 font-medium">
              {babyName} · {calcAge(birthDate)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 bg-white/60 border border-green-200 text-green-700 rounded-full px-4 py-2 text-sm font-semibold transition-colors shadow-sm hover:bg-white"
        >
          <PlusIcon size={15} className="text-green-600" />
          บันทึก
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mt-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white/60 border border-green-100 rounded-2xl px-3 py-3 text-center">
            <p className="text-[10px] font-bold text-green-500 uppercase tracking-wide mb-1">
              {m.label}
            </p>
            <p className="text-2xl font-bold text-green-900 leading-none">
              {m.value ?? "—"}
            </p>
            <p className="text-[11px] text-green-500 mt-0.5">{m.unit}</p>
          </div>
        ))}
      </div>
    </header>
  );
}

