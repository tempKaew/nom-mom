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
} from "@/components/icons";
import { apiGet, apiPatch, apiPut } from "@/services/api/client";
import type { Appointment } from "@/types/app";
import { MESSAGES } from "@/constants/messages";

// ─── Module-level cache ───────────────────────────────────────────────────────
const APPTS_TTL_MS = 2 * 60 * 1000;
type ApptCacheEntry = {
  data: Appointment[];
  fetchedAt: number;
  inFlight: Promise<Appointment[]> | null;
};
const _medApptCache = new Map<string, ApptCacheEntry>();

// ─── Constants ─────────────────────────────────────────────────────────────

const VACCINE_SCHEDULE = [
  { name: "HBsAg (Hepatitis B) ครั้งที่ 1", schedule: "แรกเกิด" },
  { name: "BCG (วัณโรค)", schedule: "แรกเกิด" },
  { name: "HBsAg (Hepatitis B) ครั้งที่ 2", schedule: "1 เดือน" },
  { name: "DTwP-HB-Hib ครั้งที่ 1", schedule: "2 เดือน" },
  { name: "OPV / IPV ครั้งที่ 1", schedule: "2 เดือน" },
  { name: "Rotavirus ครั้งที่ 1", schedule: "2 เดือน" },
  { name: "DTwP-HB-Hib ครั้งที่ 2", schedule: "4 เดือน" },
  { name: "OPV / IPV ครั้งที่ 2", schedule: "4 เดือน" },
  { name: "Rotavirus ครั้งที่ 2", schedule: "4 เดือน" },
  { name: "DTwP-HB-Hib ครั้งที่ 3", schedule: "6 เดือน" },
  { name: "OPV ครั้งที่ 3", schedule: "6 เดือน" },
  { name: "HBsAg (Hepatitis B) ครั้งที่ 3", schedule: "6 เดือน" },
  { name: "Influenza (ไข้หวัดใหญ่)", schedule: "6 เดือนขึ้นไป" },
  { name: "MMR (คางทูม-หัด-หัดเยอรมัน) ครั้งที่ 1", schedule: "9-12 เดือน" },
  { name: "JE (ไข้สมองอักเสบ) ครั้งที่ 1", schedule: "12 เดือน" },
  { name: "Varicella (อีสุกอีใส)", schedule: "12 เดือน" },
  { name: "HepA ครั้งที่ 1", schedule: "12-18 เดือน" },
  { name: "DTwP-HB-Hib กระตุ้น", schedule: "18 เดือน" },
  { name: "OPV กระตุ้น", schedule: "18 เดือน" },
  { name: "MMR ครั้งที่ 2", schedule: "2.5 ปี" },
];

type AppointmentStatus = "upcoming" | "completed" | "cancelled";

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; icon: React.ReactNode; badge: string; badgeText: string }
> = {
  upcoming: {
    label: "กำลังจะมาถึง",
    icon: <CalendarIcon size={12} />,
    badge: "bg-blue-50 text-blue-600",
    badgeText: "กำลังจะมาถึง",
  },
  completed: {
    label: "เสร็จแล้ว",
    icon: <CheckCircleIcon size={12} />,
    badge: "bg-emerald-50 text-emerald-600",
    badgeText: "เสร็จแล้ว",
  },
  cancelled: {
    label: "ยกเลิก",
    icon: <XCircleIcon size={12} />,
    badge: "bg-gray-100 text-gray-400",
    badgeText: "ยกเลิก",
  },
};

type TabKey = "vaccine" | "appointment" | "history";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "vaccine", label: "วัคซีน", icon: <SyringeIcon size={15} /> },
  { key: "appointment", label: "นัดหมอ", icon: <CalendarIcon size={15} /> },
  { key: "history", label: "ประวัติรักษา", icon: <ClipboardIcon size={15} /> },
];

function formatAppointmentDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Status Change Sheet ───────────────────────────────────────────────────

