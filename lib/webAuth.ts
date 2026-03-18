/**
 * Web authentication utilities for external-browser login.
 *
 * Uses only Node.js built-in `crypto` — no extra dependencies.
 *
 * PIN:   scrypt hash stored in DB.
 * Token: HS256 JWT with { type: "web", lineUserId, userId } signed by
 *        process.env.WEB_AUTH_SECRET.  Expires in 7 days.
 */

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

// ─── Config ───────────────────────────────────────────────────────────────────

const ISSUER      = "nomMom";
const TOKEN_TTL_S = 7 * 24 * 60 * 60; // 7 days

function getSecret(): string {
  const s = process.env.WEB_AUTH_SECRET;
  if (!s) throw new Error("WEB_AUTH_SECRET is not set");
  return s;
}

// ─── Base64url helpers ────────────────────────────────────────────────────────

function b64u(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf.toString("base64url");
}

function fromb64u(s: string): string {
  return Buffer.from(s, "base64url").toString("utf8");
}

// ─── JWT ──────────────────────────────────────────────────────────────────────

export type WebTokenPayload = {
  lineUserId: string;
  userId: string;
  type: "web";
  iss: string;
  iat: number;
  exp: number;
};

export function signWebToken(lineUserId: string, userId: string): string {
  const header  = b64u(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now     = Math.floor(Date.now() / 1000);
  const payload = b64u(
    JSON.stringify({
      type: "web",
      iss: ISSUER,
      lineUserId,
      userId,
      iat: now,
      exp: now + TOKEN_TTL_S,
    } satisfies WebTokenPayload),
  );

  const sig = createHmac("sha256", getSecret())
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${sig}`;
}

export function verifyWebToken(token: string): WebTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, sig] = parts;

    const expectedSig = createHmac("sha256", getSecret())
      .update(`${header}.${payload}`)
      .digest("base64url");

    // Constant-time comparison to prevent timing attacks
    const sigBuf = Buffer.from(sig, "base64url");
    const expBuf = Buffer.from(expectedSig, "base64url");
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const data = JSON.parse(fromb64u(payload)) as WebTokenPayload;
    if (data.type !== "web" || data.iss !== ISSUER) return null;
    if (data.exp < Math.floor(Date.now() / 1000)) return null;

    return data;
  } catch {
    return null;
  }
}

/**
 * Decode a JWT payload WITHOUT signature verification.
 * Used only to decide whether a token is a web token or a LINE ID token
 * before routing to the appropriate verifier.
 */
export function peekTokenType(token: string): "web" | "line" {
  try {
    const [, payload] = token.split(".");
    const data = JSON.parse(fromb64u(payload)) as { type?: string; iss?: string };
    if (data.type === "web" && data.iss === ISSUER) return "web";
  } catch {
    // fall through
  }
  return "line";
}

// ─── PIN hashing ──────────────────────────────────────────────────────────────

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, dkLen: 32 } as const;

export function hashPin(pin: string): string {
  const salt    = randomBytes(16).toString("hex");
  const derived = scryptSync(pin, salt, SCRYPT_PARAMS.dkLen, {
    N: SCRYPT_PARAMS.N,
    r: SCRYPT_PARAMS.r,
    p: SCRYPT_PARAMS.p,
  }) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export function verifyPin(pin: string, storedHash: string): boolean {
  try {
    const [salt, hex] = storedHash.split(":");
    const derived = scryptSync(pin, salt, SCRYPT_PARAMS.dkLen, {
      N: SCRYPT_PARAMS.N,
      r: SCRYPT_PARAMS.r,
      p: SCRYPT_PARAMS.p,
    }) as Buffer;
    const stored = Buffer.from(hex, "hex");
    return derived.length === stored.length && timingSafeEqual(derived, stored);
  } catch {
    return false;
  }
}
