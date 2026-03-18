import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Car, DollarSign, User, History, Workflow } from "lucide-react";

import { requireProfile } from "@/lib/auth/require-profile";
import { formatMoneyFromCents, titleCase } from "@/lib/format";
import { getStatusStyle } from "@/lib/status";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { BookingForm } from "../booking-form";
import { CarTimesForm } from "../car-times-form";
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
          "id, studio_id, customer_id, car_id, service_id, package_id, staff_id, booking_date, start_time, end_time, status, price_cents, notes, car_arrived_at, car_ready_at, car_picked_up_at, customers(display_name), cars(brand, model), staff_profiles(display_name), services(name), packages(name)",
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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/bookings"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Bookings
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <span className="font-medium text-foreground">
              {booking.customers?.display_name ?? "Booking"}
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Booking Details
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusStyle(booking.status)}`}
          >
            {titleCase(booking.status)}
          </span>
          <Button asChild variant="outline">
            <Link href="/workflow">
              <Workflow className="mr-2 h-4 w-4" />
              Workflow
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-lg font-semibold">Edit Booking</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
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
              submitAction={updateBooking.bind(null, id) as any}
            />
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-base font-semibold">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                  <CalendarDays className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">When</div>
                  <div className="font-medium text-foreground">
                    {booking.booking_date} at {String(booking.start_time).slice(0, 5)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                  <Car className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Vehicle</div>
                  <div className="font-medium text-foreground">
                    {booking.cars?.brand} {booking.cars?.model}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Assigned To</div>
                  <div className="font-medium text-foreground">
                    {booking.staff_profiles?.display_name ?? "Unassigned"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/10">
                  <DollarSign className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Price</div>
                  <div className="text-lg font-bold text-foreground">
                    {formatMoneyFromCents(booking.price_cents ?? 0, currency)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-base font-semibold">Car Times</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <CarTimesForm
                bookingId={id}
                initialValues={{
                  car_arrived_at: booking.car_arrived_at ?? null,
                  car_ready_at: booking.car_ready_at ?? null,
                  car_picked_up_at: booking.car_picked_up_at ?? null,
                }}
              />
            </CardContent>
          </Card>

          {/* Status History */}
          <Card>
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base font-semibold">Status History</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              {(historyRes.data ?? []).map((h: any) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2"
                >
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusStyle(h.status)}`}
                  >
                    {titleCase(h.status)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {String(h.changed_at).replace("T", " ").slice(0, 16)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
