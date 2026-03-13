import Link from "next/link";

import { requireProfile } from "@/lib/auth/require-profile";
import { todayISODate } from "@/lib/time";
import { one } from "@/lib/supabase/normalize";

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

  const [staffRes, todaysBookingsRes] = await Promise.all([
    supabase
      .from("staff_profiles")
      .select("id, display_name, role, is_active")
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
    return { ...s, total: list.length, active, completed };
  });

  const topBusy = [...staffRows]
    .filter((s) => s.is_active)
    .sort((a, b) => b.active - a.active)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Staff</h1>
        <div className="text-sm text-muted-foreground">
          Today’s assignments and a lightweight workload overview.
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Team</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Today</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffRows.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.display_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.role}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.is_active ? "secondary" : "outline"}>
                        {s.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium">{s.active}</span>
                      <span className="text-sm text-muted-foreground"> / {s.total} jobs</span>
                    </TableCell>
                  </TableRow>
                ))}
                {staffRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                      No staff profiles yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today’s busiest</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topBusy.map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{s.display_name}</div>
                  <div className="text-xs text-muted-foreground">{s.role}</div>
                </div>
                <Badge variant={s.active >= 4 ? "default" : "secondary"}>
                  {s.active} active
                </Badge>
              </div>
            ))}
            {topBusy.length === 0 && (
              <div className="text-sm text-muted-foreground">No workloads yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today’s jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Car</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Open</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(bookings as any[]).map((b) => {
                const customer = one(b.customers as any) as any;
                const car = one(b.cars as any) as any;
                const svc = one(b.services as any) as any;
                const pkg = one(b.packages as any) as any;
                const staff = staffRows.find((s) => s.id === b.staff_id);
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{customer?.display_name ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {car?.brand} {car?.model}
                    </TableCell>
                    <TableCell>{svc?.name ?? pkg?.name ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {staff?.display_name ?? "Unassigned"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {String(b.status).replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/bookings/${b.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        Open
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(bookings as any[]).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    No jobs today.
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
