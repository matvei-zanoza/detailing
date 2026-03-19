"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const setRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["owner", "manager", "staff"]),
});

export type SetUserRoleResult = { ok: true } | { ok: false; error: string };

export async function setUserRole(raw: unknown): Promise<SetUserRoleResult> {
  await requireSuperAdmin();

  const parsed = setRoleSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const admin = createSupabaseAdminClient();

  const current = await admin
    .from("user_profiles")
    .select("id, membership_status, studio_id")
    .eq("id", parsed.data.userId)
    .maybeSingle();

  if (current.error) {
    return { ok: false, error: current.error.message ?? "Failed to load user" };
  }

  if (!current.data) {
    return { ok: false, error: "User not found" };
  }

  if (current.data.membership_status !== "active" || !current.data.studio_id) {
    return { ok: false, error: "User must be an active studio member to set role" };
  }

  const up = await admin
    .from("user_profiles")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.userId);

  if (up.error) {
    return { ok: false, error: up.error.message ?? "Failed to update role" };
  }

  revalidatePath("/admin/users");
  revalidatePath("/staff");
  revalidatePath("/staff/requests");

  return { ok: true };
}
