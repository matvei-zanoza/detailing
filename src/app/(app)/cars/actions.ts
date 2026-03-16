"use server";

import { revalidatePath } from "next/cache";

import { requireProfile } from "@/lib/auth/require-profile";
import { carSchema } from "@/lib/schemas/car";

export async function createCar(raw: unknown) {
  const values = carSchema.parse(raw);
  const { supabase, profile } = await requireProfile();

  const insert = await supabase
    .from("cars")
    .insert({
      studio_id: profile.studio_id,
      customer_id: values.customer_id,
      brand: values.brand,
      model: values.model,
      year: values.year,
      color: values.color,
      license_plate: values.license_plate,
      category: values.category,
    })
    .select("id, customer_id, brand, model, year, color")
    .single();

  if (insert.error || !insert.data) {
    throw insert.error ?? new Error("Failed to create car");
  }

  revalidatePath("/cars");
  revalidatePath("/customers");
  revalidatePath("/bookings");

  return {
    id: insert.data.id as string,
    customer_id: insert.data.customer_id as string,
    label: `${insert.data.brand} ${insert.data.model} • ${insert.data.year} • ${insert.data.color}`,
  };
}
