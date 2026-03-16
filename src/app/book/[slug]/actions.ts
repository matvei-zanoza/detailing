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
  const parsed = publicBookingSchema.parse(raw);

  if (parsed.hp && parsed.hp.trim().length > 0) {
    return { ok: true } as const;
  }

  const OPEN_HOUR = 10;
  const CLOSE_HOUR = 19;

  const startHour = Number(parsed.start_time.slice(0, 2));
  if (Number.isNaN(startHour)) {
    throw new Error("Invalid start time");
  }

  if (startHour < OPEN_HOUR) {
    throw new Error("Studio is closed at that time");
  }

  const endTime = addHoursToTime(parsed.start_time, parsed.duration_hours);
  const endHour = Number(endTime.slice(0, 2));
  const endMinute = Number(endTime.slice(3, 5));

  if (endHour > CLOSE_HOUR || (endHour === CLOSE_HOUR && endMinute > 0)) {
    throw new Error("Selected window exceeds closing time");
  }

  const supabase = createSupabaseAdminClient();

  const studioRes = await supabase
    .from("studios")
    .select("id")
    .eq("slug", parsed.studio_slug)
    .maybeSingle();

  if (studioRes.error || !studioRes.data) {
    throw studioRes.error ?? new Error("Studio not found");
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
      throw serviceRes.error ?? new Error("Service not found");
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
      throw packageRes.error ?? new Error("Package not found");
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
    throw customerInsert.error ?? new Error("Failed to create customer");
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
    throw carInsert.error ?? new Error("Failed to create car");
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
    throw bookingInsert.error ?? new Error("Failed to create booking");
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
    throw reqInsert.error ?? new Error("Failed to create request");
  }

  revalidatePath("/incoming");

  return { ok: true, bookingId, requestId: reqInsert.data.id as string } as const;
}
