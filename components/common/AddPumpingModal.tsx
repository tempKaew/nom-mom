"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { apiPost, apiPatch } from "@/services/api/client";
import type {
  PumpingType,
  BreastCondition,
  PainLevel,
  StorageType,
  PumpingSession,
} from "@/types/app";
import {
  ActivityIcon,
  ZapIcon,
  HeartIcon,
  AlertCircleIcon,
  CircleDotIcon,
  FeatherIcon,
  FrownIcon,
  SmileIcon,
  BottleMilkIcon,
  ThermometerIcon,
  SnowflakeIcon,
  LightbulbIcon,
  TimerIcon,
  PencilIcon,
  PlayIcon,
  SquareIcon,
  XIcon,
  SaveIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BreastPumpIcon,
} from "@/components/icons";

// ─── Local types ──────────────────────────────────────────────────────────────

type Unit = "ml" | "oz";
type InputMode = "timer" | "manual";
type TimerState = "idle" | "running" | "stopped";

type LastSession = {
  pumpingType: PumpingType;
  durationMinutes: number;
  storageType: StorageType;
  unit: Unit;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ML_PER_OZ = 29.5735;
const LS_LAST = "pumping_last_session";

const QUICK_DURATIONS = [10, 15, 20, 30] as const;

const PUMPING_TYPES: {
  key: PumpingType;
  icon: React.ReactNode;
  label: string;
  sub: string;
  active: string;
}[] = [
  {
    key: "normal",
    icon: <ActivityIcon size={18} />,
    label: "ปกติ",
    sub: "ทั่วไป",
    active: "bg-blue-100 border-blue-400 text-blue-800",
  },
  {
    key: "power",
    icon: <ZapIcon size={18} />,
    label: "Power Pump",
    sub: "เพิ่มน้ำนม",
    active: "bg-amber-100 border-amber-400 text-amber-800",
  },
  {
    key: "relieve",
    icon: <HeartIcon size={18} />,
    label: "แก้คัดเต้า",
    sub: "ลดอาการ",
    active: "bg-rose-100 border-rose-400 text-rose-800",
  },
];

const BREAST_CONDITIONS: {
  key: BreastCondition;
  icon: React.ReactNode;
  label: string;
  active: string;
}[] = [
  {
    key: "engorged",
    icon: <AlertCircleIcon size={16} />,
    label: "คัด",
    active: "bg-red-100 border-red-400 text-red-700",
  },
  {
    key: "normal",
    icon: <CircleDotIcon size={16} />,
    label: "ปกติ",
    active: "bg-yellow-100 border-yellow-400 text-yellow-700",
  },
  {
    key: "soft",
    icon: <FeatherIcon size={16} />,
    label: "นิ่ม",
    active: "bg-green-100 border-green-400 text-green-700",
  },
];

const PAIN_LEVELS: {
  key: PainLevel;
  icon: React.ReactNode;
  label: string;
  active: string;
}[] = [
  {
    key: "painful",
    icon: <FrownIcon size={18} />,
    label: "เจ็บ",
    active: "bg-red-100 border-red-400 text-red-700",
  },
  {
    key: "no_pain",
    icon: <SmileIcon size={18} />,
    label: "ไม่เจ็บ",
    active: "bg-green-100 border-green-400 text-green-700",
  },
];

const STORAGE_TYPES: {
  key: StorageType;
  icon: React.ReactNode;
  label: string;
  active: string;
}[] = [
  {
    key: "immediate",
    icon: <BottleMilkIcon size={20} />,
    label: "ให้เลย",
    active: "bg-pink-100 border-pink-400 text-pink-700",
  },
  {
    key: "room_temp",
    icon: <ThermometerIcon size={20} />,
    label: "ช่องธรรมดา",
    active: "bg-orange-100 border-orange-400 text-orange-700",
  },
  {
    key: "frozen",
    icon: <SnowflakeIcon size={20} />,
    label: "แช่แข็ง",
    active: "bg-sky-100 border-sky-400 text-sky-700",
  },
];

const NOTE_TAG_PRESETS = [
  { key: "painful_breast", label: "ปวดเต้า" },
  { key: "fussy_baby", label: "ลูกงอแง" },
  { key: "low_yield", label: "ได้น้อยผิดปกติ" },
  { key: "good_flow", label: "น้ำนมไหลดี" },
  { key: "not_empty", label: "ปั๊มไม่เกลี้ยง" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, "0");
const toTimeStr = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function parseDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00`);
}

function addMins(dateStr: string, timeStr: string, mins: number): string {
  const d = parseDateTime(dateStr, timeStr);
  d.setMinutes(d.getMinutes() + mins);
  return toTimeStr(d);
}

const mlToOz = (ml: number) => Math.round((ml / ML_PER_OZ) * 10) / 10;
const ozToMl = (oz: number) => Math.round(oz * ML_PER_OZ);

function fmtSec(sec: number): string {
  return `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`;
}

function fmtDuration(mins: number): string {
  if (mins < 60) return `${mins} นาที`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} ชม. ${m} น.` : `${h} ชม.`;
}

function pumpingTypeLabel(t: PumpingType): string {
  return PUMPING_TYPES.find((p) => p.key === t)?.label ?? t;
}

function storageTypeLabel(s: StorageType): string {
  return STORAGE_TYPES.find((x) => x.key === s)?.label ?? s;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-gray-400 uppercase  mb-2">
      {children}
    </p>
  );
}

