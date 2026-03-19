"use client";

import { useEffect, useState } from "react";
import { useDashboardAuth } from "@/hooks/useDashboardAuth";
import { useLogs } from "@/hooks/useLogs";
import { useAppointments } from "@/hooks/useAppointments";
import { useSelectedBabyId } from "@/hooks/useSelectedBabyId";
import {
  LoadingSpinner,
  ErrorView,
  AddMilkLogModal,
  AddExcretionEventModal,
  AddSleepLogModal,
  AddPumpingModal,
  AddAppointmentModal,
  BottomNav,
  SwitchBabySheet,
} from "@/components/common";
import { MESSAGES } from "@/constants/messages";
import { QUICK_BTN_CONFIG, buildActivities } from "@/config/activityConfig";

import { BabyHeader } from "./_components/BabyHeader";
import { QuickRecord } from "./_components/QuickRecord";
import { RecentSection } from "./_components/RecentSection";
import { UpcomingAppointmentsSection } from "./_components/UpcomingAppointmentsSection";
import type { QuickModal, QuickBtnConfig } from "./_components/QuickRecord";
import { Appointment } from "@/types/app";

export default function DashboardPage() {
  const { status, idToken, data, errorMessage } = useDashboardAuth();
  const [selectedBabyId, setSelectedBabyId] = useSelectedBabyId(
    data?.babies ?? [],
  );
  const [quickModal, setQuickModal] = useState<QuickModal>(null);
  const [showSwitchBaby, setShowSwitchBaby] = useState(false);

  const {
    milkLogs,
    excretionEvents,
    sleepLogs,
    pumpingSessions,
    latestGrowth,
    loading: logsLoading,
    refetch: refetchLogs,
  } = useLogs(idToken, selectedBabyId);

  const {
    appointments,
    loading: appointmentsLoading,
    refetch: refetchAppointments,
  } = useAppointments(idToken, selectedBabyId);

  useEffect(() => {
    if (status === "ready" && selectedBabyId) {
      refetchLogs();
      refetchAppointments();
    }
  }, [status, selectedBabyId, refetchLogs, refetchAppointments]);

  if (status === "loading") return <LoadingSpinner />;
  if (status === "error")
    return (
      <ErrorView
        message={errorMessage}
        action={{ label: MESSAGES.UI.RETRY, href: "/dashboard" }}
      />
    );
  if (!data) return null;

  const { babies } = data;
  const selectedBaby =
    babies.find((b) => b.id === selectedBabyId) ?? babies[0] ?? null;

  const lastFeeding = milkLogs[0] ?? null;
  const lastPump = pumpingSessions[0]
    ? { logged_at: pumpingSessions[0].start_time }
    : null;
  const lastExcretion = excretionEvents[0] ?? null;
  const lastSleep = sleepLogs[0] ?? null;
  // const nextAppt = appointments.find((a) => a.status === "upcoming") ?? null;
  const nextAppt = null as Appointment | null;

  const quickButtons: QuickBtnConfig[] = [
    { ...QUICK_BTN_CONFIG.feeding, key: "feeding", lastLog: lastFeeding },
    { ...QUICK_BTN_CONFIG.pump, key: "pump", lastLog: lastPump },
    {
      ...QUICK_BTN_CONFIG.appointment,
      key: "appointment",
      lastLog: nextAppt ? { logged_at: nextAppt.appointment_at } : null,
    },
    {
      ...QUICK_BTN_CONFIG.diaper,
      key: "diaper",
      lastLog: lastExcretion ? { logged_at: lastExcretion.datetime } : null,
    },
    {
      ...QUICK_BTN_CONFIG.sleep,
      key: "sleep",
      lastLog: lastSleep ? { logged_at: lastSleep.started_at } : null,
    },
    { ...QUICK_BTN_CONFIG.medical, key: null },
  ];

  const recentActivities = buildActivities(
    milkLogs,
    excretionEvents,
    sleepLogs,
    pumpingSessions,
  ).slice(0, 9);

  return (
    <div className="h-[100dvh] bg-app-bg flex flex-col overflow-hidden">
      <BabyHeader
        babies={babies}
        selectedBaby={selectedBaby}
        onSwitchBaby={() => setShowSwitchBaby(true)}
        latestGrowth={latestGrowth}
      />

      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom))" }}
      >
        <QuickRecord
          buttons={quickButtons}
          onPress={(key) => setQuickModal(key)}
        />

        <UpcomingAppointmentsSection
          appointments={appointments}
          loading={appointmentsLoading}
        />

        <RecentSection
          activities={recentActivities}
          loading={logsLoading}
          idToken={idToken}
          babyId={selectedBabyId}
          onEditSuccess={() => refetchLogs(true)}
        />
      </main>

      {/* Modals */}
      {quickModal === "feeding" && selectedBabyId && (
        <AddMilkLogModal
          idToken={idToken}
          babyId={selectedBabyId}
          initialType="breast"
          birthDate={selectedBaby?.birth_date}
          onClose={() => setQuickModal(null)}
          onSuccess={() => {
            setQuickModal(null);
            refetchLogs(true);
          }}
        />
      )}

      {quickModal === "pump" && selectedBabyId && (
        <AddPumpingModal
          idToken={idToken}
          babyId={selectedBabyId}
          onClose={() => setQuickModal(null)}
          onSuccess={() => {
            setQuickModal(null);
            refetchLogs(true);
          }}
        />
      )}

      {quickModal === "diaper" && selectedBabyId && (
        <AddExcretionEventModal
          idToken={idToken}
          babyId={selectedBabyId}
          onClose={() => setQuickModal(null)}
          onSuccess={() => {
            setQuickModal(null);
            refetchLogs(true);
          }}
        />
      )}

      {quickModal === "appointment" && selectedBabyId && (
        <AddAppointmentModal
          idToken={idToken}
          babyId={selectedBabyId}
          onClose={() => setQuickModal(null)}
          onSuccess={() => {
            setQuickModal(null);
            refetchAppointments(true);
          }}
        />
      )}

      {quickModal === "sleep" && selectedBabyId && (
        <AddSleepLogModal
          idToken={idToken}
          babyId={selectedBabyId}
          onClose={() => setQuickModal(null)}
          onSuccess={() => {
            setQuickModal(null);
            refetchLogs(true);
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
