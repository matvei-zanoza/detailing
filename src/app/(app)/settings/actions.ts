"use server";

import { revalidatePath } from "next/cache";
import { randomInt } from "crypto";
import { z } from "zod";

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

const setJoinCodeSchema = z.object({
  code: z.string().trim().min(4).max(32),
});

function normalizeJoinCode(code: string) {
  return code.replace(/[^a-z0-9]+/gi, "").toUpperCase();
}

export async function setStudioJoinCode(raw: unknown): Promise<SetStudioJoinCodeResult> {
  const parsed = setJoinCodeSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid code" };
  }

  const { supabase, profile } = await requireProfile();
  if (!(profile.role === "owner" || profile.role === "manager")) {
    return { ok: false, error: "Not allowed" };
  }

  const rpc = await supabase.rpc("set_studio_join_code", {
    p_studio_id: profile.studio_id,
    p_code: normalizeJoinCode(parsed.data.code),
  });

  if (rpc.error) {
    return { ok: false, error: rpc.error.message ?? "Failed to update join code" };
  }

  revalidatePath("/settings");
  return { ok: true };
}

export type RotateStudioJoinCodeResult =
  | { ok: true; code: string }
  | { ok: false; error: string };

function generateJoinCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function rotateStudioJoinCode(): Promise<RotateStudioJoinCodeResult> {
  const { supabase, profile } = await requireProfile();
  if (!(profile.role === "owner" || profile.role === "manager")) {
    return { ok: false, error: "Not allowed" };
  }

  const code = generateJoinCode();
  const rpc = await supabase.rpc("set_studio_join_code", {
    p_studio_id: profile.studio_id,
    p_code: code,
  });

  if (rpc.error) {
    return { ok: false, error: rpc.error.message ?? "Failed to rotate join code" };
  }

  revalidatePath("/settings");
  return { ok: true, code };
}
