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
      error: "missing_liff_id" | "not_logged_in" | "no_id_token";
      message: string;
    }
  | { ok: false; error: "exception"; message: string };

/**
 * Module-level cache of the LIFF init Promise.
 * Since Next.js client-side navigation doesn't reload the module, this
 * persists across page transitions within the same session — making every
 * page after the first one nearly instant (no re-init, no extra network round-trips).
 */
let _initPromise: Promise<{ ok: true; idToken: string } | { ok: false; error: string; message: string }> | null = null;

/** Synchronously available once LIFF has been initialized successfully. */
let _resolvedToken: string | null = null;

/** Returns the cached ID token synchronously, or null if not yet initialized. */
export function getLiffCachedToken(): string | null {
  return _resolvedToken;
}

async function _initCore(): Promise<{ ok: true; idToken: string } | { ok: false; error: string; message: string }> {
  const liffId = getLiffId();
  if (!liffId) {
    return { ok: false, error: "missing_liff_id", message: MESSAGES.LIFF.NOT_SET };
  }

  try {
    const liff = (await import("@line/liff")).default;
    await liff.init({ liffId });

    if (!liff.isLoggedIn()) {
      liff.login();
      return { ok: false, error: "not_logged_in", message: "Redirecting to login…" };
    }

    const token = liff.getIDToken();
    if (!token) {
      return { ok: false, error: "no_id_token", message: LINE_AUTH_ERROR };
    }

    _resolvedToken = token;
    return { ok: true, idToken: token };
  } catch (err) {
    // Clear cache on error so the next call retries
    _initPromise = null;
    return {
      ok: false,
      error: "exception",
      message: err instanceof Error ? err.message : "LIFF initialization failed.",
    };
  }
}

/**
 * Initialize LIFF and return ID token.
 * The first call does the real work; subsequent calls in the same session
 * return the cached result immediately without any network overhead.
 *
 * @param withProfile  Pass true to also fetch the LINE profile (dashboard only).
 *                     Skipping profile saves one extra network round-trip on
 *                     pages that don't need it (edit, new-baby, etc.).
 */
export async function initLiffAndGetToken(withProfile = false): Promise<LiffInitResult> {
  if (!_initPromise) {
    _initPromise = _initCore();
  }

  const core = await _initPromise;

  if (!core.ok) {
    return core as LiffInitResult;
  }

  if (!withProfile) {
    return { ok: true, idToken: core.idToken };
  }

  // Fetch profile only when explicitly requested
  let profile: { displayName?: string; pictureUrl?: string | null } | undefined;
  try {
    const liff = (await import("@line/liff")).default;
    const p = await liff.getProfile();
    profile = { displayName: p.displayName, pictureUrl: p.pictureUrl };
  } catch {
    // profile is optional — don't fail
  }

  return { ok: true, idToken: core.idToken, profile };
}
