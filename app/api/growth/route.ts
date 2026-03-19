import { NextRequest, NextResponse } from "next/server";
import { requireLineAuth } from "@/lib/apiAuth";
import { isMemberOfBaby } from "@/repositories/memberRepository";
import {
  getGrowthRecordsByBabyId,
  createGrowthRecord,
  updateGrowthRecord,
} from "@/repositories/growthRepository";
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

    const limit = parseLimitParam(
      request.nextUrl.searchParams.get("limit"),
      50
    );
    const records = await getGrowthRecordsByBabyId(babyId, limit);
    return NextResponse.json({ data: records });
  } catch (err) {
    console.error("[api/growth] GET error:", err);
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
      recorded_at?: string;
      weight_kg?: number | null;
      height_cm?: number | null;
      head_circumference_cm?: number | null;
      notes?: string | null;
    };

    const { baby_id, weight_kg, height_cm, head_circumference_cm } = body;

    if (!baby_id) {
      return NextResponse.json(
        { error: MESSAGES.LOGS.BABY_ID_REQUIRED },
        { status: 400 }
      );
    }

    if (
      weight_kg == null &&
      height_cm == null &&
      head_circumference_cm == null
    ) {
      return NextResponse.json(
        { error: MESSAGES.GROWTH.AT_LEAST_ONE_FIELD },
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

    const record = await createGrowthRecord({
      baby_id,
      user_id: auth.userId,
      recorded_at: body.recorded_at,
      weight_kg: weight_kg ?? null,
      height_cm: height_cm ?? null,
      head_circumference_cm: head_circumference_cm ?? null,
      notes: body.notes ?? null,
    });

    if (!record) {
      return NextResponse.json(
        { error: MESSAGES.GROWTH.ADD_FAILED },
        { status: 502 }
      );
    }

    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    console.error("[api/growth] POST error:", err);
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
    if (!id) {
      return NextResponse.json({ error: "growth id is required" }, { status: 400 });
    }

    const body = (await request.json()) as {
      baby_id?: string;
      recorded_at?: string;
      weight_kg?: number | null;
      height_cm?: number | null;
      head_circumference_cm?: number | null;
      notes?: string | null;
    };

    const { baby_id, weight_kg, height_cm, head_circumference_cm } = body;
    if (!baby_id) {
      return NextResponse.json(
        { error: MESSAGES.LOGS.BABY_ID_REQUIRED },
        { status: 400 }
      );
    }

    if (
      weight_kg == null &&
      height_cm == null &&
      head_circumference_cm == null
    ) {
      return NextResponse.json(
        { error: MESSAGES.GROWTH.AT_LEAST_ONE_FIELD },
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

    const updated = await updateGrowthRecord(id, baby_id, {
      recorded_at: body.recorded_at,
      weight_kg: weight_kg ?? null,
      height_cm: height_cm ?? null,
      head_circumference_cm: head_circumference_cm ?? null,
      notes: body.notes ?? null,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update growth record" },
        { status: 502 }
      );
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[api/growth] PATCH error:", err);
    const message =
      err instanceof Error ? err.message : MESSAGES.GENERAL.INTERNAL_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
