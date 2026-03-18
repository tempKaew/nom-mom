import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyPin, signWebToken } from "@/lib/webAuth";
import {
  findUserIdByLineId,
  getUserPinHash,
} from "@/repositories/userRepository";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as {
    line_user_id?: unknown;
    pin?: unknown;
  };

  const lineUserId = typeof body.line_user_id === "string" ? body.line_user_id.trim() : "";
  const pin        = typeof body.pin          === "string" ? body.pin.trim()          : "";

  if (!lineUserId || !pin) {
    return NextResponse.json(
      { error: "กรุณากรอก LINE User ID และ PIN" },
      { status: 400 },
    );
  }

  if (!/^\d{6}$/.test(pin)) {
    return NextResponse.json(
      { error: "PIN ต้องเป็นตัวเลข 6 หลัก" },
      { status: 400 },
    );
  }

  // Find the user
  const userId = await findUserIdByLineId(lineUserId);
  if (!userId) {
    // Use same message for both "not found" and "wrong PIN" to prevent enumeration
    return NextResponse.json(
      { error: "LINE User ID หรือ PIN ไม่ถูกต้อง" },
      { status: 401 },
    );
  }

  // Verify PIN
  const pinHash = await getUserPinHash(lineUserId);
  if (!pinHash) {
    return NextResponse.json(
      { error: "ยังไม่ได้ตั้ง PIN กรุณาเปิดแอปผ่าน LINE เพื่อตั้ง PIN ก่อน" },
      { status: 403 },
    );
  }

  if (!verifyPin(pin, pinHash)) {
    return NextResponse.json(
      { error: "LINE User ID หรือ PIN ไม่ถูกต้อง" },
      { status: 401 },
    );
  }

  const token = signWebToken(lineUserId, userId);
  return NextResponse.json({ token });
}
