"use server";

import { revalidatePath } from "next/cache";

import { requireProfile } from "@/lib/auth/require-profile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function isStudioAdminRole(role: string) {
  return role === "owner" || role === "manager";
}

export async function approveMember(userId: string) {
  const { profile, user } = await requireProfile();

  if (!isStudioAdminRole(profile.role)) {
    return { ok: false, error: "Not allowed" } as const;
  }

  if (!userId) return { ok: false, error: "User is required" } as const;

  let admin: ReturnType<typeof createSupabaseAdminClient>;
  try {
    admin = createSupabaseAdminClient();
  } catch (e) {
    console.error("[staff/requests] missing admin configuration", {
      error: e instanceof Error ? e.message : String(e),
    });
    return { ok: false, error: "Approve failed. Please try again later." } as const;
  }

  const target = await admin
    .from("user_profiles")
    .select("id, display_name, requested_studio_id, membership_status")
    .eq("id", userId)
    .maybeSingle();

  if (target.error) {
    console.error("[staff/requests] approve failed to load target user", {
      message: target.error.message,
      code: (target.error as any).code,
      details: (target.error as any).details,
      hint: (target.error as any).hint,
    });
    return { ok: false, error: "Approve failed. Please try again later." } as const;
  }

  if (!target.data) {
    return { ok: false, error: "User not found" } as const;
  }

  if (target.data.requested_studio_id !== profile.studio_id) {
    return { ok: false, error: "Request is not for your studio" } as const;
  }

  if (target.data.membership_status !== "pending_approval") {
    return { ok: false, error: "User is not pending approval" } as const;
  }

  const now = new Date().toISOString();

  const update = await admin
    .from("user_profiles")
    .update({
      studio_id: profile.studio_id,
      membership_status: "active",
      approved_at: now,
      approved_by: user.id,
      role: "staff",
      requested_studio_id: null,
      requested_at: null,
    })
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (update.error || !update.data) {
    if (update.error) {
      console.error("[staff/requests] approve failed to update profile", {
        message: update.error.message,
        code: (update.error as any).code,
        details: (update.error as any).details,
        hint: (update.error as any).hint,
      });
    }
    return { ok: false, error: "Approve failed. Please try again later." } as const;
  }

  await admin
    .from("studio_join_requests")
    .update({ status: "approved", decided_at: now, decided_by: user.id })
    .eq("studio_id", profile.studio_id)
    .eq("user_id", userId);

  const safeDisplayName = (target.data.display_name ?? "").trim() || "Staff";

  const staffExisting = await admin
    .from("staff_profiles")
    .select("id")
    .eq("studio_id", profile.studio_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (staffExisting.error) {
    console.error("[staff/requests] approve failed to check staff profile", {
      message: staffExisting.error.message,
      code: (staffExisting.error as any).code,
      details: (staffExisting.error as any).details,
      hint: (staffExisting.error as any).hint,
    });
    return { ok: false, error: "Approve failed. Please try again later." } as const;
  }

  if (!staffExisting.data) {
    const ins = await admin.from("staff_profiles").insert({
      studio_id: profile.studio_id,
      user_id: userId,
      display_name: safeDisplayName,
      role: "staff",
      is_active: true,
    });
    if (ins.error) {
      console.error("[staff/requests] approve failed to create staff profile", {
        message: ins.error.message,
        code: (ins.error as any).code,
        details: (ins.error as any).details,
        hint: (ins.error as any).hint,
      });
      return { ok: false, error: "Approve failed. Please try again later." } as const;
    }
  } else {
    const upStaff = await admin
      .from("staff_profiles")
      .update({ display_name: safeDisplayName, role: "staff", is_active: true })
      .eq("id", staffExisting.data.id);
    if (upStaff.error) {
      console.error("[staff/requests] approve failed to update staff profile", {
        message: upStaff.error.message,
        code: (upStaff.error as any).code,
        details: (upStaff.error as any).details,
        hint: (upStaff.error as any).hint,
      });
      return { ok: false, error: "Approve failed. Please try again later." } as const;
    }
  }

  revalidatePath("/staff/requests");
  revalidatePath("/staff");
  return { ok: true } as const;
}

export async function rejectMember(userId: string) {
  const { profile, user } = await requireProfile();

  if (!isStudioAdminRole(profile.role)) {
    return { ok: false, error: "Not allowed" } as const;
  }

  if (!userId) return { ok: false, error: "User is required" } as const;

  let admin: ReturnType<typeof createSupabaseAdminClient>;
  try {
    admin = createSupabaseAdminClient();
  } catch (e) {
    console.error("[staff/requests] missing admin configuration", {
      error: e instanceof Error ? e.message : String(e),
    });
    return { ok: false, error: "Reject failed. Please try again later." } as const;
  }

  const target = await admin
    .from("user_profiles")
    .select("id, requested_studio_id, membership_status")
    .eq("id", userId)
    .maybeSingle();

  if (target.error) {
    console.error("[staff/requests] reject failed to load target user", {
      message: target.error.message,
      code: (target.error as any).code,
      details: (target.error as any).details,
      hint: (target.error as any).hint,
    });
    return { ok: false, error: "Reject failed. Please try again later." } as const;
  }

  if (!target.data) {
    return { ok: false, error: "User not found" } as const;
  }

  if (target.data.requested_studio_id !== profile.studio_id) {
    return { ok: false, error: "Request is not for your studio" } as const;
  }

  if (target.data.membership_status !== "pending_approval") {
    return { ok: false, error: "User is not pending approval" } as const;
  }

  const now = new Date().toISOString();

  const update = await admin
    .from("user_profiles")
    .update({
      studio_id: null,
      membership_status: "rejected",
      requested_studio_id: null,
      requested_at: null,
      approved_at: null,
      approved_by: null,
    })
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (update.error || !update.data) {
    if (update.error) {
      console.error("[staff/requests] reject failed to update profile", {
        message: update.error.message,
        code: (update.error as any).code,
        details: (update.error as any).details,
        hint: (update.error as any).hint,
      });
    }
    return { ok: false, error: "Reject failed. Please try again later." } as const;
  }

  await admin
    .from("studio_join_requests")
    .update({ status: "rejected", decided_at: now, decided_by: user.id })
    .eq("studio_id", profile.studio_id)
    .eq("user_id", userId);

  revalidatePath("/staff/requests");
  return { ok: true } as const;
}
