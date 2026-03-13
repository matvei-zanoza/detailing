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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <div className="text-sm text-muted-foreground">
          Simple operational analytics for this studio.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revenue today</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatMoneyFromCents(todayRevenue, currency)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revenue this week</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatMoneyFromCents(weekRevenue, currency)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revenue this month</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatMoneyFromCents(monthRevenue, currency)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Booked → Paid</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{conversion}%</CardContent>
          <div className="px-6 pb-4 text-xs text-muted-foreground">
            {paidCount} paid / {bookingsCount} bookings
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenue (last 7 days)</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <RevenueChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most popular</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {popular.map((p) => (
              <div key={p.key} className="flex items-center justify-between">
                <div className="text-sm font-medium truncate">{p.name}</div>
                <Badge variant="secondary">{p.count}</Badge>
              </div>
            ))}
            {popular.length === 0 && (
              <div className="text-sm text-muted-foreground">No data yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Repeat customers</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {repeatCustomerCount}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Staff workload (month)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {staffWorkload.map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <div className="text-sm font-medium">{s.name}</div>
                <Badge variant={s.jobs >= 12 ? "default" : "secondary"}>{s.jobs} jobs</Badge>
              </div>
            ))}
            {staffWorkload.length === 0 && (
              <div className="text-sm text-muted-foreground">No workload yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
