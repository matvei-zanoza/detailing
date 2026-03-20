import { Building2, Users, Globe, TrendingUp, ArrowUpRight, Activity, Server, Database, ShieldCheck, Zap } from "lucide-react";

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
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 lg:p-8">
        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">System Overview</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor and manage all studios, users, and system configuration
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-sm px-4 py-2 shadow-lg shadow-emerald-500/5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Activity className="h-4 w-4 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">System Online</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Studios Card */}
        <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute right-0 top-0 h-32 w-32 -translate-y-12 translate-x-12 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-colors duration-300" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Studios</CardTitle>
            <div className="rounded-xl bg-primary/10 p-2.5 ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold text-foreground tracking-tight">{studiosCount ?? 0}</div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span>Registered studios</span>
            </div>
          </CardContent>
        </Card>

        {/* Listed Studios Card */}
        <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-0.5">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute right-0 top-0 h-32 w-32 -translate-y-12 translate-x-12 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition-colors duration-300" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Listed Studios</CardTitle>
            <div className="rounded-xl bg-emerald-500/10 p-2.5 ring-1 ring-emerald-500/20 group-hover:ring-emerald-500/40 transition-all duration-300">
              <Globe className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold text-foreground tracking-tight">{listedCount ?? 0}</div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
              <span>Visible in onboarding</span>
            </div>
          </CardContent>
        </Card>

        {/* Users Card */}
        <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-0.5">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute right-0 top-0 h-32 w-32 -translate-y-12 translate-x-12 rounded-full bg-blue-500/10 blur-2xl group-hover:bg-blue-500/20 transition-colors duration-300" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <div className="rounded-xl bg-blue-500/10 p-2.5 ring-1 ring-blue-500/20 group-hover:ring-blue-500/40 transition-all duration-300">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold text-foreground tracking-tight">{usersCount ?? 0}</div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Registered accounts</span>
            </div>
          </CardContent>
        </Card>

        {/* Admins Card */}
        <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-amber-500/30 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-0.5">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute right-0 top-0 h-32 w-32 -translate-y-12 translate-x-12 rounded-full bg-amber-500/10 blur-2xl group-hover:bg-amber-500/20 transition-colors duration-300" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">System Admins</CardTitle>
            <div className="rounded-xl bg-amber-500/10 p-2.5 ring-1 ring-amber-500/20 group-hover:ring-amber-500/40 transition-all duration-300">
              <ShieldCheck className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold text-foreground tracking-tight">{adminsCount ?? 0}</div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Super administrators</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Pending */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Requests */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Pending Requests</CardTitle>
              {(pendingCount ?? 0) > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-500/15 px-2.5 text-xs font-semibold text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30">
                  {pendingCount}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {(pendingCount ?? 0) > 0 ? (
              <div className="flex items-center gap-4 rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-amber-500/5 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-500/30">
                  <Users className="h-5 w-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground">
                    {pendingCount} pending join {pendingCount === 1 ? 'request' : 'requests'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Awaiting admin review</div>
                </div>
                <Zap className="h-5 w-5 text-amber-500/50" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 mb-3">
                  <Users className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <span className="text-sm text-muted-foreground">No pending requests</span>
                <span className="text-xs text-muted-foreground/70 mt-1">All caught up!</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Info */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-semibold">System Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-3.5 ring-1 ring-border/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Server className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">Environment</span>
                </div>
                <span className="text-sm font-semibold text-foreground px-3 py-1 rounded-full bg-primary/10">Production</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-3.5 ring-1 ring-border/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Database className="h-4 w-4 text-emerald-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Database</span>
                </div>
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-3.5 ring-1 ring-border/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                    <ShieldCheck className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Auth Provider</span>
                </div>
                <span className="text-sm font-semibold text-foreground">Supabase</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
