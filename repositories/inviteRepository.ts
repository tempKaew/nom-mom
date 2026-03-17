import { randomBytes } from "crypto";
import { supabaseServer } from "@/lib/supabase/server";

export type InviteRow = {
  id: string;
  baby_id: string;
  token: string;
  label: string | null;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
};

export function generateInviteToken(): string {
  return randomBytes(16).toString("hex");
}

export async function findPendingInviteByToken(
  token: string
): Promise<{ id: string; baby_id: string; role: string } | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabaseServer
    .from("baby_invites")
    .select("id, baby_id, role")
    .eq("token", token)
    .eq("status", "pending")
    .gt("expires_at", now)
    .maybeSingle();

  if (error || !data) return null;
  return data as { id: string; baby_id: string; role: string };
}

export async function acceptInvite(
  inviteId: string,
  userId: string
): Promise<Error | null> {
  const now = new Date().toISOString();
  const { data: invite } = await supabaseServer
    .from("baby_invites")
    .select("baby_id, role")
    .eq("id", inviteId)
    .single();

  if (!invite) return new Error("Invite not found");

  const { error: memberError } = await supabaseServer
    .from("baby_members")
    // @ts-expect-error - insert type inference with generic Database
    .insert({
      baby_id: (invite as { baby_id: string }).baby_id,
      user_id: userId,
      role: (invite as { role: string }).role,
    });
  if (memberError) return new Error(memberError.message);

  const { error: updateError } = await supabaseServer
    .from("baby_invites")
    // @ts-expect-error - update type inference with generic Database
    .update({ status: "accepted", updated_at: now })
    .eq("id", inviteId);
  return updateError ? new Error(updateError.message) : null;
}

export async function listInvitesByBabyId(
  babyId: string
): Promise<InviteRow[]> {
  const { data, error } = await supabaseServer
    .from("baby_invites")
    .select("id, baby_id, token, label, role, status, expires_at, created_at")
    .eq("baby_id", babyId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message ?? "Database error");
  return (data ?? []) as InviteRow[];
}

export async function createInvite(params: {
  baby_id: string;
  inviter_user_id: string;
  token: string;
  label: string;
  role: string;
  status: string;
  expires_at: string;
}): Promise<InviteRow | null> {
  const { data, error } = await supabaseServer
    .from("baby_invites")
    // @ts-expect-error - insert type inference with generic Database
    .insert(params)
    .select("id, baby_id, token, label, role, status, expires_at, created_at")
    .single();

  if (error || !data) {
    console.error("[inviteRepository] createInvite error:", error);
    return null;
  }
  return data as InviteRow;
}
