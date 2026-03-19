"use client";

import { XIcon } from "@/components/icons";
import type { HowToTarget } from "./development.types";

type Props = {
  target: HowToTarget;
  tips: string[];
  onClose: () => void;
};

export function DevelopmentHowToSheet({ target, tips, onClose }: Props) {
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
          <h4 className="text-base font-bold text-gray-900">วิธีส่งเสริมให้ทำได้</h4>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
          >
            <XIcon size={14} />
          </button>
        </div>
        <div className="px-5 pb-6 space-y-3 overflow-y-auto">
          <p className="text-sm font-semibold text-gray-800">{target.label}</p>
          <div className="space-y-2">
            {tips.map((tip) => (
              <div key={tip} className="rounded-xl bg-purple-50 border border-purple-100 px-3 py-2">
                <p className="text-xs text-purple-800 leading-relaxed">• {tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
