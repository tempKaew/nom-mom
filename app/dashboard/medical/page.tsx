"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useDashboardAuth } from "@/hooks/useDashboardAuth";
import { useSelectedBabyId } from "@/hooks/useSelectedBabyId";
import {
  LoadingSpinner,
  ErrorView,
  AddAppointmentModal,
  BottomNav,
  SwitchBabySheet,
} from "@/components/common";
import { calcAge } from "@/utils/time";
import {
  PlusIcon,
  CheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  SyringeIcon,
  CalendarIcon,
  ClipboardIcon,
  HospitalIcon,
  CaregiverIcon,
  StethoscopeIcon,
  PencilIcon,
  SaveIcon,
  XIcon,
} from "@/components/icons";
import { apiGet, apiPatch, apiPut } from "@/services/api/client";
import type { Appointment } from "@/types/app";
import { MESSAGES } from "@/constants/messages";

// ─── Cache ────────────────────────────────────────────────────────────────────

const APPTS_TTL_MS = 2 * 60 * 1000;
type ApptCacheEntry = {
  data: Appointment[];
  fetchedAt: number;
  inFlight: Promise<Appointment[]> | null;
};
const _medApptCache = new Map<string, ApptCacheEntry>();

// ─── Constants ────────────────────────────────────────────────────────────────

type VaccineGroup = { label: string; vaccines: { name: string; schedule: string }[] };

const VACCINE_GROUPS: VaccineGroup[] = [
  {
    label: "แรกเกิด",
    vaccines: [
      { name: "HBsAg (Hepatitis B) ครั้งที่ 1", schedule: "แรกเกิด" },
      { name: "BCG (วัณโรค)", schedule: "แรกเกิด" },
    ],
  },
  {
    label: "1–2 เดือน",
    vaccines: [
      { name: "HBsAg (Hepatitis B) ครั้งที่ 2", schedule: "1 เดือน" },
      { name: "DTwP-HB-Hib ครั้งที่ 1", schedule: "2 เดือน" },
      { name: "OPV / IPV ครั้งที่ 1", schedule: "2 เดือน" },
      { name: "Rotavirus ครั้งที่ 1", schedule: "2 เดือน" },
    ],
  },
  {
    label: "4 เดือน",
    vaccines: [
      { name: "DTwP-HB-Hib ครั้งที่ 2", schedule: "4 เดือน" },
      { name: "OPV / IPV ครั้งที่ 2", schedule: "4 เดือน" },
      { name: "Rotavirus ครั้งที่ 2", schedule: "4 เดือน" },
    ],
  },
  {
    label: "6 เดือน",
    vaccines: [
      { name: "DTwP-HB-Hib ครั้งที่ 3", schedule: "6 เดือน" },
      { name: "OPV ครั้งที่ 3", schedule: "6 เดือน" },
      { name: "HBsAg (Hepatitis B) ครั้งที่ 3", schedule: "6 เดือน" },
      { name: "Influenza (ไข้หวัดใหญ่)", schedule: "6 เดือนขึ้นไป" },
    ],
  },
  {
    label: "9–12 เดือน",
    vaccines: [
      { name: "MMR (คางทูม-หัด-หัดเยอรมัน) ครั้งที่ 1", schedule: "9-12 เดือน" },
      { name: "JE (ไข้สมองอักเสบ) ครั้งที่ 1", schedule: "12 เดือน" },
      { name: "Varicella (อีสุกอีใส)", schedule: "12 เดือน" },
    ],
  },
  {
    label: "12–18 เดือน",
    vaccines: [
      { name: "HepA ครั้งที่ 1", schedule: "12-18 เดือน" },
      { name: "DTwP-HB-Hib กระตุ้น", schedule: "18 เดือน" },
      { name: "OPV กระตุ้น", schedule: "18 เดือน" },
    ],
  },
  {
    label: "2–3 ปี",
    vaccines: [
      { name: "MMR ครั้งที่ 2", schedule: "2.5 ปี" },
    ],
  },
];

const ALL_VACCINES = VACCINE_GROUPS.flatMap((g) => g.vaccines);

type AppointmentStatus = "upcoming" | "completed" | "cancelled";

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; icon: React.ReactNode; border: string; bg: string; text: string; badge: string }
> = {
  upcoming: {
    label: "กำลังจะมาถึง",
    icon: <CalendarIcon size={12} />,
    border: "border-blue-400",
    bg: "bg-blue-50",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-600",
  },
  completed: {
    label: "เสร็จแล้ว",
    icon: <CheckCircleIcon size={12} />,
    border: "border-emerald-400",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-600",
  },
  cancelled: {
    label: "ยกเลิก",
    icon: <XCircleIcon size={12} />,
    border: "border-gray-300",
    bg: "bg-gray-50",
    text: "text-gray-500",
    badge: "bg-gray-100 text-gray-400",
  },
};

