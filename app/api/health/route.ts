import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Health check endpoint for monitoring and LINE Mini App readiness.
 * GET /api/health
 */
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
