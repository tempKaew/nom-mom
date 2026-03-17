"use client";

import { useCallback, useState } from "react";
import { apiGet } from "@/services/api/client";
import type { Appointment } from "@/types/app";

// ─── Module-level cache ───────────────────────────────────────────────────────

const APPTS_TTL_MS = 2 * 60 * 1000; // 2 minutes

type CacheEntry = {
  data: Appointment[];
  fetchedAt: number;
  inFlight: Promise<Appointment[]> | null;
};

const _apptCache = new Map<string, CacheEntry>();

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAppointments(idToken: string | null, babyId: string | null) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * @param force  Pass `true` after a mutation to bypass the TTL cache.
   */
  const refetch = useCallback(async (force = false) => {
    if (!idToken || !babyId) {
      setAppointments([]);
      return;
    }

    const entry = _apptCache.get(babyId);
    const now = Date.now();

    // ── 1. Fresh cache hit ───────────────────────────────────────────────
    if (
      !force &&
      entry &&
      !entry.inFlight &&
      now - entry.fetchedAt < APPTS_TTL_MS
    ) {
      setAppointments(entry.data);
      return;
    }

    // ── 2. In-flight dedup ───────────────────────────────────────────────
    if (entry?.inFlight) {
      setLoading(true);
      try {
        setAppointments(await entry.inFlight);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── 3. New fetch ─────────────────────────────────────────────────────
    const fetchPromise: Promise<Appointment[]> = apiGet<{ data: Appointment[] }>(
      `/api/appointments?babyId=${encodeURIComponent(babyId)}`,
      idToken
    ).then((res) => (res.ok ? res.data.data ?? [] : []));

    _apptCache.set(babyId, {
      data: entry?.data ?? [],
      fetchedAt: entry?.fetchedAt ?? 0,
      inFlight: fetchPromise,
    });

    setLoading(true);
    try {
      const data = await fetchPromise;
      _apptCache.set(babyId, { data, fetchedAt: Date.now(), inFlight: null });
      setAppointments(data);
    } catch {
      const current = _apptCache.get(babyId);
      if (current) _apptCache.set(babyId, { ...current, inFlight: null });
    } finally {
      setLoading(false);
    }
  }, [idToken, babyId]);

  return { appointments, loading, refetch };
}
