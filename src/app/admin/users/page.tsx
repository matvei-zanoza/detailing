import { Users, UserCheck, UserX, Clock } from "lucide-react";

import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { UsersTable } from "./users-table";

export default async function AdminUsersPage() {
  await requireSuperAdmin();
  const admin = createSupabaseAdminClient();

  const [profilesRes, appAdminsRes] = await Promise.all([
    admin
      .from("user_profiles")
      .select(
        "id, display_name, role, membership_status, studio_id, requested_studio_id, requested_at, approved_at, approved_by",
      )
      .order("requested_at", { ascending: false, nullsFirst: false }),
    admin.from("app_admins").select("user_id, is_super_admin"),
  ]);

  if (profilesRes.error) {
    throw profilesRes.error;
  }
  if (appAdminsRes.error) {
    throw appAdminsRes.error;
  }

  const adminByUserId = new Map<string, { is_super_admin: boolean }>();
  for (const a of appAdminsRes.data ?? []) {
    adminByUserId.set(a.user_id as string, { is_super_admin: Boolean(a.is_super_admin) });
  }

  const rows = (profilesRes.data ?? []).slice(0, 200);

  // Calculate stats
  const activeUsers = rows.filter((r) => r.membership_status === "active").length;
  const pendingUsers = rows.filter(
    (r) => r.membership_status === "pending_studio" || r.membership_status === "pending_approval",
  ).length;
  const totalUsers = rows.length;

  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{totalUsers}</div>
              <div className="text-xs text-muted-foreground">Total Users</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-emerald-500/10 p-3">
              <UserCheck className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{activeUsers}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-amber-500/10 p-3">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{pendingUsers}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">User Management</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">View and manage all registered users</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <UsersTable
            rows={rows.map((r) => ({
              id: r.id as string,
              display_name: r.display_name as string,
              role: r.role as string,
              app_access: adminByUserId.get(r.id as string)?.is_super_admin
                ? ("super_admin" as const)
                : adminByUserId.has(r.id as string)
                  ? ("admin" as const)
                  : ("user" as const),
              membership_status: r.membership_status as string,
              studio_id: (r.studio_id as string | null) ?? null,
              requested_studio_id: (r.requested_studio_id as string | null) ?? null,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
