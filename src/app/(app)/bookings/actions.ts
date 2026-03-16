"use server";

import { revalidatePath } from "next/cache";

import { requireProfile } from "@/lib/auth/require-profile";
import { bookingFormSchema } from "@/lib/schemas/booking";
import { BOOKING_STATUSES, type BookingStatus } from "@/lib/domain/booking";

function toCents(price: number) {
  return Math.round((price ?? 0) * 100);
}

function toTimeWithSeconds(t: string | null | undefined) {
  if (!t) return null;
  return `${t}:00`;
}

export async function createBooking(raw: unknown) {
  const parsed = bookingFormSchema.parse(raw);
  const { supabase, user, profile } = await requireProfile();

  const insert = await supabase
    .from("bookings")
    .insert({
      studio_id: profile.studio_id,
      customer_id: parsed.customer_id,
      car_id: parsed.car_id,
      service_id: parsed.item_type === "service" ? parsed.service_id : null,
      package_id: parsed.item_type === "package" ? parsed.package_id : null,
      staff_id: parsed.staff_id ?? null,
      booking_date: parsed.booking_date,
      start_time: toTimeWithSeconds(parsed.start_time)!,
      end_time: toTimeWithSeconds(parsed.end_time ?? null),
      status: parsed.status,
      price_cents: toCents(parsed.price),
      notes: parsed.notes ?? null,
    })
    .select("id")
    .single();

  if (insert.error || !insert.data) {
    throw insert.error ?? new Error("Failed to create booking");
  }

  await supabase.from("booking_status_history").insert({
    studio_id: profile.studio_id,
    booking_id: insert.data.id,
    status: parsed.status,
    changed_by: user.id,
  });

  revalidatePath("/bookings");
  revalidatePath("/workflow");
  revalidatePath("/dashboard");

  return { id: insert.data.id as string };
}

export async function updateBooking(bookingId: string, raw: unknown) {
  const parsed = bookingFormSchema.parse(raw);
  const { supabase, user, profile } = await requireProfile();

  const existing = await supabase
    .from("bookings")
    .select("status")
    .eq("id", bookingId)
    .eq("studio_id", profile.studio_id)
    .single();

  if (existing.error || !existing.data) {
    throw existing.error ?? new Error("Booking not found");
  }

  const update = await supabase
    .from("bookings")
    .update({
      customer_id: parsed.customer_id,
      car_id: parsed.car_id,
      service_id: parsed.item_type === "service" ? parsed.service_id : null,
      package_id: parsed.item_type === "package" ? parsed.package_id : null,
      staff_id: parsed.staff_id ?? null,
      booking_date: parsed.booking_date,
      start_time: toTimeWithSeconds(parsed.start_time)!,
      end_time: toTimeWithSeconds(parsed.end_time ?? null),
      status: parsed.status,
      price_cents: toCents(parsed.price),
      notes: parsed.notes ?? null,
    })
    .eq("id", bookingId)
    .eq("studio_id", profile.studio_id)
    .select("id")
    .single();

  if (update.error || !update.data) {
    throw update.error ?? new Error("Failed to update booking");
  }

  const previous = existing.data.status as BookingStatus;
  if (previous !== parsed.status) {
    await supabase.from("booking_status_history").insert({
      studio_id: profile.studio_id,
      booking_id: bookingId,
      status: parsed.status,
      changed_by: user.id,
    });
  }

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/workflow");
  revalidatePath("/dashboard");

  return { id: bookingId };
}

export async function updateCarTimes(
  bookingId: string,
  raw: {
    car_arrived_at?: string | null;
    car_ready_at?: string | null;
    car_picked_up_at?: string | null;
  },
) {
  const { supabase, profile } = await requireProfile();

  const update = await supabase
    .from("bookings")
    .update({
      car_arrived_at: raw.car_arrived_at ?? null,
      car_ready_at: raw.car_ready_at ?? null,
      car_picked_up_at: raw.car_picked_up_at ?? null,
    })
    .eq("id", bookingId)
    .eq("studio_id", profile.studio_id)
    .select("id")
    .maybeSingle();

  if (update.error) {
    throw update.error;
  }

  if (!update.data) {
    throw new Error("Booking not found");
  }

  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/workflow");
  revalidatePath("/dashboard");

  return { id: bookingId };
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus) {
  if (!BOOKING_STATUSES.includes(status)) {
    throw new Error("Invalid status");
  }

  const { supabase, user, profile } = await requireProfile();

  const update = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId)
    .eq("studio_id", profile.studio_id)
    .select("id")
    .single();

  if (update.error || !update.data) {
    throw update.error ?? new Error("Failed to update status");
  }

  await supabase.from("booking_status_history").insert({
    studio_id: profile.studio_id,
    booking_id: bookingId,
    status,
    changed_by: user.id,
  });

  revalidatePath("/workflow");
  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/dashboard");

  return { id: bookingId };
}
