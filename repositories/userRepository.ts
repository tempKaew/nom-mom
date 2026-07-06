import { supabaseServer } from "@/lib/supabase/server";
import type { UserRow } from "@/types/database";

export async function findUserByLineId(
  lineUserId: string
): Promise<UserRow | null> {
  const { data, error } = await supabaseServer
    .from("users")
    .select("id, line_user_id, phone, display_name, picture_url")
    .eq("line_user_id", lineUserId)
    .maybeSingle();

  if (error) {
    console.error("[userRepository] findUserByLineId error:", error);
    return null;
  }
  return data as UserRow | null;
}

export async function findUserIdByLineId(
  lineUserId: string
): Promise<string | null> {
  const { data, error } = await supabaseServer
    .from("users")
    .select("id")
    .eq("line_user_id", lineUserId)
    .maybeSingle();

  if (error || !data) return null;
  return (data as { id: string }).id;
}

export async function createUser(params: {
  line_user_id: string;
  display_name: string | null;
  picture_url: string | null;
}): Promise<{ id: string } | null> {
  const { data, error } = await supabaseServer
    .from("users")
    .insert(params)
    .select("id")
    .single();

  if (error || !data) {
    console.error("[userRepository] createUser error:", error);
    return null;
  }
  return data as { id: string };
}

export async function userExistsByLineId(
  lineUserId: string
): Promise<boolean> {
  const id = await findUserIdByLineId(lineUserId);
  return id != null;
}

export async function getUserPinHash(
  lineUserId: string,
): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabaseServer as any)
    .from("users")
    .select("pin_hash")
    .eq("line_user_id", lineUserId)
    .maybeSingle();

  if (error || !data) return null;
  return (data as { pin_hash: string | null }).pin_hash ?? null;
}

/** Get auth fields by phone (used in web-login flow). */
export async function getUserAuthByPhone(
  phone: string,
): Promise<{
  id: string;
  pin_hash: string | null;
  line_user_id: string | null;
} | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabaseServer as any)
    .from("users")
    .select("id, pin_hash, line_user_id")
    .eq("phone", phone)
    .maybeSingle();

  if (error || !data) return null;
  return data as {
    id: string;
    pin_hash: string | null;
    line_user_id: string | null;
  };
}

export async function findUserByPhone(
  phone: string,
): Promise<{ id: string; line_user_id: string | null } | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabaseServer as any)
    .from("users")
    .select("id, line_user_id")
    .eq("phone", phone)
    .maybeSingle();

  if (error || !data) return null;
  return data as { id: string; line_user_id: string | null };
}

/** Set phone once (for users who registered before phone was required). */
export async function setUserPhoneIfEmpty(
  lineUserId: string,
  phone: string,
): Promise<{ ok: true } | { ok: false; reason: "duplicate" | "already_set" | "error" }> {
  const taken = await findUserByPhone(phone);
  if (taken && taken.line_user_id !== lineUserId) {
    return { ok: false, reason: "duplicate" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabaseServer as any)
    .from("users")
    .update({ phone, updated_at: new Date().toISOString() })
    .eq("line_user_id", lineUserId)
    .is("phone", null)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") return { ok: false, reason: "duplicate" };
    console.error("[userRepository] setUserPhoneIfEmpty error:", error);
    return { ok: false, reason: "error" };
  }
  if (!data) return { ok: false, reason: "already_set" };
  return { ok: true };
}

export async function setUserPinHash(
  lineUserId: string,
  pinHash: string,
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseServer as any)
    .from("users")
    .update({ pin_hash: pinHash, updated_at: new Date().toISOString() })
    .eq("line_user_id", lineUserId);

  if (error) {
    console.error("[userRepository] setUserPinHash error:", error);
    return false;
  }
  return true;
}
