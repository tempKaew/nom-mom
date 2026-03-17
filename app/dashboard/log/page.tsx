"use client";

import { useEffect, useState, useMemo } from "react";
import { useDashboardAuth } from "@/hooks/useDashboardAuth";
import { useLogs } from "@/hooks/useLogs";
import { useSelectedBabyId } from "@/hooks/useSelectedBabyId";
import {
  LoadingSpinner,
  ErrorView,
  BottomNav,
  SwitchBabySheet,
} from "@/components/common";
import { formatTime, formatDateGroup } from "@/utils/time";
import { CalendarIcon } from "@/components/icons";
import {
  CATEGORY_STYLES,
  buildActivities,
  type Activity,
} from "@/config/activityConfig";
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

  const isCustomValid =
    datePreset !== "custom" ||
    (!!customFrom && !!customTo && customFrom <= customTo);

  return (
    <div
      className="min-h-screen bg-app-bg flex flex-col"
      style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom))" }}
    >
      {/* Header */}
      <header className="bg-white px-4 pt-5 pb-3 shadow-sm sticky top-0 z-10 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            {MESSAGES.UI.SECTION_ACTIVITY_LOG}
          </h1>

          {/* Date range filter */}
          <div className="space-y-2">
            <div className="flex gap-1 overflow-x-auto scrollbar-none">
              {DATE_PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handlePresetChange(p.key)}
                  className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    datePreset === p.key
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {p.key === "custom" && <CalendarIcon size={13} />}
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom date inputs */}
        {datePreset === "custom" && (
          <div className="flex items-center gap-2">
            {/* scale wrapper: iOS Safari enforces min 16px font on inputs,
                scaling down the container lets us render visually smaller */}
            <div className="flex-1 overflow-hidden">
              <input
                type="date"
                value={customFrom}
                max={customTo || today}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full origin-left scale-[0.835] -ml-0 border border-gray-200 rounded-full px-3 py-1 focus:outline-none text-gray-600 focus:ring-2 focus:ring-blue-400"
                style={{ display: "block" }}
              />
            </div>
            <span className="text-gray-400 text-xs shrink-0">–</span>
            <div className="flex-1 overflow-hidden">
              <input
                type="date"
                value={customTo}
                min={customFrom}
                max={today}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full origin-left scale-[0.835] -ml-0 border border-gray-200 rounded-full px-3 py-1 focus:outline-none text-gray-600 focus:ring-2 focus:ring-blue-400"
                style={{ display: "block" }}
              />
            </div>
          </div>
        )}

        {/* Category filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-none">
          {CATEGORY_FILTERS.map((f) => {
            const isActive = categoryFilter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setCategoryFilter(f.key)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 pt-4">
        {logsLoading ? (
          <LoadingSpinner className="text-xs" label="กำลังโหลดกิจกรรม..." />
        ) : !isCustomValid ? (
          <div className="bg-surface rounded-2xl p-8 text-center mt-4">
            <p className="text-gray-400 text-sm">
              กรุณาเลือกวันเริ่มต้นและวันสิ้นสุดให้ถูกต้อง
            </p>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-surface rounded-2xl p-8 text-center mt-4">
            <p className="text-gray-400 text-sm">{MESSAGES.UI.EMPTY_RECORDS}</p>
          </div>
        ) : (
          <div className="space-y-5 pb-4">
            {groups.map((group) => (
              <div key={group.date}>
                <p className="text-[11px] font-bold text-gray-400 uppercase mb-2 px-1">
                  {formatDateGroup(group.date)}
                </p>
                <div className="space-y-2">
                  {group.items.map((act) => {
                    const style = CATEGORY_STYLES[act.category];
                    return (
                      <div key={act.id} className="flex items-start gap-3">
                        <span className="text-[11px] text-gray-400 pt-3.5 w-[58px] shrink-0 text-right leading-tight">
                          {formatTime(act.logged_at)}
                        </span>
                        <div
                          className={`flex-1 ${style.bg} rounded-2xl px-4 py-3`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base leading-none">
                              {act.icon}
                            </span>
                            <span
                              className={`text-sm font-semibold ${style.text}`}
                            >
                              {act.label}
                            </span>
                          </div>
                          <p className={`text-xs mt-0.5 ${style.detail}`}>
                            {act.detail}
                          </p>
                          {act.notes && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {act.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
