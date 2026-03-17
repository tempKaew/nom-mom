import type { NextRequest } from "next/server";
import { getLiffChannelId } from "@/config/env";
import { MESSAGES } from "@/constants/messages";

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
 * Get LINE user ID from request by verifying the LIFF ID token.
 * Expects header: Authorization: Bearer <liff_id_token>
 * Returns null if missing or invalid.
 */
export async function getLineUserIdFromRequest(
  request: NextRequest
): Promise<LineAuthResult | null> {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (!token) return null;

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
      name: payload.name,
      picture: payload.picture,
    };
  } catch (err) {
    console.error("[line/auth] Verify error:", err);
    return null;
  }
}

export const LINE_AUTH_ERROR = MESSAGES.AUTH.ID_TOKEN_REQUIRED;
