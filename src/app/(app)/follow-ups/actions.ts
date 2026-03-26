"use server";

import { revalidatePath } from "next/cache";

import { requireProfile } from "@/lib/auth/require-profile";

export async function markFollowUpSent(taskId: string) {
  const { supabase, profile } = await requireProfile();

  if (!taskId) return { ok: false, error: "Task is required" } as const;

  const now = new Date().toISOString();

  const up = await supabase
    .from("follow_up_tasks")
    .update({ status: "sent", sent_at: now })
    .eq("id", taskId)
    .eq("studio_id", profile.studio_id)
    .select("id")
    .maybeSingle();

  if (up.error || !up.data) {
    return { ok: false, error: up.error?.message ?? "Failed to update task" } as const;
  }

  revalidatePath("/follow-ups");
  revalidatePath("/dashboard");
  return { ok: true } as const;
}

export async function markFollowUpSkipped(taskId: string) {
  const { supabase, profile } = await requireProfile();

  if (!taskId) return { ok: false, error: "Task is required" } as const;

  const up = await supabase
    .from("follow_up_tasks")
    .update({ status: "skipped" })
    .eq("id", taskId)
    .eq("studio_id", profile.studio_id)
    .select("id")
    .maybeSingle();

  if (up.error || !up.data) {
    return { ok: false, error: up.error?.message ?? "Failed to update task" } as const;
  }

  revalidatePath("/follow-ups");
  revalidatePath("/dashboard");
  return { ok: true } as const;
}
