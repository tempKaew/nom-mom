"use client";

import Link from "next/link";
import type { Appointment } from "@/types/app";
import { MESSAGES } from "@/constants/messages";
import { LoadingSpinner } from "@/components/common";
import { CalendarIcon } from "@/components/icons";

interface Props {
  appointments: Appointment[];
  loading: boolean;
}

function getDaysUntil(isoDate: string): number {
  const now = new Date();
  const target = new Date(isoDate);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function CalendarDate({ iso }: { iso: string }) {
  const d = new Date(iso);
  const day = d.toLocaleDateString("th-TH", { day: "numeric" });
  const month = d.toLocaleDateString("th-TH", { month: "short" });
  return (
    <div className="shrink-0 w-10 rounded-xl overflow-hidden shadow-sm text-center text-gray-500 font-bold font-prompt">
      <div className="bg-white pt-1 pb-0">
        <span className="text-base leading-none block">{day}</span>
      </div>
      <div className="bg-medical/80 py-0 border-t border-medical/5">
        <span className="text-xs uppercase">{month}</span>
      </div>
    </div>
  );
}

function CountdownBadge({ days }: { days: number }) {
  if (days > 30) return null;
  const cls =
    days <= 1
      ? "bg-red-100 text-red-600"
      : days <= 7
        ? "bg-orange-100 text-orange-600"
        : "bg-yellow-100 text-yellow-600";
  const label =
    days <= 0 ? "วันนี้!" : days === 1 ? "พรุ่งนี้!" : `อีก ${days} วัน`;
  return (
    <span
      className={`shrink-0 text-[11px] font-bold px-2 py-1 rounded-full ${cls}`}
    >
      {label}
    </span>
  );
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
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <CalendarIcon size={13} className="text-medical" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {MESSAGES.UI.SECTION_UPCOMING_APPOINTMENTS}
          </p>
        </div>
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
        <div className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-50">
          <CalendarIcon size={28} className="text-gray-200 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">
            {MESSAGES.UI.EMPTY_UPCOMING_APPOINTMENTS}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {upcoming.map((appt) => {
            const days = getDaysUntil(appt.appointment_at);
            const time = new Date(appt.appointment_at).toLocaleTimeString(
              "th-TH",
              {
                hour: "2-digit",
                minute: "2-digit",
              },
            );
            return (
              <div
                key={appt.id}
                className="bg-white rounded-2xl px-3 py-2.5 flex items-center gap-3 shadow-sm border-l-[3px] border-medical"
              >
                <CalendarDate iso={appt.appointment_at} />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate leading-tight">
                    {appt.title}
                  </p>
                  {(appt.doctor_name || appt.hospital) && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {[appt.doctor_name, appt.hospital]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                  {appt.notes && (
                    <p className="text-xs text-gray-400 mt-0.5 italic truncate">
                      {appt.notes}
                    </p>
                  )}
                </div>

                {/* Right: countdown badge + time */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <CountdownBadge days={days} />
                  <span className="text-[10px] font-medium text-gray-400">
                    {time}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
