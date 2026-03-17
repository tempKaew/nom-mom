"use client";

import { formatTime } from "@/utils/time";
import { CATEGORY_STYLES, type Activity } from "@/config/activityConfig";
import { LoadingSpinner } from "@/components/common";
import { MESSAGES } from "@/constants/messages";
import Link from "next/link";

interface Props {
  activities: Activity[];
  loading: boolean;
}

export function RecentSection({ activities, loading }: Props) {
  return (
    <section className="px-4 pt-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold  text-gray-400 uppercase">
          {MESSAGES.UI.SECTION_RECENT}
        </p>
        <Link
          href="/dashboard/log"
          className="text-[11px] text-medical font-medium"
        >
          {MESSAGES.UI.SEE_ALL}
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner className="text-xs" label="กำลังโหลดกิจกรรมล่าสุด..." />
      ) : activities.length === 0 ? (
        <div className="bg-surface rounded-2xl p-5 text-center">
          <p className="text-gray-400 text-sm">{MESSAGES.UI.EMPTY_RECORDS}</p>
        </div>
      ) : (
        <div className="space-y-2 pb-2">
          {activities.map((act) => {
            const style = CATEGORY_STYLES[act.category];
            return (
              <div key={act.id} className="flex items-start gap-3">
                <span className="text-[11px] text-gray-400 pt-3.5 w-[60px] shrink-0 text-right">
                  {formatTime(act.logged_at)}
                </span>
                <div className={`flex-1 ${style.bg} rounded-2xl px-4 py-3`}>
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{act.icon}</span>
                    <span className={`text-sm font-semibold ${style.text}`}>
                      {act.label}
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 ${style.detail}`}>
                    {act.detail}
                  </p>
                  {act.notes && (
                    <p className="text-xs text-gray-400 mt-0.5">{act.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
