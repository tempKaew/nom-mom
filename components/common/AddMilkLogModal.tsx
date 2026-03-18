"use client";

import { useState } from "react";
import { apiPost, apiPatch } from "@/services/api/client";
import { XIcon, SaveIcon, BabyIcon, ClockIcon } from "@/components/icons";
import { MESSAGES } from "@/constants/messages";
import { toLocalDatetimeValue } from "@/utils/time";
import type { MilkLog } from "@/types/app";

// ─── Constants ────────────────────────────────────────────────────────────────

const OZ_TO_ML = 29.5735;

const MILK_TYPES = [
  { key: "latch",      label: "เข้าเต้า" },
  { key: "breast",     label: "นมแม่" },
  { key: "formula",    label: "นมผง" },
  { key: "cow_milk",   label: "นมวัว" },
  { key: "plant_milk", label: "นมพืช" },
  { key: "other",      label: "นมอื่นๆ" },
] as const;

type MilkType = typeof MILK_TYPES[number]["key"];

const DURATION_PRESETS = [5, 10, 15, 20, 30];

const NOTE_CHIPS = [
  "สำรอก",
  "งอแง",
  "ง่วงหลังกิน",
  "กินได้ดี",
  "ไม่ยอมกิน",
  "สะอึก",
];

// ─── Age-based oz suggestions ─────────────────────────────────────────────────

function getAgeInWeeks(birthDate: string): number {
  return Math.floor((Date.now() - new Date(birthDate).getTime()) / (7 * 24 * 60 * 60 * 1000));
}

type AgeRange = { label: string; amounts: number[] };

function getAgeRange(birthDate: string | null | undefined): AgeRange {
  if (!birthDate) return { label: "", amounts: [2, 3, 4, 5, 6] };
  const w = getAgeInWeeks(birthDate);
  if (w < 4)  return { label: "1 สัปดาห์แรก (1.5–3 oz)",   amounts: [1.5, 2, 2.5, 3] };
  if (w < 8)  return { label: "~1 เดือน (3–4 oz)",          amounts: [3, 3.5, 4] };
  if (w < 16) return { label: "~2 เดือน (4–5 oz)",          amounts: [4, 4.5, 5] };
  if (w < 26) return { label: "~4 เดือน (4–6 oz)",          amounts: [4, 5, 6] };
  return       { label: "6–12 เดือน (7–8 oz)",              amounts: [7, 7.5, 8] };
}

// ─── Note chip helpers ────────────────────────────────────────────────────────

