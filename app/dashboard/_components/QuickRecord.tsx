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
  bg: string;
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
      <p className="text-[10px] font-bold  text-gray-400 uppercase mb-3">
        {MESSAGES.UI.SECTION_QUICK_RECORD}
      </p>
      <div className="grid grid-cols-3 gap-2.5">
        {buttons.map((btn, i) => (
          <button
            key={i}
            type="button"
            onClick={() => btn.key && onPress(btn.key)}
            disabled={btn.comingSoon}
            className={`${btn.bg} rounded-2xl p-3 flex flex-col items-center gap-1 active:scale-95 transition-transform disabled:opacity-60`}
          >
            <span className="text-[26px] leading-none mt-1">{btn.icon}</span>
            <span className={`text-xs font-semibold mt-1 ${btn.iconColor}`}>
              {btn.label}
            </span>
            {btn.comingSoon ? (
              <span className="text-[9px] text-gray-300 font-medium">
                {MESSAGES.UI.COMING_SOON}
              </span>
            ) : btn.lastLog ? (
              <>
                <span className="text-[10px] text-gray-400 leading-tight">
                  {timeAgo(btn.lastLog.logged_at)}
                </span>
                <span className="text-[10px] text-gray-400 leading-tight">
                  {formatTime(btn.lastLog.logged_at)}
                </span>
              </>
            ) : (
              <span className="text-[10px] text-gray-300">—</span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
