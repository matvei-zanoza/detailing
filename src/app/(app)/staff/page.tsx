import Link from "next/link";
import { Users, Briefcase, CalendarDays, CheckCircle2, ExternalLink } from "lucide-react";

import { requireProfile } from "@/lib/auth/require-profile";
import { todayISODate } from "@/lib/time";
import { one } from "@/lib/supabase/normalize";
import { getStatusStyle } from "@/lib/status";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function StaffPage() {
  const { supabase, profile } = await requireProfile();
  const today = todayISODate();

  const canManage = profile.role === "owner" || profile.role === "manager";

  const [staffRes, todaysBookingsRes] = await Promise.all([
    supabase
      .from("staff_profiles")
      .select("id, user_id, display_name, role, is_active")
      .eq("studio_id", profile.studio_id)
      .order("is_active", { ascending: false })
      .order("display_name", { ascending: true }),
    supabase
      .from("bookings")
      .select(
        "id, staff_id, status, customers(display_name), cars(brand, model), services(name), packages(name)",
      )
      .eq("studio_id", profile.studio_id)
      .eq("booking_date", today)
      .neq("status", "cancelled"),
  ]);

  const staff = staffRes.data ?? [];
  const bookings = todaysBookingsRes.data ?? [];

  const userIds = Array.from(new Set(staff.map((s) => s.user_id as string | null).filter(Boolean))) as string[];
  const roleByUserId = new Map<string, string>();
  if (userIds.length > 0) {
    const membersRes = await supabase.from("user_profiles").select("id, role").in("id", userIds);
    for (const m of membersRes.data ?? []) {
      roleByUserId.set(m.id as string, m.role as string);
    }
  }

  const jobsByStaff = new Map<string, any[]>();
  for (const b of bookings as any[]) {
    if (!b.staff_id) continue;
    const list = jobsByStaff.get(b.staff_id) ?? [];
    list.push(b);
    jobsByStaff.set(b.staff_id, list);
  }

  const staffRows = staff.map((s) => {
    const list = jobsByStaff.get(s.id) ?? [];
    const active = list.filter((b) =>
      ["arrived", "in_progress", "quality_check", "finished"].includes(b.status),
    ).length;
    const completed = list.filter((b) => ["paid"].includes(b.status)).length;

    const userId = (s.user_id as string | null) ?? null;
    const role = userId ? (roleByUserId.get(userId) ?? (s.role as string)) : (s.role as string);

    return { ...s, role, total: list.length, active, completed };
  });

  const topBusy = [...staffRows]
    .filter((s) => s.is_active)
    .sort((a, b) => b.active - a.active)
    .slice(0, 6);

  const activeStaffCount = staffRows.filter((s) => s.is_active).length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Staff</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Team roster and today&apos;s workload assignments.
          </p>
        </div>
        {canManage ? (
          <div className="flex items-center gap-2">
            <Link
              href="/staff/members"
              className="group inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/80 px-4 py-2.5 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5"
            >
              <Users className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
              Members
            </Link>
            <Link
              href="/staff/requests"
              className="group inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/80 px-4 py-2.5 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-amber-500/30 hover:bg-amber-500/5 hover:shadow-md hover:shadow-amber-500/5 hover:-translate-y-0.5"
            >
              <ExternalLink className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-amber-500" />
              Requests
            </Link>
          </div>
        ) : null}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 px-4 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">{activeStaffCount}</div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Active Staff
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 px-4 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-warning/10">
              <Briefcase className="h-4 w-4 text-warning" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">{bookings.length}</div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Jobs Today
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Team Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-lg font-semibold">Team Roster</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Staff Member
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Role
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Today&apos;s Load
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffRows.map((s) => (
                  <TableRow key={s.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {s.display_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-foreground">{s.display_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <Briefcase className="h-3.5 w-3.5" />
                        {s.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          s.is_active
                            ? "bg-success/15 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {s.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-lg font-bold text-foreground">{s.active}</span>
                        <span className="text-sm text-muted-foreground">/ {s.total} jobs</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {staffRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
                          <Users className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm text-muted-foreground">No staff profiles yet</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Busiest Staff Sidebar */}
        <Card>
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-warning" />
              <CardTitle className="text-base font-semibold">Top Workload Today</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {topBusy.map((s, i) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-foreground">{s.display_name}</div>
                    <div className="text-xs text-muted-foreground">{s.role}</div>
                  </div>
                </div>
                <Badge variant={s.active >= 4 ? "default" : "secondary"} className="font-semibold">
                  {s.active} active
                </Badge>
              </div>
            ))}
            {topBusy.length === 0 && (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No active workloads today
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's Jobs */}
      <Card>
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-lg font-semibold">Today&apos;s Job Assignments</CardTitle>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {bookings.length} jobs
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
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
                  Assigned To
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(bookings as any[]).map((b) => {
                const customer = one(b.customers as any) as any;
                const car = one(b.cars as any) as any;
                const svc = one(b.services as any) as any;
                const pkg = one(b.packages as any) as any;
                const assignedStaff = staffRows.find((s) => s.id === b.staff_id);
                return (
                  <TableRow key={b.id} className="group">
                    <TableCell className="font-medium text-foreground">
                      {customer?.display_name ?? "Unknown"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {car?.brand} {car?.model}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {svc?.name ?? pkg?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {assignedStaff?.display_name ?? "Unassigned"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusStyle(b.status)}`}
                      >
                        {String(b.status).replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/bookings/${b.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        View
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(bookings as any[]).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
                        <CalendarDays className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm text-muted-foreground">No jobs scheduled for today</p>
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
