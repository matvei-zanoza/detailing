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
    .single();

  if (update.error || !update.data) {
    return {
      ok: false,
      error: update.error?.message ?? "Failed to update studio",
    } satisfies UpdateStudioSettingsResult;
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return { ok: true, id: update.data.id as string } satisfies UpdateStudioSettingsResult;
}
