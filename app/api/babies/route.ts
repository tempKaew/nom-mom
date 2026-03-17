import { NextRequest, NextResponse } from "next/server";
import { requireLineAuth } from "@/lib/apiAuth";
import { createBaby } from "@/repositories/babyRepository";
import { addMember } from "@/repositories/memberRepository";
import { listBabies } from "@/repositories/babyRepository";
import { MESSAGES } from "@/constants/messages";

export const dynamic = "force-dynamic";

type CreateBabyBody = {
  name: string;
  birth_date?: string | null;
  avatar_url?: string | null;
};

type CreateBabyResponse = { babyId: string } | { error: string };

export async function GET(): Promise<NextResponse<{ data: unknown } | { error: string }>> {
  try {
    const data = await listBabies();
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[api/babies] GET error:", err);
    const message =
      err instanceof Error ? err.message : MESSAGES.GENERAL.INTERNAL_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateBabyResponse>> {
  try {
    const auth = await requireLineAuth(request);
    if (auth instanceof Response) return auth;

    const body = (await request.json()) as CreateBabyBody;
    const { name, birth_date, avatar_url } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: MESSAGES.BABY.NAME_REQUIRED },
        { status: 400 }
      );
    }

    const baby = await createBaby({
      name: name.trim(),
      birth_date: birth_date ?? null,
      avatar_url: avatar_url ?? null,
      created_by_user_id: auth.userId,
    });

    if (!baby) {
      return NextResponse.json(
        { error: "Failed to create baby" },
        { status: 502 }
      );
    }

    const memberError = await addMember({
      baby_id: baby.id,
      user_id: auth.userId,
      role: "owner",
    });
    if (memberError) {
      return NextResponse.json(
        { error: memberError.message ?? "Failed to add owner" },
        { status: 502 }
      );
    }

    return NextResponse.json({ babyId: baby.id });
  } catch (err) {
    console.error("[api/babies] POST error:", err);
    const message =
      err instanceof Error ? err.message : MESSAGES.GENERAL.INTERNAL_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
