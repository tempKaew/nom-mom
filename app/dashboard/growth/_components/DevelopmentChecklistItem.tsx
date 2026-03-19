"use client";

import { CheckCircleIcon } from "@/components/icons";
import type { DevItem } from "./development.types";
import { formatCheckedAt } from "./development.utils";

type Props = {
  item: DevItem;
  checkedAt?: string;
  onToggle: (item: DevItem) => void;
  onHowTo: (item: DevItem) => void;
};

export function DevelopmentChecklistItem({
  item,
  checkedAt,
  onToggle,
  onHowTo,
}: Props) {
  const checked = !!checkedAt;

  return (
    <div
      className={`w-full rounded-xl border px-3 py-2.5 text-left transition-all active:scale-[0.99] ${
        checked ? "border-emerald-200 bg-emerald-50" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => onToggle(item)}
          className="flex items-start gap-2 min-w-0 flex-1"
        >
          <span className={`mt-0.5 ${checked ? "text-emerald-500" : "text-gray-300"}`}>
            <CheckCircleIcon size={14} />
          </span>
          <div className="min-w-0">
            <p
              className={`text-xs leading-relaxed ${
                checked ? "text-emerald-700 font-semibold" : "text-gray-700"
              }`}
            >
              {item.label}
            </p>
            {checkedAt && (
              <p className="text-[11px] text-emerald-600 mt-1">
                ทำได้เมื่อ: {formatCheckedAt(checkedAt)}
              </p>
            )}
          </div>
        </button>
        <button
          type="button"
          onClick={() => onHowTo(item)}
          className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
        >
          how to
        </button>
      </div>
    </div>
  );
}

