"use client";

import { useState } from "react";
import { MESSAGES } from "@/constants/messages";
import { LoadingSpinner, EditActivityModal } from "@/components/common";
import { ActivityCard } from "@/components/activity/ActivityCard";
import type { Activity } from "@/config/activityConfig";
import Link from "next/link";

interface Props {
  activities: Activity[];
  loading: boolean;
  idToken: string | null;
  babyId: string | null;
  onEditSuccess: () => void;
}

export function RecentSection({ activities, loading, idToken, babyId, onEditSuccess }: Props) {
  const [editActivity, setEditActivity] = useState<Activity | null>(null);

  return (
    <section className="px-4 pt-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-gray-400 uppercase">
          {MESSAGES.UI.SECTION_RECENT}
        </p>
        <Link href="/dashboard/log" className="text-[11px] text-medical font-medium">
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
          {activities.map((act) => (
            <ActivityCard
              key={act.id}
              activity={act}
              onEdit={babyId ? setEditActivity : undefined}
            />
          ))}
        </div>
      )}

      {editActivity && babyId && (
        <EditActivityModal
          activity={editActivity}
          babyId={babyId}
          idToken={idToken}
          onClose={() => setEditActivity(null)}
          onSuccess={() => {
            setEditActivity(null);
            onEditSuccess();
          }}
        />
      )}
    </section>
  );
}