function parseNoteChips(notes: string | null | undefined): { chips: Set<string>; text: string } {
  const parts = (notes ?? "").split(/[,·]/).map((s) => s.trim()).filter(Boolean);
  return {
    chips: new Set(parts.filter((p) => NOTE_CHIPS.includes(p))),
    text:  parts.filter((p) => !NOTE_CHIPS.includes(p)).join(", "),
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
      {children}
    </p>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  idToken: string | null;
  babyId: string;
  initialType?: string;
  birthDate?: string | null;
  /** Pass to open in edit mode — fields are pre-filled and PATCH is used. */
  initialData?: MilkLog;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddMilkLogModal({
  idToken,
  babyId,
  initialType = "breast",
  birthDate,
  initialData,
  onClose,
  onSuccess,
}: Props) {
  const isEdit = !!initialData;

  const validInitial = (): MilkType => {
    const t = initialData?.type ?? initialType;
    return MILK_TYPES.some((m) => m.key === t) ? (t as MilkType) : "breast";
  };

  const { chips: initChips, text: initText } = parseNoteChips(initialData?.notes);

  const [type, setType]           = useState<MilkType>(validInitial);
  const [loggedAt, setLoggedAt]   = useState(() =>
    initialData ? toLocalDatetimeValue(new Date(initialData.logged_at)) : toLocalDatetimeValue(new Date())
  );
  const [amountOz, setAmountOz]   = useState(() => {
    if (!initialData?.amount_ml) return "";
    return String((initialData.amount_ml / 29.5735).toFixed(1));
  });
  const [duration, setDuration]   = useState(String(initialData?.duration_minutes ?? ""));
  const [selectedChips, setSelectedChips] = useState<Set<string>>(initChips);
  const [noteText, setNoteText]   = useState(initText);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState("");

  const ageRange = getAgeRange(birthDate);

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) => {
      const next = new Set(prev);
      next.has(chip) ? next.delete(chip) : next.add(chip);
      return next;
    });
  };

  const buildNotes = (): string | null => {
    const chips = Array.from(selectedChips).join(", ");
    const manual = noteText.trim();
    return [chips, manual].filter(Boolean).join(" · ") || null;
  };

  const handleSubmit = async () => {
    if (!idToken || submitting) return;
    setSubmitting(true);
    setError("");

    const payload = {
      baby_id:          babyId,
      type,
      amount_ml:        amountOz ? Math.round(Number(amountOz) * OZ_TO_ML) : null,
      duration_minutes: duration ? Number(duration) : null,
      notes:            buildNotes(),
      logged_at:        new Date(loggedAt).toISOString(),
    };

    const result = isEdit
      ? await apiPatch(`/api/milk?id=${initialData!.id}`, idToken, payload)
      : await apiPost("/api/milk", idToken, payload);

    if (!result.ok) {
      setError(result.error ?? MESSAGES.LOGS.MILK_ADD_FAILED);
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
            <BabyIcon size={20} className="text-feeding" />
            <h2 className="text-lg font-bold text-gray-900">
              {isEdit ? "แก้ไขการป้อนนม" : "ป้อนนม"}
            </h2>
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
            <XIcon size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 pb-4 space-y-5">

          {/* วันและเวลาที่ป้อน */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <ClockIcon size={11} className="text-gray-400" />
              <SectionLabel>วันและเวลาที่ป้อน</SectionLabel>
            </div>
            <input type="datetime-local" value={loggedAt} max={toLocalDatetimeValue(new Date())}
              onChange={(e) => setLoggedAt(e.target.value)}
              className="block w-full rounded-xl border border-gray-200 px-0 py-2.5 text-gray-900 text-sm focus:border-pink-400 focus:ring-1 focus:ring-pink-400 outline-none" />
          </div>

          {/* ประเภทนม */}
          <div>
            <SectionLabel>ประเภทนม</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {MILK_TYPES.map((t) => (
                <button key={t.key} type="button" onClick={() => setType(t.key)}
                  className={`px-4 py-2 rounded-full border text-sm font-semibold transition-all active:scale-95 touch-manipulation ${
                    type === t.key
                      ? "bg-pink-100 border-pink-400 text-pink-800 shadow-sm"
                      : "border-gray-200 bg-white text-gray-500"
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ปริมาณ (oz) */}
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <SectionLabel>ปริมาณ (oz)</SectionLabel>
              {ageRange.label && (
                <span className="text-[10px] text-gray-400 font-normal normal-case -mt-1">
                  {ageRange.label}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {ageRange.amounts.map((oz) => (
                <button key={oz} type="button" onClick={() => setAmountOz(String(oz))}
                  className={`px-3 py-1.5 rounded-full border text-sm font-semibold transition-all active:scale-95 touch-manipulation ${
                    amountOz === String(oz)
                      ? "bg-pink-100 border-pink-400 text-pink-800"
                      : "border-gray-200 bg-white text-gray-500"
                  }`}>
                  {oz} oz
                </button>
              ))}
            </div>
            <input type="number" min="0" step="0.5" value={amountOz}
              onChange={(e) => setAmountOz(e.target.value)} placeholder="กรอกเอง (oz)"
              className="block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 text-sm focus:border-pink-400 focus:ring-1 focus:ring-pink-400 outline-none placeholder:text-gray-300" />
            {amountOz && !isNaN(Number(amountOz)) && (
              <p className="text-[11px] text-gray-400 mt-1">≈ {Math.round(Number(amountOz) * OZ_TO_ML)} ml</p>
            )}
          </div>

          {/* เวลา (นาที) */}
          <div>
            <SectionLabel>เวลา (นาที)</SectionLabel>
            <div className="flex gap-2 mb-2">
              {DURATION_PRESETS.map((min) => (
                <button key={min} type="button" onClick={() => setDuration(String(min))}
                  className={`flex-1 py-1.5 rounded-full border text-sm font-semibold transition-all active:scale-95 touch-manipulation ${
                    duration === String(min)
                      ? "bg-pink-100 border-pink-400 text-pink-800"
                      : "border-gray-200 bg-white text-gray-500"
                  }`}>
                  {min}
                </button>
              ))}
            </div>
            <input type="number" min="0" value={duration} onChange={(e) => setDuration(e.target.value)}
              placeholder="กรอกเอง (นาที)"
              className="block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 text-sm focus:border-pink-400 focus:ring-1 focus:ring-pink-400 outline-none placeholder:text-gray-300" />
          </div>

          {/* หมายเหตุ */}
          <div>
            <SectionLabel>หมายเหตุ <span className="font-normal normal-case">(ไม่บังคับ)</span></SectionLabel>
            <div className="flex flex-wrap gap-2 mb-2">
              {NOTE_CHIPS.map((chip) => (
                <button key={chip} type="button" onClick={() => toggleChip(chip)}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all active:scale-95 touch-manipulation ${
                    selectedChips.has(chip)
                      ? "bg-pink-100 border-pink-400 text-pink-800"
                      : "border-gray-200 bg-white text-gray-500"
                  }`}>
                  {chip}
                </button>
              ))}
            </div>
            <input type="text" value={noteText} onChange={(e) => setNoteText(e.target.value)}
              placeholder="บันทึกเพิ่มเติม…"
              className="block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 text-sm focus:border-pink-400 focus:ring-1 focus:ring-pink-400 outline-none placeholder:text-gray-300" />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 pb-6 pt-3 flex gap-2 shrink-0 border-t border-gray-100">
          <button type="button" onClick={onClose} disabled={submitting}
            className="w-24 shrink-0 py-3.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 disabled:opacity-50 touch-manipulation">
            ยกเลิก
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="flex-1 py-3.5 rounded-2xl bg-pink-400 text-white text-sm font-bold shadow-md active:scale-[0.98] transition-transform disabled:opacity-50 touch-manipulation flex items-center justify-center gap-2">
            {submitting ? "กำลังบันทึก…" : <><SaveIcon size={16} /> บันทึก</>}
          </button>
        </div>
      </div>
    </div>
  );
}
