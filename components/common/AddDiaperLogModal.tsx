"use client";

import { useState } from "react";
import { apiPost } from "@/services/api/client";
import { XIcon, SaveIcon, ToiletIcon } from "@/components/icons";
import { MESSAGES } from "@/constants/messages";

const DIAPER_TYPES = [
  { key: "pee", label: "ฉี่" },
  { key: "poo", label: "อึ" },
  { key: "both", label: "ทั้งคู่" },
] as const;

interface AddDiaperLogModalProps {
  idToken: string | null;
  babyId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-gray-400 uppercase mb-2">
      {children}
    </p>
  );
}

export function AddDiaperLogModal({
  idToken,
  babyId,
  onClose,
  onSuccess,
}: AddDiaperLogModalProps) {
  const [type, setType] = useState<"pee" | "poo" | "both">("pee");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!idToken || submitting) return;
    setSubmitting(true);
    setError("");

    const result = await apiPost("/api/diaper", idToken, {
      baby_id: babyId,
      type,
      notes: notes.trim() || null,
    });

    if (!result.ok) {
      setError(result.error ?? MESSAGES.LOGS.DIAPER_ADD_FAILED);
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
          <div className="flex items-center gap-2">
            <ToiletIcon size={20} className="text-diaper" />
            <h2 className="text-lg font-bold text-gray-900">บันทึกผ้าอ้อม</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 pb-4 space-y-4">
          {/* Type */}
          <div>
            <SectionLabel>ประเภท</SectionLabel>
            <div className="flex gap-2">
              {DIAPER_TYPES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setType(t.key)}
                  className={`flex-1 rounded-2xl border py-3 text-sm font-semibold transition-all active:scale-95 touch-manipulation ${
                    type === t.key
                      ? "bg-yellow-100 border-yellow-400 text-yellow-800 shadow-sm"
                      : "border-gray-200 bg-white text-gray-500"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <SectionLabel>
              หมายเหตุ{" "}
              <span className="font-normal normal-case">(ไม่บังคับ)</span>
            </SectionLabel>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น มีผื่น, สีผิดปกติ…"
              className="block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 text-sm focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none placeholder:text-gray-300"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-6 pt-3 flex gap-2 shrink-0 border-t border-gray-100">
          {error && <p className="text-sm text-red-500 mb-2 w-full">{error}</p>}
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
            className="flex-1 py-3.5 rounded-2xl bg-yellow-400 text-white text-sm font-bold shadow-md active:scale-[0.98] transition-transform disabled:opacity-50 touch-manipulation flex items-center justify-center gap-2"
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
