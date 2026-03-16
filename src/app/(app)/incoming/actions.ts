"use server";

import { revalidatePath } from "next/cache";

import { requireProfile } from "@/lib/auth/require-profile";

export async function acknowledgeBookingRequest(requestId: string) {
  const { supabase, user, profile } = await requireProfile();

  const update = await supabase
    .from("booking_requests")
    .update({
      status: "acknowledged",
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: user.id,
    })
    .eq("id", requestId)
    .eq("studio_id", profile.studio_id)
    .select("id")
    .maybeSingle();

  if (update.error) {
    throw update.error;
  }

  if (!update.data) {
    throw new Error("Request not found");
  }

  revalidatePath("/incoming");

  return { id: update.data.id as string };
}
