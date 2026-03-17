import { NextRequest, NextResponse } from "next/server";
import { requireLineAuth } from "@/lib/apiAuth";
import { isMemberOfBaby } from "@/repositories/memberRepository";
import {
  getMilkLogsByBabyId,
  createMilkLog,
  parseLimitParam,
} from "@/repositories/milkLogRepository";
import { MESSAGES } from "@/constants/messages";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireLineAuth(request);
    if (auth instanceof Response) return auth;

    const babyId = request.nextUrl.searchParams.get("babyId");
    if (!babyId) {
      return NextResponse.json(
        { error: MESSAGES.LOGS.BABY_ID_REQUIRED },
        { status: 400 }
      );
    }

    const isMember = await isMemberOfBaby(auth.userId, babyId);
    if (!isMember) {
      return NextResponse.json(
        { error: MESSAGES.BABY.NOT_FOUND_OR_ACCESS_DENIED },
        { status: 404 }
      );
    }

    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = parseLimitParam(limitParam);
    const from = request.nextUrl.searchParams.get("from") ?? undefined;
    const to = request.nextUrl.searchParams.get("to") ?? undefined;

    const logs = await getMilkLogsByBabyId(babyId, limit, from, to);
    return NextResponse.json({ data: logs });
  } catch (err) {
    console.error("[api/milk] GET error:", err);
    const message =
      err instanceof Error ? err.message : MESSAGES.GENERAL.INTERNAL_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type MilkLogBody = {
  baby_id?: string;
  type?: string;
  amount_ml?: number | null;
  duration_minutes?: number | null;
  notes?: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const auth = await requireLineAuth(request);
    if (auth instanceof Response) return auth;

    const body = (await request.json()) as MilkLogBody;
    const { baby_id, type } = body;
    if (!baby_id) {
      return NextResponse.json({ error: MESSAGES.LOGS.BABY_ID_REQUIRED }, { status: 400 });
    }
    if (!type) {
      return NextResponse.json({ error: MESSAGES.LOGS.TYPE_REQUIRED }, { status: 400 });
    }

    const isMember = await isMemberOfBaby(auth.userId, baby_id);
    if (!isMember) {
      return NextResponse.json(
        { error: MESSAGES.BABY.NOT_FOUND_OR_ACCESS_DENIED },
        { status: 404 }
      );
    }

    const log = await createMilkLog({
      baby_id,
      user_id: auth.userId,
      type,
      amount_ml: body.amount_ml ?? null,
      duration_minutes: body.duration_minutes ?? null,
      notes: body.notes ?? null,
    });

    if (!log) {
      return NextResponse.json({ error: MESSAGES.LOGS.MILK_ADD_FAILED }, { status: 502 });
    }

    return NextResponse.json(log, { status: 201 });
  } catch (err) {
    console.error("[api/milk] POST error:", err);
    const message =
      err instanceof Error ? err.message : MESSAGES.GENERAL.INTERNAL_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
