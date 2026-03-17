import { NextRequest, NextResponse } from "next/server";
import { getLineUserIdFromRequest } from "@/lib/line";
import { findUserByLineId } from "@/repositories/userRepository";
import { getMembersByUserId } from "@/repositories/memberRepository";
import {
  getBabiesByIds,
} from "@/repositories/babyRepository";
import { MESSAGES } from "@/constants/messages";
import type { UserRow } from "@/types/database";
import type { BabyWithRole } from "@/types/app";

export const dynamic = "force-dynamic";

type MeResponse = { user: UserRow; babies: BabyWithRole[] } | { error: string };

export async function GET(
  request: NextRequest
): Promise<NextResponse<MeResponse>> {
  try {
    const auth = await getLineUserIdFromRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: MESSAGES.AUTH.MISSING_OR_INVALID },
        { status: 401 }
      );
    }

    const user = await findUserByLineId(auth.lineUserId);
    if (!user) {
      return NextResponse.json({ error: MESSAGES.AUTH.USER_NOT_FOUND }, { status: 404 });
    }

    const members = await getMembersByUserId(user.id);
    if (members.length === 0) {
      return NextResponse.json(
        { user, babies: [] },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }

    const babyIds = members.map((m) => m.baby_id);
    const roleByBabyId = new Map(members.map((m) => [m.baby_id, m.role]));
    const babies = await getBabiesByIds(babyIds, roleByBabyId);

    return NextResponse.json(
      { user, babies },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (err) {
    console.error("[api/me] Unexpected error:", err);
    const message =
      err instanceof Error ? err.message : MESSAGES.GENERAL.INTERNAL_ERROR;
    const status = message.includes("Failed to load") ? 502 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
