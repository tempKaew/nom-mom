import { NextRequest, NextResponse } from "next/server";
import { getLineUserIdFromRequest } from "@/lib/line";
import { findUserIdByLineId } from "@/repositories/userRepository";
import { MESSAGES } from "@/constants/messages";

export const dynamic = "force-dynamic";

type CheckUserResponse =
  | { exists: true; userId?: string }
  | { exists: false }
  | { error: string };

export async function GET(
  request: NextRequest
): Promise<NextResponse<CheckUserResponse>> {
  try {
    const auth = await getLineUserIdFromRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: MESSAGES.AUTH.MISSING_OR_INVALID },
        { status: 401 }
      );
    }

    const userId = await findUserIdByLineId(auth.lineUserId);
    if (userId) {
      return NextResponse.json({ exists: true, userId });
    }
    return NextResponse.json({ exists: false });
  } catch (err) {
    console.error("[api/check-user] Unexpected error:", err);
    const message =
      err instanceof Error ? err.message : MESSAGES.GENERAL.INTERNAL_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
