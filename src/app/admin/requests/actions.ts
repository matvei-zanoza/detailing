"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ requestId: z.string().uuid() });

type ActionResult = { ok: true } | { ok: false; error: string };

async function loadRequestOrError(requestId: string) {
  const admin = createSupabaseAdminClient();

  const req = await admin
    .from("studio_join_requests")
    .select("id, studio_id, user_id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (req.error) {
    return { ok: false as const, error: req.error.message };
  }

  if (!req.data) {
    return { ok: false as const, error: "Request not found" };
  }

  return { ok: true as const, request: req.data };
}

export async function approveJoinRequest(raw: unknown): Promise<ActionResult> {
  const { user } = await requireSuperAdmin();

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const loaded = await loadRequestOrError(parsed.data.requestId);
  if (!loaded.ok) return loaded;

  const { request } = loaded;
  if (request.status !== "pending") {
    return { ok: false, error: "Request is not pending" };
  }

  const admin = createSupabaseAdminClient();

  const profile = await admin
    .from("user_profiles")
    .select("id, display_name, requested_studio_id, membership_status")
    .eq("id", request.user_id)
    .maybeSingle();

  if (profile.error) {
    return { ok: false, error: profile.error.message ?? "Failed to load user" };
  }

  if (!profile.data) {
    return { ok: false, error: "User profile not found" };
  }

  if (profile.data.membership_status !== "pending_approval") {
    return { ok: false, error: "User is not pending approval" };
  }

  if (profile.data.requested_studio_id !== request.studio_id) {
    return { ok: false, error: "Requested studio does not match" };
  }

  const now = new Date().toISOString();

  const up = await admin
    .from("user_profiles")
    .update({
      studio_id: request.studio_id,
      membership_status: "active",
      approved_at: now,
      approved_by: user.id,
      role: "staff",
      requested_studio_id: null,
      requested_at: null,
    })
    .eq("id", request.user_id)
    .select("id")
    .maybeSingle();

  if (up.error || !up.data) {
    return { ok: false, error: up.error?.message ?? "Failed to approve" };
  }

  await admin
    .from("studio_join_requests")
    .update({ status: "approved", decided_at: now, decided_by: user.id })
    .eq("id", request.id);

  const staffExisting = await admin
    .from("staff_profiles")
    .select("id")
    .eq("studio_id", request.studio_id)
    .eq("user_id", request.user_id)
    .maybeSingle();

  const safeDisplayName = (profile.data.display_name ?? "").trim() || "Staff";

  if (!staffExisting.data) {
    const ins = await admin.from("staff_profiles").insert({
      studio_id: request.studio_id,
      user_id: request.user_id,
      display_name: safeDisplayName,
      role: "staff",
      is_active: true,
    });
    if (ins.error) {
      return { ok: false, error: ins.error.message ?? "Failed to create staff profile" };
    }
  } else {
    const upStaff = await admin
      .from("staff_profiles")
      .update({ display_name: safeDisplayName, role: "staff", is_active: true })
      .eq("id", staffExisting.data.id);
    if (upStaff.error) {
      return { ok: false, error: upStaff.error.message ?? "Failed to update staff profile" };
    }
  }

  revalidatePath("/admin/requests");
  revalidatePath("/admin/users");
  revalidatePath("/staff/requests");
  revalidatePath("/staff");

  return { ok: true };
}

export async function rejectJoinRequest(raw: unknown): Promise<ActionResult> {
  const { user } = await requireSuperAdmin();

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const loaded = await loadRequestOrError(parsed.data.requestId);
  if (!loaded.ok) return loaded;

  const { request } = loaded;
  if (request.status !== "pending") {
    return { ok: false, error: "Request is not pending" };
  }

  const admin = createSupabaseAdminClient();

  const now = new Date().toISOString();

  const up = await admin
    .from("user_profiles")
    .update({
      studio_id: null,
      membership_status: "rejected",
      requested_studio_id: null,
      requested_at: null,
      approved_at: null,
      approved_by: null,
    })
    .eq("id", request.user_id)
    .select("id")
    .maybeSingle();

  if (up.error || !up.data) {
    return { ok: false, error: up.error?.message ?? "Failed to reject" };
  }

  await admin
    .from("studio_join_requests")
    .update({ status: "rejected", decided_at: now, decided_by: user.id })
    .eq("id", request.id);

  revalidatePath("/admin/requests");
  revalidatePath("/admin/users");

  return { ok: true };
}
