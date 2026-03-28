"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";

function normalizeJoinCode(code: string) {
  return code.replace(/[^a-z0-9]+/gi, "").toUpperCase();
}

export async function requestStudioAccess(code: string) {
  const { supabase, user } = await requireUser();

  if (!code?.trim()) return { ok: false, error: "onboarding.select.error.codeRequired" } as const;

  const resolved = await supabase.rpc("resolve_studio_by_join_code", {
    p_code: normalizeJoinCode(code),
  });

  if (resolved.error) {
    return { ok: false, error: "onboarding.select.error.verifyFailed" } as const;
  }

  const studioId = resolved.data as string | null;
  if (!studioId) {
    return { ok: false, error: "onboarding.select.error.invalidCode" } as const;
  }

  const previous = await supabase
    .from("user_profiles")
    .select("membership_status, requested_studio_id, requested_at")
    .eq("id", user.id)
    .maybeSingle();

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
    return { ok: false, error: update.error.message ?? "onboarding.select.error.requestAccessFailed" } as const;
  }

  const upsert = await supabase
    .from("studio_join_requests")
    .upsert({ studio_id: studioId, user_id: user.id, status: "pending" }, { onConflict: "studio_id,user_id" });

  if (upsert.error) {
    const prevData = previous.data;
    await supabase
      .from("user_profiles")
      .update({
        membership_status: (prevData?.membership_status as any) ?? "pending_studio",
        requested_studio_id: (prevData?.requested_studio_id as any) ?? null,
        requested_at: (prevData as any)?.requested_at ?? null,
      })
      .eq("id", user.id);
    return { ok: false, error: upsert.error.message ?? "onboarding.select.error.createJoinRequestFailed" } as const;
  }

  revalidatePath("/onboarding");
  revalidatePath("/onboarding/select-studio");
  return { ok: true } as const;
}
