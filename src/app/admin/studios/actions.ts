"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAppAdmin } from "@/lib/auth/require-app-admin";

const createStudioSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
});

export async function createStudio(raw: unknown) {
  await requireAppAdmin();

  const parsed = createStudioSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" } as const;
  }

  const { supabase } = await requireAppAdmin();

  const ins = await supabase
    .from("studios")
    .insert({ name: parsed.data.name, slug: parsed.data.slug })
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
  await requireAppAdmin();

  const parsed = setListingSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" } as const;
  }

  const { supabase } = await requireAppAdmin();

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
