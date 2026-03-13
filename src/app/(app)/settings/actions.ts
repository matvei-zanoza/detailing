"use server";

import { revalidatePath } from "next/cache";

import { requireProfile } from "@/lib/auth/require-profile";
import { studioSettingsSchema } from "@/lib/schemas/studio-settings";

export async function updateStudioSettings(raw: unknown) {
  const values = studioSettingsSchema.parse(raw);
  const { supabase, profile } = await requireProfile();

  const update = await supabase
    .from("studios")
    .update({
      name: values.name,
      timezone: values.timezone,
      currency: values.currency,
      branding_color: values.branding_color,
      business_hours: JSON.parse(values.business_hours),
    })
    .eq("id", profile.studio_id)
    .select("id")
    .single();

  if (update.error || !update.data) {
    throw update.error ?? new Error("Failed to update studio");
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return { id: update.data.id as string };
}
