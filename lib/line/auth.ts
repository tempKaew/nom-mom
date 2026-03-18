import type { NextRequest } from "next/server";
import { getLiffChannelId } from "@/config/env";
import { MESSAGES } from "@/constants/messages";
import { peekTokenType, verifyWebToken } from "@/lib/webAuth";

const LINE_VERIFY_URL = "https://api.line.me/oauth2/v2.1/verify";

export type LineIdTokenPayload = {
  sub: string;
  name?: string;
  picture?: string;
};

export type LineAuthResult = {
  lineUserId: string;
  name?: string;
  picture?: string;
};

/**
 * Get LINE user ID from request by verifying the token.
 * Expects header: Authorization: Bearer <token>
 *
 * Accepts two token types:
 *   1. LINE LIFF ID token  — verified against LINE's /oauth2/v2.1/verify endpoint
 *   2. Web JWT             — verified locally using WEB_AUTH_SECRET
 *
 * Returns null if missing or invalid.
 */
export async function getLineUserIdFromRequest(
  request: NextRequest
): Promise<LineAuthResult | null> {
  const auth  = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (!token) return null;

  // Route to the correct verifier based on the token's `type` claim
  if (peekTokenType(token) === "web") {
    return verifyWebTokenFromRequest(token);
  }

  return verifyLineToken(token);
}

// ─── Web token verifier ───────────────────────────────────────────────────────

function verifyWebTokenFromRequest(token: string): LineAuthResult | null {
  const payload = verifyWebToken(token);
  if (!payload) return null;
  return { lineUserId: payload.lineUserId };
}

// ─── LINE ID token verifier ───────────────────────────────────────────────────

async function verifyLineToken(token: string): Promise<LineAuthResult | null> {
  const channelId = getLiffChannelId();
  if (!channelId) {
    console.error("[line/auth] LIFF_CHANNEL_ID is not set");
    return null;
  }

  try {
    const body = new URLSearchParams({
      id_token: token,
      client_id: channelId,
    }).toString();

    const res = await fetch(LINE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[line/auth] LINE verify failed:", res.status, text);
      return null;
    }

    const payload = (await res.json()) as LineIdTokenPayload & { sub: string };
    if (!payload?.sub) return null;

    return {
      lineUserId: payload.sub,
      name:       payload.name,
      picture:    payload.picture,
    };
  } catch (err) {
    console.error("[line/auth] Verify error:", err);
    return null;
  }
}

export const LINE_AUTH_ERROR = MESSAGES.AUTH.ID_TOKEN_REQUIRED;
