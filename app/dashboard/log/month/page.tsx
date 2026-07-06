"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useDashboardAuth } from "@/hooks/useDashboardAuth";
import { useLogs } from "@/hooks/useLogs";
import { useSelectedBabyId } from "@/hooks/useSelectedBabyId";
import { LoadingSpinner, ErrorView, BottomNav } from "@/components/common";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
} from "@/components/icons";
import type {
  ExcretionEvent,
  MilkLog,
  PumpingSession,
  SleepLog,
} from "@/types/app";
import { MESSAGES } from "@/constants/messages";

// ─── Types ───────────────────────────────────────────────────────────────────

type DaySummary = {
  feedCount: number;
  feedOz: number;
  pumpCount: number;
  pumpOz: number;
  sleepMinutes: number;
  peeCount: number;
  poopCount: number;
};

const EMPTY_DAY: DaySummary = {
  feedCount: 0,
  feedOz: 0,
  pumpCount: 0,
  pumpOz: 0,
  sleepMinutes: 0,
  peeCount: 0,
  poopCount: 0,
};

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dateKeyFromIso(iso: string): string {
  return toLocalDateKey(new Date(iso));
}

function getMonthRange(
  year: number,
  month: number,
): { from: string; to: string } {
  const from = new Date(year, month, 1, 0, 0, 0, 0);
  const to = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

function buildCalendarDays(year: number, month: number): (number | null)[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function durationMinutesFromSleep(
  startedAt: string,
  endedAt: string | null,
  durationMinutes: number | null,
): number {
  if (typeof durationMinutes === "number") return durationMinutes;
  if (!endedAt) return 0;
  return Math.max(
    0,
    Math.round(
      (new Date(endedAt).getTime() - new Date(startedAt).getTime()) /
        (1000 * 60),
    ),
  );
}

function buildDaySummaries(
  milkLogs: MilkLog[],
  pumpingSessions: PumpingSession[],
  sleepLogs: SleepLog[],
  excretionEvents: ExcretionEvent[],
): Map<string, DaySummary> {
  const map = new Map<string, DaySummary>();

  const get = (key: string): DaySummary => {
    if (!map.has(key)) map.set(key, { ...EMPTY_DAY });
    return map.get(key)!;
  };

  for (const l of milkLogs) {
    const day = get(dateKeyFromIso(l.logged_at));
    day.feedCount += 1;
    day.feedOz += (l.amount_ml ?? 0) / 29.5735;
  }

  for (const p of pumpingSessions) {
    const day = get(dateKeyFromIso(p.start_time));
    day.pumpCount += 1;
    day.pumpOz += (p.total_volume_ml ?? 0) / 29.5735;
  }

  for (const s of sleepLogs) {
    const day = get(dateKeyFromIso(s.started_at));
    day.sleepMinutes += durationMinutesFromSleep(
      s.started_at,
      s.ended_at,
      s.duration_minutes ?? null,
    );
  }

  for (const e of excretionEvents) {
    const day = get(dateKeyFromIso(e.datetime));
    if (e.type === "pee" || e.type === "both") day.peeCount += 1;
    if (e.type === "poop" || e.type === "both") day.poopCount += 1;
  }

  return map;
}

function hasActivity(summary: DaySummary): boolean {
  return (
    summary.feedCount > 0 ||
    summary.pumpCount > 0 ||
    summary.sleepMinutes > 0 ||
    summary.peeCount > 0 ||
    summary.poopCount > 0
  );
}

function formatMonthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("th-TH", {
    month: "long",
    year: "numeric",
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

type MonthSummaryProps = {
  label: string;
  feedTotalOz: number;
  feedCount: number;
  pumpingTotalOz: number;
  pumpingCount: number;
  sleepHours: number;
  peeCount: number;
  poopCount: number;
};

function MonthSummary({
  label,
  feedTotalOz,
  feedCount,
  pumpingTotalOz,
  pumpingCount,
  sleepHours,
  peeCount,
  poopCount,
}: Readonly<MonthSummaryProps>) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-800">สรุปรายเดือน</h2>
        <span className="text-[11px] text-gray-400">{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-blue-50 px-3 py-2">
          <p className="text-[10px] text-blue-500 font-bold">การป้อนนม</p>
          <p className="text-sm font-bold text-blue-800">
            {feedTotalOz.toFixed(1)} oz
          </p>
          <p className="text-[11px] text-blue-600">{feedCount} ครั้ง</p>
        </div>
        <div className="rounded-xl bg-sky-50 px-3 py-2">
          <p className="text-[10px] text-sky-500 font-bold">การปั๊มนม</p>
          <p className="text-sm font-bold text-sky-800">
            {pumpingTotalOz.toFixed(1)} oz
          </p>
          <p className="text-[11px] text-sky-600">{pumpingCount} รอบ</p>
        </div>
        <div className="rounded-xl bg-purple-50 px-3 py-2">
          <p className="text-[10px] text-purple-500 font-bold">การนอน</p>
          <p className="text-sm font-bold text-purple-800">
            {sleepHours.toFixed(1)} ชม.
          </p>
        </div>
        <div className="rounded-xl bg-amber-50 px-3 py-2">
          <p className="text-[10px] text-amber-500 font-bold">การขับถ่าย</p>
          <p className="text-sm font-bold text-amber-800">
            ฉี่ {peeCount} / อึ {poopCount}
          </p>
        </div>
      </div>
    </section>
  );
}

type DayDetailProps = {
  dateKey: string;
  summary: DaySummary;
};

function DayDetail({ dateKey, summary }: Readonly<DayDetailProps>) {
  const label = new Date(`${dateKey}T12:00:00`).toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const sleepHours = summary.sleepMinutes / 60;

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
      <h3 className="text-sm font-bold text-gray-800">{label}</h3>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-blue-50 px-3 py-2">
          <p className="text-blue-500 font-semibold">ป้อนนม</p>
          <p className="text-blue-800 font-bold mt-0.5">
            {summary.feedCount} ครั้ง • {summary.feedOz.toFixed(1)} oz
          </p>
        </div>
        <div className="rounded-lg bg-sky-50 px-3 py-2">
          <p className="text-sky-500 font-semibold">ปั๊มนม</p>
          <p className="text-sky-800 font-bold mt-0.5">
            {summary.pumpCount} รอบ • {summary.pumpOz.toFixed(1)} oz
          </p>
        </div>
        <div className="rounded-lg bg-purple-50 px-3 py-2">
          <p className="text-purple-500 font-semibold">นอน</p>
          <p className="text-purple-800 font-bold mt-0.5">
            {sleepHours.toFixed(1)} ชม.
          </p>
        </div>
        <div className="rounded-lg bg-amber-50 px-3 py-2">
          <p className="text-amber-500 font-semibold">ขับถ่าย</p>
          <p className="text-amber-800 font-bold mt-0.5">
            ฉี่ {summary.peeCount} • อึ {summary.poopCount}
          </p>
        </div>
      </div>
    </section>
  );
}

type DayCellProps = {
  day: number;
  dateKey: string;
  summary: DaySummary;
  isToday: boolean;
  isSelected: boolean;
  isFuture: boolean;
  onSelect: () => void;
};

function getDayCellClassName(
  isFuture: boolean,
  isSelected: boolean,
  isToday: boolean,
  active: boolean,
): string {
  if (isFuture) return "border-transparent opacity-30 cursor-default";
  if (isSelected)
    return "border-green-500 bg-green-50 shadow-sm ring-1 ring-green-300";
  if (isToday) return "border-green-300 bg-green-50/60";
  if (active) return "border-gray-200 bg-white hover:border-green-200";
  return "border-transparent bg-gray-50/60";
}

function DayCell({
  day,
  summary,
  isToday,
  isSelected,
  isFuture,
  onSelect,
}: Readonly<DayCellProps>) {
  const active = hasActivity(summary);
  const sleepHours = summary.sleepMinutes / 60;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isFuture}
      className={`min-h-[4.5rem] rounded-xl border p-1.5 text-left transition-all flex flex-col items-start justify-start ${getDayCellClassName(isFuture, isSelected, isToday, active)}`}
    >
      <p
        className={`text-[11px] font-bold leading-none ${
          isToday ? "text-green-700" : "text-gray-700"
        }`}
      >
        {day}
      </p>
      {active && (
        <div className="mt-1 space-y-0.5 text-[8px] leading-tight font-medium flex items-start flex-col gap-1">
          {summary.feedOz > 0 && (
            <p className="text-blue-600">n. {summary.feedOz.toFixed(1)}</p>
          )}
          {summary.pumpOz > 0 && (
            <p className="text-sky-600">p. {summary.pumpOz.toFixed(1)}</p>
          )}
          {summary.sleepMinutes > 0 && (
            <p className="text-purple-600">s. {sleepHours.toFixed(1)}</p>
          )}
          {summary.peeCount > 0 && (
            <p className="text-amber-600">p. {summary.peeCount}</p>
          )}
          {summary.poopCount > 0 && (
            <p className="text-amber-600">b. {summary.poopCount}</p>
          )}
        </div>
      )}
    </button>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LogMonthPage() {
  const { status, idToken, data, errorMessage } = useDashboardAuth();
  const [selectedBabyId] = useSelectedBabyId(data?.babies ?? []);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(
    toLocalDateKey(now),
  );

  const { from, to } = useMemo(
    () => getMonthRange(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const {
    milkLogs,
    excretionEvents,
    sleepLogs,
    pumpingSessions,
    loading,
    refetch,
  } = useLogs(idToken, selectedBabyId, from, to);

  useEffect(() => {
    if (status === "ready" && selectedBabyId) refetch();
  }, [status, selectedBabyId, refetch]);

  const daySummaries = useMemo(
    () =>
      buildDaySummaries(milkLogs, pumpingSessions, sleepLogs, excretionEvents),
    [milkLogs, pumpingSessions, sleepLogs, excretionEvents],
  );

  const calendarDays = useMemo(
    () => buildCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const monthLabel = formatMonthLabel(viewYear, viewMonth);
  const todayKey = toLocalDateKey(now);

  const monthTotals = useMemo(() => {
    let feedTotalOz = 0;
    let feedCount = 0;
    let pumpingTotalOz = 0;
    let pumpingCount = 0;
    let sleepMinutes = 0;
    let peeCount = 0;
    let poopCount = 0;

    for (const s of daySummaries.values()) {
      feedTotalOz += s.feedOz;
      feedCount += s.feedCount;
      pumpingTotalOz += s.pumpOz;
      pumpingCount += s.pumpCount;
      sleepMinutes += s.sleepMinutes;
      peeCount += s.peeCount;
      poopCount += s.poopCount;
    }

    return {
      feedTotalOz,
      feedCount,
      pumpingTotalOz,
      pumpingCount,
      sleepHours: sleepMinutes / 60,
      peeCount,
      poopCount,
    };
  }, [daySummaries]);

  const goPrevMonth = () => {
    setSelectedDateKey(null);
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    const next = new Date(viewYear, viewMonth + 1, 1);
    if (next > new Date(now.getFullYear(), now.getMonth(), 1)) return;
    setSelectedDateKey(null);
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const canGoNext =
    viewYear < now.getFullYear() ||
    (viewYear === now.getFullYear() && viewMonth < now.getMonth());

  if (status === "loading") return <LoadingSpinner />;
  if (status === "error")
    return (
      <ErrorView
        message={errorMessage}
        action={{ label: MESSAGES.UI.RETRY, href: "/dashboard/log/month" }}
      />
    );
  if (!data) return null;

  const selectedSummary =
    selectedDateKey != null
      ? (daySummaries.get(selectedDateKey) ?? EMPTY_DAY)
      : null;

  return (
    <div
      className="min-h-screen bg-app-bg flex flex-col"
      style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom))" }}
    >
      <header
        className="sticky top-0 z-10 px-4 pt-5 pb-3 space-y-3"
        style={{
          background: "linear-gradient(135deg, #eefbeb 0%, #d3f5cc 100%)",
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/log"
            className="w-9 h-9 rounded-full bg-white/70 border border-green-200 text-green-700 flex items-center justify-center shrink-0"
            aria-label="กลับไปหน้าบันทึกกิจกรรม"
          >
            <ChevronLeftIcon size={16} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-green-900 truncate">
              สรุปรายเดือน
            </h1>
            <p className="text-[11px] text-green-700/70 flex items-center gap-1">
              <CalendarIcon size={11} />
              ปฏิทินกิจกรรมรายวัน
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between bg-white/60 border border-green-200 rounded-2xl px-2 py-1.5">
          <button
            type="button"
            onClick={goPrevMonth}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-green-700 hover:bg-white transition-colors"
            aria-label="เดือนก่อนหน้า"
          >
            <ChevronLeftIcon size={18} />
          </button>
          <p className="text-sm font-bold text-green-900 capitalize">
            {monthLabel}
          </p>
          <button
            type="button"
            onClick={goNextMonth}
            disabled={!canGoNext}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-green-700 hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="เดือนถัดไป"
          >
            <ChevronRightIcon size={18} />
          </button>
        </div>
      </header>

      <div className="flex-1 px-4 pt-4 space-y-4 pb-4">
        {loading ? (
          <LoadingSpinner className="text-xs" label="กำลังโหลดข้อมูล..." />
        ) : (
          <>
            <MonthSummary label={monthLabel} {...monthTotals} />

            {selectedDateKey && selectedSummary && (
              <DayDetail dateKey={selectedDateKey} summary={selectedSummary} />
            )}

            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
              <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAYS.map((wd) => (
                  <div
                    key={wd}
                    className="text-center text-[10px] font-bold text-gray-400 py-1"
                  >
                    {wd}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                  if (day == null) {
                    return (
                      <div key={`empty-${idx}`} className="min-h-[4.5rem]" />
                    );
                  }
                  const dateKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const summary = daySummaries.get(dateKey) ?? EMPTY_DAY;
                  const cellDate = new Date(viewYear, viewMonth, day);
                  const isFuture = cellDate > now;

                  return (
                    <DayCell
                      key={dateKey}
                      day={day}
                      dateKey={dateKey}
                      summary={summary}
                      isToday={dateKey === todayKey}
                      isSelected={dateKey === selectedDateKey}
                      isFuture={isFuture}
                      onSelect={() => setSelectedDateKey(dateKey)}
                    />
                  );
                })}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-500">
                <span>n. ป้อนนม</span>
                <span>p. ปั๊มนม</span>
                <span>s. นอน</span>
                <span>p. ฉี่</span>
                <span>b. อึ</span>
              </div>
            </section>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
