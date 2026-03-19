"use client";

import { useState } from "react";
import { apiPatch, apiPost } from "@/services/api/client";
import { RulerIcon, ScaleIcon, BrainIcon, XIcon, SaveIcon } from "@/components/icons";
import { toLocalDatetimeValue } from "@/utils/time";
import type { GrowthRecord } from "@/types/app";

type Props = {
  babyId: string;
  idToken: string | null;
  initialData?: GrowthRecord | null;
  onClose: () => void;
  onSuccess: () => void;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
      {children}
    </p>
  );
}

export function GrowthRecordModal({
  babyId,
  idToken,
  initialData,
  onClose,
  onSuccess,
}: Props) {
  const isEdit = !!initialData;
  const [weight, setWeight] = useState(
    initialData?.weight_kg != null ? String(initialData.weight_kg) : "",
  );
  const [height, setHeight] = useState(
    initialData?.height_cm != null ? String(initialData.height_cm) : "",
  );
  const [head, setHead] = useState(
    initialData?.head_circumference_cm != null
      ? String(initialData.head_circumference_cm)
      : "",
  );
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [recordedAt, setRecordedAt] = useState(() =>
    initialData
      ? toLocalDatetimeValue(new Date(initialData.recorded_at))
      : toLocalDatetimeValue(new Date()),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!weight && !height && !head) {
      setError("กรุณากรอกข้อมูลอย่างน้อย 1 รายการ");
      return;
    }
    if (!idToken || loading) return;

    setLoading(true);
    setError("");

    const payload = {
      baby_id: babyId,
      recorded_at: new Date(recordedAt).toISOString(),
      weight_kg: weight ? Number(weight) : null,
      height_cm: height ? Number(height) : null,
      head_circumference_cm: head ? Number(head) : null,
      notes: notes.trim() || null,
    };

    const result = isEdit
      ? await apiPatch(`/api/growth?id=${initialData!.id}`, idToken, payload)
      : await apiPost("/api/growth", idToken, payload);

    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "บันทึกข้อมูลการเติบโตไม่สำเร็จ");
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
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 shrink-0" />

        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <ScaleIcon size={20} className="text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-900">
              {isEdit ? "แก้ไขการเติบโต" : "เพิ่มการเติบโต"}
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

        <div className="overflow-y-auto flex-1 px-5 pb-4 space-y-4">
          <div>
            <SectionLabel>วันและเวลาที่วัด</SectionLabel>
            <input
              type="datetime-local"
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
              className="block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none"
            />
          </div>

          <div>
            <SectionLabel>น้ำหนัก (kg)</SectionLabel>
            <div className="relative">
              <ScaleIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                inputMode="decimal"
                step="0.001"
                min="0"
                max="200"
                placeholder="เช่น 5.200"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="block w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2.5 text-gray-900 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none"
              />
            </div>
          </div>

          <div>
            <SectionLabel>ส่วนสูง (cm)</SectionLabel>
            <div className="relative">
              <RulerIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                max="300"
                placeholder="เช่น 58.5"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="block w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2.5 text-gray-900 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none"
              />
            </div>
          </div>

          <div>
            <SectionLabel>รอบศีรษะ (cm)</SectionLabel>
            <div className="relative">
              <BrainIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                max="100"
                placeholder="เช่น 37.5"
                value={head}
                onChange={(e) => setHead(e.target.value)}
                className="block w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2.5 text-gray-900 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none"
              />
            </div>
          </div>

          <div>
            <SectionLabel>หมายเหตุ (ไม่บังคับ)</SectionLabel>
            <textarea
              placeholder="บันทึกเพิ่มเติม..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="px-5 pb-6 pt-3 flex gap-2 shrink-0 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-24 shrink-0 py-3.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3.5 rounded-2xl bg-emerald-500 text-white text-sm font-bold shadow-md active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? "กำลังบันทึก..." : <><SaveIcon size={16} /> บันทึก</>}
          </button>
        </div>
      </div>
    </div>
  );
}

