import { NextRequest, NextResponse } from "next/server";
import { requireLineAuth } from "@/lib/apiAuth";
import { isMemberOfBaby } from "@/repositories/memberRepository";
import {
  getExcretionEventsByBabyId,
  createExcretionEvent,
} from "@/repositories/excretionEventRepository";
import { parseLimitParam } from "@/repositories/milkLogRepository";
import { MESSAGES } from "@/constants/messages";
import type { CreateExcretionEventPayload, ExcretionType } from "@/types/app";

export const dynamic = "force-dynamic";

const VALID_TYPES: ExcretionType[] = ["pee", "poop", "both"];

// ─── GET /api/excretion-event?babyId=&limit=&from=&to= ───────────────────────

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

    const limit = parseLimitParam(searchParams.get("limit"));
    const from  = searchParams.get("from")  ?? undefined;
    const to    = searchParams.get("to")    ?? undefined;

    const events = await getExcretionEventsByBabyId(babyId, limit, from, to);
    return NextResponse.json({ data: events });
  } catch (err) {
    console.error("[api/excretion-event] GET error:", err);
    const message = err instanceof Error ? err.message : MESSAGES.GENERAL.INTERNAL_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── POST /api/excretion-event ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const auth = await requireLineAuth(request);
    if (auth instanceof Response) return auth;

    const body = await request.json() as CreateExcretionEventPayload;

    const { baby_id, type } = body;

    if (!baby_id) {
      return NextResponse.json({ error: MESSAGES.LOGS.BABY_ID_REQUIRED }, { status: 400 });
    }
    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `type must be one of: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    const isMember = await isMemberOfBaby(auth.userId, baby_id);
    if (!isMember) {
      return NextResponse.json(
        { error: MESSAGES.BABY.NOT_FOUND_OR_ACCESS_DENIED },
        { status: 404 }
      );
    }

    const event = await createExcretionEvent({ ...body, user_id: auth.userId });
    if (!event) {
      return NextResponse.json({ error: MESSAGES.EXCRETION.ADD_FAILED }, { status: 502 });
    }

    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    console.error("[api/excretion-event] POST error:", err);
    const message = err instanceof Error ? err.message : MESSAGES.GENERAL.INTERNAL_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
