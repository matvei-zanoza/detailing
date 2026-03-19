"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireProfile } from "@/lib/auth/require-profile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["owner", "manager", "staff"]),
});

type Result = { ok: true } | { ok: false; error: string };

function canManageStudio(role: string) {
  return role === "owner" || role === "manager";
}

export async function setStudioMemberRole(raw: unknown): Promise<Result> {
  const { profile, user } = await requireProfile();

  if (!canManageStudio(profile.role)) {
    return { ok: false, error: "Not allowed" };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const targetUserId = parsed.data.userId;
  const nextRole = parsed.data.role;

  if (profile.role === "manager" && nextRole === "owner") {
    return { ok: false, error: "Managers cannot assign owner role" };
  }

  const admin = createSupabaseAdminClient();

  const target = await admin
    .from("user_profiles")
    .select("id, role, studio_id, membership_status")
    .eq("id", targetUserId)
    .maybeSingle();

  if (target.error) {
    return { ok: false, error: target.error.message ?? "Failed to load user" };
  }

  if (!target.data) {
    return { ok: false, error: "User not found" };
  }

  if (target.data.studio_id !== profile.studio_id || target.data.membership_status !== "active") {
    return { ok: false, error: "User is not an active member of your studio" };
  }

  const prevRole = target.data.role as string;

  if (prevRole === "owner" && nextRole !== "owner") {
    const owners = await admin
      .from("user_profiles")
      .select("id")
      .eq("studio_id", profile.studio_id)
      .eq("membership_status", "active")
      .eq("role", "owner");

    if (owners.error) {
      return { ok: false, error: owners.error.message ?? "Failed to validate owners" };
    }

    const ownersCount = (owners.data ?? []).length;
    if (ownersCount <= 1) {
      return { ok: false, error: "Cannot remove the last owner" };
    }
  }

  const upProfile = await admin.from("user_profiles").update({ role: nextRole }).eq("id", targetUserId);
  if (upProfile.error) {
    return { ok: false, error: upProfile.error.message ?? "Failed to update role" };
  }

  await admin
    .from("staff_profiles")
    .update({ role: nextRole })
    .eq("studio_id", profile.studio_id)
    .eq("user_id", targetUserId);

  revalidatePath("/staff/members");
  revalidatePath("/staff");

  if (targetUserId === user.id) {
    revalidatePath("/dashboard");
    revalidatePath("/settings");
  }

  return { ok: true };
}