function VolumeStepper({
  label,
  side,
  valueMl,
  onChange,
  unit,
}: {
  label: string;
  side: "left" | "right";
  valueMl: number;
  onChange: (ml: number) => void;
  unit: Unit;
}) {
  const display = unit === "oz" ? mlToOz(valueMl) : valueMl;
  const step = unit === "oz" ? 0.5 : 5;

  const inc = () => {
    if (unit === "oz") onChange(ozToMl(mlToOz(valueMl) + step));
    else onChange(valueMl + step);
  };
  const dec = () => {
    if (unit === "oz")
      onChange(Math.max(0, ozToMl(Math.max(0, mlToOz(valueMl) - step))));
    else onChange(Math.max(0, valueMl - step));
  };

  return (
    <div className="flex-1 bg-gray-50 rounded-2xl p-3 flex flex-col items-center gap-2">
      <span className="flex items-center gap-1 text-xs font-semibold text-gray-500">
        {side === "left" ? (
          <ArrowLeftIcon size={12} />
        ) : (
          <ArrowRightIcon size={12} />
        )}
        {label}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={dec}
          className="w-11 h-11 rounded-full bg-white shadow-sm border border-gray-200 text-pink-500 text-2xl flex items-center justify-center active:scale-90 transition-transform touch-manipulation select-none"
        >
          −
        </button>
        <div className="w-14 text-center">
          <p className="text-2xl font-bold text-gray-900 tabular-nums leading-tight">
            {display}
          </p>
          <p className="text-[10px] text-gray-400">{unit}</p>
        </div>
        <button
          type="button"
          onClick={inc}
          className="w-11 h-11 rounded-full bg-white shadow-sm border border-gray-200 text-pink-500 text-2xl flex items-center justify-center active:scale-90 transition-transform touch-manipulation select-none"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export interface AddPumpingModalProps {
  idToken: string | null;
  babyId: string;
  /** Pass to open in edit mode — fields are pre-filled and PATCH is used. */
  initialData?: PumpingSession;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddPumpingModal({
  idToken,
  babyId,
  initialData,
  onClose,
  onSuccess,
}: AddPumpingModalProps) {
  const isEdit = !!initialData;
  const now = new Date();

  // ─── Mode & Unit ────────────────────────────────────────────────────────
  // Edit mode always uses manual (no timer for past sessions)
  const [inputMode, setInputMode] = useState<InputMode>(isEdit ? "manual" : "timer");
  const [unit, setUnit] = useState<Unit>("oz");

  // ─── Pumping type (shared, top-level choice) ────────────────────────────
  const [pumpingType, setPumpingType] = useState<PumpingType>(
    (initialData?.pumping_type as PumpingType) ?? "normal"
  );

  // ─── Timer ──────────────────────────────────────────────────────────────
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [timerStart, setTimerStart] = useState<Date | null>(null);
  const [timerEnd, setTimerEnd] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Manual time ────────────────────────────────────────────────────────
  const [date, setDate] = useState(() =>
    initialData ? toDateStr(new Date(initialData.start_time)) : toDateStr(now)
  );
  const [startTime, setStartTime] = useState(() =>
    initialData ? toTimeStr(new Date(initialData.start_time)) : toTimeStr(now)
  );
  const [endTime, setEndTime] = useState(() =>
    initialData?.end_time ? toTimeStr(new Date(initialData.end_time)) : ""
  );

  // ─── Volume ─────────────────────────────────────────────────────────────
  const [leftMl, setLeftMl] = useState(initialData?.left_volume_ml ?? 0);
  const [rightMl, setRightMl] = useState(initialData?.right_volume_ml ?? 0);

  // ─── Breast status ──────────────────────────────────────────────────────
  const [breastCondition, setBreastCondition] = useState<BreastCondition | null>(
    (initialData?.breast_condition as BreastCondition | null) ?? null
  );
  const [painLevel, setPainLevel] = useState<PainLevel | null>(
    (initialData?.pain_level as PainLevel | null) ?? null
  );

  // ─── Storage ────────────────────────────────────────────────────────────
  const [storageType, setStorageType] = useState<StorageType>(
    (initialData?.storage_type as StorageType) ?? "immediate"
  );

  // ─── Notes ──────────────────────────────────────────────────────────────
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.note_tags ?? []);
  const [noteText, setNoteText] = useState(initialData?.note_text ?? "");

  // ─── Smart suggest ──────────────────────────────────────────────────────
  const [lastSession, setLastSession] = useState<LastSession | null>(null);

  // ─── Form ───────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const totalMl = leftMl + rightMl;

  // ─── Load preferences from localStorage (add mode only) ─────────────────
  useEffect(() => {
    if (isEdit) return;
    try {
      const saved = localStorage.getItem(LS_LAST);
      if (saved) {
        const ls = JSON.parse(saved) as Partial<LastSession>;
        if (ls.pumpingType && ls.durationMinutes && ls.storageType && ls.unit) {
          setLastSession(ls as LastSession);
        }
      }
    } catch {
      // ignore
    }
  }, [isEdit]);

  // Apply last session defaults to manual end time
  useEffect(() => {
    const defaultDur = lastSession?.durationMinutes ?? 15;
    if (defaultDur > 0 && defaultDur <= 120) {
      setEndTime(addMins(toDateStr(now), toTimeStr(now), defaultDur));
    }
    if (lastSession?.pumpingType) setPumpingType(lastSession.pumpingType);
    if (lastSession?.storageType) setStorageType(lastSession.storageType);
    if (lastSession?.unit) setUnit(lastSession.unit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSession]);

  // ─── Apply last session (quick fill) ────────────────────────────────────
  const applyLastSession = () => {
    if (!lastSession) return;
    setPumpingType(lastSession.pumpingType);
    setStorageType(lastSession.storageType);
    setUnit(lastSession.unit);
    if (inputMode === "manual") {
      setEndTime(addMins(date, startTime, lastSession.durationMinutes));
    }
  };

  // ─── Timer controls ─────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    setTimerStart(new Date());
    setTimerState("running");
    setElapsed(0);
    intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerEnd(new Date());
    setTimerState("stopped");
  }, []);

  const resetTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerState("idle");
    setElapsed(0);
    setTimerStart(null);
    setTimerEnd(null);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // ─── Manual duration ────────────────────────────────────────────────────
  const manualDuration =
    startTime && endTime
      ? Math.round(
          (parseDateTime(date, endTime).getTime() -
            parseDateTime(date, startTime).getTime()) /
            60000,
        )
      : null;

  // ─── Tag toggle ─────────────────────────────────────────────────────────
  const toggleTag = (key: string) => {
    setSelectedTags((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key],
    );
  };

  const toggleUnit = () => {
    const next: Unit = unit === "ml" ? "oz" : "ml";
    setUnit(next);
  };

  // ─── Save ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!idToken || submitting) return;
    setError("");

    let startISO: string;
    let endISO: string | null = null;
    let durationMins: number | null = null;

    if (inputMode === "timer") {
      if (timerState !== "stopped" || !timerStart) {
        setError("กรุณาเริ่มและหยุดจับเวลาก่อนบันทึก");
        return;
      }
      startISO = timerStart.toISOString();
      endISO = timerEnd?.toISOString() ?? null;
      // ceil so any elapsed time (even < 60s) records as at least 1 min
      durationMins = elapsed > 0 ? Math.max(1, Math.ceil(elapsed / 60)) : null;
    } else {
      if (!startTime) {
        setError("กรุณาระบุเวลาเริ่มปั๊ม");
        return;
      }
      const startDate = parseDateTime(date, startTime);
      startISO = startDate.toISOString();
      if (endTime) {
        const endDate = parseDateTime(date, endTime);
        if (endDate <= startDate) {
          setError("เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น");
          return;
        }
        endISO = endDate.toISOString();
        durationMins = Math.round(
          (endDate.getTime() - startDate.getTime()) / 60000,
        );
      }
    }

    setSubmitting(true);

    const pumpPayload = {
      baby_id:          babyId,
      start_time:       startISO,
      end_time:         endISO,
      duration_minutes: durationMins,
      left_volume_ml:   leftMl,
      right_volume_ml:  rightMl,
      total_volume_ml:  totalMl,
      pumping_type:     pumpingType,
      breast_condition: breastCondition,
      pain_level:       painLevel,
      storage_type:     storageType,
      note_text:        noteText.trim() || null,
      note_tags:        selectedTags,
      notes:            null,
    };

    // Persist last session for next time (add mode only)
    if (!isEdit) {
      const toSave: LastSession = {
        pumpingType,
        durationMinutes: durationMins ?? lastSession?.durationMinutes ?? 15,
        storageType,
        unit,
      };
      try {
        localStorage.setItem(LS_LAST, JSON.stringify(toSave));
      } catch {
        // ignore
      }
    }

    const result = isEdit
      ? await apiPatch(`/api/pumping?id=${initialData!.id}`, idToken, pumpPayload)
      : await apiPost("/api/pumping", idToken, pumpPayload);

    if (!result.ok) {
      setError(
        (result as { ok: false; error: string }).error ??
          "บันทึกการปั๊มนมไม่สำเร็จ",
      );
      setSubmitting(false);
      return;
    }

    onSuccess();
  };

  // ─── Derived ─────────────────────────────────────────────────────────────
  const showDetailSections = inputMode === "manual" || timerState === "stopped";
  const showSaveBar = showDetailSections;
  const saveDisabled =
    submitting ||
    (inputMode === "manual" && !startTime) ||
    (inputMode === "manual" && manualDuration !== null && manualDuration <= 0);

  const timerTypeConfig = PUMPING_TYPES.find((p) => p.key === pumpingType)!;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-t-3xl w-full max-w-full shadow-2xl flex flex-col max-h-[94dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 sm:hidden flex-shrink-0" />

        {/* ── Fixed header ──────────────────────────────────────────────── */}
        <div className="px-5 pt-4 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BreastPumpIcon size={20} className="text-feeding" />
              <h2 className="text-lg font-bold text-gray-900">
                {isEdit ? "แก้ไขการปั๊มนม" : "บันทึกการปั๊มนม"}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <XIcon size={16} />
            </button>
          </div>

          {/* Smart suggest banner */}
          {lastSession && (
            <button
              type="button"
              onClick={applyLastSession}
              className="w-full mb-3 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-3.5 py-2.5 touch-manipulation active:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-2 min-w-0">
                <LightbulbIcon size={15} className="text-amber-500 shrink-0" />
                <p className="text-xs text-amber-800 font-medium truncate">
                  ครั้งก่อน:{" "}
                  <span className="font-bold">
                    {pumpingTypeLabel(lastSession.pumpingType)}
                  </span>{" "}
                  · {lastSession.durationMinutes} นาที ·{" "}
                  {storageTypeLabel(lastSession.storageType)}
                </p>
              </div>
              <span className="flex items-center gap-0.5 text-xs text-amber-600 font-bold shrink-0 ml-2">
                ใช้เดิม <ChevronRightIcon size={13} />
              </span>
            </button>
          )}

          {/* Mode toggle (add mode only — edit always uses manual) */}
          {!isEdit && <div className="flex bg-gray-100 rounded-xl p-1">
            {(["timer", "manual"] as InputMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setInputMode(m)}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all touch-manipulation flex items-center justify-center gap-1.5 ${
                  inputMode === m
                    ? "bg-white shadow text-gray-900"
                    : "text-gray-400"
                }`}
              >
                {m === "timer" ? (
                  <>
                    <TimerIcon size={14} /> จับเวลา
                  </>
                ) : (
                  <>
                    <PencilIcon size={14} /> กรอกเอง
                  </>
                )}
              </button>
            ))}
          </div>}
        </div>

        {/* ── Scrollable body ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 pb-2">
          {inputMode === "timer" ? (
            /* ─── Timer Mode ─────────────────────────────────────────── */
            <div>
              {/* Timer idle: type picker + start */}
              {timerState === "idle" && (
                <div className="py-2 space-y-5">
                  <PumpingTypeSelector
                    value={pumpingType}
                    onChange={setPumpingType}
                  />
                  <div className="flex flex-col items-center gap-4 py-3">
                    <div className="text-6xl font-mono font-bold text-gray-200 tabular-nums">
                      00:00
                    </div>
                    <p className="text-sm text-gray-400">กดเพื่อเริ่มจับเวลา</p>
                    <button
                      type="button"
                      onClick={startTimer}
                      className="w-48 h-14 rounded-2xl bg-green-500 text-white text-base font-bold shadow-lg active:scale-95 transition-transform touch-manipulation flex items-center justify-center gap-2"
                    >
                      <PlayIcon size={18} />
                      เริ่มปั๊มนม
                    </button>
                  </div>
                </div>
              )}

              {/* Timer running: minimal UI */}
              {timerState === "running" && (
                <div className="flex flex-col items-center gap-5 py-8">
                  {/* Type badge */}
                  <span
                    className={`text-sm font-semibold px-3 py-1 rounded-full border ${timerTypeConfig.active}`}
                  >
                    {timerTypeConfig.icon} {timerTypeConfig.label}
                  </span>
                  <div className="text-7xl font-mono font-bold text-green-500 tabular-nums">
                    {fmtSec(elapsed)}
                  </div>
                  <p className="text-sm text-gray-400">
                    เริ่ม {timerStart ? toTimeStr(timerStart) : ""}
                  </p>
                  <button
                    type="button"
                    onClick={stopTimer}
                    className="w-48 h-14 rounded-2xl bg-red-400 text-white text-base font-bold shadow-lg active:scale-95 transition-transform touch-manipulation flex items-center justify-center gap-2"
                  >
                    <SquareIcon size={18} />
                    หยุด
                  </button>
                </div>
              )}

              {/* Timer stopped: summary + detail sections */}
              {timerState === "stopped" && (
                <div className="py-2 space-y-5">
                  {/* Summary card */}
                  <div className="bg-green-50 rounded-2xl px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">
                        ระยะเวลาปั๊ม
                      </p>
                      <p className="text-3xl font-bold text-green-600 tabular-nums">
                        {fmtSec(elapsed)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {timerStart ? toTimeStr(timerStart) : ""}
                        <span className="mx-1 text-gray-300">→</span>
                        {timerEnd ? toTimeStr(timerEnd) : ""}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${timerTypeConfig.active}`}
                      >
                        {timerTypeConfig.icon} {timerTypeConfig.label}
                      </span>
                      <button
                        type="button"
                        onClick={resetTimer}
                        className="text-xs text-gray-400 underline touch-manipulation"
                      >
                        รีเซ็ต
                      </button>
                    </div>
                  </div>

                  {/* Change type after stop */}
                  <PumpingTypeSelector
                    value={pumpingType}
                    onChange={setPumpingType}
                  />

                  {/* Detail sections */}
                  <DetailSections
                    leftMl={leftMl}
                    rightMl={rightMl}
                    totalMl={totalMl}
                    unit={unit}
                    onLeftChange={setLeftMl}
                    onRightChange={setRightMl}
                    onToggleUnit={toggleUnit}
                    breastCondition={breastCondition}
                    onBreastCondition={setBreastCondition}
                    painLevel={painLevel}
                    onPainLevel={setPainLevel}
                    storageType={storageType}
                    onStorageType={setStorageType}
                    selectedTags={selectedTags}
                    onToggleTag={toggleTag}
                    noteText={noteText}
                    onNoteText={setNoteText}
                  />
                </div>
              )}
            </div>
          ) : (
            /* ─── Manual Mode ───────────────────────────────────────── */
            <div className="py-2 space-y-5">
              {/* Pumping type */}
              <PumpingTypeSelector
                value={pumpingType}
                onChange={setPumpingType}
              />

              {/* Date */}
              <div>
                <SectionLabel>วันที่</SectionLabel>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  max={toDateStr(new Date())}
                  className="block w-full rounded-xl border border-gray-200 px-0 py-2.5 text-gray-900 text-sm focus:border-pink-400 focus:ring-1 focus:ring-pink-400 outline-none"
                />
              </div>

              {/* Start time */}
              <div>
                <SectionLabel>เวลาเริ่มปั๊ม</SectionLabel>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    const v = e.target.value;
                    setStartTime(v);
                    if (manualDuration && manualDuration > 0) {
                      setEndTime(addMins(date, v, manualDuration));
                    }
                  }}
                  className="block w-full rounded-xl border border-gray-200 px-0 py-2.5 text-gray-900 text-sm focus:border-pink-400 focus:ring-1 focus:ring-pink-400 outline-none"
                />
              </div>

              {/* Quick duration */}
              <div>
                <SectionLabel>ระยะเวลาด่วน</SectionLabel>
                <div className="grid grid-cols-4 gap-2">
                  {QUICK_DURATIONS.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setEndTime(addMins(date, startTime, mins))}
                      className={`py-3 rounded-xl border text-sm font-bold active:scale-95 transition-all touch-manipulation ${
                        manualDuration === mins
                          ? "bg-pink-400 border-pink-400 text-white shadow-sm"
                          : "border-pink-200 bg-pink-50 text-pink-600"
                      }`}
                    >
                      {mins}
                      <span className="block text-[10px] font-normal opacity-70">
                        นาที
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* End time */}
              <div>
                <SectionLabel>เวลาเสร็จ</SectionLabel>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="block w-full rounded-xl border border-gray-200 px-0 py-2.5 text-gray-900 text-sm focus:border-pink-400 focus:ring-1 focus:ring-pink-400 outline-none"
                />
                {manualDuration !== null && manualDuration > 0 && (
                  <p className="text-xs text-pink-500 mt-1.5 flex items-center gap-1">
                    <TimerIcon size={12} />
                    <span>{fmtDuration(manualDuration)}</span>
                  </p>
                )}
                {manualDuration !== null && manualDuration < 0 && (
                  <p className="text-xs text-red-500 mt-1.5">
                    เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น
                  </p>
                )}
              </div>

              {/* Detail sections */}
              <DetailSections
                leftMl={leftMl}
                rightMl={rightMl}
                totalMl={totalMl}
                unit={unit}
                onLeftChange={setLeftMl}
                onRightChange={setRightMl}
                onToggleUnit={toggleUnit}
                breastCondition={breastCondition}
                onBreastCondition={setBreastCondition}
                painLevel={painLevel}
                onPainLevel={setPainLevel}
                storageType={storageType}
                onStorageType={setStorageType}
                selectedTags={selectedTags}
                onToggleTag={toggleTag}
                noteText={noteText}
                onNoteText={setNoteText}
              />
            </div>
          )}
        </div>

        {/* ── Sticky save bar ───────────────────────────────────────────── */}
        {showSaveBar && (
          <div className="px-5 py-4 flex-shrink-0 border-t border-gray-100 bg-white rounded-b-3xl">
            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="w-24 shrink-0 py-3.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 disabled:opacity-50 touch-manipulation"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saveDisabled}
                className="flex-1 py-3.5 rounded-2xl bg-pink-400 text-white text-sm font-bold shadow-md active:scale-[0.98] transition-transform disabled:opacity-50 touch-manipulation flex items-center justify-center gap-2"
              >
                {submitting ? (
                  "กำลังบันทึก…"
                ) : (
                  <>
                    <SaveIcon size={16} /> บันทึก
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Safe area bottom (timer idle/running) */}
        {!showSaveBar && (
          <div
            className="flex-shrink-0"
            style={{ height: "env(safe-area-inset-bottom, 8px)" }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Pumping Type Selector ────────────────────────────────────────────────────

function PumpingTypeSelector({
  value,
  onChange,
}: {
  value: PumpingType;
  onChange: (v: PumpingType) => void;
}) {
  return (
    <div>
      <SectionLabel>ประเภทการปั๊ม</SectionLabel>
      <div className="flex gap-2">
        {PUMPING_TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={`flex-1 rounded-2xl border py-3 flex flex-col items-center gap-0.5 transition-all active:scale-95 touch-manipulation ${
              value === t.key
                ? `${t.active} shadow-sm`
                : "border-gray-200 bg-white text-gray-500"
            }`}
          >
            <span className="text-xl leading-none">{t.icon}</span>
            <span className="text-xs font-bold leading-tight">{t.label}</span>
            <span className="text-[9px] opacity-60">{t.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Detail Sections ──────────────────────────────────────────────────────────

type DetailSectionsProps = {
  leftMl: number;
  rightMl: number;
  totalMl: number;
  unit: Unit;
  onLeftChange: (ml: number) => void;
  onRightChange: (ml: number) => void;
  onToggleUnit: () => void;
  breastCondition: BreastCondition | null;
  onBreastCondition: (v: BreastCondition | null) => void;
  painLevel: PainLevel | null;
  onPainLevel: (v: PainLevel | null) => void;
  storageType: StorageType;
  onStorageType: (v: StorageType) => void;
  selectedTags: string[];
  onToggleTag: (key: string) => void;
  noteText: string;
  onNoteText: (v: string) => void;
};

function DetailSections({
  leftMl,
  rightMl,
  totalMl,
  unit,
  onLeftChange,
  onRightChange,
  onToggleUnit,
  breastCondition,
  onBreastCondition,
  painLevel,
  onPainLevel,
  storageType,
  onStorageType,
  selectedTags,
  onToggleTag,
  noteText,
  onNoteText,
}: DetailSectionsProps) {
  return (
    <>
      {/* Volume */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>ปริมาณนม</SectionLabel>
          <button
            type="button"
            onClick={onToggleUnit}
            className="text-xs bg-gray-100 rounded-lg px-2.5 py-1 text-gray-600 font-medium hover:bg-gray-200 transition-colors touch-manipulation"
          >
            {unit === "ml" ? "⇄ oz" : "⇄ ml"}
          </button>
        </div>
        <div className="flex gap-3">
          <VolumeStepper
            label="ซ้าย"
            side="left"
            valueMl={leftMl}
            onChange={onLeftChange}
            unit={unit}
          />
          <VolumeStepper
            label="ขวา"
            side="right"
            valueMl={rightMl}
            onChange={onRightChange}
            unit={unit}
          />
        </div>
        {totalMl > 0 && (
          <p className="mt-2.5 text-center text-sm text-gray-500">
            รวม{" "}
            <span className="font-bold text-gray-800">
              {unit === "oz"
                ? `${Math.round((totalMl / ML_PER_OZ) * 10) / 10} oz`
                : `${totalMl} ml`}
            </span>
          </p>
        )}
      </div>

      {/* Breast status */}
      <div>
        <SectionLabel>สภาพเต้านม (ไม่บังคับ)</SectionLabel>
        <div className="space-y-2">
          {/* Condition row */}
          <div className="flex gap-2">
            {BREAST_CONDITIONS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() =>
                  onBreastCondition(breastCondition === c.key ? null : c.key)
                }
                className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold flex flex-col items-center gap-0.5 transition-all active:scale-95 touch-manipulation ${
                  breastCondition === c.key
                    ? `${c.active} shadow-sm`
                    : "border-gray-200 bg-white text-gray-500"
                }`}
              >
                <span className="text-base leading-none">{c.icon}</span>
                <span className="text-xs">{c.label}</span>
              </button>
            ))}
          </div>
          {/* Pain level row */}
          <div className="flex gap-2">
            {PAIN_LEVELS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => onPainLevel(painLevel === p.key ? null : p.key)}
                className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation ${
                  painLevel === p.key
                    ? `${p.active} shadow-sm`
                    : "border-gray-200 bg-white text-gray-500"
                }`}
              >
                <span>{p.icon}</span>
                <span className="text-xs">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Storage type */}
      <div>
        <SectionLabel>เก็บนม</SectionLabel>
        <div className="flex gap-2">
          {STORAGE_TYPES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => onStorageType(s.key)}
              className={`flex-1 rounded-2xl border py-3 flex flex-col items-center gap-0.5 transition-all active:scale-95 touch-manipulation ${
                storageType === s.key
                  ? `${s.active} shadow-sm`
                  : "border-gray-200 bg-white text-gray-500"
              }`}
            >
              <span className="text-xl leading-none">{s.icon}</span>
              <span className="text-[11px] font-semibold">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Smart note chips */}
      <div>
        <SectionLabel>บันทึก (ไม่บังคับ)</SectionLabel>
        <div className="flex flex-wrap gap-2 mb-3">
          {NOTE_TAG_PRESETS.map((tag) => (
            <button
              key={tag.key}
              type="button"
              onClick={() => onToggleTag(tag.key)}
              className={`px-3 py-2 rounded-full text-xs font-semibold border transition-all active:scale-95 touch-manipulation ${
                selectedTags.includes(tag.key)
                  ? "bg-pink-100 border-pink-400 text-pink-700"
                  : "border-gray-200 bg-white text-gray-500"
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={noteText}
          onChange={(e) => onNoteText(e.target.value)}
          placeholder="พิมพ์หมายเหตุเพิ่มเติม…"
          className="block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 text-sm focus:border-pink-400 focus:ring-1 focus:ring-pink-400 outline-none placeholder:text-gray-300"
        />
      </div>
    </>
  );
}
