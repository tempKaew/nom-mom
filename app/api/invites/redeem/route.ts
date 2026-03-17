import { NextRequest, NextResponse } from "next/server";
import { requireLineAuth } from "@/lib/apiAuth";
import {
  findPendingInviteByToken,
  acceptInvite,
} from "@/repositories/inviteRepository";
import { isMemberOfBaby } from "@/repositories/memberRepository";
import { MESSAGES } from "@/constants/messages";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireLineAuth(request);
    if (auth instanceof Response) return auth;

    const body = (await request.json()) as { token?: string };
    const token = body.token?.trim();

    if (!token) {
      return NextResponse.json(
        { error: MESSAGES.INVITES.TOKEN_REQUIRED },
        { status: 400 }
      );
    }

    const invite = await findPendingInviteByToken(token);
    if (!invite) {
      return NextResponse.json(
        { error: MESSAGES.INVITES.NOT_FOUND_OR_EXPIRED },
        { status: 404 }
      );
    }

    const alreadyMember = await isMemberOfBaby(auth.userId, invite.baby_id);
    if (alreadyMember) {
      return NextResponse.json(
        { error: MESSAGES.INVITES.ALREADY_MEMBER },
        { status: 409 }
      );
    }

    const err = await acceptInvite(invite.id, auth.userId);
    if (err) {
      return NextResponse.json(
        { error: MESSAGES.INVITES.REDEEM_FAILED },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, baby_id: invite.baby_id });
  } catch (err) {
    console.error("[api/invites/redeem] POST error:", err);
    const message =
      err instanceof Error ? err.message : MESSAGES.GENERAL.INTERNAL_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
