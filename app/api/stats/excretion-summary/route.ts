import { NextRequest, NextResponse } from "next/server";
import { requireLineAuth } from "@/lib/apiAuth";
import { isMemberOfBaby } from "@/repositories/memberRepository";
import { getExcretionSummary } from "@/repositories/excretionEventRepository";
import { MESSAGES } from "@/constants/messages";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireLineAuth(request);
    if (auth instanceof Response) return auth;

    const { searchParams } = request.nextUrl;
    const babyId = searchParams.get("babyId");
    if (!babyId) {
      return NextResponse.json({ error: MESSAGES.LOGS.BABY_ID_REQUIRED }, { status: 400 });
    }

    const isMember = await isMemberOfBaby(auth.userId, babyId);
    if (!isMember) {
      return NextResponse.json(
        { error: MESSAGES.BABY.NOT_FOUND_OR_ACCESS_DENIED },
        { status: 404 }
      );
    }

    const from = searchParams.get("from") ?? undefined;
    const to   = searchParams.get("to")   ?? undefined;

    const summary = await getExcretionSummary(babyId, from, to);
    return NextResponse.json({ data: summary });
  } catch (err) {
    console.error("[api/stats/excretion-summary] GET error:", err);
    const message = err instanceof Error ? err.message : MESSAGES.GENERAL.INTERNAL_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
