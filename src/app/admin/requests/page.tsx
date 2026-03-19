import { UserPlus, Clock, CheckCircle2, XCircle } from "lucide-react";

import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { RequestsTable } from "./requests-table";

export default async function AdminRequestsPage() {
  const { supabase } = await requireSuperAdmin();

  const { data, error } = await supabase
    .from("studio_join_requests")
    .select("id, studio_id, user_id, status, created_at, decided_at, decided_by")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []).slice(0, 200);

  // Calculate stats
  const pending = rows.filter((r) => r.status === "pending").length;
  const approved = rows.filter((r) => r.status === "approved").length;
  const rejected = rows.filter((r) => r.status === "rejected").length;

  const userIds = Array.from(new Set(rows.map((r) => r.user_id as string)));

  const displayNameById = new Map<string, string>();
  const emailById = new Map<string, string>();

  if (userIds.length > 0) {
    const profilesRes = await supabase
      .from("user_profiles")
      .select("id, display_name")
      .in("id", userIds);

    if (profilesRes.error) {
      throw profilesRes.error;
    }

    for (const p of profilesRes.data ?? []) {
      displayNameById.set(p.id as string, p.display_name as string);
    }

    const admin = createSupabaseAdminClient();
    await Promise.all(
      userIds.map(async (id) => {
        const res = await admin.auth.admin.getUserById(id);
        const email = res.data?.user?.email ?? null;
        if (email) emailById.set(id, email);
      }),
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{rows.length}</div>
              <div className="text-xs text-muted-foreground">Total Requests</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-amber-500/10 p-3">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{pending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-emerald-500/10 p-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{approved}</div>
              <div className="text-xs text-muted-foreground">Approved</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-red-500/10 p-3">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{rejected}</div>
              <div className="text-xs text-muted-foreground">Rejected</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Join Requests</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Review and manage studio join requests</p>
            </div>
            {pending > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-500/10 px-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                {pending} pending
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <RequestsTable
            rows={rows.map((r) => ({
              id: r.id as string,
              studio_id: r.studio_id as string,
              user_id: r.user_id as string,
              user_display_name: displayNameById.get(r.user_id as string) ?? null,
              user_email: emailById.get(r.user_id as string) ?? null,
              status: r.status as string,
              created_at: r.created_at as string,
              decided_at: (r.decided_at as string | null) ?? null,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
