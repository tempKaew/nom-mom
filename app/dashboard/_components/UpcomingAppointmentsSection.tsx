"use client";

import Link from "next/link";
import type { Appointment } from "@/types/app";
import { MESSAGES } from "@/constants/messages";
import { LoadingSpinner } from "@/components/common";

interface Props {
  appointments: Appointment[];
  loading: boolean;
}

function getDaysUntil(isoDate: string): number {
  const now = new Date();
  const target = new Date(isoDate);
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function formatAppointmentDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UpcomingAppointmentsSection({ appointments, loading }: Props) {
  const now = new Date();

  const upcoming = appointments
    .filter((a) => a.status === "upcoming" && new Date(a.appointment_at) > now)
    .sort(
      (a, b) =>
        new Date(a.appointment_at).getTime() -
        new Date(b.appointment_at).getTime(),
    )
    .slice(0, 3);

  return (
    <section className="px-4 pt-4 shrink-0">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold  text-gray-400 uppercase">
          {MESSAGES.UI.SECTION_UPCOMING_APPOINTMENTS}
        </p>
        <Link
          href="/dashboard/medical?tab=appointment"
          className="text-[11px] text-medical font-medium"
        >
          {MESSAGES.UI.SEE_ALL}
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner className="text-xs" label="กำลังโหลดนัดหมาย..." />
      ) : upcoming.length === 0 ? (
        <div className="bg-surface rounded-2xl p-4 text-center">
          <p className="text-gray-400 text-sm">
            {MESSAGES.UI.EMPTY_UPCOMING_APPOINTMENTS}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {upcoming.map((appt) => {
            const days = getDaysUntil(appt.appointment_at);
            const isUrgent = days < 30;
            return (
              <div
                key={appt.id}
                className="bg-medical-bg rounded-2xl px-4 py-3 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-medical truncate">
                    {appt.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {[appt.doctor_name, appt.hospital]
                      .filter(Boolean)
                      .join(" · ") ||
                      formatAppointmentDate(appt.appointment_at)}
                  </p>
                  {(appt.doctor_name || appt.hospital) && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatAppointmentDate(appt.appointment_at)}
                    </p>
                  )}
                </div>
                {isUrgent && (
                  <span
                    className={`shrink-0 text-[11px] font-bold px-2 py-1 rounded-full ${
                      days <= 3
                        ? "bg-red-100 text-red-600"
                        : days <= 7
                          ? "bg-orange-100 text-orange-600"
                          : "bg-yellow-100 text-yellow-600"
                    }`}
                  >
                    อีก {days} วัน
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
