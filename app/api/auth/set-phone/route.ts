import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireLineAuth } from "@/lib/apiAuth";
import { isValidThaiPhone, normalizePhoneInput } from "@/lib/phone";
import { setUserPhoneIfEmpty } from "@/repositories/userRepository";

export async function POST(request: NextRequest) {
  const auth = await requireLineAuth(request);
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => ({})) as { phone?: unknown };
  const raw =
    typeof body.phone === "string" ? normalizePhoneInput(body.phone) : "";

  if (!isValidThaiPhone(raw)) {
    return NextResponse.json(
      { error: "เบอร์โทรต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 0" },
      { status: 400 },
    );
  }

  const result = await setUserPhoneIfEmpty(auth.lineAuth.lineUserId, raw);
  if (!result.ok) {
    if (result.reason === "duplicate") {
      return NextResponse.json(
        { error: "เบอร์โทรนี้ถูกใช้งานแล้ว" },
        { status: 409 },
      );
    }
    if (result.reason === "already_set") {
      return NextResponse.json(
        { error: "คุณได้ตั้งเบอร์โทรไว้แล้ว" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "บันทึกเบอร์โทรไม่สำเร็จ" }, { status: 500 });
  }

  return NextResponse.json({ success: true, phone: raw });
}
