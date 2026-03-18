"use client";

import { timeAgo, formatTime } from "@/utils/time";
import { MESSAGES } from "@/constants/messages";

export type QuickModal =
  | "feeding"
  | "pump"
  | "appointment"
  | "diaper"
  | "sleep"
  | null;

export type QuickBtnConfig = {
  key: QuickModal;
  label: string;
  icon: React.ReactNode;
  bg: string;       // used for icon-circle background
  iconColor: string;
  lastLog?: { logged_at: string } | null;
  comingSoon?: boolean;
};

interface Props {
  buttons: QuickBtnConfig[];
  onPress: (key: Exclude<QuickModal, null>) => void;
}

export function QuickRecord({ buttons, onPress }: Props) {
  return (
    <section className="px-4 pt-5">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
        {MESSAGES.UI.SECTION_QUICK_RECORD}
      </p>
      <div className="grid grid-cols-3 gap-2.5">
        {buttons.map((btn, i) => (
          <button
            key={i}
            type="button"
            onClick={() => btn.key && onPress(btn.key)}
            disabled={btn.comingSoon}
            className="bg-white rounded-2xl p-3 flex flex-col items-center gap-0 shadow-sm border border-gray-100/80 active:scale-95 transition-transform disabled:opacity-50"
          >
            {/* Icon circle */}
            <div className={`w-11 h-11 rounded-xl ${btn.bg} flex items-center justify-center mb-2 mt-1`}>
              <span className={`${btn.iconColor} text-[22px] leading-none`}>
                {btn.icon}
              </span>
            </div>

            {/* Label */}
            <span className="text-xs font-semibold text-gray-700 text-center leading-tight">
              {btn.label}
            </span>

            {/* Last log info */}
            {btn.comingSoon ? (
              <span className="text-[9px] text-gray-300 font-medium mt-1">
                {MESSAGES.UI.COMING_SOON}
              </span>
            ) : btn.lastLog ? (
              <div className="mt-1 text-center">
                <span className="text-[10px] text-gray-400 leading-tight block">
                  {timeAgo(btn.lastLog.logged_at)}
                </span>
                <span className="text-[10px] text-gray-300 leading-tight block">
                  {formatTime(btn.lastLog.logged_at)}
                </span>
              </div>
            ) : (
              <span className="text-[10px] text-gray-300 mt-1">—</span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
