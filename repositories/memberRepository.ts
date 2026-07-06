import { supabaseServer } from "@/lib/supabase/server";
import type { MemberRow } from "@/types/database";

export async function getMembersByUserId(
  userId: string
): Promise<MemberRow[]> {
  const { data, error } = await supabaseServer
    .from("baby_members")
    .select("baby_id, role")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message ?? "Failed to load members");
  return (data ?? []) as MemberRow[];
}

export async function isMemberOfBaby(
  userId: string,
  babyId: string
): Promise<boolean> {
  const { data, error } = await supabaseServer
    .from("baby_members")
    .select("baby_id")
    .eq("baby_id", babyId)
    .eq("user_id", userId)
    .maybeSingle();

  return !error && data != null;
}

export async function addMember(params: {
  baby_id: string;
  user_id: string;
  role: string;
}): Promise<Error | null> {
  const { error } = await supabaseServer.from("baby_members").insert(params);
  return error ? new Error(error.message) : null;
}
