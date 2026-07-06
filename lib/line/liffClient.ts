"use client";

import { getLiffId } from "@/config/env";
import { LINE_AUTH_ERROR } from "./auth";
import { MESSAGES } from "@/constants/messages";

export type LiffInitResult =
  | {
      ok: true;
      idToken: string;
      profile?: { displayName?: string; pictureUrl?: string | null };
    }
  | {
      ok: false;
      error: "missing_liff_id" | "not_logged_in" | "no_id_token" | "no_web_session";
      message: string;
    }
  | { ok: false; error: "exception"; message: string };

// ─── JWT expiry helper ────────────────────────────────────────────────────────

function getJwtExpiry(token: string): number | null {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(b64)) as { exp?: number };
    return payload.exp ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns true if the token has already expired or will expire within
 * `bufferSecs` seconds (default 0 — only truly expired tokens).
 */
export function isTokenExpired(token: string, bufferSecs = 0): boolean {
  const exp = getJwtExpiry(token);
  if (exp === null) return true;
  return Date.now() / 1000 >= exp - bufferSecs;
}

// ─── Browser detection ────────────────────────────────────────────────────────

/** True when running inside the LINE in-app browser. */
export function isLineInAppBrowser(): boolean {
  if (typeof window === "undefined") return false;
  return /Line\//i.test(navigator.userAgent);
}

// ─── Web token storage (external-browser flow) ───────────────────────────────

const WEB_TOKEN_KEY = "nomMom_web_auth_token";

export function storeWebToken(token: string): void {
  try { localStorage.setItem(WEB_TOKEN_KEY, token); } catch { /* ignore */ }
}

export function clearWebToken(): void {
  try { localStorage.removeItem(WEB_TOKEN_KEY); } catch { /* ignore */ }
}

function getStoredWebToken(): string | null {
  try { return localStorage.getItem(WEB_TOKEN_KEY); } catch { return null; }
}

// ─── LIFF state ───────────────────────────────────────────────────────────────

/**
 * Guard: liff.init() must only be called ONCE per app session.
 * Calling it multiple times can re-trigger the OAuth redirect flow,
 * causing an infinite redirect loop when a token expires.
 */
let _liffReady = false;
let _initPromise: Promise<{ ok: true; idToken: string } | { ok: false; error: string; message: string }> | null = null;
let _resolvedToken: string | null = null;

export function getLiffCachedToken(): string | null {
  return _resolvedToken;
}

export function clearLiffTokenCache(): void {
  _initPromise   = null;
  _resolvedToken = null;
  // NOTE: _liffReady intentionally NOT cleared — we must never re-init LIFF.
}

/**
 * Attempts to return a fresher token without re-initialising LIFF.
 * In the LINE browser: reads the current token from the already-init'd SDK.
 * In external browser: clears the web token so the user is sent to /web-login.
 *
 * Returns null when a fresh token cannot be obtained silently (caller must
 * redirect the user to re-authenticate).
 */
export async function refreshLiffToken(): Promise<string | null> {
  if (!isLineInAppBrowser()) {
    clearWebToken();
    return null;
  }

  // Do NOT call liff.init() again — that causes a new OAuth redirect loop.
  // Just ask the already-initialised LIFF instance for its current token.
  try {
    const liff = (await import("@line/liff")).default;
    if (!_liffReady || !liff.isLoggedIn()) return null;

    const token = liff.getIDToken();
    if (token && !isTokenExpired(token)) {
      _resolvedToken = token;
      return token;
    }
  } catch {
    // ignore
  }

  // Token is still expired — silent refresh not possible; caller handles redirect.
  clearLiffTokenCache();
  return null;
}

// ─── LIFF core init (called exactly once) ────────────────────────────────────

async function _initCore(): Promise<{ ok: true; idToken: string } | { ok: false; error: string; message: string }> {
  const liffId = getLiffId();
  if (!liffId) {
    return { ok: false, error: "missing_liff_id", message: MESSAGES.LIFF.NOT_SET };
  }

  try {
    const liff = (await import("@line/liff")).default;

    // Only ever call liff.init() once per app session.
    if (!_liffReady) {
      await liff.init({ liffId });
      _liffReady = true;
    }

    if (!liff.isLoggedIn()) {
      liff.login();
      return { ok: false, error: "not_logged_in", message: "Redirecting to login…" };
    }

    const token = liff.getIDToken();
    if (!token) {
      return { ok: false, error: "no_id_token", message: LINE_AUTH_ERROR };
    }

    // If LIFF returned an expired token (stale cache), we need a fresh login.
    // LOOP-BREAK GUARD: if the URL already contains LIFF callback params we just
    // completed a fresh OAuth exchange.  Redirecting again would cause an infinite
    // loop, so we surface an error instead.
    if (isTokenExpired(token)) {
      const params = new URLSearchParams(window.location.search);
      const isLiffCallback = params.has("code") && params.has("liffClientId");
      if (isLiffCallback) {
        // Fresh auth still yielded an expired token — likely a clock-skew issue.
        // Returning an error breaks the loop; the user can manually retry.
        return {
          ok: false,
          error: "no_id_token",
          message: "การยืนยันตัวตนล้มเหลว กรุณาลองใหม่อีกครั้ง",
        };
      }
      liff.login();
      return { ok: false, error: "not_logged_in", message: "Token expired, redirecting to login…" };
    }

    _resolvedToken = token;
    return { ok: true, idToken: token };
  } catch (err) {
    _initPromise = null;
    return {
      ok: false,
      error: "exception",
      message: err instanceof Error ? err.message : "LIFF initialization failed.",
    };
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Returns a valid auth token for API calls.
 *
 * - LINE in-app browser → LIFF ID token (existing flow, unchanged)
 * - External browser    → stored web JWT from localStorage
 *
 * Returns `{ ok: false, error: "no_web_session" }` when the user needs to
 * log in via /web-login.
 */
export async function initLiffAndGetToken(withProfile = false): Promise<LiffInitResult> {
  // ── External browser: web token flow ──────────────────────────────────
  if (!isLineInAppBrowser()) {
    const stored = getStoredWebToken();
    if (!stored || isTokenExpired(stored)) {
      clearWebToken();
      return {
        ok: false,
        error: "no_web_session",
        message: "กรุณาเข้าสู่ระบบด้วยเบอร์โทรและ PIN",
      };
    }
    return { ok: true, idToken: stored };
  }

  // ── LINE in-app browser: LIFF flow ────────────────────────────────────
  // If the cached token is still valid, serve it immediately without re-init.
  if (_resolvedToken && !isTokenExpired(_resolvedToken)) {
    if (!withProfile) return { ok: true, idToken: _resolvedToken };
  } else {
    // Token absent or truly expired — clear so _initCore fetches a fresh one.
    clearLiffTokenCache();
  }

  if (!_initPromise) {
    _initPromise = _initCore();
  }

  const core = await _initPromise;
  if (!core.ok) return core as LiffInitResult;

  if (!withProfile) {
    return { ok: true, idToken: core.idToken };
  }

  let profile: { displayName?: string; pictureUrl?: string | null } | undefined;
  try {
    const liff = (await import("@line/liff")).default;
    const p    = await liff.getProfile();
    profile    = { displayName: p.displayName, pictureUrl: p.pictureUrl };
  } catch {
    // profile is optional
  }

  return { ok: true, idToken: core.idToken, profile };
}
