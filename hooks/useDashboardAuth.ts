"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { initLiffAndGetToken, refreshLiffToken, isLineInAppBrowser } from "@/lib/line";
import { apiGet, setTokenRefresher, clearTokenRefresher } from "@/services/api/client";
import type { MeData } from "@/types/app";
import { getBaseUrl } from "@/utils/url";
import { authHeaders } from "@/services/api/client";

type Status = "loading" | "ready" | "error";

type AuthCache = { idToken: string; data: MeData };

/**
 * Module-level singletons — survive Next.js client-side navigation.
 *
 * _cache: the resolved auth result. Once set, every subsequent page mount
 *   skips LIFF init + check-user + /api/me and goes straight to "ready".
 *
 * _promise: deduplicates concurrent in-flight fetches (e.g. React Strict Mode
 *   double-invocation, or two components mounting at the same time).
 */
let _cache: AuthCache | null = null;
let _promise: Promise<AuthCache | { redirect: string } | { error: string }> | null = null;

/** Update MeData in the cache (e.g. after adding/editing a baby). */
export function patchDashboardCache(data: MeData) {
  if (_cache) _cache.data = data;
}

/** Fully clear the cache (e.g. on logout or fatal error). */
export function clearDashboardCache() {
  _cache = null;
  _promise = null;
}

async function fetchAuthData(): Promise<
  AuthCache | { redirect: string } | { error: string }
> {
  const liffResult = await initLiffAndGetToken(true);

  if (!liffResult.ok) {
    if (
      liffResult.error === "not_logged_in" ||
      liffResult.error === "no_web_session"
    ) {
      // Redirect to the correct login page based on browser type
      return { redirect: isLineInAppBrowser() ? "/" : "/web-login" };
    }
    return { error: liffResult.message };
  }

  const token = liffResult.idToken;
  const base = getBaseUrl();
  const headers = authHeaders(token);

  const checkRes = await fetch(`${base}/api/check-user`, { headers });
  const checkJson = await checkRes.json();

  if (!checkRes.ok) {
    return { error: checkJson?.error ?? "Check user failed" };
  }

  if (!checkJson.exists) {
    return { redirect: "/register" };
  }

  const meResult = await apiGet<MeData>("/api/me", token);
  if (!meResult.ok) {
    return { error: meResult.error ?? "Failed to load data" };
  }

  return { idToken: token, data: meResult.data };
}

export function useDashboardAuth() {
  const router = useRouter();

  // Lazy initializers read the module-level cache synchronously.
  // On the first page load _cache is null → "loading".
  // On every subsequent page navigation _cache is populated → "ready" instantly.
  const [status, setStatus] = useState<Status>(() =>
    _cache ? "ready" : "loading"
  );
  const [idToken, setIdToken] = useState<string | null>(
    () => _cache?.idToken ?? null
  );
  const [data, setData] = useState<MeData | null>(() => _cache?.data ?? null);
  const [errorMessage, setErrorMessage] = useState("");

  // Register a token refresher with the API client so any 401 is silently
  // retried with a fresh LIFF token.  Cleaned up when the hook unmounts.
  useEffect(() => {
    if (!idToken) return;

    setTokenRefresher(async () => {
      const fresh = await refreshLiffToken();
      if (fresh) {
        setIdToken(fresh);
        if (_cache) _cache.idToken = fresh;
      }
      return fresh;
    });

    return () => clearTokenRefresher();
  }, [idToken]);

  const refetchMe = useCallback(async (): Promise<MeData | null> => {
    const token = idToken;
    if (!token) return null;
    const result = await apiGet<MeData>("/api/me", token);
    if (!result.ok) throw new Error(result.error);
    const newData = result.data;
    setData(newData);
    patchDashboardCache(newData);
    return newData;
  }, [idToken]);

  useEffect(() => {
    // Cache hit → already ready, nothing to fetch
    if (_cache) return;

    let cancelled = false;

    async function run() {
      // Deduplicate: if another component already started the fetch, wait for it
      if (!_promise) {
        _promise = fetchAuthData();
      }

      const result = await _promise;
      if (cancelled) return;

      if ("redirect" in result) {
        router.replace(result.redirect);
        return;
      }

      if ("error" in result) {
        setErrorMessage(result.error);
        setStatus("error");
        _promise = null; // allow retry on next mount
        return;
      }

      // Success — populate cache and update state
      _cache = result;
      setIdToken(result.idToken);
      setData(result.data);
      setStatus("ready");
    }

    run();
    return () => {
      cancelled = true;
    };
  // router is stable in Next.js App Router; listing it satisfies lint without causing re-runs
  }, [router]);

  return { status, idToken, data, errorMessage, refetchMe };
}
