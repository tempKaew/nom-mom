import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireLineAuth } from "@/lib/apiAuth";
import { hashPin } from "@/lib/webAuth";
import { setUserPinHash } from "@/repositories/userRepository";

export async function POST(request: NextRequest) {
  const auth = await requireLineAuth(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => ({})) as { pin?: unknown };
  const pin  = typeof body.pin === "string" ? body.pin.trim() : "";

  if (!/^\d{6}$/.test(pin)) {
    return NextResponse.json(
      { error: "PIN ต้องเป็นตัวเลข 6 หลักเท่านั้น" },
      { status: 400 },
    );
  }

  const ok = await setUserPinHash(auth.lineAuth.lineUserId, hashPin(pin));
  if (!ok) {
    return NextResponse.json({ error: "บันทึก PIN ไม่สำเร็จ" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
