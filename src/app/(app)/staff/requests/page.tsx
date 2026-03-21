import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth/require-profile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RequestsTable } from "./requests-table";

export default async function StaffRequestsPage() {
  const { supabase, profile } = await requireProfile();

  if (!(profile.role === "owner" || profile.role === "manager")) {
    redirect("/staff");
  }

  const { data: pendingRequests, error: pendingErr } = await supabase
    .from("studio_join_requests")
    .select("studio_id, user_id, status, created_at")
    .eq("studio_id", profile.studio_id)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (pendingErr) {
    throw pendingErr;
  }

  const userIds = Array.from(new Set((pendingRequests ?? []).map((r) => r.user_id as string)));

  const displayNameById = new Map<string, string>();
  const emailById = new Map<string, string>();
  if (userIds.length > 0) {
    const admin = createSupabaseAdminClient();

    const profilesRes = await admin.from("user_profiles").select("id, display_name").in("id", userIds);
    if (profilesRes.error) {
      throw profilesRes.error;
    }

    for (const p of profilesRes.data ?? []) {
      displayNameById.set(p.id as string, p.display_name as string);
    }

    await Promise.all(
      userIds.map(async (id) => {
        const res = await admin.auth.admin.getUserById(id);
        const email = res.data?.user?.email ?? null;
        if (email) emailById.set(id, email);
      }),
    );
  }

  const createdAtById = new Map<string, string | null>();
  for (const r of pendingRequests ?? []) {
    createdAtById.set(r.user_id as string, (r.created_at as string | null) ?? null);
  }

  const rows = userIds.map((id) => ({
    id,
    display_name: displayNameById.get(id) ?? "—",
    email: emailById.get(id) ?? null,
    requested_at: createdAtById.get(id) ?? null,
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Access Requests</h1>
          <p className="text-sm text-muted-foreground">Approve or reject new members.</p>
        </div>
        <Badge variant="secondary">{rows.length} pending</Badge>
      </div>

      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold">Pending approvals</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <RequestsTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
