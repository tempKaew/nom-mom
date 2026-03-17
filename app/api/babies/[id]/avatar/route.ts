import { NextRequest, NextResponse } from "next/server";
import { requireLineAuth } from "@/lib/apiAuth";
import { isMemberOfBaby } from "@/repositories/memberRepository";
import { updateBabyAvatar } from "@/repositories/babyRepository";
import { supabaseServer } from "@/lib/supabase/server";
import { MESSAGES } from "@/constants/messages";
import { STORAGE_BUCKETS } from "@/constants/api";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ avatar_url: string } | { error: string }>> {
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

    let file: File | Blob;
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const f = formData.get("file");
      if (!f || !(f instanceof File)) {
        return NextResponse.json(
          { error: MESSAGES.AVATAR.MISSING_FILE },
          { status: 400 }
        );
      }
      file = f;
    } else if (
      contentType.includes("image/") ||
      contentType === "application/octet-stream"
    ) {
      const buf = await request.arrayBuffer();
      file = new Blob([buf], {
        type: contentType.split(";")[0]?.trim() || "image/png",
      });
    } else {
      return NextResponse.json(
        { error: MESSAGES.AVATAR.INVALID_BODY },
        { status: 400 }
      );
    }

    const bucket = STORAGE_BUCKETS.BABY_AVATARS;
    const path = `${id}.png`;

    const { error: uploadError } = await supabaseServer.storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
        contentType: "image/png",
      });

    if (uploadError) {
      console.error("[api/babies/[id]/avatar] Upload error:", uploadError);
      return NextResponse.json(
        { error: MESSAGES.AVATAR.BUCKET_ERROR },
        { status: 502 }
      );
    }

    const { data: urlData } = supabaseServer.storage
      .from(bucket)
      .getPublicUrl(path);
    const avatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;

    const updateErr = await updateBabyAvatar(id, avatarUrl);
    if (updateErr) {
      console.error("[api/babies/[id]/avatar] Update baby error:", updateErr);
      return NextResponse.json(
        { error: MESSAGES.BABY.UPDATE_FAILED },
        { status: 502 }
      );
    }

    return NextResponse.json({ avatar_url: avatarUrl });
  } catch (err) {
    console.error("[api/babies/[id]/avatar] Error:", err);
    const message =
      err instanceof Error ? err.message : MESSAGES.GENERAL.INTERNAL_ERROR;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
