import { NextRequest, NextResponse } from "next/server";
import { requireLineAuth } from "@/lib/apiAuth";
import { isMemberOfBaby } from "@/repositories/memberRepository";
import {
  getPumpingSessionsByBabyId,
  createPumpingSession,
  updatePumpingSession,
} from "@/repositories/pumpingRepository";
import { MESSAGES } from "@/constants/messages";
import type { PumpingType, BreastCondition, PainLevel, StorageType } from "@/types/app";

export const dynamic = "force-dynamic";

const VALID_PUMPING_TYPES: PumpingType[] = ["normal", "power", "relieve"];
const VALID_CONDITIONS: BreastCondition[] = ["engorged", "normal", "soft"];
const VALID_PAIN_LEVELS: PainLevel[] = ["painful", "no_pain"];
const VALID_STORAGE_TYPES: StorageType[] = ["immediate", "room_temp", "frozen"];

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
    const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam, 10)), 500) : 50;
    const from = request.nextUrl.searchParams.get("from") ?? undefined;
    const to = request.nextUrl.searchParams.get("to") ?? undefined;

    const sessions = await getPumpingSessionsByBabyId(babyId, limit, from, to);
    return NextResponse.json({ data: sessions });
  } catch (err) {
    console.error("[api/pumping] GET error:", err);
    const message = err instanceof Error ? err.message : MESSAGES.GENERAL.INTERNAL_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type PumpingBody = {
  baby_id?: string;
  start_time?: string;
  end_time?: string | null;
  duration_minutes?: number | null;
  left_volume_ml?: number;
  right_volume_ml?: number;
  total_volume_ml?: number;
  pumping_type?: string;
  breast_condition?: string | null;
  pain_level?: string | null;
  storage_type?: string;
  note_text?: string | null;
  note_tags?: string[];
  notes?: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const auth = await requireLineAuth(request);
    if (auth instanceof Response) return auth;

    const body = (await request.json()) as PumpingBody;
    const { baby_id, start_time } = body;

    if (!baby_id) {
      return NextResponse.json({ error: MESSAGES.LOGS.BABY_ID_REQUIRED }, { status: 400 });
    }
    if (!start_time) {
      return NextResponse.json(
        { error: MESSAGES.PUMPING.START_TIME_REQUIRED },
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

    const leftVol = Math.max(0, body.left_volume_ml ?? 0);
    const rightVol = Math.max(0, body.right_volume_ml ?? 0);
    const totalVol = leftVol + rightVol;

    const pumpingType: PumpingType = VALID_PUMPING_TYPES.includes(body.pumping_type as PumpingType)
      ? (body.pumping_type as PumpingType)
      : "normal";

    const breastCondition: BreastCondition | null = VALID_CONDITIONS.includes(body.breast_condition as BreastCondition)
      ? (body.breast_condition as BreastCondition)
      : null;

    const painLevel: PainLevel | null = VALID_PAIN_LEVELS.includes(body.pain_level as PainLevel)
      ? (body.pain_level as PainLevel)
      : null;

    const storageType: StorageType = VALID_STORAGE_TYPES.includes(body.storage_type as StorageType)
      ? (body.storage_type as StorageType)
      : "immediate";

    const session = await createPumpingSession({
      baby_id,
      user_id: auth.userId,
      start_time,
      end_time: body.end_time ?? null,
      duration_minutes: body.duration_minutes ?? null,
      left_volume_ml: leftVol,
      right_volume_ml: rightVol,
      total_volume_ml: totalVol,
      pumping_type: pumpingType,
      breast_condition: breastCondition,
      pain_level: painLevel,
      storage_type: storageType,
      note_text: body.note_text?.trim() || null,
      note_tags: Array.isArray(body.note_tags) ? body.note_tags : [],
      notes: body.notes?.trim() || null,
    });

    if (!session) {
      return NextResponse.json(
        { error: MESSAGES.PUMPING.ADD_FAILED },
        { status: 502 }
      );
    }

    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    console.error("[api/pumping] POST error:", err);
    const message = err instanceof Error ? err.message : MESSAGES.GENERAL.INTERNAL_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireLineAuth(request);
    if (auth instanceof Response) return auth;

    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const body = (await request.json()) as Record<string, unknown> & { baby_id?: string };

    if (!body.baby_id) return NextResponse.json({ error: MESSAGES.LOGS.BABY_ID_REQUIRED }, { status: 400 });

    const isMember = await isMemberOfBaby(auth.userId, body.baby_id as string);
    if (!isMember) return NextResponse.json({ error: MESSAGES.BABY.NOT_FOUND_OR_ACCESS_DENIED }, { status: 404 });

    const { baby_id, ...fields } = body;
    const session = await updatePumpingSession(id, baby_id as string, fields);
    if (!session) return NextResponse.json({ error: "แก้ไขไม่สำเร็จ" }, { status: 502 });

    return NextResponse.json(session);
  } catch (err) {
    console.error("[api/pumping] PATCH error:", err);
    return NextResponse.json({ error: MESSAGES.GENERAL.INTERNAL_ERROR }, { status: 500 });
  }
}
