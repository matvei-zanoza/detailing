"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";

export async function requestStudioAccess(studioId: string) {
  const { supabase, user } = await requireUser();

  if (!studioId) return { ok: false, error: "Studio is required" } as const;

  const update = await supabase
    .from("user_profiles")
    .update({
      membership_status: "pending_approval",
      requested_studio_id: studioId,
      requested_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (update.error) {
    return { ok: false, error: update.error.message ?? "Failed to request access" } as const;
  }

  const upsert = await supabase
    .from("studio_join_requests")
    .upsert({ studio_id: studioId, user_id: user.id, status: "pending" }, { onConflict: "studio_id,user_id" });

  if (upsert.error) {
    return { ok: false, error: upsert.error.message ?? "Failed to create join request" } as const;
  }

  revalidatePath("/onboarding");
  revalidatePath("/onboarding/select-studio");
  return { ok: true } as const;
}
