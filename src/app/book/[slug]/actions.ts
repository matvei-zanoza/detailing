"use server";

import { revalidatePath } from "next/cache";

import { publicBookingSchema } from "@/lib/schemas/public-booking";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function addHoursToTime(start: string, hours: number) {
  const [hh, mm] = start.split(":").map((x) => Number(x));
  const total = hh * 60 + mm + hours * 60;
  const outH = Math.floor(total / 60);
  const outM = total % 60;
  return `${String(outH).padStart(2, "0")}:${String(outM).padStart(2, "0")}`;
}

function toTimeWithSeconds(t: string) {
  return `${t}:00`;
}

export async function createPublicBooking(raw: unknown) {
  const parsedRes = publicBookingSchema.safeParse(raw);
  if (!parsedRes.success) {
    return {
      ok: false,
      error: parsedRes.error.issues[0]?.message ?? "Invalid input",
    } as const;
  }

  const parsed = parsedRes.data;

  if (parsed.hp && parsed.hp.trim().length > 0) {
    return { ok: true } as const;
  }

  const OPEN_HOUR = 10;
  const CLOSE_HOUR = 19;

  const startHour = Number(parsed.start_time.slice(0, 2));
  const startMinute = Number(parsed.start_time.slice(3, 5));
  if (Number.isNaN(startHour)) {
    return { ok: false, error: "Invalid start time" } as const;
  }

  if (startMinute !== 0) {
    return { ok: false, error: "Start time must be on the hour" } as const;
  }

  if (startHour < OPEN_HOUR) {
    return { ok: false, error: "Studio is closed at that time" } as const;
  }

  const endTime = addHoursToTime(parsed.start_time, parsed.duration_hours);
  const endHour = Number(endTime.slice(0, 2));
  const endMinute = Number(endTime.slice(3, 5));

  if (endHour > CLOSE_HOUR || (endHour === CLOSE_HOUR && endMinute > 0)) {
    return { ok: false, error: "Selected window exceeds closing time" } as const;
  }

  const supabase = createSupabaseAdminClient();

  const studioRes = await supabase
    .from("studios")
    .select("id")
    .eq("slug", parsed.studio_slug)
    .maybeSingle();

  if (studioRes.error || !studioRes.data) {
    return { ok: false, error: "Studio not found" } as const;
  }

  const studioId = studioRes.data.id as string;

  let priceCents = 0;
  if (parsed.item_type === "service") {
    const serviceRes = await supabase
      .from("services")
      .select("id, base_price_cents")
      .eq("studio_id", studioId)
      .eq("id", parsed.service_id!)
      .eq("is_active", true)
      .maybeSingle();

    if (serviceRes.error || !serviceRes.data) {
      return { ok: false, error: "Service not found" } as const;
    }

    priceCents = serviceRes.data.base_price_cents ?? 0;
  } else {
    const packageRes = await supabase
      .from("packages")
      .select("id, base_price_cents")
      .eq("studio_id", studioId)
      .eq("id", parsed.package_id!)
      .eq("is_active", true)
      .maybeSingle();

    if (packageRes.error || !packageRes.data) {
      return { ok: false, error: "Package not found" } as const;
    }

    priceCents = packageRes.data.base_price_cents ?? 0;
  }

  const customerInsert = await supabase
    .from("customers")
    .insert({
      studio_id: studioId,
      display_name: parsed.customer_name,
      email: parsed.customer_email ?? null,
      phone: parsed.customer_phone,
      notes: null,
    })
    .select("id")
    .single();

  if (customerInsert.error || !customerInsert.data) {
    return {
      ok: false,
      error: customerInsert.error?.message ?? "Failed to create customer",
    } as const;
  }

  const customerId = customerInsert.data.id as string;

  const carInsert = await supabase
    .from("cars")
    .insert({
      studio_id: studioId,
      customer_id: customerId,
      brand: parsed.car_brand ?? "Unknown",
      model: parsed.car_model ?? "Unknown",
      year: new Date().getFullYear(),
      color: "Unknown",
      license_plate: "UNKNOWN",
      category: "sedan",
    })
    .select("id")
    .single();

  if (carInsert.error || !carInsert.data) {
    return {
      ok: false,
      error: carInsert.error?.message ?? "Failed to create car",
    } as const;
  }

  const carId = carInsert.data.id as string;

  const bookingInsert = await supabase
    .from("bookings")
    .insert({
      studio_id: studioId,
      customer_id: customerId,
      car_id: carId,
      service_id: parsed.item_type === "service" ? parsed.service_id : null,
      package_id: parsed.item_type === "package" ? parsed.package_id : null,
      staff_id: null,
      booking_date: parsed.booking_date,
      start_time: toTimeWithSeconds(parsed.start_time),
      end_time: toTimeWithSeconds(endTime),
      status: "booked",
      price_cents: priceCents,
      notes: parsed.notes ?? null,
    })
    .select("id")
    .single();

  if (bookingInsert.error || !bookingInsert.data) {
    return {
      ok: false,
      error: bookingInsert.error?.message ?? "Failed to create booking",
    } as const;
  }

  const bookingId = bookingInsert.data.id as string;

  await supabase.from("booking_status_history").insert({
    studio_id: studioId,
    booking_id: bookingId,
    status: "booked",
    changed_by: null,
  });

  const reqInsert = await supabase
    .from("booking_requests")
    .insert({
      studio_id: studioId,
      booking_id: bookingId,
      status: "new",
      customer_name: parsed.customer_name,
      customer_phone: parsed.customer_phone,
      customer_email: parsed.customer_email ?? null,
      car_brand: parsed.car_brand ?? null,
      car_model: parsed.car_model ?? null,
      booking_date: parsed.booking_date,
      start_time: toTimeWithSeconds(parsed.start_time),
      end_time: toTimeWithSeconds(endTime),
      item_type: parsed.item_type,
      service_id: parsed.item_type === "service" ? parsed.service_id : null,
      package_id: parsed.item_type === "package" ? parsed.package_id : null,
      notes: parsed.notes ?? null,
      acknowledged_at: null,
      acknowledged_by: null,
    })
    .select("id")
    .single();

  if (reqInsert.error || !reqInsert.data) {
    return {
      ok: false,
      error: reqInsert.error?.message ?? "Failed to create request",
    } as const;
  }

  revalidatePath("/incoming");

  return { ok: true, bookingId, requestId: reqInsert.data.id as string } as const;
}
