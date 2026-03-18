import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyPin, signWebToken } from "@/lib/webAuth";
import { getUserAuthById } from "@/repositories/userRepository";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as {
    user_id?: unknown;
    pin?: unknown;
  };

  const userId = typeof body.user_id === "string" ? body.user_id.trim() : "";
  const pin    = typeof body.pin     === "string" ? body.pin.trim()     : "";

  if (!userId || !pin) {
    return NextResponse.json(
      { error: "กรุณากรอก User ID และ PIN" },
      { status: 400 },
    );
  }

  if (!/^\d{6}$/.test(pin)) {
    return NextResponse.json(
      { error: "PIN ต้องเป็นตัวเลข 6 หลัก" },
      { status: 400 },
    );
  }

  // Look up user by database UUID
  const userAuth = await getUserAuthById(userId);
  if (!userAuth) {
    return NextResponse.json(
      { error: "User ID หรือ PIN ไม่ถูกต้อง" },
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
      { error: "User ID หรือ PIN ไม่ถูกต้อง" },
      { status: 401 },
    );
  }

  const token = signWebToken(userAuth.line_user_id ?? "", userId);
  return NextResponse.json({ token });
}
