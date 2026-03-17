"use client";

import { useEffect, useState } from "react";
import { initLiffAndGetToken, getLiffCachedToken } from "@/lib/line";

type LiffErrorKind = "missing_liff_id" | "no_id_token" | "exception";

type LiffAuthState =
  | { status: "loading" }
  | { status: "ready"; idToken: string; profile?: { displayName?: string; pictureUrl?: string | null } }
  | { status: "error"; message: string; kind: LiffErrorKind };

/**
 * Initialize LIFF and expose idToken (and optional profile).
 * On pages after the first load, starts immediately as "ready" using
 * the module-level cached token — no loading screen.
 */
export function useLiffAuth(): LiffAuthState {
  const [state, setState] = useState<LiffAuthState>(() => {
    const cached = getLiffCachedToken();
    return cached ? { status: "ready", idToken: cached } : { status: "loading" };
  });

  useEffect(() => {
    // Already resolved from cache — nothing to do
    if (state.status === "ready") return;

    let cancelled = false;

    async function run() {
      const result = await initLiffAndGetToken();
      if (cancelled) return;

      if (result.ok) {
        setState({
          status: "ready",
          idToken: result.idToken,
          profile: result.profile,
        });
        return;
      }

      if (result.error === "not_logged_in") return;

      setState({
        status: "error",
        message: result.message,
        kind:
          result.error === "missing_liff_id"
            ? "missing_liff_id"
            : result.error === "no_id_token"
            ? "no_id_token"
            : "exception",
      });
    }

    run();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
