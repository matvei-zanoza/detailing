import { Building2, Users, Globe, TrendingUp, ArrowUpRight, Activity } from "lucide-react";

import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminPage() {
  await requireSuperAdmin();
  const admin = createSupabaseAdminClient();

  const [
    { count: studiosCount }, 
    { count: adminsCount }, 
    { count: listedCount },
    { count: usersCount },
    { count: pendingCount }
  ] = await Promise.all([
    admin.from("studios").select("id", { count: "exact", head: true }),
    admin.from("app_admins").select("user_id", { count: "exact", head: true }),
    admin.from("studio_directory").select("studio_id", { count: "exact", head: true }).eq("is_active", true),
    admin.from("user_profiles").select("id", { count: "exact", head: true }),
    admin.from("studio_join_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-muted/20 p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">System Overview</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor and manage all studios, users, and system configuration
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">System Online</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Studios Card */}
        <Card className="group relative overflow-hidden border-border/50 transition-all hover:border-border hover:shadow-lg">
          <div className="absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-primary/5" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Studios</CardTitle>
            <div className="rounded-lg bg-primary/10 p-2">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{studiosCount ?? 0}</div>
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span>Registered studios</span>
            </div>
          </CardContent>
        </Card>

        {/* Listed Studios Card */}
        <Card className="group relative overflow-hidden border-border/50 transition-all hover:border-border hover:shadow-lg">
          <div className="absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-emerald-500/5" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Listed Studios</CardTitle>
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <Globe className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{listedCount ?? 0}</div>
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              <span>Visible in onboarding</span>
            </div>
          </CardContent>
        </Card>

        {/* Users Card */}
        <Card className="group relative overflow-hidden border-border/50 transition-all hover:border-border hover:shadow-lg">
          <div className="absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-blue-500/5" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{usersCount ?? 0}</div>
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <span>Registered accounts</span>
            </div>
          </CardContent>
        </Card>

        {/* Admins Card */}
        <Card className="group relative overflow-hidden border-border/50 transition-all hover:border-border hover:shadow-lg">
          <div className="absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-amber-500/5" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">System Admins</CardTitle>
            <div className="rounded-lg bg-amber-500/10 p-2">
              <Users className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{adminsCount ?? 0}</div>
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <span>app_admins table</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Pending */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Requests */}
        <Card className="border-border/50">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Pending Requests</CardTitle>
              {(pendingCount ?? 0) > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-500/10 px-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                  {pendingCount}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {(pendingCount ?? 0) > 0 ? (
              <div className="flex items-center gap-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                  <Users className="h-5 w-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">
                    {pendingCount} pending join {pendingCount === 1 ? 'request' : 'requests'}
                  </div>
                  <div className="text-xs text-muted-foreground">Awaiting admin review</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                No pending requests
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Info */}
        <Card className="border-border/50">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-base font-semibold">System Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <span className="text-sm text-muted-foreground">Environment</span>
                <span className="text-sm font-medium text-foreground">Production</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <span className="text-sm text-muted-foreground">Database</span>
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Connected</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <span className="text-sm text-muted-foreground">Auth Provider</span>
                <span className="text-sm font-medium text-foreground">Supabase</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
