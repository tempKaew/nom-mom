import { NextRequest, NextResponse } from "next/server";
import { requireLineAuth } from "@/lib/apiAuth";
import { isMemberOfBaby } from "@/repositories/memberRepository";
import {
  getSleepLogsByBabyId,
  createSleepLog,
  updateSleepLog,
} from "@/repositories/sleepLogRepository";
import { parseLimitParam } from "@/repositories/milkLogRepository";
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

    const limit = parseLimitParam(request.nextUrl.searchParams.get("limit"));
    const from = request.nextUrl.searchParams.get("from") ?? undefined;
    const to = request.nextUrl.searchParams.get("to") ?? undefined;
    const logs = await getSleepLogsByBabyId(babyId, limit, from, to);
    return NextResponse.json({ data: logs });
  } catch (err) {
    console.error("[api/sleep] GET error:", err);
    const message =
      err instanceof Error ? err.message : MESSAGES.GENERAL.INTERNAL_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireLineAuth(request);
    if (auth instanceof Response) return auth;

    const body = (await request.json()) as {
      baby_id?: string;
      started_at?: string;
      ended_at?: string | null;
      duration_minutes?: number | null;
      type?: string;
      notes?: string | null;
    };

    const { baby_id, started_at } = body;

    if (!baby_id) {
      return NextResponse.json(
        { error: MESSAGES.LOGS.BABY_ID_REQUIRED },
        { status: 400 }
      );
    }
    if (!started_at) {
      return NextResponse.json(
        { error: MESSAGES.SLEEP.STARTED_AT_REQUIRED },
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

    const log = await createSleepLog({
      baby_id,
      user_id: auth.userId,
      started_at,
      ended_at: body.ended_at,
      duration_minutes: body.duration_minutes,
      type: body.type,
      notes: body.notes,
    });

    if (!log) {
      return NextResponse.json(
        { error: MESSAGES.SLEEP.ADD_FAILED },
        { status: 502 }
      );
    }

    return NextResponse.json(log, { status: 201 });
  } catch (err) {
    console.error("[api/sleep] POST error:", err);
    const message =
      err instanceof Error ? err.message : MESSAGES.GENERAL.INTERNAL_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireLineAuth(request);
    if (auth instanceof Response) return auth;

    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const body = (await request.json()) as {
      baby_id?: string;
      type?: string;
      started_at?: string;
      ended_at?: string | null;
      duration_minutes?: number | null;
      notes?: string | null;
    };

    if (!body.baby_id) return NextResponse.json({ error: MESSAGES.LOGS.BABY_ID_REQUIRED }, { status: 400 });

    const isMember = await isMemberOfBaby(auth.userId, body.baby_id);
    if (!isMember) return NextResponse.json({ error: MESSAGES.BABY.NOT_FOUND_OR_ACCESS_DENIED }, { status: 404 });

    const { baby_id, ...fields } = body;
    const log = await updateSleepLog(id, baby_id, fields);
    if (!log) return NextResponse.json({ error: "แก้ไขไม่สำเร็จ" }, { status: 502 });

    return NextResponse.json(log);
  } catch (err) {
    console.error("[api/sleep] PATCH error:", err);
    return NextResponse.json({ error: MESSAGES.GENERAL.INTERNAL_ERROR }, { status: 500 });
  }
}
