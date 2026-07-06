"use client";

import { useEffect, useState, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { useDashboardAuth } from "@/hooks/useDashboardAuth";
import { useLogs } from "@/hooks/useLogs";
import { useSelectedBabyId } from "@/hooks/useSelectedBabyId";
import {
  LoadingSpinner,
  ErrorView,
  BottomNav,
  SwitchBabySheet,
  EditActivityModal,
} from "@/components/common";
import { ActivityCard } from "@/components/activity/ActivityCard";
import { formatDateGroup } from "@/utils/time";
import { CalendarIcon } from "@/components/icons";
import { buildActivities, type Activity } from "@/config/activityConfig";
import { MESSAGES } from "@/constants/messages";

// ─── Types ───────────────────────────────────────────────────────────────────

type ActivityCategory = "all" | "feeding" | "diaper" | "sleep" | "pumping";

type DatePreset = "today" | "7d" | "30d" | "custom";

// ─── Cache alignment ─────────────────────────────────────────────────────────
// Round timestamps to 2-minute buckets (matches useLogs TTL) so that navigating
// back within 2 minutes produces the same cache key and avoids a re-fetch.
const CACHE_WINDOW_MS = 2 * 60 * 1000;

function floorToWindow(d: Date): Date {
  return new Date(Math.floor(d.getTime() / CACHE_WINDOW_MS) * CACHE_WINDOW_MS);
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_FILTERS: { key: ActivityCategory; label: string }[] = [
  { key: "all", label: MESSAGES.UI.FILTER_ALL },
  { key: "feeding", label: MESSAGES.UI.FILTER_FEEDING },
  { key: "pumping", label: MESSAGES.UI.FILTER_PUMPING },
  { key: "diaper", label: MESSAGES.UI.FILTER_DIAPER },
  { key: "sleep", label: MESSAGES.UI.FILTER_SLEEP },
];

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: "today", label: "วันนี้" },
  { key: "7d", label: "7 วัน" },
  { key: "30d", label: "1 เดือน" },
  { key: "custom", label: "กำหนดเอง" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function computeDateRange(
  preset: DatePreset,
  customFrom: string,
  customTo: string,
): { from: string; to: string } {
  const now = new Date();
  const todayStr = toLocalDateString(now);

  if (preset === "today") {
    return {
      from: new Date(`${todayStr}T00:00:00`).toISOString(),
      to: new Date(`${todayStr}T23:59:59`).toISOString(),
    };
  }
  if (preset === "7d") {
    const ceiling = floorToWindow(now);
    const start = new Date(ceiling);
    start.setDate(start.getDate() - 7);
    return { from: start.toISOString(), to: ceiling.toISOString() };
  }
  if (preset === "30d") {
    const ceiling = floorToWindow(now);
    const start = new Date(ceiling);
    start.setDate(start.getDate() - 30);
    return { from: start.toISOString(), to: ceiling.toISOString() };
  }
  // custom
  const fromStr = customFrom || todayStr;
  const toStr = customTo || todayStr;
  return {
    from: new Date(`${fromStr}T00:00:00`).toISOString(),
    to: new Date(`${toStr}T23:59:59`).toISOString(),
  };
}

function groupByDate(
  activities: Activity[],
): { date: string; items: Activity[] }[] {
  const map = new Map<string, Activity[]>();
  for (const act of activities) {
    const key = new Date(act.logged_at).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(act);
  }
  return Array.from(map.entries()).map(([, items]) => ({
    date: items[0].logged_at,
    items,
  }));
}

function formatRangeLabel(from: string, to: string): string {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const fmt = (d: Date) =>
    d.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  return `${fmt(fromDate)} - ${fmt(toDate)}`;
}

function averageIntervalHours(isoTimes: string[]): number | null {
  if (isoTimes.length < 2) return null;
  const sorted = [...isoTimes].sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );
  const diffs: number[] = [];
  for (let i = 1; i < sorted.length; i += 1) {
    diffs.push(
      new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime(),
    );
  }
  const avgMs = diffs.reduce((s, v) => s + v, 0) / diffs.length;
  return avgMs / (1000 * 60 * 60);
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

type SummarySectionProps = {
  rangeLabel: string;
  feedTotalOz: number;
  feedCount: number;
  pumpingTotalOz: number;
  pumpingCount: number;
  sleepHours: number;
  napMinutes: number;
  peeCount: number;
  poopCount: number;
  diaperUsedCount: number;
  lastPoopHours: number | null;
};

function SummarySection({
  rangeLabel,
  feedTotalOz,
  feedCount,
  pumpingTotalOz,
  pumpingCount,
  sleepHours,
  napMinutes,
  peeCount,
  poopCount,
  diaperUsedCount,
  lastPoopHours,
}: Readonly<SummarySectionProps>) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-800">
          สรุปตามช่วงเวลาที่เลือก
        </h2>
        <span className="text-[11px] text-gray-400">{rangeLabel}</span>
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
          <p className="text-[11px] text-purple-600">
            งีบ {Math.round(napMinutes)} นาที
          </p>
        </div>
        <div className="rounded-xl bg-amber-50 px-3 py-2">
          <p className="text-[10px] text-amber-500 font-bold">การขับถ่าย</p>
          <p className="text-sm font-bold text-amber-800">
            ฉี่ {peeCount} / อึ {poopCount}
          </p>
          <p className="text-[11px] text-amber-600">
            ใช้ผ้าอ้อม {diaperUsedCount} ครั้ง
            {lastPoopHours != null
              ? `, อึล่าสุด ${lastPoopHours} ชม.`
              : ", ยังไม่มีอึ"}
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LogPage() {
  const { status, idToken, data, errorMessage } = useDashboardAuth();
  const [selectedBabyId, setSelectedBabyId] = useSelectedBabyId(
    data?.babies ?? [],
  );
  const [categoryFilter, setCategoryFilter] = useState<ActivityCategory>("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("7d");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [showSwitchBaby, setShowSwitchBaby] = useState(false);
  const [editActivity, setEditActivity] = useState<Activity | null>(null);

  const today = toLocalDateString(new Date());

  // Initialize custom dates to today when switching to custom
  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset === "custom" && !customFrom) {
      setCustomFrom(today);
      setCustomTo(today);
    }
  };

  const { from, to } = useMemo(
    () => computeDateRange(datePreset, customFrom, customTo),
    [datePreset, customFrom, customTo],
  );

  const {
    milkLogs,
    excretionEvents,
    sleepLogs,
    pumpingSessions,
    loading: logsLoading,
    refetch: refetchLogs,
  } = useLogs(idToken, selectedBabyId, from, to);

  useEffect(() => {
    if (status === "ready" && selectedBabyId) refetchLogs();
  }, [status, selectedBabyId, refetchLogs]);

  if (status === "loading") return <LoadingSpinner />;
  if (status === "error")
    return (
      <ErrorView
        message={errorMessage}
        action={{ label: MESSAGES.UI.RETRY, href: "/dashboard/log" }}
      />
    );
  if (!data) return null;

  const { babies } = data;

  const allActivities = buildActivities(
    milkLogs,
    excretionEvents,
    sleepLogs,
    pumpingSessions,
  );
  const filtered =
    categoryFilter === "all"
      ? allActivities
      : allActivities.filter((a) => a.category === categoryFilter);

  const groups = groupByDate(filtered);
  const rangeLabel = formatRangeLabel(from, to);

  const feedTotalOz = milkLogs.reduce(
    (sum, l) => sum + (l.amount_ml ?? 0) / 29.5735,
    0,
  );
  const feedCount = milkLogs.length;
  const feedAvgOz = feedCount > 0 ? feedTotalOz / feedCount : 0;
  const feedIntervalHours = averageIntervalHours(
    milkLogs.map((l) => l.logged_at),
  );

  const pumpingTotalOz = pumpingSessions.reduce(
    (sum, p) => sum + (p.total_volume_ml ?? 0) / 29.5735,
    0,
  );
  const pumpingCount = pumpingSessions.length;
  const pumpingAvgOz = pumpingCount > 0 ? pumpingTotalOz / pumpingCount : 0;

  const sleepMinutes = sleepLogs.reduce(
    (sum, s) =>
      sum +
      durationMinutesFromSleep(
        s.started_at,
        s.ended_at,
        s.duration_minutes ?? null,
      ),
    0,
  );
  const sleepHours = sleepMinutes / 60;
  const napMinutes = sleepLogs
    .filter((s) => s.type === "nap")
    .reduce(
      (sum, s) =>
        sum +
        durationMinutesFromSleep(
          s.started_at,
          s.ended_at,
          s.duration_minutes ?? null,
        ),
      0,
    );
  const nightMinutes = Math.max(0, sleepMinutes - napMinutes);

  const peeCount = excretionEvents.filter(
    (e) => e.type === "pee" || e.type === "both",
  ).length;
  const diaperUsedCount = excretionEvents.filter((e) => e.diaper_used).length;
  const poopEvents = excretionEvents.filter(
    (e) => e.type === "poop" || e.type === "both",
  );
  const poopCount = poopEvents.length;
  const lastPoop = poopEvents.sort(
    (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime(),
  )[0];
  const lastPoopHours =
    lastPoop != null
      ? Math.floor(
          (Date.now() - new Date(lastPoop.datetime).getTime()) /
            (1000 * 60 * 60),
        )
      : null;

  const insights = [
    feedCount > 0
      ? `ป้อนนมรวม ${feedTotalOz.toFixed(1)} oz • เฉลี่ย ${feedAvgOz.toFixed(1)} oz/ครั้ง${
          feedIntervalHours && ` • ทุก ~${feedIntervalHours.toFixed(1)} ชม.`
        }`
      : "ยังไม่มีบันทึกการป้อนนมในช่วงเวลานี้",
    pumpingCount > 0
      ? `ปั๊มนมรวม ${pumpingTotalOz.toFixed(1)} oz • เฉลี่ย ${pumpingAvgOz.toFixed(1)} oz/รอบ`
      : "ยังไม่มีบันทึกการปั๊มนมในช่วงเวลานี้",
    sleepMinutes > 0
      ? `นอนรวม ${sleepHours.toFixed(1)} ชม. • งีบ ${Math.round(napMinutes)} นาที • กลางคืน ${Math.round(nightMinutes)} นาที`
      : "ยังไม่มีบันทึกการนอนในช่วงเวลานี้",
    poopCount > 0
      ? `ฉี่ ${peeCount} ครั้ง • อึ ${poopCount} ครั้ง • ใช้ผ้าอ้อม ${diaperUsedCount} ครั้ง • ล่าสุดอึ ${lastPoopHours ?? 0} ชม.ก่อน`
      : `ฉี่ ${peeCount} ครั้ง • ใช้ผ้าอ้อม ${diaperUsedCount} ครั้ง • ยังไม่มีบันทึกอึในช่วงเวลานี้`,
  ];

  const isCustomValid =
    datePreset !== "custom" ||
    (!!customFrom && !!customTo && customFrom <= customTo);

  let logContent: ReactNode;
  if (logsLoading) {
    logContent = (
      <LoadingSpinner className="text-xs" label="กำลังโหลดกิจกรรม..." />
    );
  } else if (!isCustomValid) {
    logContent = (
      <div className="bg-white rounded-2xl p-8 text-center mt-2 shadow-sm">
        <p className="text-gray-400 text-sm">
          กรุณาเลือกวันเริ่มต้นและวันสิ้นสุดให้ถูกต้อง
        </p>
      </div>
    );
  } else if (groups.length === 0) {
    logContent = (
      <div className="bg-white rounded-2xl p-10 text-center mt-2 shadow-sm">
        <p className="text-3xl mb-3">📋</p>
        <p className="text-gray-500 text-sm font-medium">
          {MESSAGES.UI.EMPTY_RECORDS}
        </p>
        <p className="text-gray-300 text-xs mt-1">
          ยังไม่มีกิจกรรมในช่วงเวลานี้
        </p>
      </div>
    );
  } else {
    logContent = (
      <div className="space-y-5 pb-4">
        {/* Layer 1: Summary by current filter range */}
        <SummarySection
          rangeLabel={rangeLabel}
          feedTotalOz={feedTotalOz}
          feedCount={feedCount}
          pumpingTotalOz={pumpingTotalOz}
          pumpingCount={pumpingCount}
          sleepHours={sleepHours}
          napMinutes={napMinutes}
          peeCount={peeCount}
          poopCount={poopCount}
          diaperUsedCount={diaperUsedCount}
          lastPoopHours={lastPoopHours}
        />

        {/* Layer 2: Auto insights */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-2">Insight</h3>
          <div className="space-y-1.5">
            {insights.map((text) => (
              <p key={text} className="text-xs text-gray-600 leading-relaxed">
                • {text}
              </p>
            ))}
          </div>
        </section>

        <Link
          href="/dashboard/log/month"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-green-200 bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition-colors"
        >
          <CalendarIcon size={14} />
          ดูสรุปเป็นรายเดือน
        </Link>

        {/* Layer 3: Timeline list */}
        {groups.map((group) => (
          <div key={group.date}>
            {/* Date group label */}
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                {formatDateGroup(group.date)}
              </span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
            <div className="space-y-2">
              {group.items.map((act) => (
                <ActivityCard
                  key={act.id}
                  activity={act}
                  onEdit={setEditActivity}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-app-bg flex flex-col"
      style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom))" }}
    >
      {/* ── Gradient header ─────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-10 px-4 pt-5 pb-3 space-y-3"
        style={{
          background: "linear-gradient(135deg, #eefbeb 0%, #d3f5cc 100%)",
        }}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-green-900">
            {MESSAGES.UI.SECTION_ACTIVITY_LOG}
          </h1>

          {/* Date range presets */}
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {DATE_PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => handlePresetChange(p.key)}
                className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  datePreset === p.key
                    ? "bg-green-700 text-white shadow-sm"
                    : "bg-white/60 text-green-700 border border-green-200 hover:bg-white"
                }`}
              >
                {p.key === "custom" && <CalendarIcon size={12} />}
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom date inputs */}
        {datePreset === "custom" && (
          <div className="flex items-center gap-2">
            <div className="flex-1 overflow-hidden">
              <input
                type="date"
                value={customFrom}
                max={customTo || today}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full origin-left scale-[0.835] bg-white/60 border border-green-200 text-green-800 rounded-full px-3 py-1 focus:outline-none focus:border-green-400"
                style={{ display: "block" }}
              />
            </div>
            <span className="text-green-400 text-xs shrink-0">–</span>
            <div className="flex-1 overflow-hidden">
              <input
                type="date"
                value={customTo}
                min={customFrom}
                max={today}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full origin-left scale-[0.835] bg-white/60 border border-green-200 text-green-800 rounded-full px-3 py-1 focus:outline-none focus:border-green-400"
                style={{ display: "block" }}
              />
            </div>
          </div>
        )}

        {/* Category filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-none">
          {CATEGORY_FILTERS.map((f) => {
            const isActive = categoryFilter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setCategoryFilter(f.key)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-green-700 text-white shadow-sm"
                    : "bg-white/60 text-green-700 border border-green-200 hover:bg-white"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 px-4 pt-4">{logContent}</div>

      {editActivity && selectedBabyId && (
        <EditActivityModal
          activity={editActivity}
          babyId={selectedBabyId}
          idToken={idToken}
          onClose={() => setEditActivity(null)}
          onSuccess={() => {
            setEditActivity(null);
            refetchLogs(true);
          }}
        />
      )}

      {showSwitchBaby && (
        <SwitchBabySheet
          babies={babies}
          selectedBabyId={selectedBabyId}
          onSelect={(id) => {
            setSelectedBabyId(id);
            setShowSwitchBaby(false);
          }}
          onClose={() => setShowSwitchBaby(false)}
        />
      )}

      <BottomNav />
    </div>
  );
}
