"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const createStudioSchema = z.object({
  name: z.string().trim().min(2, { message: "Name must be at least 2 characters" }),
  slug: z
    .string()
    .trim()
    .min(2, { message: "Slug must be at least 2 characters" })
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug can contain only lowercase letters, numbers, and hyphens",
    })
    .refine((s) => !s.startsWith("-") && !s.endsWith("-"), {
      message: "Slug cannot start or end with a hyphen",
    }),
});

export async function createStudio(raw: unknown) {
  await requireSuperAdmin();

  const parsed = createStudioSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" } as const;
  }

  const name = parsed.data.name;
  const slug = parsed.data.slug.toLowerCase();

  const { supabase } = await requireSuperAdmin();

  const ins = await supabase
    .from("studios")
    .insert({ name, slug })
    .select("id")
    .maybeSingle();

  if (ins.error) {
    return { ok: false, error: ins.error.message ?? "Failed to create studio" } as const;
  }

  if (!ins.data) {
    return { ok: false, error: "Insert affected 0 rows" } as const;
  }

  await supabase.from("studio_directory").upsert({
    studio_id: ins.data.id,
    public_name: parsed.data.name,
    is_active: true,
  });

  revalidatePath("/admin/studios");
  return { ok: true, id: ins.data.id as string } as const;
}

const setListingSchema = z.object({
  studioId: z.string().uuid(),
  publicName: z.string().min(2),
  isActive: z.boolean(),
});

export async function setStudioListing(raw: unknown) {
  await requireSuperAdmin();

  const parsed = setListingSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" } as const;
  }

  const { supabase } = await requireSuperAdmin();

  const up = await supabase.from("studio_directory").upsert({
    studio_id: parsed.data.studioId,
    public_name: parsed.data.publicName,
    is_active: parsed.data.isActive,
  });

  if (up.error) {
    return { ok: false, error: up.error.message ?? "Failed to update" } as const;
  }

  revalidatePath("/admin/studios");
  revalidatePath("/onboarding/select-studio");
  return { ok: true } as const;
}

const switchStudioSchema = z.object({
  studioId: z.string().uuid(),
});

export async function switchToStudio(raw: unknown) {
  const { user } = await requireSuperAdmin();

  const parsed = switchStudioSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" } as const;
  }

  let admin: ReturnType<typeof createSupabaseAdminClient>;
  try {
    admin = createSupabaseAdminClient();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Missing admin configuration" } as const;
  }

  const now = new Date().toISOString();
  const up = await admin
    .from("user_profiles")
    .update({
      studio_id: parsed.data.studioId,
      membership_status: "active",
      role: "owner",
      approved_at: now,
      approved_by: user.id,
      requested_studio_id: null,
      requested_at: null,
    })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (up.error) {
    return { ok: false, error: up.error.message ?? "Failed to switch studio" } as const;
  }

  if (!up.data) {
    return { ok: false, error: "User profile not found" } as const;
  }

  revalidatePath("/dashboard");
  revalidatePath("/staff");
  revalidatePath("/staff/members");
  revalidatePath("/staff/requests");
  revalidatePath("/settings");
  return { ok: true } as const;
}
