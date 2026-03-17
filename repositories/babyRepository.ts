import { supabaseServer } from "@/lib/supabase/server";
import type { BabyRow } from "@/types/database";

export type BabyWithRole = BabyRow & { role: string; is_owner: boolean };

export async function getBabiesByIds(
  babyIds: string[],
  roleByBabyId: Map<string, string>
): Promise<BabyWithRole[]> {
  if (babyIds.length === 0) return [];

  const { data, error } = await supabaseServer
    .from("babies")
    .select("id, name, birth_date, avatar_url")
    .in("id", babyIds);

  if (error) throw new Error(error.message ?? "Failed to load babies");

  return (data ?? []).map((baby: BabyRow) => {
    const role = roleByBabyId.get(baby.id) ?? "member";
    return { ...baby, role, is_owner: role === "owner" };
  });
}

export async function getBabyById(babyId: string): Promise<BabyRow | null> {
  const { data, error } = await supabaseServer
    .from("babies")
    .select("id, name, birth_date, avatar_url")
    .eq("id", babyId)
    .single();

  if (error || !data) return null;
  return data as BabyRow;
}

export async function getBabyOwnerId(babyId: string): Promise<string | null> {
  const { data, error } = await supabaseServer
    .from("babies")
    .select("created_by_user_id")
    .eq("id", babyId)
    .maybeSingle();

  if (error || !data) return null;
  return (data as { created_by_user_id: string | null }).created_by_user_id;
}

export async function createBaby(params: {
  name: string;
  birth_date: string | null;
  avatar_url: string | null;
  created_by_user_id: string;
}): Promise<{ id: string } | null> {
  // Supabase client typings can infer 'never' for insert with our Database shape; runtime is correct.
  const { data, error } = await supabaseServer
    .from("babies")
    // @ts-expect-error - insert type inference with generic Database
    .insert({
      name: params.name,
      birth_date: params.birth_date,
      avatar_url: params.avatar_url,
      created_by_user_id: params.created_by_user_id,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[babyRepository] createBaby error:", error);
    return null;
  }
  return data as { id: string };
}

export async function updateBaby(
  babyId: string,
  updates: Partial<Pick<BabyRow, "name" | "birth_date" | "avatar_url">>
): Promise<BabyRow | null> {
  const { data, error } = await supabaseServer
    .from("babies")
    // @ts-expect-error - update type inference with generic Database
    .update(updates)
    .eq("id", babyId)
    .select("id, name, birth_date, avatar_url")
    .single();

  if (error || !data) return null;
  return data as BabyRow;
}

export async function updateBabyAvatar(
  babyId: string,
  avatarUrl: string
): Promise<Error | null> {
  const { error } = await supabaseServer
    .from("babies")
    // @ts-expect-error - update type inference with generic Database
    .update({ avatar_url: avatarUrl })
    .eq("id", babyId);
  return error ? new Error(error.message) : null;
}

/** Fetch all babies (no auth filter – for internal/test use) */
export async function listBabies(): Promise<BabyRow[]> {
  const { data, error } = await supabaseServer
    .from("babies")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as BabyRow[];
}

export async function deleteBaby(babyId: string): Promise<boolean> {
  const { error } = await supabaseServer
    .from("babies")
    .delete()
    .eq("id", babyId);
  return !error;
}
