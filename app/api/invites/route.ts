import { NextRequest, NextResponse } from "next/server";
import { requireLineAuth } from "@/lib/apiAuth";
import { getBabyOwnerId } from "@/repositories/babyRepository";
import {
  listInvitesByBabyId,
  createInvite,
  generateInviteToken,
} from "@/repositories/inviteRepository";
import { MESSAGES } from "@/constants/messages";
import { INVITE_DEFAULTS } from "@/constants/api";

export const dynamic = "force-dynamic";

type CreateInviteBody = {
  babyId: string;
  label: string;
  role?: string;
  expiresInDays?: number;
};

export async function GET(
  request: NextRequest
): Promise<NextResponse<{ invites: Awaited<ReturnType<typeof listInvitesByBabyId>> } | { error: string }>> {
  try {
    const auth = await requireLineAuth(request);
    if (auth instanceof Response) return auth;

    const babyId = request.nextUrl.searchParams.get("babyId")?.trim();
    if (!babyId) {
      return NextResponse.json(
        { error: MESSAGES.INVITES.BABY_ID_REQUIRED },
        { status: 400 }
      );
    }

    const ownerId = await getBabyOwnerId(babyId);
    if (!ownerId) {
      return NextResponse.json(
        { error: MESSAGES.BABY.NOT_FOUND },
        { status: 404 }
      );
    }
    if (ownerId !== auth.userId) {
      return NextResponse.json(
        { error: MESSAGES.INVITES.ONLY_OWNER },
        { status: 403 }
      );
    }

    const invites = await listInvitesByBabyId(babyId);
    return NextResponse.json({ invites });
  } catch (err) {
    console.error("[api/invites] GET error:", err);
    const message =
      err instanceof Error ? err.message : MESSAGES.GENERAL.INTERNAL_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireLineAuth(request);
    if (auth instanceof Response) return auth;

    const body = (await request.json()) as CreateInviteBody;
    const {
      babyId: rawBabyId,
      label,
      role = INVITE_DEFAULTS.ROLE,
      expiresInDays = INVITE_DEFAULTS.EXPIRES_IN_DAYS,
    } = body;

    const babyId = rawBabyId?.trim();
    if (!babyId) {
      return NextResponse.json(
        { error: "babyId is required" },
        { status: 400 }
      );
    }
    if (!label || typeof label !== "string" || label.trim() === "") {
      return NextResponse.json(
        { error: MESSAGES.INVITES.LABEL_REQUIRED },
        { status: 400 }
      );
    }

    const ownerId = await getBabyOwnerId(babyId);
    if (!ownerId) {
      return NextResponse.json(
        { error: MESSAGES.BABY.NOT_FOUND },
        { status: 404 }
      );
    }
    if (ownerId !== auth.userId) {
      return NextResponse.json(
        { error: MESSAGES.INVITES.ONLY_OWNER_CREATE },
        { status: 403 }
      );
    }

    const token = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + (expiresInDays > 0 ? expiresInDays : INVITE_DEFAULTS.EXPIRES_IN_DAYS)
    );

    const invite = await createInvite({
      baby_id: babyId,
      inviter_user_id: auth.userId,
      token,
      label: label.trim(),
      role: (role && String(role).trim()) || INVITE_DEFAULTS.ROLE,
      status: "pending",
      expires_at: expiresAt.toISOString(),
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Failed to create invite" },
        { status: 502 }
      );
    }

    return NextResponse.json({ invite, token: invite.token });
  } catch (err) {
    console.error("[api/invites] POST error:", err);
    const message =
      err instanceof Error ? err.message : MESSAGES.GENERAL.INTERNAL_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
