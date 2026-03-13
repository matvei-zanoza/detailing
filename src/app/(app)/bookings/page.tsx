import Link from "next/link";
import { CalendarDays, Filter, Clock, User, Car, DollarSign } from "lucide-react";

import { requireProfile } from "@/lib/auth/require-profile";
import { todayISODate } from "@/lib/time";
import { formatMoneyFromCents, titleCase } from "@/lib/format";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

// Status color mapping
function getStatusStyle(status: string) {
  const styles: Record<string, string> = {
    scheduled: "bg-muted text-muted-foreground",
    arrived: "bg-primary/15 text-primary",
    in_progress: "bg-warning/15 text-warning",
    quality_check: "bg-accent/15 text-accent",
    finished: "bg-success/15 text-success",
    paid: "bg-success/20 text-success",
    cancelled: "bg-destructive/15 text-destructive",
  };
  return styles[status] || "bg-muted text-muted-foreground";
}

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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Bookings</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage appointments, filter by date and status, and create new bookings.
          </p>
        </div>
        <CreateBookingDialog
          customers={customers}
          cars={cars}
          staff={staff}
          services={services}
          packages={packages}
        />
      </div>

      {/* Filter Card */}
      <Card>
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-semibold">Schedule for {date}</CardTitle>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {(bookings.data ?? []).length} bookings
              </span>
            </div>
            <form
              method="get"
              action="/bookings"
              className="flex flex-col gap-2 lg:flex-row lg:items-center"
            >
              <Input
                type="date"
                defaultValue={date}
                name="date"
                className="h-9 bg-muted/30 lg:w-[160px]"
              />
              <select
                name="status"
                defaultValue={status}
                className="h-9 rounded-lg border border-border/50 bg-muted/30 px-3 text-sm transition-colors focus:border-ring focus:bg-muted/50 lg:w-[160px]"
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
                className="h-9 rounded-lg border border-border/50 bg-muted/30 px-3 text-sm transition-colors focus:border-ring focus:bg-muted/50 lg:w-[180px]"
              >
                <option value="all">All staff</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <Button type="submit" variant="secondary" size="sm">
                Apply Filters
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Time
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Customer
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Vehicle
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Service
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Assigned
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Price
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(bookings.data ?? []).map((b: any) => {
                const svcName = b.services?.name ?? b.packages?.name ?? "—";
                return (
                  <TableRow key={b.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/50">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <span className="font-semibold text-foreground">
                          {String(b.start_time).slice(0, 5)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/bookings/${b.id}`}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {b.customers?.display_name ?? "Customer"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Car className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {b.cars?.brand} {b.cars?.model}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-foreground">{svcName}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {b.staff_profiles?.display_name ?? "Unassigned"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getStatusStyle(b.status)}`}
                      >
                        {titleCase(b.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-foreground">
                        {formatMoneyFromCents(b.price_cents ?? 0, currency)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(bookings.data ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
                        <CalendarDays className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">No bookings found</p>
                        <p className="text-sm text-muted-foreground">
                          Try adjusting your filters or create a new booking.
                        </p>
                      </div>
                    </div>
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
