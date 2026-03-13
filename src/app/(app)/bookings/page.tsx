import Link from "next/link";

import { requireProfile } from "@/lib/auth/require-profile";
import { todayISODate } from "@/lib/time";
import { formatMoneyFromCents, titleCase } from "@/lib/format";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { BOOKING_STATUSES } from "@/lib/domain/booking";
import { CreateBookingDialog } from "./create-booking-dialog";

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { supabase, profile } = await requireProfile();
  const sp = await searchParams;

  const date = (typeof sp.date === "string" ? sp.date : null) ?? todayISODate();
  const status = typeof sp.status === "string" ? sp.status : "all";
  const staffId = typeof sp.staff === "string" ? sp.staff : "all";

  const [studioRes, customersRes, carsRes, staffRes, servicesRes, packagesRes] =
    await Promise.all([
      supabase
        .from("studios")
        .select("currency")
        .eq("id", profile.studio_id)
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
    ]);

  const currency = studioRes.data?.currency ?? "USD";

  let query = supabase
    .from("bookings")
    .select(
      "id, booking_date, start_time, status, price_cents, customers(display_name), cars(brand, model), staff_profiles(display_name), services(name), packages(name)",
    )
    .eq("studio_id", profile.studio_id)
    .eq("booking_date", date)
    .order("start_time", { ascending: true });

  if (status !== "all") query = query.eq("status", status);
  if (staffId !== "all") query = query.eq("staff_id", staffId);

  const bookings = await query;

  const customers = (customersRes.data ?? []).map((c) => ({
    id: c.id,
    label: c.display_name,
  }));

  const cars = (carsRes.data ?? []).map((c) => ({
    id: c.id,
    customer_id: c.customer_id,
    label: `${c.brand} ${c.model} • ${c.year} • ${c.color}`,
  }));

  const staff = (staffRes.data ?? []).map((s) => ({ id: s.id, label: s.display_name }));
  const services = (servicesRes.data ?? []).map((s) => ({ id: s.id, label: s.name }));
  const packages = (packagesRes.data ?? []).map((p) => ({ id: p.id, label: p.name }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
          <div className="text-sm text-muted-foreground">
            Filter by date/status and create or edit bookings.
          </div>
        </div>
        <CreateBookingDialog
          customers={customers}
          cars={cars}
          staff={staff}
          services={services}
          packages={packages}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base">Schedule</CardTitle>
          <form
            method="get"
            action="/bookings"
            className="flex flex-col gap-2 md:flex-row md:items-center"
          >
            <Input
              type="date"
              defaultValue={date}
              name="date"
              className="md:w-[170px]"
            />
            <select
              name="status"
              defaultValue={status}
              className="h-10 rounded-md border bg-background px-3 text-sm md:w-[180px]"
            >
              <option value="all">All statuses</option>
              {BOOKING_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </select>
            <select
              name="staff"
              defaultValue={staffId}
              className="h-10 rounded-md border bg-background px-3 text-sm md:w-[220px]"
            >
              <option value="all">All staff</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline">
              Apply
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Car</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(bookings.data ?? []).map((b: any) => {
                const svcName = b.services?.name ?? b.packages?.name ?? "—";
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{String(b.start_time).slice(0, 5)}</TableCell>
                    <TableCell>
                      <Link href={`/bookings/${b.id}`} className="font-medium hover:underline">
                        {b.customers?.display_name ?? "Customer"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {b.cars?.brand} {b.cars?.model}
                    </TableCell>
                    <TableCell>{svcName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {b.staff_profiles?.display_name ?? "Unassigned"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{titleCase(b.status)}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoneyFromCents(b.price_cents ?? 0, currency)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {(bookings.data ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                    No bookings for this filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
