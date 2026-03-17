import { supabaseServer } from "@/lib/supabase/server";
import type { UserRow } from "@/types/database";

export async function findUserByLineId(
  lineUserId: string
): Promise<UserRow | null> {
  const { data, error } = await supabaseServer
    .from("users")
    .select("id, display_name, picture_url")
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
    // @ts-expect-error - insert type inference with generic Database
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
