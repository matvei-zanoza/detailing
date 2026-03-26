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

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

async function ensurePaidSideEffects(args: {
  supabase: any;
  studioId: string;
  bookingId: string;
  customerId: string;
  carId: string;
  priceCents: number;
  serviceName: string;
  paidAtIso: string;
}) {
  const { supabase, studioId, bookingId, customerId, carId, priceCents, serviceName, paidAtIso } = args;

  const existingPayment = await supabase
    .from("payments")
    .select("id")
    .eq("studio_id", studioId)
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (!existingPayment.data) {
    await supabase.from("payments").insert({
      studio_id: studioId,
      booking_id: bookingId,
      amount_cents: priceCents ?? 0,
      status: "paid",
      method: "cash",
      discount_cents: 0,
      paid_at: paidAtIso,
    });
  }

  const existingHistory = await supabase
    .from("car_service_history")
    .select("id")
    .eq("studio_id", studioId)
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (!existingHistory.data) {
    await supabase.from("car_service_history").insert({
      studio_id: studioId,
      car_id: carId,
      booking_id: bookingId,
      services_summary: serviceName,
      notes: null,
    });
  }

  const carRes = await supabase
    .from("cars")
    .select("total_spent_cents")
    .eq("id", carId)
    .eq("studio_id", studioId)
    .maybeSingle();

  const currentTotal = (carRes.data as any)?.total_spent_cents ?? 0;
  await supabase
    .from("cars")
    .update({
      last_visit_at: paidAtIso,
      total_spent_cents: currentTotal + (priceCents ?? 0),
    })
    .eq("id", carId)
    .eq("studio_id", studioId);

  const now = new Date(paidAtIso);
  const existingTasks = await supabase
    .from("follow_up_tasks")
    .select("id, type")
    .eq("studio_id", studioId)
    .eq("booking_id", bookingId);

  const types = new Set((existingTasks.data ?? []).map((t: any) => t.type));
  const toInsert: any[] = [];

  if (!types.has("review_request")) {
    toInsert.push({
      studio_id: studioId,
      customer_id: customerId,
      car_id: carId,
      booking_id: bookingId,
      type: "review_request",
      status: "pending",
      scheduled_for: addHours(now, 24).toISOString(),
    });
  }

  if (!types.has("rebook_reminder")) {
    toInsert.push({
      studio_id: studioId,
      customer_id: customerId,
      car_id: carId,
      booking_id: bookingId,
      type: "rebook_reminder",
      status: "pending",
      scheduled_for: addDays(now, 28).toISOString(),
    });
  }

  if (toInsert.length) {
    await supabase.from("follow_up_tasks").insert(toInsert);
  }
}

export async function createBooking(raw: unknown) {
  const parsed = bookingFormSchema.parse(raw);
  const { supabase, user, profile } = await requireProfile();
  const studioId = profile.studio_id!;

  const insert = await supabase
    .from("bookings")
    .insert({
      studio_id: studioId,
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
    studio_id: studioId,
    booking_id: insert.data.id,
    status: parsed.status,
    from_status: null,
    to_status: parsed.status,
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
  const studioId = profile.studio_id!;

  const existing = await supabase
    .from("bookings")
    .select("status")
    .eq("id", bookingId)
    .eq("studio_id", studioId)
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
    .eq("studio_id", studioId)
    .select("id")
    .single();

  if (update.error || !update.data) {
    throw update.error ?? new Error("Failed to update booking");
  }

  const previous = existing.data.status as BookingStatus;
  if (previous !== parsed.status) {
    await supabase.from("booking_status_history").insert({
      studio_id: studioId,
      booking_id: bookingId,
      status: parsed.status,
      from_status: previous,
      to_status: parsed.status,
      changed_by: user.id,
    });

    if (parsed.status === "paid" && previous !== "paid") {
      const now = new Date();
      const nowIso = now.toISOString();

      const bookingRes = await supabase
        .from("bookings")
        .select(
          "id, studio_id, customer_id, car_id, price_cents, booking_date, services(name), packages(name)",
        )
        .eq("id", bookingId)
        .eq("studio_id", studioId)
        .single();

      if (!bookingRes.error && bookingRes.data) {
        const b: any = bookingRes.data;
        const serviceName = b.services?.name ?? b.packages?.name ?? "Service";

        await ensurePaidSideEffects({
          supabase,
          studioId,
          bookingId,
          customerId: b.customer_id,
          carId: b.car_id,
          priceCents: b.price_cents ?? 0,
          serviceName,
          paidAtIso: nowIso,
        });
      }
    }
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
  const studioId = profile.studio_id!;

  const update = await supabase
    .from("bookings")
    .update({
      car_arrived_at: raw.car_arrived_at ?? null,
      car_ready_at: raw.car_ready_at ?? null,
      car_picked_up_at: raw.car_picked_up_at ?? null,
    })
    .eq("id", bookingId)
    .eq("studio_id", studioId)
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
  const studioId = profile.studio_id!;

  const existing = await supabase
    .from("bookings")
    .select("status, customer_id, car_id, price_cents, services(name), packages(name)")
    .eq("id", bookingId)
    .eq("studio_id", studioId)
    .single();

  if (existing.error || !existing.data) {
    throw existing.error ?? new Error("Booking not found");
  }

  const previous = existing.data.status as BookingStatus;

  const update = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId)
    .eq("studio_id", studioId)
    .select("id")
    .single();

  if (update.error || !update.data) {
    throw update.error ?? new Error("Failed to update status");
  }

  await supabase.from("booking_status_history").insert({
    studio_id: studioId,
    booking_id: bookingId,
    status,
    from_status: previous,
    to_status: status,
    changed_by: user.id,
  });

  if (status === "paid" && previous !== "paid") {
    const now = new Date();
    const nowIso = now.toISOString();
    const b: any = existing.data;
    const serviceName = b.services?.name ?? b.packages?.name ?? "Service";

    await ensurePaidSideEffects({
      supabase,
      studioId,
      bookingId,
      customerId: b.customer_id,
      carId: b.car_id,
      priceCents: b.price_cents ?? 0,
      serviceName,
      paidAtIso: nowIso,
    });
  }

  revalidatePath("/workflow");
  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`);
  revalidatePath("/dashboard");

  return { id: bookingId };
}
