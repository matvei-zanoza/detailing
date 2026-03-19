"use server";

import { revalidatePath } from "next/cache";

import { requireProfile } from "@/lib/auth/require-profile";
import { packageSchema } from "@/lib/schemas/package";

function toCents(price: number) {
  return Math.round((price ?? 0) * 100);
}

export async function createPackage(raw: unknown) {
  const values = packageSchema.parse(raw);
  const { supabase, profile } = await requireProfile();

  if (!(profile.role === "owner" || profile.role === "manager")) {
    throw new Error("Not allowed");
  }

  const insert = await supabase
    .from("packages")
    .insert({
      studio_id: profile.studio_id,
      name: values.name,
      description: values.description,
      target_profile: values.target_profile,
      base_price_cents: toCents(values.base_price),
      is_active: values.is_active,
    })
    .select("id")
    .single();

  if (insert.error || !insert.data) {
    throw insert.error ?? new Error("Failed to create package");
  }

  const packageId = insert.data.id as string;

  const items = values.included_service_ids.map((service_id) => ({
    studio_id: profile.studio_id,
    package_id: packageId,
    service_id,
    quantity: 1,
  }));

  const insItems = await supabase.from("package_items").insert(items);
  if (insItems.error) {
    throw insItems.error;
  }

  revalidatePath("/packages");
  revalidatePath("/bookings");

  return { id: packageId };
}

export async function updatePackage(packageId: string, raw: unknown) {
  const values = packageSchema.parse(raw);
  const { supabase, profile } = await requireProfile();

  if (!(profile.role === "owner" || profile.role === "manager")) {
    throw new Error("Not allowed");
  }

  const update = await supabase
    .from("packages")
    .update({
      name: values.name,
      description: values.description,
      target_profile: values.target_profile,
      base_price_cents: toCents(values.base_price),
      is_active: values.is_active,
    })
    .eq("studio_id", profile.studio_id)
    .eq("id", packageId)
    .select("id")
    .single();

  if (update.error || !update.data) {
    throw update.error ?? new Error("Failed to update package");
  }

  const del = await supabase
    .from("package_items")
    .delete()
    .eq("studio_id", profile.studio_id)
    .eq("package_id", packageId);

  if (del.error) {
    throw del.error;
  }

  const items = values.included_service_ids.map((service_id) => ({
    studio_id: profile.studio_id,
    package_id: packageId,
    service_id,
    quantity: 1,
  }));

  const ins = await supabase.from("package_items").insert(items);
  if (ins.error) {
    throw ins.error;
  }

  revalidatePath("/packages");
  revalidatePath("/bookings");

  return { id: packageId };
}
