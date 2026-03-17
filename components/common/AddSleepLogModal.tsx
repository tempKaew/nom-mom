"use client";

import { useState } from "react";
import { apiPost } from "@/services/api/client";
import {
  XIcon,
  SaveIcon,
  BedIcon,
  MoonIcon,
  TimerIcon,
} from "@/components/icons";

const SLEEP_TYPES = [
  { key: "nap", label: "งีบหลับ", icon: BedIcon },
  { key: "night", label: "กลางคืน", icon: MoonIcon },
] as const;

interface AddSleepLogModalProps {
  idToken: string | null;
  babyId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AddSleepLogModal({
  idToken,
  babyId,
  onClose,
  onSuccess,
}: AddSleepLogModalProps) {
  const now = new Date();
  const [sleepType, setSleepType] = useState<"nap" | "night">("nap");
  const [startedAt, setStartedAt] = useState(toLocalDatetimeValue(now));
  const [endedAt, setEndedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const computedMinutes =
    startedAt && endedAt
      ? Math.round(
          (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000,
        )
      : null;

  const handleSubmit = async () => {
    if (!idToken || submitting) return;

    if (endedAt && computedMinutes !== null && computedMinutes < 0) {
      setError("เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น");
      return;
    }

    setSubmitting(true);
    setError("");

    const result = await apiPost("/api/sleep", idToken, {
      baby_id: babyId,
      started_at: new Date(startedAt).toISOString(),
      ended_at: endedAt ? new Date(endedAt).toISOString() : null,
      type: sleepType,
      notes: notes.trim() || null,
    });

    if (!result.ok) {
      setError(result.error ?? "บันทึกข้อมูลการนอนไม่สำเร็จ");
      setSubmitting(false);
      return;
    }

    onSuccess();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-full bg-white rounded-t-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <h2 className="text-lg font-bold text-gray-900">บันทึกการนอน</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-8 space-y-4">
          {/* Sleep type */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase  mb-2">
              ประเภท
            </p>
            <div className="flex gap-2">
              {SLEEP_TYPES.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setSleepType(t.key)}
                    className={`flex-1 rounded-2xl border py-3 text-sm font-semibold transition-all active:scale-95 touch-manipulation flex items-center justify-center gap-2 ${
                      sleepType === t.key
                        ? "bg-purple-100 border-purple-400 text-purple-800 shadow-sm"
                        : "border-gray-200 bg-white text-gray-500"
                    }`}
                  >
                    <Icon size={16} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start time */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase  mb-2">
              เริ่มนอน
            </p>
            <input
              type="datetime-local"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
              required
              className="block w-full rounded-xl border border-gray-200 px-0 py-2.5 text-gray-900 text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none"
            />
          </div>

          {/* End time */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase  mb-2">
              ตื่นนอน{" "}
              <span className="font-normal normal-case">(ไม่บังคับ)</span>
            </p>
            <input
              type="datetime-local"
              value={endedAt}
              onChange={(e) => setEndedAt(e.target.value)}
              min={startedAt}
              className="block w-full rounded-xl border border-gray-200 px-0 py-2.5 text-gray-900 text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none"
            />
            {computedMinutes !== null && computedMinutes >= 0 && (
              <p className="text-xs text-purple-500 mt-1.5 flex items-center gap-1">
                <TimerIcon size={12} />
                นอน {computedMinutes} นาที
                {computedMinutes >= 60
                  ? ` (${Math.floor(computedMinutes / 60)} ชม. ${computedMinutes % 60} นาที)`
                  : ""}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase  mb-2">
              หมายเหตุ{" "}
              <span className="font-normal normal-case">(ไม่บังคับ)</span>
            </p>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น หลับยาก, ตื่นกลางดึก…"
              className="block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none placeholder:text-gray-300"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
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
              onClick={handleSubmit}
              disabled={submitting || !startedAt}
              className="flex-1 py-3.5 rounded-2xl bg-purple-500 text-white text-sm font-bold shadow-md active:scale-[0.98] transition-transform disabled:opacity-50 touch-manipulation flex items-center justify-center gap-2"
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
      </div>
    </div>
  );
}
