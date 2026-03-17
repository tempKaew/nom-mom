import { NextRequest, NextResponse } from "next/server";
import { requireLineAuth } from "@/lib/apiAuth";
import { isMemberOfBaby } from "@/repositories/memberRepository";
import { getBabyById, updateBaby, deleteBaby, getBabyOwnerId } from "@/repositories/babyRepository";

export type BabyDetail = {
  id: string;
  name: string;
  birth_date: string | null;
  avatar_url: string | null;
  is_owner: boolean;
};
import { MESSAGES } from "@/constants/messages";
import type { BabyRow } from "@/types/database";

export const dynamic = "force-dynamic";

type PatchBody = {
  name?: string;
  birth_date?: string | null;
  avatar_url?: string | null;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<BabyDetail | { error: string }>> {
  try {
    const auth = await requireLineAuth(_request);
    if (auth instanceof Response) return auth;

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: MESSAGES.BABY.ID_REQUIRED },
        { status: 400 }
      );
    }

    const isMember = await isMemberOfBaby(auth.userId, id);
    if (!isMember) {
      return NextResponse.json(
        { error: MESSAGES.BABY.NOT_FOUND_OR_ACCESS_DENIED },
        { status: 404 }
      );
    }

    const [baby, ownerId] = await Promise.all([
      getBabyById(id),
      getBabyOwnerId(id),
    ]);

    if (!baby) {
      return NextResponse.json(
        { error: MESSAGES.BABY.NOT_FOUND },
        { status: 404 }
      );
    }

    return NextResponse.json({ ...baby, is_owner: ownerId === auth.userId });
  } catch (err) {
    console.error("[api/babies/[id]] GET error:", err);
    const message =
      err instanceof Error ? err.message : MESSAGES.GENERAL.INTERNAL_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<BabyRow | { error: string }>> {
  try {
    const auth = await requireLineAuth(request);
    if (auth instanceof Response) return auth;

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: MESSAGES.BABY.ID_REQUIRED },
        { status: 400 }
      );
    }

    const isMember = await isMemberOfBaby(auth.userId, id);
    if (!isMember) {
      return NextResponse.json(
        { error: MESSAGES.BABY.NOT_FOUND_OR_ACCESS_DENIED },
        { status: 404 }
      );
    }

    const body = (await request.json()) as PatchBody;
    const updates: Partial<Pick<BabyRow, "name" | "birth_date" | "avatar_url">> = {};
    if (body.name !== undefined) updates.name = String(body.name).trim();
    if (body.birth_date !== undefined) updates.birth_date = body.birth_date;
    if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url;

    if (Object.keys(updates).length === 0) {
      const current = await getBabyById(id);
      return NextResponse.json(current ?? ({} as BabyRow));
    }

    const baby = await updateBaby(id, updates);
    if (!baby) {
      return NextResponse.json(
        { error: MESSAGES.BABY.UPDATE_FAILED },
        { status: 502 }
      );
    }
    return NextResponse.json(baby);
  } catch (err) {
    console.error("[api/babies/[id]] PATCH error:", err);
    const message =
      err instanceof Error ? err.message : MESSAGES.GENERAL.INTERNAL_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ success: true } | { error: string }>> {
  try {
    const auth = await requireLineAuth(request);
    if (auth instanceof Response) return auth;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: MESSAGES.BABY.ID_REQUIRED }, { status: 400 });
    }

    const ownerId = await getBabyOwnerId(id);
    if (!ownerId || ownerId !== auth.userId) {
      return NextResponse.json(
        { error: MESSAGES.BABY.DELETE_OWNER_ONLY },
        { status: 403 }
      );
    }

    const ok = await deleteBaby(id);
    if (!ok) {
      return NextResponse.json({ error: MESSAGES.BABY.DELETE_FAILED }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/babies/[id]] DELETE error:", err);
    const message =
      err instanceof Error ? err.message : MESSAGES.GENERAL.INTERNAL_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
