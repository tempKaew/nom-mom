"use client";

import { useCallback, useState } from "react";
import { getBaseUrl } from "@/utils/url";
import { authHeaders } from "@/services/api/client";
import type { MilkLog, ExcretionEvent, SleepLog, PumpingSession, GrowthRecord } from "@/types/app";

// ─── Module-level cache (survives client-side navigation) ────────────────────

const LOGS_TTL_MS = 2 * 60 * 1000; // 2 minutes

type LogsData = {
  milkLogs: MilkLog[];
  excretionEvents: ExcretionEvent[];
  sleepLogs: SleepLog[];
  pumpingSessions: PumpingSession[];
  latestGrowth: GrowthRecord | null;
};

type CacheEntry = {
  data: LogsData;
  fetchedAt: number;
  /** In-flight promise for deduplication — null when idle. */
  inFlight: Promise<LogsData> | null;
};

const _logsCache = new Map<string, CacheEntry>();

const EMPTY_LOGS: LogsData = {
  milkLogs: [],
  excretionEvents: [],
  sleepLogs: [],
  pumpingSessions: [],
  latestGrowth: null,
};

function makeCacheKey(babyId: string, from?: string, to?: string) {
  return `${babyId}|${from ?? ""}|${to ?? ""}`;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useLogs(
  idToken: string | null,
  babyId: string | null,
  from?: string,
  to?: string
) {
  const [milkLogs, setMilkLogs] = useState<MilkLog[]>([]);
  const [excretionEvents, setExcretionEvents] = useState<ExcretionEvent[]>([]);
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [pumpingSessions, setPumpingSessions] = useState<PumpingSession[]>([]);
  const [latestGrowth, setLatestGrowth] = useState<GrowthRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const applyData = useCallback((d: LogsData) => {
    setMilkLogs(d.milkLogs);
    setExcretionEvents(d.excretionEvents);
    setSleepLogs(d.sleepLogs);
    setPumpingSessions(d.pumpingSessions);
    setLatestGrowth(d.latestGrowth);
  }, []);

  /**
   * @param force  Pass `true` after a mutation to bypass the TTL cache
   *               and always fetch fresh data. Default: `false`.
   */
  const refetch = useCallback(async (force = false) => {
    if (!idToken || !babyId) {
      applyData(EMPTY_LOGS);
      return;
    }

    const key = makeCacheKey(babyId, from, to);
    const entry = _logsCache.get(key);
    const now = Date.now();

    // ── 1. Fresh cache hit → apply immediately, no network ───────────────
    if (
      !force &&
      entry &&
      !entry.inFlight &&
      now - entry.fetchedAt < LOGS_TTL_MS
    ) {
      applyData(entry.data);
      return;
    }

    // ── 2. In-flight dedup → wait for the existing promise ───────────────
    if (entry?.inFlight) {
      setLoading(true);
      try {
        applyData(await entry.inFlight);
      } catch {
        // The originating fetch failed; state stays as-is.
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── 3. New fetch ──────────────────────────────────────────────────────
    const base = getBaseUrl();
    const headers = authHeaders(idToken);

    const rangeParams =
      (from ? `&from=${encodeURIComponent(from)}` : "") +
      (to ? `&to=${encodeURIComponent(to)}` : "");
    const limitParam = from || to ? "&limit=500" : "";
    const q = `babyId=${encodeURIComponent(babyId)}${limitParam}${rangeParams}`;

    const fetchPromise: Promise<LogsData> = Promise.all([
      fetch(`${base}/api/milk?${q}`,             { headers }),
      fetch(`${base}/api/excretion-event?${q}`,  { headers }),
      fetch(`${base}/api/sleep?${q}`,             { headers }),
      fetch(`${base}/api/pumping?${q}`,           { headers }),
      fetch(`${base}/api/growth?babyId=${encodeURIComponent(babyId)}&limit=1`, { headers }),
    ]).then(async ([milkRes, excretionRes, sleepRes, pumpingRes, growthRes]) => {
      const [milkJson, excretionJson, sleepJson, pumpingJson, growthJson] =
        await Promise.all([
          milkRes.ok      ? milkRes.json()      : { data: [] },
          excretionRes.ok ? excretionRes.json() : { data: [] },
          sleepRes.ok     ? sleepRes.json()     : { data: [] },
          pumpingRes.ok   ? pumpingRes.json()   : { data: [] },
          growthRes.ok    ? growthRes.json()    : { data: [] },
        ]);
      return {
        milkLogs:        milkJson.data      ?? [],
        excretionEvents: excretionJson.data ?? [],
        sleepLogs:       sleepJson.data     ?? [],
        pumpingSessions: pumpingJson.data   ?? [],
        latestGrowth:    (growthJson.data   ?? [])[0] ?? null,
      } satisfies LogsData;
    });

    // Register as in-flight so concurrent callers can deduplicate.
    _logsCache.set(key, {
      data: entry?.data ?? EMPTY_LOGS,
      fetchedAt: entry?.fetchedAt ?? 0,
      inFlight: fetchPromise,
    });

    setLoading(true);
    try {
      const data = await fetchPromise;
      _logsCache.set(key, { data, fetchedAt: Date.now(), inFlight: null });
      applyData(data);
    } catch {
      // Clear in-flight on error so the next call can retry.
      const current = _logsCache.get(key);
      if (current) _logsCache.set(key, { ...current, inFlight: null });
    } finally {
      setLoading(false);
    }
  }, [idToken, babyId, from, to, applyData]);

  return { milkLogs, excretionEvents, sleepLogs, pumpingSessions, latestGrowth, loading, refetch };
}
