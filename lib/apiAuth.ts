import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getLineUserIdFromRequest, type LineAuthResult } from "@/lib/line";
import { findUserIdByLineId } from "@/repositories/userRepository";
import { MESSAGES } from "@/constants/messages";

/**
 * Require LINE auth for API route. Returns 401 JSON if not authenticated.
 * On success returns { lineAuth, userId } so the route can proceed.
 */
export async function requireLineAuth(
  request: NextRequest,
): Promise<
  { lineAuth: LineAuthResult; userId: string } | NextResponse<{ error: string }>
> {
  const lineAuth = await getLineUserIdFromRequest(request);
  if (!lineAuth) {
    return NextResponse.json(
      { error: MESSAGES.AUTH.MISSING_OR_INVALID },
      { status: 401 },
    );
  }

  const userId = await findUserIdByLineId(lineAuth.lineUserId);
  if (!userId) {
    return NextResponse.json(
      { error: MESSAGES.AUTH.USER_NOT_FOUND },
      { status: 404 },
    );
  }

  return { lineAuth, userId };
}
