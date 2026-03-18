"use client";

import { formatTime } from "@/utils/time";
import { CATEGORY_STYLES, type Activity } from "@/config/activityConfig";
import { PencilIcon } from "@/components/icons";

interface Props {
  activity: Activity;
  onEdit?: (activity: Activity) => void;
}

export function ActivityCard({ activity, onEdit }: Props) {
  const style = CATEGORY_STYLES[activity.category];

  return (
    <div className="flex items-start gap-2.5">
      {/* Time + dot */}
      <div className="flex flex-col items-center pt-3 w-[40px] shrink-0">
        <span className="text-[11px] text-gray-400 leading-tight text-right w-full">
          {formatTime(activity.logged_at)}
        </span>
        <div className={`w-2 h-2 rounded-full mt-1.5 ${style.dot}`} />
      </div>

      {/* Card */}
      <button
        type="button"
        onClick={() => onEdit?.(activity)}
        disabled={!onEdit}
        className={`flex-1 ${style.bg} rounded-2xl px-4 py-3 text-left transition-all ${
          onEdit ? "active:opacity-70 active:scale-[0.99] cursor-pointer" : "cursor-default"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base leading-none shrink-0">{activity.icon}</span>
            <span className={`text-sm font-semibold ${style.text} truncate`}>
              {activity.label}
            </span>
          </div>
          {onEdit && (
            <PencilIcon size={12} className="text-gray-300 shrink-0" />
          )}
        </div>
        {activity.detail && (
          <p className={`text-xs mt-0.5 ${style.detail}`}>{activity.detail}</p>
        )}
        {activity.notes && (
          <p className="text-xs text-gray-400 mt-0.5 truncate italic">{activity.notes}</p>
        )}
      </button>
    </div>
  );
}
