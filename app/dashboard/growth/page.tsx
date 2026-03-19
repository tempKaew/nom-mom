"use client";

import { useState, useEffect, useCallback } from "react";
import { useDashboardAuth } from "@/hooks/useDashboardAuth";
import { useSelectedBabyId } from "@/hooks/useSelectedBabyId";
import {
  LoadingSpinner,
  ErrorView,
  BottomNav,
  SwitchBabySheet,
} from "@/components/common";
import { GrowthHeader } from "./_components/GrowthHeader";
import { GrowthHistorySection } from "./_components/GrowthHistorySection";
import { GrowthRecordModal } from "./_components/GrowthRecordModal";
import { DevelopmentSection } from "./_components/DevelopmentSection";
import { apiGet } from "@/services/api/client";
import type { GrowthRecord } from "@/types/app";
import { MESSAGES } from "@/constants/messages";

// ─── Module-level cache ───────────────────────────────────────────────────────
const GROWTH_TTL_MS = 2 * 60 * 1000;
type GrowthCacheEntry = {
  data: GrowthRecord[];
  fetchedAt: number;
  inFlight: Promise<GrowthRecord[]> | null;
};
const _growthCache = new Map<string, GrowthCacheEntry>();

type GrowthTab = "growth" | "development";

function getAgeMonths(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const diffMs = Date.now() - birth.getTime();
  if (diffMs < 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
}

export default function GrowthPage() {
  const { status, idToken, data, errorMessage } = useDashboardAuth();
  const [selectedBabyId, setSelectedBabyId] = useSelectedBabyId(
    data?.babies ?? [],
  );
  const [showSwitchBaby, setShowSwitchBaby] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editRecord, setEditRecord] = useState<GrowthRecord | null>(null);
  const [activeTab, setActiveTab] = useState<GrowthTab>("growth");
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const fetchRecords = useCallback(
    async (force = false) => {
      if (!idToken || !selectedBabyId) return;

      const key = selectedBabyId;
      const entry = _growthCache.get(key);
      const now = Date.now();

      // Fresh cache hit → use immediately, skip network
      if (
        !force &&
        entry &&
        !entry.inFlight &&
        now - entry.fetchedAt < GROWTH_TTL_MS
      ) {
        setRecords(entry.data);
        return;
      }

      // In-flight dedup → wait for existing request
      if (entry?.inFlight) {
        setLoadingRecords(true);
        try {
          setRecords(await entry.inFlight);
        } catch {
          /* ignore */
        } finally {
          setLoadingRecords(false);
        }
        return;
      }

      // New fetch
      const fetchPromise: Promise<GrowthRecord[]> = apiGet<{
        data: GrowthRecord[];
      }>(`/api/growth?babyId=${selectedBabyId}`, idToken).then((r) =>
        r.ok ? (r.data.data ?? []) : [],
      );

      _growthCache.set(key, {
        data: entry?.data ?? [],
        fetchedAt: entry?.fetchedAt ?? 0,
        inFlight: fetchPromise,
      });

      setLoadingRecords(true);
      try {
        const data = await fetchPromise;
        _growthCache.set(key, { data, fetchedAt: Date.now(), inFlight: null });
        setRecords(data);
      } catch {
        const cur = _growthCache.get(key);
        if (cur) _growthCache.set(key, { ...cur, inFlight: null });
      } finally {
        setLoadingRecords(false);
      }
    },
    [idToken, selectedBabyId],
  );

  useEffect(() => {
    if (status === "ready") fetchRecords();
  }, [status, fetchRecords]);

  if (status === "loading") return <LoadingSpinner />;
  if (status === "error")
    return (
      <ErrorView
        message={errorMessage}
        action={{ label: MESSAGES.UI.RETRY, href: "/dashboard/growth" }}
      />
    );
  if (!data) return null;

  const { babies } = data;
  const selectedBaby =
    babies.find((b) => b.id === selectedBabyId) ?? babies[0] ?? null;
  const ageMonths = getAgeMonths(selectedBaby?.birth_date);

  const latest = records[0] ?? null;

  const metrics: { label: string; unit: string; value: string | null }[] = [
    {
      label: "น้ำหนัก",
      unit: "kg",
      value: latest?.weight_kg != null ? latest.weight_kg.toFixed(2) : null,
    },
    {
      label: "ส่วนสูง",
      unit: "cm",
      value: latest?.height_cm != null ? latest.height_cm.toFixed(1) : null,
    },
    {
      label: "รอบศีรษะ",
      unit: "cm",
      value:
        latest?.head_circumference_cm != null
          ? latest.head_circumference_cm.toFixed(1)
          : null,
    },
  ];

  return (
    <div
      className="min-h-screen bg-app-bg flex flex-col"
      style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom))" }}
    >
      <GrowthHeader
        babyName={selectedBaby?.name}
        birthDate={selectedBaby?.birth_date}
        metrics={metrics}
        onAdd={() => setShowAddModal(true)}
      />

      <div className="flex-1 px-4 pt-4 space-y-4 pb-4">
        <div className="bg-white rounded-2xl shadow-sm p-1 flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("growth")}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
              activeTab === "growth"
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            การเจริญเติบโต
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("development")}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
              activeTab === "development"
                ? "bg-purple-500 text-white shadow-sm"
                : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            พัฒนาการ
          </button>
        </div>

        {activeTab === "growth" ? (
          <GrowthHistorySection
            records={records}
            loading={loadingRecords}
            onEdit={setEditRecord}
          />
        ) : (
          <DevelopmentSection ageMonths={ageMonths} babyId={selectedBabyId} />
        )}
      </div>

      {showAddModal && selectedBabyId && (
        <GrowthRecordModal
          babyId={selectedBabyId}
          idToken={idToken}
          initialData={null}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchRecords(true);
          }}
        />
      )}
      {editRecord && selectedBabyId && (
        <GrowthRecordModal
          babyId={selectedBabyId}
          idToken={idToken}
          initialData={editRecord}
          onClose={() => setEditRecord(null)}
          onSuccess={() => {
            setEditRecord(null);
            fetchRecords(true);
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
