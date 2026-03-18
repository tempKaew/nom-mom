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
import { calcAge } from "@/utils/time";
import {
  TrendUpIcon,
  PlusIcon,
  ScaleIcon,
  RulerIcon,
  BrainIcon,
} from "@/components/icons";
import { apiGet, apiPost } from "@/services/api/client";
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function AddGrowthModal({
  babyId,
  idToken,
  onClose,
  onSuccess,
}: {
  babyId: string;
  idToken: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [head, setHead] = useState("");
  const [notes, setNotes] = useState("");
  const [recordedAt, setRecordedAt] = useState(
    new Date().toISOString().slice(0, 16),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight && !height && !head) {
      setError("กรุณากรอกข้อมูลอย่างน้อย 1 รายการ");
      return;
    }
    setLoading(true);
    setError("");
    const result = await apiPost<GrowthRecord>("/api/growth", idToken, {
      baby_id: babyId,
      recorded_at: new Date(recordedAt).toISOString(),
      weight_kg: weight ? parseFloat(weight) : null,
      height_cm: height ? parseFloat(height) : null,
      head_circumference_cm: head ? parseFloat(head) : null,
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
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className="relative w-full bg-white rounded-t-3xl px-4 pt-5 pb-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <h2 className="text-base font-bold text-gray-900 mb-4">
          เพิ่มข้อมูลการเติบโต
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              วันที่บันทึก
            </label>
            <input
              type="datetime-local"
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
              className="mt-1 w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-800 border border-gray-100 focus:outline-none focus:border-blue-300"
            />
          </div>

          {/* Weight */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              น้ำหนัก (kg)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.001"
              min="0"
              max="200"
              placeholder="เช่น 5.200"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="mt-1 w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-800 border border-gray-100 focus:outline-none focus:border-blue-300"
            />
          </div>

          {/* Height */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              ส่วนสูง (cm)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              max="300"
              placeholder="เช่น 58.5"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="mt-1 w-full bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-800 border border-gray-100 focus:outline-none focus:border-blue-300"
            />
          </div>

          {/* Head */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              รอบศีรษะ (cm)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              max="100"
              placeholder="เช่น 37.5"
              value={head}
              onChange={(e) => setHead(e.target.value)}
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
            {loading ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function GrowthPage() {
  const { status, idToken, data, errorMessage } = useDashboardAuth();
  const [selectedBabyId, setSelectedBabyId] = useSelectedBabyId(
    data?.babies ?? [],
  );
  const [showSwitchBaby, setShowSwitchBaby] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const fetchRecords = useCallback(async (force = false) => {
    if (!idToken || !selectedBabyId) return;

    const key = selectedBabyId;
    const entry = _growthCache.get(key);
    const now = Date.now();

    // Fresh cache hit → use immediately, skip network
    if (!force && entry && !entry.inFlight && now - entry.fetchedAt < GROWTH_TTL_MS) {
      setRecords(entry.data);
      return;
    }

    // In-flight dedup → wait for existing request
    if (entry?.inFlight) {
      setLoadingRecords(true);
      try { setRecords(await entry.inFlight); } catch { /* ignore */ }
      finally { setLoadingRecords(false); }
      return;
    }

    // New fetch
    const fetchPromise: Promise<GrowthRecord[]> = apiGet<{ data: GrowthRecord[] }>(
      `/api/growth?babyId=${selectedBabyId}`,
      idToken,
    ).then((r) => (r.ok ? r.data.data ?? [] : []));

    _growthCache.set(key, { data: entry?.data ?? [], fetchedAt: entry?.fetchedAt ?? 0, inFlight: fetchPromise });

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
  }, [idToken, selectedBabyId]);

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

  const latest = records[0] ?? null;

  const metrics: { label: string; unit: string; value: string | null }[] = [
    {
      label: "น้ำหนัก",
      unit:  "kg",
      value: latest?.weight_kg != null ? latest.weight_kg.toFixed(3) : null,
    },
    {
      label: "ส่วนสูง",
      unit:  "cm",
      value: latest?.height_cm != null ? latest.height_cm.toFixed(1) : null,
    },
    {
      label: "รอบศีรษะ",
      unit:  "cm",
      value: latest?.head_circumference_cm != null
        ? latest.head_circumference_cm.toFixed(1)
        : null,
    },
  ];

  return (
    <div
      className="min-h-screen bg-app-bg flex flex-col"
      style={{ paddingBottom: "calc(4rem + env(safe-area-inset-bottom))" }}
    >
      {/* ── Gradient header ───────────────────────────────────────────── */}
      <header
        className="px-4 pt-5 pb-6"
        style={{ background: "linear-gradient(135deg, #eefbeb 0%, #d3f5cc 100%)" }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-green-900">
              {MESSAGES.UI.NAV_GROWTH}
            </h1>
            {selectedBaby?.birth_date && (
              <p className="text-sm text-green-600 mt-0.5 font-medium">
                {selectedBaby.name} · {calcAge(selectedBaby.birth_date)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-white/60 border border-green-200 text-green-700 rounded-full px-4 py-2 text-sm font-semibold transition-colors shadow-sm hover:bg-white"
          >
            <PlusIcon size={15} className="text-green-600" />
            บันทึก
          </button>
        </div>

        {/* ── Metric pills on header ── */}
        <div className="grid grid-cols-3 gap-2.5 mt-4">
          {metrics.map((m) => (
            <div key={m.label} className="bg-white/60 border border-green-100 rounded-2xl px-3 py-3 text-center">
              <p className="text-[10px] font-bold text-green-500 uppercase tracking-wide mb-1">
                {m.label}
              </p>
              <p className="text-2xl font-bold text-green-900 leading-none">
                {m.value ?? "—"}
              </p>
              <p className="text-[11px] text-green-500 mt-0.5">{m.unit}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="flex-1 px-4 pt-4 space-y-4 pb-4">
        {/* ── History ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
            <TrendUpIcon size={16} className="text-emerald-500" />
            <h2 className="text-sm font-bold text-gray-800">ประวัติการเติบโต</h2>
          </div>

          {loadingRecords ? (
            <LoadingSpinner className="text-xs" label="กำลังโหลดประวัติการเติบโต..." />
          ) : records.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-4xl mb-3">📏</p>
              <p className="text-gray-500 text-sm font-medium">{MESSAGES.UI.EMPTY_GROWTH}</p>
              <p className="text-xs text-gray-300 mt-1">{MESSAGES.UI.EMPTY_GROWTH_HINT}</p>
            </div>
          ) : (
            <div>
              {records.map((r, idx) => {
                const prev = records[idx + 1];
                const weightDiff =
                  r.weight_kg != null && prev?.weight_kg != null
                    ? r.weight_kg - prev.weight_kg
                    : null;
                return (
                  <div
                    key={r.id}
                    className="px-4 py-3.5 border-b border-gray-50 last:border-0"
                  >
                    {/* Date row */}
                    <p className="text-xs text-gray-400 mb-2">{formatDate(r.recorded_at)}</p>

                    {/* Metrics row */}
                    <div className="flex gap-3 flex-wrap">
                      {r.weight_kg != null && (
                        <div className="flex items-center gap-1.5 bg-blue-50 rounded-xl px-2.5 py-1.5">
                          <ScaleIcon size={12} className="text-blue-400" />
                          <span className="text-sm font-bold text-blue-600">
                            {r.weight_kg.toFixed(3)}
                          </span>
                          <span className="text-[10px] text-blue-400">kg</span>
                          {weightDiff !== null && (
                            <span className={`text-[10px] font-semibold ml-0.5 ${weightDiff >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                              {weightDiff >= 0 ? "+" : ""}{weightDiff.toFixed(3)}
                            </span>
                          )}
                        </div>
                      )}
                      {r.height_cm != null && (
                        <div className="flex items-center gap-1.5 bg-emerald-50 rounded-xl px-2.5 py-1.5">
                          <RulerIcon size={12} className="text-emerald-400" />
                          <span className="text-sm font-bold text-emerald-600">
                            {r.height_cm.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-emerald-400">cm</span>
                        </div>
                      )}
                      {r.head_circumference_cm != null && (
                        <div className="flex items-center gap-1.5 bg-purple-50 rounded-xl px-2.5 py-1.5">
                          <BrainIcon size={12} className="text-purple-400" />
                          <span className="text-sm font-bold text-purple-600">
                            {r.head_circumference_cm.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-purple-400">cm</span>
                        </div>
                      )}
                    </div>
                    {r.notes && (
                      <p className="text-xs text-gray-400 mt-1.5 italic">{r.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showAddModal && selectedBabyId && (
        <AddGrowthModal
          babyId={selectedBabyId}
          idToken={idToken}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
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
