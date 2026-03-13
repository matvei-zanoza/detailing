import Link from "next/link";

import { requireProfile } from "@/lib/auth/require-profile";
import { todayISODate, monthStartISODate } from "@/lib/time";
import { formatMoneyFromCents, titleCase } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function DashboardPage() {
  const { supabase, profile } = await requireProfile();

  const today = todayISODate();
  const monthStart = monthStartISODate();

  const { data: studio } = await supabase
    .from("studios")
    .select("name, currency")
    .eq("id", profile.studio_id)
    .single();

  const currency = studio?.currency ?? "USD";

  const [{ count: bookingsTodayCount }, { count: inProgressCount }, { count: completedTodayCount }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("studio_id", profile.studio_id)
        .eq("booking_date", today),
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("studio_id", profile.studio_id)
        .in("status", ["in_progress", "quality_check"]),
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("studio_id", profile.studio_id)
        .eq("booking_date", today)
        .in("status", ["finished", "paid"]),
    ]);

  const paymentsToday = await supabase
    .from("payments")
    .select("amount_cents, paid_at")
    .eq("studio_id", profile.studio_id)
    .gte("paid_at", `${today}T00:00:00.000Z`)
    .lt("paid_at", `${today}T23:59:59.999Z`);

  const revenueTodayCents = (paymentsToday.data ?? []).reduce(
    (sum, p) => sum + (p.amount_cents ?? 0),
    0,
  );

  const paymentsMonth = await supabase
    .from("payments")
    .select("amount_cents, paid_at")
    .eq("studio_id", profile.studio_id)
    .gte("paid_at", `${monthStart}T00:00:00.000Z`);

  const revenueMonthCents = (paymentsMonth.data ?? []).reduce(
    (sum, p) => sum + (p.amount_cents ?? 0),
    0,
  );

  const nextBookings = await supabase
    .from("bookings")
    .select(
      "id, booking_date, start_time, status, price_cents, customers(display_name), cars(brand, model), staff_profiles(display_name), services(name), packages(name)",
    )
    .eq("studio_id", profile.studio_id)
    .gte("booking_date", today)
    .order("booking_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(6);

  const staffLoad = await supabase
    .from("bookings")
    .select("staff_id")
    .eq("studio_id", profile.studio_id)
    .eq("booking_date", today)
    .in("status", ["arrived", "in_progress", "quality_check", "finished"]);

  const staffIds = (staffLoad.data ?? []).map((b) => b.staff_id).filter(Boolean) as string[];

  const staffRows = await supabase
    .from("staff_profiles")
    .select("id, display_name")
    .eq("studio_id", profile.studio_id)
    .eq("is_active", true)
    .order("display_name", { ascending: true });

  const staffWorkload = (staffRows.data ?? [])
    .map((s) => ({
      id: s.id,
      display_name: s.display_name,
      jobs: staffIds.filter((x) => x === s.id).length,
    }))
    .sort((a, b) => b.jobs - a.jobs)
    .slice(0, 6);

  const recentCustomers = await supabase
    .from("customers")
    .select("id, display_name, created_at")
    .eq("studio_id", profile.studio_id)
    .order("created_at", { ascending: false })
    .limit(6);

  const recentUpdates = await supabase
    .from("booking_status_history")
    .select(
      "id, status, changed_at, bookings(id, customers(display_name), cars(brand, model), services(name), packages(name))",
    )
    .eq("studio_id", profile.studio_id)
    .order("changed_at", { ascending: false })
    .limit(8);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Today</div>
          <h1 className="text-2xl font-semibold tracking-tight">{studio?.name ?? "Dashboard"}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="default">
            <Link href="/bookings">Create booking</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/workflow">Open workflow board</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bookings today</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{bookingsTodayCount ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cars in progress</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{inProgressCount ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed today</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{completedTodayCount ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revenue (today)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatMoneyFromCents(revenueTodayCents, currency)}
          </CardContent>
          <div className="px-6 pb-4 text-xs text-muted-foreground">
            Month: {formatMoneyFromCents(revenueMonthCents, currency)}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Next bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Car</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(nextBookings.data ?? []).map((b: any) => {
                  const svcName = b.services?.name ?? b.packages?.name ?? "—";
                  const staffName = b.staff_profiles?.display_name ?? "Unassigned";
                  return (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div className="font-medium">{b.booking_date}</div>
                        <div className="text-xs text-muted-foreground">{String(b.start_time).slice(0, 5)}</div>
                      </TableCell>
                      <TableCell>
                        <Link className="font-medium hover:underline" href={`/bookings/${b.id}`}>
                          {b.customers?.display_name ?? "Customer"}
                        </Link>
                        <div className="mt-1">
                          <Badge variant="secondary">{titleCase(b.status)}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {b.cars?.brand} {b.cars?.model}
                      </TableCell>
                      <TableCell>{svcName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{staffName}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoneyFromCents(b.price_cents ?? 0, currency)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(nextBookings.data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      No upcoming bookings yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active staff workload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {staffWorkload.map((s) => (
                <div key={s.id} className="flex items-center justify-between">
                  <div className="text-sm font-medium">{s.display_name}</div>
                  <Badge variant={s.jobs >= 4 ? "default" : "secondary"}>{s.jobs} jobs</Badge>
                </div>
              ))}
              {staffWorkload.length === 0 && (
                <div className="text-sm text-muted-foreground">No assignments today.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent customers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(recentCustomers.data ?? []).map((c: any) => (
                <Link
                  key={c.id}
                  href={`/customers/${c.id}`}
                  className="block rounded-md border px-3 py-2 hover:bg-muted"
                >
                  <div className="text-sm font-medium">{c.display_name}</div>
                  <div className="text-xs text-muted-foreground">Added {String(c.created_at).slice(0, 10)}</div>
                </Link>
              ))}
              {(recentCustomers.data ?? []).length === 0 && (
                <div className="text-sm text-muted-foreground">No customers yet.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent job updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(recentUpdates.data ?? []).map((u: any) => {
                const booking = u.bookings;
                const customer = booking?.customers?.display_name ?? "Customer";
                const car = booking?.cars ? `${booking.cars.brand} ${booking.cars.model}` : "Car";
                const svc = booking?.services?.name ?? booking?.packages?.name ?? "—";
                return (
                  <div key={u.id} className="rounded-md border px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{customer}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {car} • {svc}
                        </div>
                      </div>
                      <Badge variant="secondary">{titleCase(u.status)}</Badge>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {String(u.changed_at).replace("T", " ").slice(0, 16)}
                    </div>
                  </div>
                );
              })}
              {(recentUpdates.data ?? []).length === 0 && (
                <div className="text-sm text-muted-foreground">No updates yet.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
