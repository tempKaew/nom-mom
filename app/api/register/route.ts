import { NextRequest, NextResponse } from "next/server";
import { getLineUserIdFromRequest } from "@/lib/line";
import { findUserIdByLineId, createUser } from "@/repositories/userRepository";
import {
  findPendingInviteByToken,
  acceptInvite,
} from "@/repositories/inviteRepository";
import { MESSAGES } from "@/constants/messages";

export const dynamic = "force-dynamic";

type RegisterBody = {
  displayName?: string | null;
  pictureUrl?: string | null;
  inviteCode?: string | null;
};

type RegisterResponse = { userId: string } | { error: string };

export async function POST(
  request: NextRequest
): Promise<NextResponse<RegisterResponse>> {
  try {
    const auth = await getLineUserIdFromRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: MESSAGES.AUTH.MISSING_OR_INVALID },
        { status: 401 }
      );
    }

    const body = (await request.json()) as RegisterBody;
    const { displayName, pictureUrl, inviteCode } = body;
    const finalDisplayName = displayName?.trim() || auth.name || null;
    const finalPictureUrl =
      (typeof pictureUrl === "string" ? pictureUrl.trim() : pictureUrl) || auth.picture || null;

    const existingId = await findUserIdByLineId(auth.lineUserId);
    if (existingId) {
      return NextResponse.json(
        { error: MESSAGES.USER.ALREADY_REGISTERED },
        { status: 409 }
      );
    }

    const newUser = await createUser({
      line_user_id: auth.lineUserId,
      display_name: finalDisplayName,
      picture_url: finalPictureUrl,
    });
    if (!newUser) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 502 }
      );
    }

    const code = inviteCode && String(inviteCode).trim();
    if (code) {
      const invite = await findPendingInviteByToken(code);
      if (invite) {
        await acceptInvite(invite.id, newUser.id);
      }
    }

    return NextResponse.json({ userId: newUser.id });
  } catch (err) {
    console.error("[api/register] Unexpected error:", err);
    const message =
      err instanceof Error ? err.message : MESSAGES.GENERAL.INTERNAL_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
