import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Users,
  CalendarDays,
  Star,
  Briefcase,
  ArrowUpRight,
  Repeat,
} from "lucide-react";

import { requireProfile } from "@/lib/auth/require-profile";
import { todayISODate, monthStartISODate } from "@/lib/time";
import { formatMoneyFromCents } from "@/lib/format";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RevenueChart } from "./revenue-chart";

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function AnalyticsPage() {
  const { supabase, profile } = await requireProfile();

  const today = todayISODate();
  const monthStart = monthStartISODate();

  const { data: studio } = await supabase
    .from("studios")
    .select("currency")
    .eq("id", profile.studio_id)
    .single();

  const currency = studio?.currency ?? "USD";

  const paymentsMonth = await supabase
    .from("payments")
    .select("amount_cents, paid_at, booking_id")
    .eq("studio_id", profile.studio_id)
    .gte("paid_at", `${monthStart}T00:00:00.000Z`)
    .order("paid_at", { ascending: true });

  const monthRevenue = (paymentsMonth.data ?? []).reduce(
    (sum, p) => sum + (p.amount_cents ?? 0),
    0,
  );

  const paymentsToday = (paymentsMonth.data ?? []).filter((p) =>
    String(p.paid_at).startsWith(today),
  );

  const todayRevenue = paymentsToday.reduce(
    (sum, p) => sum + (p.amount_cents ?? 0),
    0,
  );

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  const paymentsWeek = (paymentsMonth.data ?? []).filter(
    (p) => new Date(p.paid_at).getTime() >= weekStart.getTime(),
  );

  const weekRevenue = paymentsWeek.reduce(
    (sum, p) => sum + (p.amount_cents ?? 0),
    0,
  );

  const bookingsMonth = await supabase
    .from("bookings")
    .select("id, booking_date, status, service_id, package_id")
    .eq("studio_id", profile.studio_id)
    .gte("booking_date", monthStart);

  const bookingsCount = (bookingsMonth.data ?? []).length;
  const paidCount = (bookingsMonth.data ?? []).filter((b) => b.status === "paid")
    .length;
  const conversion = bookingsCount ? Math.round((paidCount / bookingsCount) * 100) : 0;

  const repeatTagRes = await supabase
    .from("customer_tags")
    .select("id")
    .eq("studio_id", profile.studio_id)
    .eq("name", "repeat")
    .maybeSingle();

  const repeatAssignmentsRes = repeatTagRes.data?.id
    ? await supabase
        .from("customer_tag_assignments")
        .select("customer_id")
        .eq("studio_id", profile.studio_id)
        .eq("tag_id", repeatTagRes.data.id)
        .limit(2000)
    : { data: [] as { customer_id: string }[] };

  const repeatCustomerCount = new Set(
    (repeatAssignmentsRes.data ?? []).map((r) => r.customer_id),
  ).size;

  const byDay = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    byDay.set(iso(d), 0);
  }
  for (const p of paymentsWeek) {
    const key = String(p.paid_at).slice(0, 10);
    if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + (p.amount_cents ?? 0));
  }

  const chartData = Array.from(byDay.entries()).map(([date, cents]) => ({
    date: date.slice(5),
    revenue: Math.round(cents / 100),
  }));

  const servicePopularity = new Map<string, number>();
  for (const b of bookingsMonth.data ?? []) {
    const k = b.service_id ? `service:${b.service_id}` : b.package_id ? `package:${b.package_id}` : "unknown";
    servicePopularity.set(k, (servicePopularity.get(k) ?? 0) + 1);
  }

  const [servicesRes, packagesRes] = await Promise.all([
    supabase
      .from("services")
      .select("id, name")
      .eq("studio_id", profile.studio_id),
    supabase
      .from("packages")
      .select("id, name")
      .eq("studio_id", profile.studio_id),
  ]);

  const nameByKey = new Map<string, string>();
  for (const s of servicesRes.data ?? []) nameByKey.set(`service:${s.id}`, s.name);
  for (const p of packagesRes.data ?? []) nameByKey.set(`package:${p.id}`, p.name);

  const popular = Array.from(servicePopularity.entries())
    .map(([k, v]) => ({
      key: k,
      name: nameByKey.get(k) ?? "—",
      count: v,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const staffLoad = await supabase
    .from("bookings")
    .select("staff_id")
    .eq("studio_id", profile.studio_id)
    .gte("booking_date", monthStart)
    .neq("status", "cancelled");

  const staffIds = (staffLoad.data ?? []).map((b) => b.staff_id).filter(Boolean) as string[];

  const staffRes = await supabase
    .from("staff_profiles")
    .select("id, display_name")
    .eq("studio_id", profile.studio_id)
    .eq("is_active", true);

  const staffWorkload = (staffRes.data ?? [])
    .map((s) => ({
      id: s.id,
      name: s.display_name,
      jobs: staffIds.filter((x) => x === s.id).length,
    }))
    .sort((a, b) => b.jobs - a.jobs)
    .slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Analytics</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Performance metrics and operational insights for your studio.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/50 px-3 py-1.5">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Period:</span>
          <span className="text-sm font-medium text-foreground">{monthStart} to {today}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue Today
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10">
              <DollarSign className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-foreground">
              {formatMoneyFromCents(todayRevenue, currency)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Collected payments</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Weekly Revenue
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-foreground">
              {formatMoneyFromCents(weekRevenue, currency)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Revenue
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
              <BarChart3 className="h-4 w-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-foreground">
              {formatMoneyFromCents(monthRevenue, currency)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">This month to date</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversion Rate
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10">
              <ArrowUpRight className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-foreground">{conversion}%</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {paidCount} paid / {bookingsCount} booked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Revenue Trend</CardTitle>
                <p className="text-sm text-muted-foreground">Last 7 days performance</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-1.5">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">
                  {formatMoneyFromCents(weekRevenue, currency)}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            <RevenueChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-warning" />
              <CardTitle className="text-base font-semibold">Popular Services</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {popular.map((p, i) => (
              <div
                key={p.key}
                className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-foreground line-clamp-1">{p.name}</span>
                </div>
                <Badge variant="secondary" className="font-semibold">
                  {p.count}
                </Badge>
              </div>
            ))}
            {popular.length === 0 && (
              <div className="py-4 text-center text-sm text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-accent" />
              <CardTitle className="text-base font-semibold">Repeat Customers</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-accent/10">
                <Users className="h-8 w-8 text-accent" />
              </div>
              <div>
                <div className="text-4xl font-bold text-foreground">{repeatCustomerCount}</div>
                <p className="text-sm text-muted-foreground">Loyal clients who returned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-semibold">Staff Performance (This Month)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {staffWorkload.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {s.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-foreground">{s.name}</span>
                  </div>
                  <Badge variant={s.jobs >= 12 ? "default" : "secondary"} className="font-semibold">
                    {s.jobs}
                  </Badge>
                </div>
              ))}
              {staffWorkload.length === 0 && (
                <div className="col-span-full py-4 text-center text-sm text-muted-foreground">
                  No workload data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
