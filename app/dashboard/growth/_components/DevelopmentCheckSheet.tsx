"use client";

import { XIcon } from "@/components/icons";
import type { PendingTarget } from "./development.types";

type Props = {
  target: PendingTarget;
  pendingAt: string;
  onChangePendingAt: (val: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function DevelopmentCheckSheet({
  target,
  pendingAt,
  onChangePendingAt,
  onClose,
  onConfirm,
}: Props) {
  if (!target) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center !mt-0" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-full bg-white rounded-t-3xl shadow-2xl max-h-[80dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 shrink-0" />
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <h4 className="text-base font-bold text-gray-900">ระบุวันเวลา</h4>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
          >
            <XIcon size={14} />
          </button>
        </div>
        <div className="px-5 pb-4 space-y-3">
          <p className="text-sm text-gray-700">{target.label}</p>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              วันและเวลาที่ทำได้
            </p>
            <input
              type="datetime-local"
              value={pendingAt}
              onChange={(e) => onChangePendingAt(e.target.value)}
              className="block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none"
            />
          </div>
        </div>
        <div className="px-5 pb-6 pt-2 border-t border-gray-100 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-24 shrink-0 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl bg-purple-500 text-white text-sm font-bold"
          >
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}

