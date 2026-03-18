import { getBaseUrl } from "@/utils/url";

// ─── Token refresh registry ───────────────────────────────────────────────────

/**
 * A callback registered by useDashboardAuth that refreshes the LIFF token and
 * updates React state.  Returns the new token, or null if refresh failed.
 *
 * API functions call this on 401 and retry once with the fresh token.
 */
type TokenRefresher = () => Promise<string | null>;
let _tokenRefresher: TokenRefresher | null = null;

export function setTokenRefresher(fn: TokenRefresher): void {
  _tokenRefresher = fn;
}

export function clearTokenRefresher(): void {
  _tokenRefresher = null;
}

// ─── Auth headers ─────────────────────────────────────────────────────────────

export function authHeaders(idToken: string | null): HeadersInit {
  if (!idToken) return {};
  return { Authorization: `Bearer ${idToken}` };
}

// ─── Internal fetch-with-retry ────────────────────────────────────────────────

/**
 * Wraps fetch with a single silent 401 retry.
 *
 * Flow:
 *  1. Make the request with the provided token.
 *  2. If the response is 401 AND a token refresher is registered:
 *     a. Call the refresher to get a new token.
 *     b. Retry the request once with the new token.
 *  3. Return whichever response was last received.
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  idToken: string | null,
): Promise<Response> {
  const res = await fetch(url, init);

  if (res.status !== 401 || !_tokenRefresher) return res;

  // Try to silently refresh the token
  const freshToken = await _tokenRefresher();
  if (!freshToken || freshToken === idToken) return res; // no new token — give up

  // Rebuild headers with the fresh token and retry once
  const retryHeaders = {
    ...(init.headers as Record<string, string>),
    Authorization: `Bearer ${freshToken}`,
  };
  return fetch(url, { ...init, headers: retryHeaders });
}

// ─── Public API functions ─────────────────────────────────────────────────────

export async function apiGet<T>(
  path: string,
  idToken: string | null,
): Promise<{ ok: true; data: T } | { ok: false; error: string; status?: number }> {
  const url = `${getBaseUrl()}${path}`;
  const init: RequestInit = { headers: authHeaders(idToken), cache: "no-store" };
  const res = await fetchWithRetry(url, init, idToken);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: (json as { error?: string })?.error ?? `Request failed (${res.status})`, status: res.status };
  }
  return { ok: true, data: json as T };
}

export async function apiPost<T>(
  path: string,
  idToken: string | null,
  body: unknown,
): Promise<{ ok: true; data: T } | { ok: false; error: string; status?: number }> {
  const url = `${getBaseUrl()}${path}`;
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(idToken) },
    body: JSON.stringify(body),
  };
  const res = await fetchWithRetry(url, init, idToken);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: (json as { error?: string })?.error ?? `Request failed (${res.status})`, status: res.status };
  }
  return { ok: true, data: json as T };
}

export async function apiDelete<T>(
  path: string,
  idToken: string | null,
): Promise<{ ok: true; data: T } | { ok: false; error: string; status?: number }> {
  const url = `${getBaseUrl()}${path}`;
  const init: RequestInit = { method: "DELETE", headers: authHeaders(idToken) };
  const res = await fetchWithRetry(url, init, idToken);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: (json as { error?: string })?.error ?? `Request failed (${res.status})`, status: res.status };
  }
  return { ok: true, data: json as T };
}

export async function apiPut<T>(
  path: string,
  idToken: string | null,
  body: unknown,
): Promise<{ ok: true; data: T } | { ok: false; error: string; status?: number }> {
  const url = `${getBaseUrl()}${path}`;
  const init: RequestInit = {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders(idToken) },
    body: JSON.stringify(body),
  };
  const res = await fetchWithRetry(url, init, idToken);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: (json as { error?: string })?.error ?? `Request failed (${res.status})`, status: res.status };
  }
  return { ok: true, data: json as T };
}

export async function apiPatch<T>(
  path: string,
  idToken: string | null,
  body: unknown,
): Promise<{ ok: true; data: T } | { ok: false; error: string; status?: number }> {
  const url = `${getBaseUrl()}${path}`;
  const init: RequestInit = {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders(idToken) },
    body: JSON.stringify(body),
  };
  const res = await fetchWithRetry(url, init, idToken);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: (json as { error?: string })?.error ?? `Request failed (${res.status})`, status: res.status };
  }
  return { ok: true, data: json as T };
}
