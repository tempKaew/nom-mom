import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyPin, signWebToken } from "@/lib/webAuth";
import { isValidThaiPhone, normalizePhoneInput } from "@/lib/phone";
import { getUserAuthByPhone } from "@/repositories/userRepository";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as {
    phone?: unknown;
    pin?: unknown;
  };

  const phone =
    typeof body.phone === "string" ? normalizePhoneInput(body.phone) : "";
  const pin = typeof body.pin === "string" ? body.pin.trim() : "";

  if (!phone || !pin) {
    return NextResponse.json(
      { error: "กรุณากรอกเบอร์โทรและ PIN" },
      { status: 400 },
    );
  }

  if (!isValidThaiPhone(phone)) {
    return NextResponse.json(
      { error: "เบอร์โทรต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 0" },
      { status: 400 },
    );
  }

  if (!/^\d{6}$/.test(pin)) {
    return NextResponse.json(
      { error: "PIN ต้องเป็นตัวเลข 6 หลัก" },
      { status: 400 },
    );
  }

  const userAuth = await getUserAuthByPhone(phone);
  if (!userAuth) {
    return NextResponse.json(
      { error: "เบอร์โทรหรือ PIN ไม่ถูกต้อง" },
      { status: 401 },
    );
  }

  if (!userAuth.pin_hash) {
    return NextResponse.json(
      { error: "ยังไม่ได้ตั้ง PIN กรุณาเปิดแอปผ่าน LINE เพื่อตั้ง PIN ก่อน" },
      { status: 403 },
    );
  }

  if (!verifyPin(pin, userAuth.pin_hash)) {
    return NextResponse.json(
      { error: "เบอร์โทรหรือ PIN ไม่ถูกต้อง" },
      { status: 401 },
    );
  }

  const token = signWebToken(userAuth.line_user_id ?? "", userAuth.id);
  return NextResponse.json({ token });
}
