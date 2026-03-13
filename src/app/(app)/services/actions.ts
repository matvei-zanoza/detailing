"use server";

import { revalidatePath } from "next/cache";

import { requireProfile } from "@/lib/auth/require-profile";
import { serviceSchema } from "@/lib/schemas/service";

function toCents(price: number) {
  return Math.round((price ?? 0) * 100);
}

export async function createService(raw: unknown) {
  const values = serviceSchema.parse(raw);
  const { supabase, profile } = await requireProfile();

  const insert = await supabase
    .from("services")
    .insert({
      studio_id: profile.studio_id,
      name: values.name,
      description: values.description,
      duration_minutes: values.duration_minutes,
      base_price_cents: toCents(values.base_price),
      category: values.category,
      is_active: values.is_active,
    })
    .select("id")
    .single();

  if (insert.error || !insert.data) {
    throw insert.error ?? new Error("Failed to create service");
  }

  revalidatePath("/services");
  revalidatePath("/bookings");

  return { id: insert.data.id as string };
}

export async function updateService(serviceId: string, raw: unknown) {
  const values = serviceSchema.parse(raw);
  const { supabase, profile } = await requireProfile();

  const update = await supabase
    .from("services")
    .update({
      name: values.name,
      description: values.description,
      duration_minutes: values.duration_minutes,
      base_price_cents: toCents(values.base_price),
      category: values.category,
      is_active: values.is_active,
    })
    .eq("studio_id", profile.studio_id)
    .eq("id", serviceId)
    .select("id")
    .single();

  if (update.error || !update.data) {
    throw update.error ?? new Error("Failed to update service");
  }

  revalidatePath("/services");
  revalidatePath("/bookings");

  return { id: serviceId };
}
