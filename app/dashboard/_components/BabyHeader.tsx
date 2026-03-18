"use client";

import Image from "next/image";
import Link from "next/link";
import { calcAge } from "@/utils/time";
import {
  ChevronDownIcon,
  PlusIcon,
  RulerIcon,
  WeightIcon,
} from "@/components/icons";
import type { BabyWithRole, GrowthRecord } from "@/types/app";
import { MESSAGES } from "@/constants/messages";

interface Props {
  babies: BabyWithRole[];
  selectedBaby: BabyWithRole | null;
  onSwitchBaby: () => void;
  latestGrowth?: GrowthRecord | null;
}

export function BabyHeader({ babies, selectedBaby, onSwitchBaby, latestGrowth }: Props) {
  return (
    <header
      className="shrink-0 px-4 pt-6 pb-5"
      style={{ background: "linear-gradient(135deg, #eefbeb 0%, #d3f5cc 100%)" }}
    >
      {babies.length === 0 ? (
        /* ── No baby yet ── */
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/babies/new"
            className="w-11 h-11 rounded-full border-2 border-dashed border-green-300 flex items-center justify-center"
          >
            <PlusIcon size={20} className="text-green-500" />
          </Link>
          <p className="text-sm text-green-700">{MESSAGES.UI.ADD_BABY_TO_START}</p>
        </div>
      ) : selectedBaby ? (
        /* ── Baby info ── */
        <button
          type="button"
          onClick={onSwitchBaby}
          className="w-full flex items-center gap-3.5 text-left"
        >
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full border-2 border-green-200 shadow-sm overflow-hidden shrink-0 bg-white/50">
            {selectedBaby.avatar_url ? (
              <Image
                src={selectedBaby.avatar_url}
                alt=""
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-green-700 font-bold text-xl">
                  {selectedBaby.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Name + age + dropdown */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-green-900 tracking-wide truncate">
                {selectedBaby.name}
              </span>
              <ChevronDownIcon size={14} className="text-green-500 shrink-0" />
            </div>
            {selectedBaby.birth_date && (
              <p className="text-xs text-green-600 mt-0.5 font-medium">
                {calcAge(selectedBaby.birth_date)}
              </p>
            )}
          </div>

          {/* Growth metric pills */}
          <div className="shrink-0 flex flex-col items-end gap-1.5">
            <span className="inline-flex items-center gap-1 bg-white/60 border border-green-100 rounded-full px-2.5 py-1 text-[11px] font-semibold text-green-800">
              <WeightIcon size={11} className="text-green-500" />
              {latestGrowth?.weight_kg != null ? `${latestGrowth.weight_kg} kg` : "— kg"}
            </span>
            <span className="inline-flex items-center gap-1 bg-white/60 border border-green-100 rounded-full px-2.5 py-1 text-[11px] font-semibold text-green-800">
              <RulerIcon size={11} className="text-green-500" />
              {latestGrowth?.height_cm != null ? `${latestGrowth.height_cm} cm` : "— cm"}
            </span>
          </div>
        </button>
      ) : null}
    </header>
  );
}
