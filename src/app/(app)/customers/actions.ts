"use server";

import { revalidatePath } from "next/cache";

import { requireProfile } from "@/lib/auth/require-profile";
import { customerSchema } from "@/lib/schemas/customer";

export async function createCustomer(raw: unknown) {
  const values = customerSchema.parse(raw);
  const { supabase, profile } = await requireProfile();

  const insert = await supabase
    .from("customers")
    .insert({
      studio_id: profile.studio_id,
      display_name: values.display_name,
      email: values.email ?? null,
      phone: values.phone ?? null,
      notes: values.notes ?? null,
    })
    .select("id, display_name")
    .single();

  if (insert.error || !insert.data) {
    throw insert.error ?? new Error("Failed to create customer");
  }

  revalidatePath("/customers");
  revalidatePath("/bookings");

  return { id: insert.data.id as string, display_name: insert.data.display_name as string };
}