type TabKey = "vaccine" | "appointment" | "history";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "vaccine",     label: "วัคซีน",      icon: <SyringeIcon size={15} /> },
  { key: "appointment", label: "นัดหมอ",       icon: <CalendarIcon size={15} /> },
  { key: "history",     label: "ประวัติรักษา", icon: <ClipboardIcon size={15} /> },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatApptDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatApptTime(iso: string) {
  return new Date(iso).toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function daysUntil(iso: string): number {
  const now = new Date();
  const d = new Date(iso);
  return Math.ceil((d.getTime() - now.getTime()) / 86400000);
}

function CountdownBadge({ iso }: { iso: string }) {
  const days = daysUntil(iso);
  if (days < 0) return null;
  if (days === 0) return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">วันนี้!</span>
  );
  if (days === 1) return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">พรุ่งนี้</span>
  );
  if (days <= 7) return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">อีก {days} วัน</span>
  );
  return null;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">{children}</p>
  );
}

// ─── Status Sheet ─────────────────────────────────────────────────────────────

function AppointmentStatusSheet({
  appointment, babyId, idToken, onClose, onSuccess,
}: {
  appointment: Appointment; babyId: string; idToken: string | null;
  onClose: () => void; onSuccess: () => void;
}) {
  const [loading, setLoading] = useState<AppointmentStatus | null>(null);

  const handleSelect = async (newStatus: AppointmentStatus) => {
    if (newStatus === appointment.status) { onClose(); return; }
    setLoading(newStatus);
    await apiPatch("/api/appointments", idToken, { id: appointment.id, baby_id: babyId, status: newStatus });
    setLoading(null);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full bg-white rounded-t-3xl px-5 pt-4 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">เปลี่ยนสถานะ</p>
        <p className="text-sm font-bold text-gray-800 mb-4 truncate">{appointment.title}</p>
        <div className="space-y-2">
          {(Object.keys(STATUS_CONFIG) as AppointmentStatus[]).map((s) => {
            const cfg = STATUS_CONFIG[s];
            const isCurrent = appointment.status === s;
            const isLoading = loading === s;
            return (
              <button key={s} type="button" disabled={loading !== null} onClick={() => handleSelect(s)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all active:scale-[0.98] touch-manipulation ${
                  isCurrent ? `${cfg.border} ${cfg.bg}` : "border-gray-100 bg-white"
                } disabled:opacity-60`}>
                <span className={`flex items-center justify-center w-5 h-5 ${isCurrent ? cfg.text : "text-gray-400"}`}>
                  {cfg.icon}
                </span>
                <span className={`flex-1 text-sm font-semibold text-left ${isCurrent ? cfg.text : "text-gray-600"}`}>
                  {cfg.label}
                </span>
                {isCurrent && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>ปัจจุบัน</span>
                )}
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Edit Appointment Sheet ────────────────────────────────────────────────────

function EditAppointmentSheet({
  appointment, babyId, idToken, onClose, onSuccess,
}: {
  appointment: Appointment; babyId: string; idToken: string | null;
  onClose: () => void; onSuccess: () => void;
}) {
  const [title, setTitle]             = useState(appointment.title);
  const [doctor, setDoctor]           = useState(appointment.doctor_name ?? "");
  const [hospital, setHospital]       = useState(appointment.hospital ?? "");
  const [appointmentAt, setApptAt]    = useState(
    new Date(appointment.appointment_at).toISOString().slice(0, 16)
  );
  const [apptStatus, setApptStatus]   = useState<AppointmentStatus>(
    (appointment.status as AppointmentStatus) in STATUS_CONFIG
      ? (appointment.status as AppointmentStatus) : "upcoming"
  );
  const [notes, setNotes]             = useState(appointment.notes ?? "");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("กรุณากรอกหัวข้อนัดหมาย"); return; }
    setLoading(true);
    setError("");
    const result = await apiPut<Appointment>("/api/appointments", idToken, {
      id: appointment.id,
      baby_id: babyId,
      title: title.trim(),
      doctor_name: doctor.trim() || null,
      hospital: hospital.trim() || null,
      appointment_at: new Date(appointmentAt).toISOString(),
      status: apptStatus,
      notes: notes.trim() || null,
    });
    setLoading(false);
    if (!result.ok) { setError(result.error); return; }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full bg-white rounded-t-3xl shadow-2xl max-h-[92dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <CalendarIcon size={20} className="text-medical" />
            <h2 className="text-lg font-bold text-gray-900">แก้ไขนัดหมาย</h2>
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
            <XIcon size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 pb-4 space-y-4">
          <div>
            <SectionLabel>ชื่อนัดหมาย <span className="text-red-400">*</span></SectionLabel>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น ตรวจพัฒนาการ, ฉีดวัคซีน"
              className="block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-medical focus:ring-1 focus:ring-medical outline-none placeholder:text-gray-300" />
          </div>

          <div>
            <SectionLabel>วันที่และเวลา <span className="text-red-400">*</span></SectionLabel>
            <input type="datetime-local" value={appointmentAt} onChange={(e) => setApptAt(e.target.value)}
              className="block w-full rounded-xl border border-gray-200 px-0 py-2.5 text-sm text-gray-900 focus:border-medical focus:ring-1 focus:ring-medical outline-none" />
          </div>

          <div>
            <SectionLabel>สถานะ</SectionLabel>
            <div className="flex gap-2">
              {(Object.keys(STATUS_CONFIG) as AppointmentStatus[]).map((s) => {
                const cfg = STATUS_CONFIG[s];
                return (
                  <button key={s} type="button" onClick={() => setApptStatus(s)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all active:scale-95 touch-manipulation ${
                      apptStatus === s ? `${cfg.border} ${cfg.bg} ${cfg.text}` : "border-gray-200 bg-white text-gray-500"
                    }`}>
                    <span className="flex items-center">{cfg.icon}</span>
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <SectionLabel>ชื่อแพทย์ <span className="font-normal normal-case">(ไม่บังคับ)</span></SectionLabel>
            <input type="text" value={doctor} onChange={(e) => setDoctor(e.target.value)}
              placeholder="นพ. / พญ. …"
              className="block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-medical focus:ring-1 focus:ring-medical outline-none placeholder:text-gray-300" />
          </div>

          <div>
            <SectionLabel>สถานพยาบาล <span className="font-normal normal-case">(ไม่บังคับ)</span></SectionLabel>
            <input type="text" value={hospital} onChange={(e) => setHospital(e.target.value)}
              placeholder="ชื่อ รพ. / คลินิก…"
              className="block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-medical focus:ring-1 focus:ring-medical outline-none placeholder:text-gray-300" />
          </div>

          <div>
            <SectionLabel>หมายเหตุ <span className="font-normal normal-case">(ไม่บังคับ)</span></SectionLabel>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="บันทึกเพิ่มเติม…" rows={2}
              className="block w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-medical focus:ring-1 focus:ring-medical outline-none placeholder:text-gray-300 resize-none" />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>

        {/* Footer */}
        <div className="px-5 pb-6 pt-3 flex gap-2 shrink-0 border-t border-gray-100">
          <button type="button" onClick={onClose} disabled={loading}
            className="w-24 shrink-0 py-3.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 disabled:opacity-50 touch-manipulation">
            ยกเลิก
          </button>
          <button type="button" onClick={(e) => handleSubmit(e as unknown as React.FormEvent)} disabled={loading}
            className="flex-1 py-3.5 rounded-2xl bg-medical text-white text-sm font-bold shadow-md active:scale-[0.98] transition-transform disabled:opacity-50 touch-manipulation flex items-center justify-center gap-2">
            {loading ? "กำลังบันทึก…" : <><SaveIcon size={16} /> บันทึก</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Appointment Card ──────────────────────────────────────────────────────────

function AppointmentCard({
  appt, onStatusClick, onEditClick,
}: {
  appt: Appointment;
  onStatusClick: (appt: Appointment) => void;
  onEditClick: (appt: Appointment) => void;
}) {
  const statusKey =
    (appt.status as AppointmentStatus) in STATUS_CONFIG
      ? (appt.status as AppointmentStatus) : "upcoming";
  const cfg = STATUS_CONFIG[statusKey];
  const isUpcoming = statusKey === "upcoming";
  const isCompleted = statusKey === "completed";
  const isCancelled = statusKey === "cancelled";

  return (
    <div className={`flex gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0 ${isCancelled ? "opacity-50" : ""}`}>
      {/* Left accent */}
      <div className={`w-1 rounded-full shrink-0 self-stretch ${cfg.border} border-l-4`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className={`text-sm font-bold leading-snug ${isCompleted ? "line-through text-gray-300" : "text-gray-800"}`}>
            {appt.title}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <button type="button" onClick={() => onEditClick(appt)}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 active:scale-95 transition-transform">
              <PencilIcon size={12} />
            </button>
          </div>
        </div>

        {/* Date + time */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 font-medium">
            {formatApptDate(appt.appointment_at)} · {formatApptTime(appt.appointment_at)} น.
          </span>
          {isUpcoming && <CountdownBadge iso={appt.appointment_at} />}
        </div>

        {/* Hospital / Doctor */}
        {(appt.hospital || appt.doctor_name) && (
          <div className="flex flex-wrap gap-x-3 mt-1">
            {appt.hospital && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <HospitalIcon size={11} /> {appt.hospital}
              </span>
            )}
            {appt.doctor_name && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                <CaregiverIcon size={11} /> {appt.doctor_name}
              </span>
            )}
          </div>
        )}

        {appt.notes && (
          <p className="text-xs text-gray-400 mt-1 italic">{appt.notes}</p>
        )}

        {/* Status pill */}
        <button type="button" onClick={() => onStatusClick(appt)}
          className={`mt-2 inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full active:scale-95 transition-transform ${cfg.badge}`}>
          {cfg.icon}
          <span>{cfg.label}</span>
        </button>
      </div>
    </div>
  );
}

// ─── Vaccine Row ──────────────────────────────────────────────────────────────

function VaccineRow({
  name, schedule, done, onToggle,
}: {
  name: string; schedule: string; done: boolean; onToggle: () => void;
}) {
  return (
    <button type="button" onClick={onToggle}
      className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 text-left active:bg-gray-50 transition-colors">
      <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
        done ? "border-emerald-400 bg-emerald-400" : "border-gray-200"
      }`}>
        {done && <CheckIcon size={10} strokeWidth={3} className="text-white" />}
      </div>
      <span className={`flex-1 text-sm leading-snug ${done ? "line-through text-gray-300" : "text-gray-700"}`}>
        {name}
      </span>
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
        done ? "bg-emerald-50 text-emerald-500" : "bg-gray-100 text-gray-400"
      }`}>
        {schedule}
      </span>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function MedicalPageContent() {
  const searchParams = useSearchParams();
  const { status, idToken, data, errorMessage } = useDashboardAuth();
  const [selectedBabyId, setSelectedBabyId] = useSelectedBabyId(data?.babies ?? []);
  const initialTab = searchParams.get("tab") as TabKey | null;
  const [activeTab, setActiveTab] = useState<TabKey>(
    initialTab && ["vaccine", "appointment", "history"].includes(initialTab)
      ? initialTab : "vaccine"
  );
  const [showSwitchBaby, setShowSwitchBaby] = useState(false);
  const [checkedVaccines, setCheckedVaccines] = useState<Set<number>>(new Set());
  const [showAddAppointment, setShowAddAppointment] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Appointment | null>(null);
  const [editTarget, setEditTarget]     = useState<Appointment | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);

  const fetchAppointments = useCallback(async (force = false) => {
    if (!idToken || !selectedBabyId) return;
    const key   = selectedBabyId;
    const entry = _medApptCache.get(key);
    const now   = Date.now();

    if (!force && entry && !entry.inFlight && now - entry.fetchedAt < APPTS_TTL_MS) {
      setAppointments(entry.data);
      return;
    }
    if (entry?.inFlight) {
      setLoadingAppts(true);
      try { setAppointments(await entry.inFlight); } catch { /* ignore */ }
      finally { setLoadingAppts(false); }
      return;
    }

    const fetchPromise: Promise<Appointment[]> = apiGet<{ data: Appointment[] }>(
      `/api/appointments?babyId=${selectedBabyId}`, idToken,
    ).then((r) => (r.ok ? r.data.data ?? [] : []));

    _medApptCache.set(key, { data: entry?.data ?? [], fetchedAt: entry?.fetchedAt ?? 0, inFlight: fetchPromise });
    setLoadingAppts(true);
    try {
      const d = await fetchPromise;
      _medApptCache.set(key, { data: d, fetchedAt: Date.now(), inFlight: null });
      setAppointments(d);
    } catch {
      const cur = _medApptCache.get(key);
      if (cur) _medApptCache.set(key, { ...cur, inFlight: null });
    } finally {
      setLoadingAppts(false);
    }
  }, [idToken, selectedBabyId]);

  useEffect(() => {
    if (status === "ready" && activeTab === "appointment") fetchAppointments();
  }, [status, activeTab, fetchAppointments]);

  if (status === "loading") return <LoadingSpinner className="text-xs" label="กำลังโหลดข้อมูลสุขภาพ..." />;
  if (status === "error")   return <ErrorView message={errorMessage} action={{ label: MESSAGES.UI.RETRY, href: "/dashboard/medical" }} />;
  if (!data) return null;

  const { babies } = data;
  const selectedBaby = babies.find((b) => b.id === selectedBabyId) ?? babies[0] ?? null;

  const toggleVaccine = (globalIndex: number) => {
    setCheckedVaccines((prev) => {
      const next = new Set(prev);
      next.has(globalIndex) ? next.delete(globalIndex) : next.add(globalIndex);
      return next;
    });
  };

  const doneCount  = checkedVaccines.size;
  const totalCount = ALL_VACCINES.length;
  const progressPct = Math.round((doneCount / totalCount) * 100);

  const upcoming = appointments
    .filter((a) => a.status === "upcoming")
    .sort((a, b) => new Date(a.appointment_at).getTime() - new Date(b.appointment_at).getTime());
  const others = appointments.filter((a) => a.status !== "upcoming");

  const nextAppt = upcoming[0] ?? null;

  return (
    <div
      className="min-h-screen bg-app-bg-secondary flex flex-col"
      style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom))" }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="bg-white px-4 pt-5 pb-0 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-medical/10 flex items-center justify-center">
              <StethoscopeIcon size={20} className="text-medical" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">สุขภาพ</h1>
              {selectedBaby && (
                <p className="text-xs text-gray-400">
                  {selectedBaby.name}
                  {selectedBaby.birth_date && ` · ${calcAge(selectedBaby.birth_date)}`}
                </p>
              )}
            </div>
          </div>
          {activeTab === "appointment" && (
            <button type="button" onClick={() => setShowAddAppointment(true)}
              className="flex items-center gap-1.5 bg-medical text-white text-xs font-bold px-3 py-2 rounded-full shadow-sm active:scale-95 transition-transform">
              <PlusIcon size={13} /> เพิ่มนัด
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex">
          {TABS.map((tab) => (
            <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-medical text-medical"
                  : "border-transparent text-gray-400"
              }`}>
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 px-4 pt-4 space-y-3">

        {/* ── Vaccine Tab ─────────────────────────────────────────────── */}
        {activeTab === "vaccine" && (
          <div className="space-y-3">
            {/* Progress card */}
            <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <SyringeIcon size={16} className="text-emerald-500" />
                  <span className="text-sm font-bold text-gray-800">ความคืบหน้า</span>
                </div>
                <span className="text-sm font-bold text-emerald-600">{doneCount}/{totalCount}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                {doneCount === 0 ? "ยังไม่มีวัคซีนที่ฉีดแล้ว"
                  : doneCount === totalCount ? "ฉีดครบทุกวัคซีนแล้ว! 🎉"
                  : `ฉีดแล้ว ${progressPct}%`}
              </p>
            </div>

            {/* Grouped vaccine list */}
            {VACCINE_GROUPS.map((group) => {
              const startIndex = ALL_VACCINES.indexOf(group.vaccines[0]);
              return (
                <div key={group.label} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                      {group.label}
                    </span>
                    <span className="ml-auto text-[10px] text-emerald-500 font-semibold">
                      {group.vaccines.filter((_, i) => checkedVaccines.has(startIndex + i)).length}/
                      {group.vaccines.length}
                    </span>
                  </div>
                  {group.vaccines.map((v, localIdx) => {
                    const globalIdx = startIndex + localIdx;
                    return (
                      <VaccineRow
                        key={v.name}
                        name={v.name}
                        schedule={v.schedule}
                        done={checkedVaccines.has(globalIdx)}
                        onToggle={() => toggleVaccine(globalIdx)}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Appointment Tab ─────────────────────────────────────────── */}
        {activeTab === "appointment" && (
          <div className="space-y-3 pb-4">
            {loadingAppts ? (
              <LoadingSpinner className="text-xs" label="กำลังโหลดนัดหมาย..." />
            ) : (
              <>
                {/* Next appointment hero */}
                {nextAppt && (
                  <div className="bg-medical/5 border border-medical/20 rounded-2xl px-4 py-4">
                    <p className="text-[11px] font-bold text-medical uppercase tracking-widest mb-1">
                      นัดหมายถัดไป
                    </p>
                    <p className="text-base font-bold text-gray-800 leading-snug mb-1">
                      {nextAppt.title}
                    </p>
                    <p className="text-sm text-gray-600 font-medium">
                      {formatApptDate(nextAppt.appointment_at)} · {formatApptTime(nextAppt.appointment_at)} น.
                    </p>
                    {(nextAppt.hospital || nextAppt.doctor_name) && (
                      <div className="flex gap-3 mt-1.5 flex-wrap">
                        {nextAppt.hospital && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <HospitalIcon size={11} /> {nextAppt.hospital}
                          </span>
                        )}
                        {nextAppt.doctor_name && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <CaregiverIcon size={11} /> {nextAppt.doctor_name}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="mt-2">
                      <CountdownBadge iso={nextAppt.appointment_at} />
                    </div>
                  </div>
                )}

                {/* All upcoming */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={15} className="text-blue-400" />
                      <h2 className="text-sm font-bold text-gray-800">กำลังจะมาถึง</h2>
                    </div>
                    {upcoming.length > 0 && (
                      <span className="text-xs bg-blue-50 text-blue-500 font-bold px-2 py-0.5 rounded-full">
                        {upcoming.length}
                      </span>
                    )}
                  </div>
                  {upcoming.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <CalendarIcon size={28} className="text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400 font-medium">ยังไม่มีนัดหมาย</p>
                      <p className="text-xs text-gray-300 mt-1">กด "เพิ่มนัด" เพื่อเพิ่มนัดหมายใหม่</p>
                    </div>
                  ) : (
                    upcoming.map((appt) => (
                      <AppointmentCard key={appt.id} appt={appt}
                        onStatusClick={setStatusTarget} onEditClick={setEditTarget} />
                    ))
                  )}
                </div>

                {/* Completed / Cancelled */}
                {others.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
                      <CheckCircleIcon size={15} className="text-gray-300" />
                      <h2 className="text-sm font-bold text-gray-800">รายการอื่นๆ</h2>
                    </div>
                    {others.map((appt) => (
                      <AppointmentCard key={appt.id} appt={appt}
                        onStatusClick={setStatusTarget} onEditClick={setEditTarget} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── History Tab ─────────────────────────────────────────────── */}
        {activeTab === "history" && (
          <div className="space-y-3 pb-4">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
                <ClipboardIcon size={15} className="text-gray-400" />
                <h2 className="text-sm font-bold text-gray-800">ประวัติการรักษา</h2>
              </div>
              <div className="px-4 py-10 text-center">
                <StethoscopeIcon size={36} className="text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-400">ยังไม่มีประวัติการรักษา</p>
                <p className="text-xs text-gray-300 mt-1">ฟีเจอร์นี้จะมาในเวอร์ชันถัดไป</p>
              </div>
            </div>
            <div className="bg-blue-50 rounded-2xl px-4 py-3">
              <p className="text-xs text-blue-400 font-medium text-center leading-relaxed">
                จะรองรับการบันทึกประวัติรักษา ยา และอาการต่างๆ
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals / Sheets ─────────────────────────────────────────────── */}
      {showAddAppointment && selectedBabyId && (
        <AddAppointmentModal babyId={selectedBabyId} idToken={idToken} showStatus
          onClose={() => setShowAddAppointment(false)}
          onSuccess={() => { setShowAddAppointment(false); fetchAppointments(true); }} />
      )}
      {statusTarget && selectedBabyId && (
        <AppointmentStatusSheet appointment={statusTarget} babyId={selectedBabyId} idToken={idToken}
          onClose={() => setStatusTarget(null)}
          onSuccess={() => { setStatusTarget(null); fetchAppointments(true); }} />
      )}
      {editTarget && selectedBabyId && (
        <EditAppointmentSheet appointment={editTarget} babyId={selectedBabyId} idToken={idToken}
          onClose={() => setEditTarget(null)}
          onSuccess={() => { setEditTarget(null); fetchAppointments(true); }} />
      )}
      {showSwitchBaby && (
        <SwitchBabySheet babies={babies} selectedBabyId={selectedBabyId}
          onSelect={(id) => { setSelectedBabyId(id); setShowSwitchBaby(false); }}
          onClose={() => setShowSwitchBaby(false)} />
      )}

      <BottomNav />
    </div>
  );
}

export default function MedicalPage() {
  return (
    <Suspense fallback={<LoadingSpinner className="text-xs" label="กำลังโหลดข้อมูลสุขภาพ..." />}>
      <MedicalPageContent />
    </Suspense>
  );
}
