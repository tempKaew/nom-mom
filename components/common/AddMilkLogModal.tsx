"use client";

import { useState } from "react";
import { apiPost } from "@/services/api/client";
import { XIcon, SaveIcon } from "@/components/icons";
import { MESSAGES } from "@/constants/messages";

// ─── Constants ────────────────────────────────────────────────────────────────

const OZ_TO_ML = 29.5735;

const MILK_TYPES = [
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

type AgeRange = {
  label: string;
  amounts: number[];
};

function getAgeRange(birthDate: string | null | undefined): AgeRange {
  if (!birthDate) return { label: "", amounts: [2, 3, 4, 5, 6] };
  const w = getAgeInWeeks(birthDate);
  if (w < 4)  return { label: "1 สัปดาห์แรก (1.5–3 oz)",   amounts: [1.5, 2, 2.5, 3] };
  if (w < 8)  return { label: "~1 เดือน (3–4 oz)",          amounts: [3, 3.5, 4] };
  if (w < 16) return { label: "~2 เดือน (4–5 oz)",          amounts: [4, 4.5, 5] };
  if (w < 26) return { label: "~4 เดือน (4–6 oz)",          amounts: [4, 5, 6] };
  return       { label: "6–12 เดือน (7–8 oz)",              amounts: [7, 7.5, 8] };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddMilkLogModal({
  idToken,
  babyId,
  initialType = "breast",
  birthDate,
  onClose,
  onSuccess,
}: Props) {
  const validInitial = MILK_TYPES.some((t) => t.key === initialType)
    ? (initialType as MilkType)
    : "breast";

  const [type, setType]           = useState<MilkType>(validInitial);
  const [amountOz, setAmountOz]   = useState("");
  const [duration, setDuration]   = useState("");
  const [selectedChips, setSelectedChips] = useState<Set<string>>(new Set());
  const [noteText, setNoteText]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState("");

  const ageRange = getAgeRange(birthDate);

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) => {
      const next = new Set(prev);
      if (next.has(chip)) next.delete(chip);
      else next.add(chip);
      return next;
    });
  };

  const buildNotes = (): string | null => {
    const chips = Array.from(selectedChips).join(", ");
    const manual = noteText.trim();
    const combined = [chips, manual].filter(Boolean).join(" · ");
    return combined || null;
  };

  const handleSubmit = async () => {
    if (!idToken || submitting) return;
    setSubmitting(true);
    setError("");

    const amountMl = amountOz ? Math.round(Number(amountOz) * OZ_TO_ML) : null;

    const result = await apiPost("/api/milk", idToken, {
      baby_id:           babyId,
      type,
      amount_ml:         amountMl,
      duration_minutes:  duration ? Number(duration) : null,
      notes:             buildNotes(),
    });

    if (!result.ok) {
      setError(result.error ?? MESSAGES.LOGS.MILK_ADD_FAILED);
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
        className="relative w-full max-w-full bg-white rounded-t-3xl shadow-2xl max-h-[92dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">ป้อนนม</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 pb-4 space-y-5">

          {/* ── ประเภทนม ── */}
          <div>
            <SectionLabel>ประเภทนม</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {MILK_TYPES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setType(t.key)}
                  className={`px-4 py-2 rounded-full border text-sm font-semibold transition-all active:scale-95 touch-manipulation ${
                    type === t.key
                      ? "bg-pink-100 border-pink-400 text-pink-800 shadow-sm"
                      : "border-gray-200 bg-white text-gray-500"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── ปริมาณ (oz) ── */}
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <SectionLabel>ปริมาณ (oz)</SectionLabel>
              {ageRange.label && (
                <span className="text-[10px] text-gray-400 font-normal normal-case -mt-1">
                  {ageRange.label}
                </span>
              )}
            </div>

            {/* Suggested chips */}
            <div className="flex flex-wrap gap-2 mb-2">
              {ageRange.amounts.map((oz) => (
                <button
                  key={oz}
                  type="button"
                  onClick={() => setAmountOz(String(oz))}
                  className={`px-3 py-1.5 rounded-full border text-sm font-semibold transition-all active:scale-95 touch-manipulation ${
                    amountOz === String(oz)
                      ? "bg-pink-100 border-pink-400 text-pink-800"
                      : "border-gray-200 bg-white text-gray-500"
                  }`}
                >
                  {oz} oz
                </button>
              ))}
            </div>

            {/* Manual input */}
            <input
              type="number"
              min="0"
              step="0.5"
              value={amountOz}
              onChange={(e) => setAmountOz(e.target.value)}
              placeholder="กรอกเอง (oz)"
              className="block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 text-sm focus:border-pink-400 focus:ring-1 focus:ring-pink-400 outline-none placeholder:text-gray-300"
            />
            {amountOz && !isNaN(Number(amountOz)) && (
              <p className="text-[11px] text-gray-400 mt-1">
                ≈ {Math.round(Number(amountOz) * OZ_TO_ML)} ml
              </p>
            )}
          </div>

          {/* ── เวลา (นาที) ── */}
          <div>
            <SectionLabel>เวลา (นาที)</SectionLabel>

            {/* Preset chips */}
            <div className="flex gap-2 mb-2">
              {DURATION_PRESETS.map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => setDuration(String(min))}
                  className={`flex-1 py-1.5 rounded-full border text-sm font-semibold transition-all active:scale-95 touch-manipulation ${
                    duration === String(min)
                      ? "bg-pink-100 border-pink-400 text-pink-800"
                      : "border-gray-200 bg-white text-gray-500"
                  }`}
                >
                  {min}
                </button>
              ))}
            </div>

            {/* Manual input */}
            <input
              type="number"
              min="0"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="กรอกเอง (นาที)"
              className="block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 text-sm focus:border-pink-400 focus:ring-1 focus:ring-pink-400 outline-none placeholder:text-gray-300"
            />
          </div>

          {/* ── หมายเหตุ ── */}
          <div>
            <SectionLabel>หมายเหตุ <span className="font-normal normal-case">(ไม่บังคับ)</span></SectionLabel>

            {/* Quick note chips */}
            <div className="flex flex-wrap gap-2 mb-2">
              {NOTE_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => toggleChip(chip)}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all active:scale-95 touch-manipulation ${
                    selectedChips.has(chip)
                      ? "bg-pink-100 border-pink-400 text-pink-800"
                      : "border-gray-200 bg-white text-gray-500"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Manual text */}
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="บันทึกเพิ่มเติม…"
              className="block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 text-sm focus:border-pink-400 focus:ring-1 focus:ring-pink-400 outline-none placeholder:text-gray-300"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 pb-6 pt-3 flex gap-2 shrink-0 border-t border-gray-100">
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
            disabled={submitting}
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
    </div>
  );
}
