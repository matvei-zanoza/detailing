"use server";

import { revalidatePath } from "next/cache";

import { requireProfile } from "@/lib/auth/require-profile";
import { carSchema } from "@/lib/schemas/car";

export async function createCar(raw: unknown) {
  const values = carSchema.parse(raw);
  const { supabase, profile } = await requireProfile();

  const customerId =
    values.customer_id && values.customer_id !== "__no_owner__" ? values.customer_id : null;
  const year = typeof values.year === "number" ? values.year : null;
  const color = values.color?.trim() ? values.color.trim() : null;
  const licensePlate = values.license_plate?.trim() ? values.license_plate.trim() : null;
  const category =
    values.category && values.category !== "__no_category__"
      ? values.category
      : null;

  const insert = await supabase
    .from("cars")
    .insert({
      studio_id: profile.studio_id,
      customer_id: customerId,
      brand: values.brand,
      model: values.model,
      year,
      color,
      license_plate: licensePlate,
      category,
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
    customer_id: (insert.data.customer_id as string | null) ?? null,
    label: [
      `${insert.data.brand} ${insert.data.model}`,
      insert.data.year ? String(insert.data.year) : null,
      insert.data.color ? String(insert.data.color) : null,
    ]
      .filter(Boolean)
      .join(" • "),
  };
}
