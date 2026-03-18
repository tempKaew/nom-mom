"use client";

import { useState } from "react";
import { apiPost, apiPatch } from "@/services/api/client";
import { XIcon, SaveIcon, BedIcon, MoonIcon, TimerIcon } from "@/components/icons";
import { toLocalDatetimeValue } from "@/utils/time";
import type { SleepLog } from "@/types/app";

// ─── Constants ────────────────────────────────────────────────────────────────

const SLEEP_TYPES = [
  { key: "nap",   label: "งีบหลับ",  icon: BedIcon },
  { key: "night", label: "กลางคืน", icon: MoonIcon },
] as const;

const NAP_DURATION_PRESETS = [15, 20, 30, 45, 60, 90] as const;

const NOTE_CHIPS = [
  "หลับยาก",
  "ตื่นกลางคืน",
  "ตื่นงอแง",
  "เล่านิทานก่อนนอน",
  "หลับหลังจากกินนม",
  "นอนหลับสนิท",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addMinutes(datetimeLocal: string, minutes: number): string {
  const d = new Date(datetimeLocal);
  d.setMinutes(d.getMinutes() + minutes);
  return toLocalDatetimeValue(d);
}

function parseNoteChips(notes: string | null | undefined): { chips: Set<string>; text: string } {
  const parts = (notes ?? "").split(/[,·]/).map((s) => s.trim()).filter(Boolean);
  return {
    chips: new Set(parts.filter((p) => NOTE_CHIPS.includes(p))),
    text:  parts.filter((p) => !NOTE_CHIPS.includes(p)).join(", "),
  };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-gray-400 uppercase mb-2">{children}</p>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  idToken: string | null;
  babyId: string;
  /** Pass to open in edit mode — fields are pre-filled and PATCH is used. */
  initialData?: SleepLog;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddSleepLogModal({ idToken, babyId, initialData, onClose, onSuccess }: Props) {
  const isEdit = !!initialData;

  const { chips: initChips, text: initText } = parseNoteChips(initialData?.notes);

  const [sleepType, setSleepType] = useState<"nap" | "night">(
    (initialData?.type as "nap" | "night") ?? "nap"
  );
  const [startedAt, setStartedAt] = useState(() =>
    initialData ? toLocalDatetimeValue(new Date(initialData.started_at)) : toLocalDatetimeValue(new Date())
  );
  const [endedAt, setEndedAt] = useState(() =>
    initialData?.ended_at ? toLocalDatetimeValue(new Date(initialData.ended_at)) : ""
  );
  const [selectedChips, setSelectedChips] = useState<Set<string>>(initChips);
  const [noteText, setNoteText]           = useState(initText);
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState("");

  const computedMinutes =
    startedAt && endedAt
      ? Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000)
      : null;

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) => {
      const next = new Set(prev);
      next.has(chip) ? next.delete(chip) : next.add(chip);
      return next;
    });
  };

  const buildNotes = (): string | null => {
    const chips  = Array.from(selectedChips).join(", ");
    const manual = noteText.trim();
    return [chips, manual].filter(Boolean).join(" · ") || null;
  };

  const applyNapDuration = (mins: number) => {
    if (!startedAt) return;
    setEndedAt(addMinutes(startedAt, mins));
  };

  const handleStartChange = (val: string) => {
    if (endedAt && computedMinutes !== null && computedMinutes > 0) {
      setEndedAt(addMinutes(val, computedMinutes));
    }
    setStartedAt(val);
  };

  const handleSubmit = async () => {
    if (!idToken || submitting) return;

    if (endedAt && computedMinutes !== null && computedMinutes < 0) {
      setError("เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น");
      return;
    }

    if (endedAt && computedMinutes !== null && computedMinutes > 24 * 60) {
      setError("ระยะเวลานอนไม่ควรเกิน 24 ชั่วโมง");
      return;
    }

    setSubmitting(true);
    setError("");

    const payload = {
      baby_id:    babyId,
      started_at: new Date(startedAt).toISOString(),
      ended_at:   endedAt ? new Date(endedAt).toISOString() : null,
      type:       sleepType,
      notes:      buildNotes(),
    };

    const result = isEdit
      ? await apiPatch(`/api/sleep?id=${initialData!.id}`, idToken, payload)
      : await apiPost("/api/sleep", idToken, payload);

    if (!result.ok) {
      setError(result.error ?? "บันทึกข้อมูลการนอนไม่สำเร็จ");
      setSubmitting(false);
      return;
    }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-full bg-white rounded-t-3xl shadow-2xl max-h-[92dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <MoonIcon size={20} className="text-sleep" />
            <h2 className="text-lg font-bold text-gray-900">
              {isEdit ? "แก้ไขการนอน" : "บันทึกการนอน"}
            </h2>
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            <XIcon size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 pb-4 space-y-4">

          {/* ประเภท */}
          <div>
            <SectionLabel>ประเภท</SectionLabel>
            <div className="flex gap-2">
              {SLEEP_TYPES.map((t) => {
                const Icon = t.icon;
                return (
                  <button key={t.key} type="button" onClick={() => setSleepType(t.key)}
                    className={`flex-1 rounded-2xl border py-3 text-sm font-semibold transition-all active:scale-95 touch-manipulation flex items-center justify-center gap-2 ${
                      sleepType === t.key
                        ? "bg-purple-100 border-purple-400 text-purple-800 shadow-sm"
                        : "border-gray-200 bg-white text-gray-500"
                    }`}>
                    <Icon size={16} /> {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* เริ่มนอน */}
          <div>
            <SectionLabel>เริ่มนอน</SectionLabel>
            <input type="datetime-local" value={startedAt} required
              onChange={(e) => handleStartChange(e.target.value)}
              className="block w-full rounded-xl border border-gray-200 px-0 py-2.5 text-gray-900 text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none" />
          </div>

          {/* ระยะเวลางีบ (nap only) */}
          {sleepType === "nap" && (
            <div>
              <SectionLabel>นอนไปกี่นาที</SectionLabel>
              <div className="grid grid-cols-6 gap-2 mb-2">
                {NAP_DURATION_PRESETS.map((mins) => (
                  <button key={mins} type="button" onClick={() => applyNapDuration(mins)}
                    className={`py-3 rounded-xl border text-sm font-bold active:scale-95 transition-all touch-manipulation ${
                      computedMinutes === mins
                        ? "bg-purple-500 border-purple-500 text-white shadow-sm"
                        : "border-purple-200 bg-purple-50 text-purple-600"
                    }`}>
                    {mins}
                    <span className="block text-[10px] font-normal opacity-70">นาที</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ตื่นนอน */}
          <div>
            <SectionLabel>ตื่นนอน <span className="font-normal normal-case">(ไม่บังคับ)</span></SectionLabel>
            <input type="datetime-local" value={endedAt} min={startedAt}
              onChange={(e) => setEndedAt(e.target.value)}
              className="block w-full rounded-xl border border-gray-200 px-0 py-2.5 text-gray-900 text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none" />
            {computedMinutes !== null && computedMinutes >= 0 && (
              <p className="text-xs text-purple-500 mt-1.5 flex items-center gap-1">
                <TimerIcon size={12} />
                นอน {computedMinutes} นาที
                {computedMinutes >= 60 ? ` (${Math.floor(computedMinutes / 60)} ชม. ${computedMinutes % 60} นาที)` : ""}
              </p>
            )}
          </div>

          {/* หมายเหตุ */}
          <div>
            <SectionLabel>หมายเหตุ <span className="font-normal normal-case">(ไม่บังคับ)</span></SectionLabel>
            <div className="flex flex-wrap gap-2 mb-2">
              {NOTE_CHIPS.map((chip) => (
                <button key={chip} type="button" onClick={() => toggleChip(chip)}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all active:scale-95 touch-manipulation ${
                    selectedChips.has(chip)
                      ? "bg-purple-100 border-purple-400 text-purple-800"
                      : "border-gray-200 bg-white text-gray-500"
                  }`}>
                  {chip}
                </button>
              ))}
            </div>
            <input type="text" value={noteText} onChange={(e) => setNoteText(e.target.value)}
              placeholder="บันทึกเพิ่มเติม…"
              className="block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 text-sm focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none placeholder:text-gray-300" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-6 pt-3 shrink-0 border-t border-gray-100">
          {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} disabled={submitting}
              className="w-24 shrink-0 py-3.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 disabled:opacity-50 touch-manipulation">
              ยกเลิก
            </button>
            <button type="button" onClick={handleSubmit} disabled={submitting || !startedAt}
              className="flex-1 py-3.5 rounded-2xl bg-sleep text-white text-sm font-bold shadow-md active:scale-[0.98] transition-transform disabled:opacity-50 touch-manipulation flex items-center justify-center gap-2">
              {submitting ? "กำลังบันทึก…" : <><SaveIcon size={16} /> บันทึก</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
