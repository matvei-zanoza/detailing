import Link from "next/link";

import { requireProfile } from "@/lib/auth/require-profile";
import { formatMoneyFromCents, titleCase } from "@/lib/format";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { BookingForm } from "../booking-form";
import { updateBooking } from "../actions";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, profile } = await requireProfile();

  const [studioRes, bookingRes, customersRes, carsRes, staffRes, servicesRes, packagesRes, historyRes] =
    await Promise.all([
      supabase
        .from("studios")
        .select("currency")
        .eq("id", profile.studio_id)
        .single(),
      supabase
        .from("bookings")
        .select(
          "id, studio_id, customer_id, car_id, service_id, package_id, staff_id, booking_date, start_time, end_time, status, price_cents, notes, customers(display_name), cars(brand, model), staff_profiles(display_name), services(name), packages(name)",
        )
        .eq("studio_id", profile.studio_id)
        .eq("id", id)
        .single(),
      supabase
        .from("customers")
        .select("id, display_name")
        .eq("studio_id", profile.studio_id)
        .order("display_name", { ascending: true }),
      supabase
        .from("cars")
        .select("id, customer_id, brand, model, year, color")
        .eq("studio_id", profile.studio_id)
        .order("created_at", { ascending: false }),
      supabase
        .from("staff_profiles")
        .select("id, display_name")
        .eq("studio_id", profile.studio_id)
        .eq("is_active", true)
        .order("display_name", { ascending: true }),
      supabase
        .from("services")
        .select("id, name")
        .eq("studio_id", profile.studio_id)
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase
        .from("packages")
        .select("id, name")
        .eq("studio_id", profile.studio_id)
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase
        .from("booking_status_history")
        .select("id, status, changed_at")
        .eq("studio_id", profile.studio_id)
        .eq("booking_id", id)
        .order("changed_at", { ascending: false })
        .limit(12),
    ]);

  if (bookingRes.error || !bookingRes.data) {
    throw bookingRes.error ?? new Error("Booking not found");
  }

  const currency = studioRes.data?.currency ?? "USD";

  const booking = {
    ...bookingRes.data,
    customers: one(bookingRes.data.customers),
    cars: one(bookingRes.data.cars),
    staff_profiles: one(bookingRes.data.staff_profiles),
    services: one(bookingRes.data.services),
    packages: one(bookingRes.data.packages),
  } as any;

  const customers = (customersRes.data ?? []).map((c) => ({ id: c.id, label: c.display_name }));
  const cars = (carsRes.data ?? []).map((c) => ({
    id: c.id,
    customer_id: c.customer_id,
    label: `${c.brand} ${c.model} • ${c.year} • ${c.color}`,
  }));
  const staff = (staffRes.data ?? []).map((s) => ({ id: s.id, label: s.display_name }));
  const services = (servicesRes.data ?? []).map((s) => ({ id: s.id, label: s.name }));
  const packages = (packagesRes.data ?? []).map((p) => ({ id: p.id, label: p.name }));

  const item_type = booking.package_id ? "package" : "service";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm text-muted-foreground">
            <Link href="/bookings" className="hover:underline">
              Bookings
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{booking.customers?.display_name ?? "Booking"}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Booking details</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{titleCase(booking.status)}</Badge>
          <Button asChild variant="outline">
            <Link href="/workflow">Open workflow</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Edit booking</CardTitle>
          </CardHeader>
          <CardContent>
            <BookingForm
              mode="edit"
              bookingId={id}
              customers={customers}
              cars={cars}
              staff={staff}
              services={services}
              packages={packages}
              initialValues={{
                customer_id: booking.customer_id,
                car_id: booking.car_id,
                item_type,
                service_id: booking.service_id,
                package_id: booking.package_id,
                staff_id: booking.staff_id,
                booking_date: booking.booking_date,
                start_time: String(booking.start_time).slice(0, 5),
                end_time: booking.end_time ? String(booking.end_time).slice(0, 5) : null,
                status: booking.status,
                price: (booking.price_cents ?? 0) / 100,
                notes: booking.notes,
              }}
              onSubmitAction={async (values) => updateBooking(id, values)}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <div className="text-muted-foreground">When</div>
                <div className="font-medium">
                  {booking.booking_date} • {String(booking.start_time).slice(0, 5)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-muted-foreground">Car</div>
                <div className="font-medium">
                  {booking.cars?.brand} {booking.cars?.model}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-muted-foreground">Service</div>
                <div className="font-medium">
                  {booking.services?.name ?? booking.packages?.name ?? "—"}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-muted-foreground">Assigned</div>
                <div className="font-medium">
                  {booking.staff_profiles?.display_name ?? "Unassigned"}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-muted-foreground">Price</div>
                <div className="font-medium">
                  {formatMoneyFromCents(booking.price_cents ?? 0, currency)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(historyRes.data ?? []).map((h: any) => (
                <div key={h.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div className="text-sm font-medium">{titleCase(h.status)}</div>
                  <div className="text-xs text-muted-foreground">
                    {String(h.changed_at).replace("T", " ").slice(0, 16)}
                  </div>
                </div>
              ))}
              {(historyRes.data ?? []).length === 0 && (
                <div className="text-sm text-muted-foreground">No history yet.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
