import Link from "next/link";
import {
  CalendarDays,
  Car,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  Plus,
  Workflow,
  Users,
  Clock,
  TrendingUp,
  Bell,
} from "lucide-react";

import { requireProfile } from "@/lib/auth/require-profile";
import { todayISODate, monthStartISODate } from "@/lib/time";
import { formatMoneyFromCents, titleCase } from "@/lib/format";
import { getStatusStyle } from "@/lib/status";
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
  const studioId = profile.studio_id!;

  const today = todayISODate();
  const monthStart = monthStartISODate();
  const nowIso = new Date().toISOString();

  const { data: studio } = await supabase
    .from("studios")
    .select("name, currency")
    .eq("id", studioId)
    .single();

  const currency = studio?.currency ?? "USD";

  const [{ count: bookingsTodayCount }, { count: inProgressCount }, { count: completedTodayCount }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("studio_id", studioId)
        .eq("booking_date", today),
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("studio_id", studioId)
        .in("status", ["in_progress", "quality_check"]),
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("studio_id", studioId)
        .eq("booking_date", today)
        .in("status", ["finished", "paid"]),
    ]);

  const { count: readyCount } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("studio_id", studioId)
    .eq("booking_date", today)
    .eq("status", "finished");

  const paymentsToday = await supabase
    .from("payments")
    .select("amount_cents, paid_at")
    .eq("studio_id", studioId)
    .eq("status", "paid")
    .gte("paid_at", `${today}T00:00:00.000Z`)
    .lt("paid_at", `${today}T23:59:59.999Z`);

  const revenueTodayCents = (paymentsToday.data ?? []).reduce(
    (sum, p) => sum + (p.amount_cents ?? 0),
    0,
  );

  const paymentsMonth = await supabase
    .from("payments")
    .select("amount_cents, paid_at")
    .eq("studio_id", studioId)
    .eq("status", "paid")
    .gte("paid_at", `${monthStart}T00:00:00.000Z`);

  const [{ count: followUpsDueCount }, { data: followUpsDue }] = await Promise.all([
    supabase
      .from("follow_up_tasks")
      .select("id", { count: "exact", head: true })
      .eq("studio_id", studioId)
      .eq("status", "pending")
      .lte("scheduled_for", nowIso),
    supabase
      .from("follow_up_tasks")
      .select(
        "id, type, scheduled_for, customers(display_name), cars(brand, model)",
      )
      .eq("studio_id", studioId)
      .eq("status", "pending")
      .order("scheduled_for", { ascending: true })
      .limit(6),
  ]);

  const revenueMonthCents = (paymentsMonth.data ?? []).reduce(
    (sum, p) => sum + (p.amount_cents ?? 0),
    0,
  );

  const nextBookings = await supabase
    .from("bookings")
    .select(
      "id, booking_date, start_time, status, price_cents, customers(display_name), cars(brand, model), staff_profiles(display_name), services(name), packages(name)",
    )
    .eq("studio_id", studioId)
    .gte("booking_date", today)
    .order("booking_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(6);

  const staffLoad = await supabase
    .from("bookings")
    .select("staff_id")
    .eq("studio_id", studioId)
    .eq("booking_date", today)
    .in("status", ["arrived", "in_progress", "quality_check", "finished"]);

  const staffIds = (staffLoad.data ?? []).map((b) => b.staff_id).filter(Boolean) as string[];

  const staffRows = await supabase
    .from("staff_profiles")
    .select("id, display_name")
    .eq("studio_id", studioId)
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
    .eq("studio_id", studioId)
    .order("created_at", { ascending: false })
    .limit(6);

  const recentUpdates = await supabase
    .from("booking_status_history")
    .select(
      "id, status, changed_at, bookings(id, customers(display_name), cars(brand, model), services(name), packages(name))",
    )
    .eq("studio_id", studioId)
    .order("changed_at", { ascending: false })
    .limit(8);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Today</span>
            <span className="text-sm text-muted-foreground/50">/</span>
            <span className="text-sm font-medium text-foreground">{today}</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {studio?.name ?? "Dashboard"}
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/bookings">
              <Plus className="mr-2 h-4 w-4" />
              New Booking
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/workflow">
              <Workflow className="mr-2 h-4 w-4" />
              Workflow Board
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bookings Today
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <CalendarDays className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-foreground">{bookingsTodayCount ?? 0}</div>
            <p className="mt-1 text-xs text-muted-foreground">Scheduled for today</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
              <Car className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-foreground">{inProgressCount ?? 0}</div>
            <p className="mt-1 text-xs text-muted-foreground">Cars being detailed</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Today
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-foreground">{completedTodayCount ?? 0}</div>
            <p className="mt-1 text-xs text-muted-foreground">Jobs finished</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue Today
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
              <DollarSign className="h-4 w-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-foreground">
              {formatMoneyFromCents(revenueTodayCents, currency)}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Month: {formatMoneyFromCents(revenueMonthCents, currency)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ready
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-foreground">{readyCount ?? 0}</div>
            <p className="mt-1 text-xs text-muted-foreground">Finished, waiting for payment/pickup</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Follow-ups Due
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
              <Bell className="h-4 w-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-foreground">{followUpsDueCount ?? 0}</div>
            <p className="mt-1 text-xs text-muted-foreground">Messages ready to send</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bookings Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Upcoming Bookings</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Next scheduled appointments</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/bookings" className="gap-1">
                View all
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    When
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
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Price
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(nextBookings.data ?? []).map((b: any) => {
                  const svcName = b.services?.name ?? b.packages?.name ?? "—";
                  return (
                    <TableRow key={b.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/50">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{b.booking_date}</div>
                            <div className="text-xs text-muted-foreground">
                              {String(b.start_time).slice(0, 5)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          className="font-medium text-foreground hover:text-primary hover:underline"
                          href={`/bookings/${b.id}`}
                        >
                          {b.customers?.display_name ?? "Customer"}
                        </Link>
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusStyle(b.status)}`}
                          >
                            {titleCase(b.status)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {b.cars?.brand} {b.cars?.model}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">{svcName}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-foreground">
                          {formatMoneyFromCents(b.price_cents ?? 0, currency)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(nextBookings.data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <CalendarDays className="h-8 w-8 text-muted-foreground/50" />
                        <span className="text-sm text-muted-foreground">No upcoming bookings</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Follow-ups Due</CardTitle>
                <p className="text-xs text-muted-foreground">Scheduled for now or overdue</p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/follow-ups" className="gap-1">
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {(followUpsDue ?? []).map((t: any) => {
                const customer = t.customers?.display_name ?? "Customer";
                const carLabel = t.cars ? `${t.cars.brand} ${t.cars.model}` : "Car";
                const type = t.type ? titleCase(String(t.type).replace("_", " ")) : "Follow-up";
                return (
                  <Link
                    key={t.id}
                    href="/follow-ups"
                    className="block rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 transition-colors hover:border-border hover:bg-muted/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-foreground">{customer}</div>
                        <div className="truncate text-xs text-muted-foreground">{carLabel}</div>
                      </div>
                      <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                        {type}
                      </span>
                    </div>
                    <div className="mt-1.5 text-[10px] text-muted-foreground/70">
                      {String(t.scheduled_for).replace("T", " ").slice(0, 16)}
                    </div>
                  </Link>
                );
              })}
              {(followUpsDue ?? []).length === 0 && (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  Nothing due right now
                </div>
              )}
            </CardContent>
          </Card>
          {/* Staff Workload */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Staff Workload</CardTitle>
                <p className="text-xs text-muted-foreground">Active assignments today</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {staffWorkload.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                  <span className="text-sm font-medium text-foreground">{s.display_name}</span>
                  <Badge
                    variant={s.jobs >= 4 ? "default" : "secondary"}
                    className="font-semibold"
                  >
                    {s.jobs} jobs
                  </Badge>
                </div>
              ))}
              {staffWorkload.length === 0 && (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No assignments today
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Customers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Recent Customers</CardTitle>
                <p className="text-xs text-muted-foreground">Newly added</p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/customers" className="gap-1">
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {(recentCustomers.data ?? []).map((c: any) => (
                <Link
                  key={c.id}
                  href={`/customers/${c.id}`}
                  className="block rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 transition-colors hover:border-border hover:bg-muted/40"
                >
                  <div className="font-medium text-foreground">{c.display_name}</div>
                  <div className="text-xs text-muted-foreground">
                    Added {String(c.created_at).slice(0, 10)}
                  </div>
                </Link>
              ))}
              {(recentCustomers.data ?? []).length === 0 && (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No customers yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              <p className="text-xs text-muted-foreground">Latest job updates</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {(recentUpdates.data ?? []).map((u: any) => {
                const booking = u.bookings;
                const customer = booking?.customers?.display_name ?? "Customer";
                const car = booking?.cars ? `${booking.cars.brand} ${booking.cars.model}` : "Car";
                const svc = booking?.services?.name ?? booking?.packages?.name ?? "—";
                return (
                  <div
                    key={u.id}
                    className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-foreground">
                          {customer}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {car} / {svc}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusStyle(u.status)}`}
                      >
                        {titleCase(u.status)}
                      </span>
                    </div>
                    <div className="mt-1.5 text-[10px] text-muted-foreground/70">
                      {String(u.changed_at).replace("T", " ").slice(0, 16)}
                    </div>
                  </div>
                );
              })}
              {(recentUpdates.data ?? []).length === 0 && (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No updates yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
