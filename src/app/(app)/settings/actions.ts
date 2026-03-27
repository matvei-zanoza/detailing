"use server";

import { revalidatePath } from "next/cache";

import { requireProfile } from "@/lib/auth/require-profile";
import { studioSettingsSchema } from "@/lib/schemas/studio-settings";

export type UpdateStudioSettingsResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function updateStudioSettings(raw: unknown) {
  const parsed = studioSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid settings",
    } satisfies UpdateStudioSettingsResult;
  }

  const values = parsed.data;
  const { supabase, profile } = await requireProfile();

  if (!(profile.role === "owner" || profile.role === "manager")) {
    return {
      ok: false,
      error: "Not allowed",
    } satisfies UpdateStudioSettingsResult;
  }

  let businessHours: unknown;
  try {
    businessHours = JSON.parse(values.business_hours);
  } catch {
    return {
      ok: false,
      error: "Business hours must be valid JSON",
    } satisfies UpdateStudioSettingsResult;
  }

  const update = await supabase
    .from("studios")
    .update({
      name: values.name,
      timezone: values.timezone,
      currency: values.currency,
      branding_color: values.branding_color,
      business_hours: businessHours,
    })
    .eq("id", profile.studio_id)
    .select("id")
    .maybeSingle();

  if (update.error) {
    return {
      ok: false,
      error: update.error?.message ?? "Failed to update studio",
    } satisfies UpdateStudioSettingsResult;
  }

  if (!update.data) {
    return {
      ok: false,
      error:
        "Studio update affected 0 rows. This is usually caused by missing UPDATE permissions (RLS policy) or an invalid studio id.",
    } satisfies UpdateStudioSettingsResult;
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return { ok: true, id: update.data.id as string } satisfies UpdateStudioSettingsResult;
}

export type SetStudioJoinCodeResult = { ok: true } | { ok: false; error: string };

export async function setStudioJoinCode(_raw: unknown): Promise<SetStudioJoinCodeResult> {
  return { ok: false, error: "Join code is static" };
}

export type RotateStudioJoinCodeResult =
  | { ok: true; code: string }
  | { ok: false; error: string };

export async function rotateStudioJoinCode(): Promise<RotateStudioJoinCodeResult> {
  return { ok: false, error: "Join code is static" };
}

export type GetStudioJoinCodeResult =
  | { ok: true; code: string | null }
  | { ok: false; error: string };

export async function getStudioJoinCode(): Promise<GetStudioJoinCodeResult> {
  const { supabase, profile } = await requireProfile();
  if (!(profile.role === "owner" || profile.role === "manager")) {
    return { ok: false, error: "Not allowed" };
  }

  const rpc = await supabase.rpc("get_studio_join_code", {
    p_studio_id: profile.studio_id,
  });

  if (rpc.error) {
    return { ok: false, error: rpc.error.message ?? "Failed to load join code" };
  }

  return { ok: true, code: (rpc.data as string | null) ?? null };
}
