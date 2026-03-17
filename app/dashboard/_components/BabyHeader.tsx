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
    <header className="bg-surface px-4 pt-5 pb-4 shadow-sm shrink-0">
      {babies.length === 0 ? (
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/babies/new"
            className="w-11 h-11 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center"
          >
            <PlusIcon size={20} className="text-gray-400" />
          </Link>
          <p className="text-sm text-gray-500">{MESSAGES.UI.ADD_BABY_TO_START}</p>
        </div>
      ) : selectedBaby ? (
        <button
          type="button"
          onClick={onSwitchBaby}
          className="w-full flex items-center gap-3 text-left"
        >
          <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden shrink-0">
            {selectedBaby.avatar_url ? (
              <Image
                src={selectedBaby.avatar_url}
                alt=""
                width={44}
                height={44}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-blue-600 font-bold text-lg">
                {selectedBaby.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-gray-900 uppercase tracking-wide">
                {selectedBaby.name}
              </span>
              {selectedBaby.birth_date && (
                <>
                  <span className="text-gray-300 text-xs">·</span>
                  <span className="text-xs text-gray-400 uppercase font-medium">
                    {calcAge(selectedBaby.birth_date)}
                  </span>
                </>
              )}
              <ChevronDownIcon size={12} className="text-gray-400 ml-0.5" />
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-gray-400 flex flex-row items-center">
                <WeightIcon size={12} className="mr-0.5 text-gray-300" />
                {latestGrowth?.weight_kg != null
                  ? `${latestGrowth.weight_kg} kg`
                  : `${MESSAGES.UI.WEIGHT} —`}
              </span>
              <span className="text-xs text-gray-400 flex flex-row items-center">
                <RulerIcon size={12} className="mr-0.5 text-gray-300" />
                {latestGrowth?.height_cm != null
                  ? `${latestGrowth.height_cm} cm`
                  : `${MESSAGES.UI.HEIGHT} —`}
              </span>
            </div>
          </div>
        </button>
      ) : null}
    </header>
  );
}
