"use client";

import { useState } from "react";
import { apiPost } from "@/services/api/client";
import {
  XIcon,
  SaveIcon,
  CalendarIcon,
  HospitalIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@/components/icons";
import { MESSAGES } from "@/constants/messages";

// ─── Status ───────────────────────────────────────────────────────────────────

type ApptStatus = "upcoming" | "completed" | "cancelled";

const STATUS_OPTIONS: {
  key: ApptStatus;
  label: string;
  icon: React.ReactNode;
  active: string;
  inactive: string;
}[] = [
  {
    key: "upcoming",
    label: "กำลังจะมาถึง",
    icon: <CalendarIcon size={12} />,
    active: "border-blue-400 bg-blue-50 text-blue-700",
    inactive: "border-gray-200 bg-white text-gray-500",
  },
  {
    key: "completed",
    label: "เสร็จแล้ว",
    icon: <CheckCircleIcon size={12} />,
    active: "border-emerald-400 bg-emerald-50 text-emerald-700",
    inactive: "border-gray-200 bg-white text-gray-500",
  },
  {
    key: "cancelled",
    label: "ยกเลิก",
    icon: <XCircleIcon size={12} />,
    active: "border-gray-400 bg-gray-100 text-gray-600",
    inactive: "border-gray-200 bg-white text-gray-500",
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  idToken: string | null;
  babyId: string;
  onClose: () => void;
  onSuccess: () => void;
  /** Show the status selector — useful for medical page where status matters */
  showStatus?: boolean;
}

// ─── Note chips ───────────────────────────────────────────────────────────────

const NOTE_CHIPS = [
  "ต้องไปก่อน 30 นาที",
  "อย่าลืมสมุดวัคซีน",
  "อดอาหารก่อนตรวจ",
  "เตรียมสิทธิประกัน",
  "นัดติดตามผล",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-gray-400 uppercase mb-2">
      {children}
    </p>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddAppointmentModal({
  idToken,
  babyId,
  onClose,
  onSuccess,
  showStatus = false,
}: Props) {
  const [title, setTitle] = useState("");
  const [appointmentAt, setAppointmentAt] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  });
  const [apptStatus, setApptStatus] = useState<ApptStatus>("upcoming");
  const [doctorName, setDoctorName] = useState("");
  const [hospital, setHospital] = useState("");
  const [selectedChips, setSelectedChips] = useState<Set<string>>(new Set());
  const [noteText, setNoteText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
    if (!title.trim()) {
      setError("กรุณากรอกชื่อนัดหมาย");
      return;
    }
    if (!appointmentAt) {
      setError("กรุณาเลือกวันที่นัดหมาย");
      return;
    }

    setSubmitting(true);
    setError("");

    const result = await apiPost("/api/appointments", idToken, {
      baby_id: babyId,
      title: title.trim(),
      doctor_name: doctorName.trim() || null,
      hospital: hospital.trim() || null,
      appointment_at: new Date(appointmentAt).toISOString(),
      status: apptStatus,
      notes: buildNotes(),
    });

    if (!result.ok) {
      setError(result.error ?? MESSAGES.APPOINTMENTS.ADD_FAILED);
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
        className="relative w-full max-w-full bg-white rounded-t-3xl shadow-2xl max-h-[90dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <CalendarIcon size={20} className="text-medical" />
            <h2 className="text-lg font-bold text-gray-900">นัดหมอ</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 pb-4 space-y-4">
          {/* Title */}
          <div>
            <SectionLabel>
              ชื่อนัดหมาย <span className="text-red-400">*</span>
            </SectionLabel>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น ฉีดวัคซีน, ตรวจพัฒนาการ…"
              className="block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 text-sm focus:border-medical focus:ring-1 focus:ring-medical outline-none placeholder:text-gray-300"
            />
          </div>

          {/* Date/time */}
          <div>
            <SectionLabel>
              วันที่และเวลา <span className="text-red-400">*</span>
            </SectionLabel>
            <input
              type="datetime-local"
              value={appointmentAt}
              onChange={(e) => setAppointmentAt(e.target.value)}
              className="block w-full rounded-xl border border-gray-200 px-0 py-2.5 text-gray-900 text-sm focus:border-medical focus:ring-1 focus:ring-medical outline-none"
            />
          </div>

          {/* Status — only shown when explicitly requested */}
          {showStatus && (
            <div>
              <SectionLabel>สถานะ</SectionLabel>
              <div className="flex gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setApptStatus(s.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 text-xs font-semibold transition-colors touch-manipulation ${
                      apptStatus === s.key ? s.active : s.inactive
                    }`}
                  >
                    <span className="flex items-center">{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Doctor + Hospital */}
          <div className="flex gap-3 flex-col">
            <div className="flex-1">
              <SectionLabel>
                ชื่อแพทย์{" "}
                <span className="font-normal normal-case">(ไม่บังคับ)</span>
              </SectionLabel>
              <div className="relative">
                <UserIcon
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
                />
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="นพ. / พญ. …"
                  className="block w-full rounded-xl border border-gray-200 pl-8 pr-3 py-2.5 text-gray-900 text-sm focus:border-medical focus:ring-1 focus:ring-medical outline-none placeholder:text-gray-300"
                />
              </div>
            </div>
            <div className="flex-1">
              <SectionLabel>
                สถานพยาบาล{" "}
                <span className="font-normal normal-case">(ไม่บังคับ)</span>
              </SectionLabel>
              <div className="relative">
                <HospitalIcon
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
                />
                <input
                  type="text"
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  placeholder="ชื่อรพ. / คลินิก…"
                  className="block w-full rounded-xl border border-gray-200 pl-8 pr-3 py-2.5 text-gray-900 text-sm focus:border-medical focus:ring-1 focus:ring-medical outline-none placeholder:text-gray-300"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <SectionLabel>
              หมายเหตุ{" "}
              <span className="font-normal normal-case">(ไม่บังคับ)</span>
            </SectionLabel>
            <div className="flex flex-wrap gap-2 mb-2">
              {NOTE_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => toggleChip(chip)}
                  className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all active:scale-95 touch-manipulation ${
                    selectedChips.has(chip)
                      ? "bg-blue-100 border-blue-400 text-blue-800"
                      : "border-gray-200 bg-white text-gray-500"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="บันทึกเพิ่มเติม…"
              className="block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-gray-900 text-sm focus:border-medical focus:ring-1 focus:ring-medical outline-none placeholder:text-gray-300"
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
            className="flex-1 py-3.5 rounded-2xl bg-medical text-white text-sm font-bold shadow-md active:scale-[0.98] transition-transform disabled:opacity-50 touch-manipulation flex items-center justify-center gap-2"
          >
            {submitting ? (
              "กำลังบันทึก…"
            ) : (
              <>
                <SaveIcon size={16} /> บันทึกนัดหมาย
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
