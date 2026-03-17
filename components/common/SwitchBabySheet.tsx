"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckIcon, PlusIcon } from "@/components/icons";

interface Baby {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface SwitchBabySheetProps {
  babies: Baby[];
  selectedBabyId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function SwitchBabySheet({
  babies,
  selectedBabyId,
  onSelect,
  onClose,
}: SwitchBabySheetProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full bg-white rounded-t-3xl p-6 pb-10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <p className="text-[11px] font-bold  text-gray-400 uppercase mb-4 text-center">
          Switch Baby
        </p>

        <div className="space-y-2">
          {babies.map((baby) => (
            <button
              key={baby.id}
              type="button"
              onClick={() => onSelect(baby.id)}
              className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors ${
                selectedBabyId === baby.id ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden shrink-0">
                {baby.avatar_url ? (
                  <Image
                    src={baby.avatar_url}
                    alt=""
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-blue-600 font-semibold text-base">
                    {baby.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-gray-900 font-medium">{baby.name}</span>
              {selectedBabyId === baby.id && (
                <CheckIcon size={18} className="ml-auto text-blue-500" />
              )}
            </button>
          ))}

          <Link
            href="/dashboard/babies/new"
            className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 hover:bg-gray-50 transition-colors"
            onClick={onClose}
          >
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center shrink-0">
              <PlusIcon size={18} className="text-gray-400" />
            </div>
            <span className="text-gray-500 font-medium">Add Baby</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
