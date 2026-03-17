/**
 * DEPRECATED — /api/diaper is kept for backward compatibility only.
 * All reads and writes are forwarded to /api/excretion-event.
 * Do NOT add new features here; use /api/excretion-event directly.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireLineAuth } from "@/lib/apiAuth";
import { isMemberOfBaby } from "@/repositories/memberRepository";
import {
  getExcretionEventsByBabyId,
  createExcretionEvent,
} from "@/repositories/excretionEventRepository";
import { parseLimitParam } from "@/repositories/milkLogRepository";
import { MESSAGES } from "@/constants/messages";
import type { ExcretionType } from "@/types/app";

export const dynamic = "force-dynamic";

/** Map legacy diaper type values to the new canonical values. */
function mapLegacyType(raw: string): ExcretionType {
  if (raw === "poo") return "poop";
  if (raw === "both") return "both";
  return "pee";
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireLineAuth(request);
    if (auth instanceof Response) return auth;

    const babyId = request.nextUrl.searchParams.get("babyId");
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

    const limit = parseLimitParam(request.nextUrl.searchParams.get("limit"));
    const events = await getExcretionEventsByBabyId(babyId, limit);

    // Shape response to match legacy DiaperLog contract so old UI keeps working
    const legacyRows = events.map((e) => ({
      id:         e.id,
      type:       e.type === "poop" ? "poo" : e.type,
      logged_at:  e.datetime,
      notes:      e.note,
    }));

    return NextResponse.json({ data: legacyRows });
  } catch (err) {
    console.error("[api/diaper] GET error:", err);
    const message = err instanceof Error ? err.message : MESSAGES.GENERAL.INTERNAL_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireLineAuth(request);
    if (auth instanceof Response) return auth;

    const body = await request.json() as {
      baby_id?: string;
      type?: string;
      notes?: string | null;
    };

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

    const event = await createExcretionEvent({
      baby_id,
      user_id:     auth.userId,
      type:        mapLegacyType(type),
      diaper_used: true,
      note:        body.notes ?? null,
    });

    if (!event) {
      return NextResponse.json({ error: MESSAGES.LOGS.DIAPER_ADD_FAILED }, { status: 502 });
    }

    // Return legacy-shaped response
    return NextResponse.json(
      { id: event.id, type: type, logged_at: event.datetime, notes: event.note },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api/diaper] POST error:", err);
    const message = err instanceof Error ? err.message : MESSAGES.GENERAL.INTERNAL_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