function AppointmentStatusSheet({
  appointment,
  babyId,
  idToken,
  onClose,
  onSuccess,
}: {
  appointment: Appointment;
  babyId: string;
  idToken: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState<AppointmentStatus | null>(null);

  const handleSelect = async (newStatus: AppointmentStatus) => {
    if (newStatus === appointment.status) {
      onClose();
      return;
    }
    setLoading(newStatus);
    await apiPatch("/api/appointments", idToken, {
      id: appointment.id,
      baby_id: babyId,
      status: newStatus,
    });
    setLoading(null);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className="relative w-full bg-white rounded-t-3xl px-4 pt-5"
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <p className="text-xs text-gray-400 mb-1">เปลี่ยนสถานะนัดหมาย</p>
        <p className="text-sm font-bold text-gray-800 mb-4 truncate">
          {appointment.title}
        </p>
        <div className="space-y-2">
          {(Object.keys(STATUS_CONFIG) as AppointmentStatus[]).map((s) => {
            const cfg = STATUS_CONFIG[s];
            const isCurrent = appointment.status === s;
            const isLoading = loading === s;
            return (
              <button
                key={s}
                type="button"
                disabled={loading !== null}
                onClick={() => handleSelect(s)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-colors active:scale-95 ${
                  isCurrent
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-100 bg-white hover:bg-gray-50"
                } disabled:opacity-60`}
              >
                <span className="flex items-center justify-center w-5 h-5">
                  {cfg.icon}
                </span>
                <span
                  className={`flex-1 text-sm font-semibold text-left ${
                    isCurrent ? "text-blue-700" : "text-gray-700"
                  }`}
                >
                  {cfg.label}
                </span>
                {isCurrent && (
                  <span className="text-[10px] bg-blue-500 text-white font-bold px-2 py-0.5 rounded-full">
                    ปัจจุบัน
                  </span>
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

// ─── Edit Appointment Sheet ────────────────────────────────────────────────

function EditAppointmentSheet({
  appointment,
  babyId,
  idToken,
  onClose,
  onSuccess,
}: {
  appointment: Appointment;
  babyId: string;
  idToken: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState(appointment.title);
  const [doctor, setDoctor] = useState(appointment.doctor_name ?? "");
  const [hospital, setHospital] = useState(appointment.hospital ?? "");
  const [appointmentAt, setAppointmentAt] = useState(
    new Date(appointment.appointment_at).toISOString().slice(0, 16),
  );
  const [apptStatus, setApptStatus] = useState<AppointmentStatus>(
    (appointment.status as AppointmentStatus) in STATUS_CONFIG
      ? (appointment.status as AppointmentStatus)
      : "upcoming",
  );
  const [notes, setNotes] = useState(appointment.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("กรุณากรอกหัวข้อนัดหมาย");
      return;
    }
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
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className="relative w-full bg-white rounded-t-3xl px-4 pt-5 max-h-[92vh] overflow-y-auto"
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <h2 className="text-base font-bold text-gray-900 mb-4">แก้ไขนัดหมาย</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              หัวข้อ *
            </label>
            <input
              type="text"
              placeholder="เช่น ตรวจพัฒนาการ, ฉีดวัคซีน"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-800 border border-gray-100 focus:outline-none focus:border-blue-300"
            />
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              วันที่และเวลา *
            </label>
            <input
              type="datetime-local"
              value={appointmentAt}
              onChange={(e) => setAppointmentAt(e.target.value)}
              className="mt-1 w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-800 border border-gray-100 focus:outline-none focus:border-blue-300"
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              สถานะ
            </label>
            <div className="mt-1.5 flex gap-2">
              {(Object.keys(STATUS_CONFIG) as AppointmentStatus[]).map((s) => {
                const cfg = STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setApptStatus(s)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 text-xs font-semibold transition-colors ${
                      apptStatus === s
                        ? "border-blue-400 bg-blue-50 text-blue-700"
                        : "border-gray-100 bg-gray-50 text-gray-500"
                    }`}
                  >
                    <span className="flex items-center">{cfg.icon}</span>
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Doctor */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              แพทย์
            </label>
            <input
              type="text"
              placeholder="ชื่อแพทย์ (ถ้ามี)"
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
              className="mt-1 w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-800 border border-gray-100 focus:outline-none focus:border-blue-300"
            />
          </div>

          {/* Hospital */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              โรงพยาบาล / คลินิก
            </label>
            <input
              type="text"
              placeholder="ชื่อสถานพยาบาล (ถ้ามี)"
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              className="mt-1 w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-800 border border-gray-100 focus:outline-none focus:border-blue-300"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              หมายเหตุ
            </label>
            <textarea
              placeholder="บันทึกเพิ่มเติม..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-800 border border-gray-100 focus:outline-none focus:border-blue-300 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-60 active:scale-95 transition-transform"
          >
            {loading ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Appointment Card ──────────────────────────────────────────────────────

function AppointmentCard({
  appt,
  onStatusClick,
  onEditClick,
}: {
  appt: Appointment;
  onStatusClick: (appt: Appointment) => void;
  onEditClick: (appt: Appointment) => void;
}) {
  const statusKey =
    (appt.status as AppointmentStatus) in STATUS_CONFIG
      ? (appt.status as AppointmentStatus)
      : "upcoming";
  const cfg = STATUS_CONFIG[statusKey];
  const isCancelled = statusKey === "cancelled";
  const isCompleted = statusKey === "completed";

  return (
    <div
      className={`px-4 py-3 border-b border-gray-50 last:border-0 ${
        isCancelled ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold text-gray-800 ${
              isCompleted ? "line-through text-gray-400" : ""
            }`}
          >
            {appt.title}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatAppointmentDate(appt.appointment_at)}
          </p>
          {appt.hospital && (
            <p className="inline-flex items-center gap-1 text-xs text-gray-400 mt-0.5">
              <HospitalIcon size={11} /> {appt.hospital}
            </p>
          )}
          {appt.doctor_name && (
            <p className="inline-flex items-center gap-1 text-xs text-gray-400">
              <CaregiverIcon size={11} /> {appt.doctor_name}
            </p>
          )}
          {appt.notes && (
            <p className="text-xs text-gray-400 mt-0.5 italic">{appt.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onEditClick(appt)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 active:scale-95 transition-transform"
          >
            <PencilIcon size={13} />
          </button>
          <button
            type="button"
            onClick={() => onStatusClick(appt)}
            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full active:scale-95 transition-transform ${cfg.badge}`}
          >
            {cfg.icon} {cfg.badgeText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

function MedicalPageContent() {
  const searchParams = useSearchParams();
  const { status, idToken, data, errorMessage } = useDashboardAuth();
  const [selectedBabyId, setSelectedBabyId] = useSelectedBabyId(
    data?.babies ?? [],
  );
  const initialTab = searchParams.get("tab") as TabKey | null;
  const [activeTab, setActiveTab] = useState<TabKey>(
    initialTab && ["vaccine", "appointment", "history"].includes(initialTab)
      ? initialTab
      : "vaccine",
  );
  const [showSwitchBaby, setShowSwitchBaby] = useState(false);
  const [checkedVaccines, setCheckedVaccines] = useState<Set<number>>(
    new Set(),
  );
  const [showAddAppointment, setShowAddAppointment] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Appointment | null>(null);
  const [editTarget, setEditTarget] = useState<Appointment | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);

  const fetchAppointments = useCallback(async (force = false) => {
    if (!idToken || !selectedBabyId) return;

    const key = selectedBabyId;
    const entry = _medApptCache.get(key);
    const now = Date.now();

    // Fresh cache hit → use immediately, skip network
    if (!force && entry && !entry.inFlight && now - entry.fetchedAt < APPTS_TTL_MS) {
      setAppointments(entry.data);
      return;
    }

    // In-flight dedup → wait for existing request
    if (entry?.inFlight) {
      setLoadingAppts(true);
      try { setAppointments(await entry.inFlight); } catch { /* ignore */ }
      finally { setLoadingAppts(false); }
      return;
    }

    // New fetch
    const fetchPromise: Promise<Appointment[]> = apiGet<{ data: Appointment[] }>(
      `/api/appointments?babyId=${selectedBabyId}`,
      idToken,
    ).then((r) => (r.ok ? r.data.data ?? [] : []));

    _medApptCache.set(key, { data: entry?.data ?? [], fetchedAt: entry?.fetchedAt ?? 0, inFlight: fetchPromise });

    setLoadingAppts(true);
    try {
      const data = await fetchPromise;
      _medApptCache.set(key, { data, fetchedAt: Date.now(), inFlight: null });
      setAppointments(data);
    } catch {
      const cur = _medApptCache.get(key);
      if (cur) _medApptCache.set(key, { ...cur, inFlight: null });
    } finally {
      setLoadingAppts(false);
    }
  }, [idToken, selectedBabyId]);

  useEffect(() => {
    if (status === "ready" && activeTab === "appointment") {
      fetchAppointments();
    }
  }, [status, activeTab, fetchAppointments]);

  if (status === "loading")
    return (
      <LoadingSpinner className="text-xs" label="กำลังโหลดข้อมูลสุขภาพ..." />
    );
  if (status === "error")
    return (
      <ErrorView
        message={errorMessage}
        action={{ label: MESSAGES.UI.RETRY, href: "/dashboard/medical" }}
      />
    );
  if (!data) return null;

  const { babies } = data;
  const selectedBaby =
    babies.find((b) => b.id === selectedBabyId) ?? babies[0] ?? null;

  const toggleVaccine = (index: number) => {
    setCheckedVaccines((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const upcoming = appointments.filter((a) => a.status === "upcoming");
  const others = appointments.filter((a) => a.status !== "upcoming");

  return (
    <div
      className="min-h-screen bg-app-bg-secondary flex flex-col"
      style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom))" }}
    >
      {/* Header */}
      <header className="bg-surface px-4 pt-5 pb-0 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Medical</h1>
            {selectedBaby?.birth_date && (
              <p className="text-sm text-gray-400 mt-0.5">
                {selectedBaby.name} · {calcAge(selectedBaby.birth_date)}
              </p>
            )}
          </div>
          {activeTab === "appointment" && (
            <button
              type="button"
              onClick={() => setShowAddAppointment(true)}
              className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow"
            >
              <PlusIcon size={16} className="text-white" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex mt-3">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-blue-500 text-blue-500"
                  : "border-transparent text-gray-400"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 pt-4">
        {/* ── Vaccine Tab ───────────────────────────────────────────────── */}
        {activeTab === "vaccine" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <SyringeIcon size={16} className="text-gray-400" />
                <h2 className="text-sm font-bold text-gray-800">ตารางวัคซีน</h2>
              </div>
              <span className="text-xs text-gray-400">
                {checkedVaccines.size}/{VACCINE_SCHEDULE.length} ฉีดแล้ว
              </span>
            </div>
            <div>
              {VACCINE_SCHEDULE.map((v, i) => {
                const isDone = checkedVaccines.has(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleVaccine(i)}
                    className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 text-left active:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                        isDone
                          ? "border-emerald-400 bg-emerald-400"
                          : "border-gray-200"
                      }`}
                    >
                      {isDone && (
                        <CheckIcon
                          size={10}
                          strokeWidth={3}
                          className="text-white"
                        />
                      )}
                    </div>
                    <span
                      className={`flex-1 text-sm ${
                        isDone ? "line-through text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {v.name}
                    </span>
                    <span className="text-xs text-gray-400 shrink-0">
                      {v.schedule}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Appointment Tab ───────────────────────────────────────────── */}
        {activeTab === "appointment" && (
          <div className="space-y-3 pb-4">
            {/* Upcoming */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <CalendarIcon size={16} className="text-gray-400" />
                  <h2 className="text-sm font-bold text-gray-800">
                    กำลังจะมาถึง
                  </h2>
                </div>
                {upcoming.length > 0 && (
                  <span className="text-xs bg-blue-50 text-blue-500 font-semibold px-2 py-0.5 rounded-full">
                    {upcoming.length}
                  </span>
                )}
              </div>

              {loadingAppts ? (
                <LoadingSpinner
                  className="text-xs"
                  label="กำลังโหลดนัดหมาย..."
                />
              ) : upcoming.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-gray-400 text-sm">ยังไม่มีนัดหมาย</p>
                  <p className="text-xs text-gray-300 mt-1">
                    กดปุ่ม + เพื่อเพิ่มนัดหมายใหม่
                  </p>
                </div>
              ) : (
                <div>
                  {upcoming.map((appt) => (
                    <AppointmentCard
                      key={appt.id}
                      appt={appt}
                      onStatusClick={setStatusTarget}
                      onEditClick={setEditTarget}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Past / Completed / Cancelled */}
            {others.length > 0 && (
              <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
                  <CalendarIcon size={16} className="text-gray-400" />
                  <h2 className="text-sm font-bold text-gray-800">
                    รายการอื่นๆ
                  </h2>
                </div>
                <div>
                  {others.map((appt) => (
                    <AppointmentCard
                      key={appt.id}
                      appt={appt}
                      onStatusClick={setStatusTarget}
                      onEditClick={setEditTarget}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── History Tab ───────────────────────────────────────────────── */}
        {activeTab === "history" && (
          <div className="space-y-3 pb-4">
            <div className="bg-surface rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
                <ClipboardIcon size={16} className="text-gray-400" />
                <h2 className="text-sm font-bold text-gray-800">
                  ประวัติการรักษา
                </h2>
              </div>
              <div className="px-4 py-8 text-center">
                <StethoscopeIcon
                  size={32}
                  className="text-gray-200 mx-auto mb-2"
                />
                <p className="text-gray-500 text-sm font-medium">
                  ยังไม่มีประวัติการรักษา
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  กดปุ่ม + เพื่อบันทึกการรักษา
                </p>
              </div>
            </div>
            <div className="bg-feeding-bg rounded-2xl px-4 py-4">
              <p className="text-xs text-blue-400 font-medium text-center">
                ฟีเจอร์นี้จะรองรับการบันทึกประวัติรักษา ยา และอาการต่างๆ
                ในเวอร์ชันถัดไป
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals / Sheets ───────────────────────────────────────────────── */}
      {showAddAppointment && selectedBabyId && (
        <AddAppointmentModal
          babyId={selectedBabyId}
          idToken={idToken}
          showStatus
          onClose={() => setShowAddAppointment(false)}
          onSuccess={() => {
            setShowAddAppointment(false);
            fetchAppointments(true);
          }}
        />
      )}

      {statusTarget && selectedBabyId && (
        <AppointmentStatusSheet
          appointment={statusTarget}
          babyId={selectedBabyId}
          idToken={idToken}
          onClose={() => setStatusTarget(null)}
          onSuccess={() => {
            setStatusTarget(null);
            fetchAppointments(true);
          }}
        />
      )}

      {editTarget && selectedBabyId && (
        <EditAppointmentSheet
          appointment={editTarget}
          babyId={selectedBabyId}
          idToken={idToken}
          onClose={() => setEditTarget(null)}
          onSuccess={() => {
            setEditTarget(null);
            fetchAppointments(true);
          }}
        />
      )}

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

export default function MedicalPage() {
  return (
    <Suspense
      fallback={
        <LoadingSpinner className="text-xs" label="กำลังโหลดข้อมูลสุขภาพ..." />
      }
    >
      <MedicalPageContent />
    </Suspense>
  );
}
