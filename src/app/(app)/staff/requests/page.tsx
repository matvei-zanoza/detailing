import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth/require-profile";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RequestsTable } from "./requests-table";

export default async function StaffRequestsPage() {
  const { supabase, profile } = await requireProfile();

  if (!(profile.role === "owner" || profile.role === "manager")) {
    redirect("/staff");
  }

  const { data: pendingUsers } = await supabase
    .from("user_profiles")
    .select("id, display_name, role, membership_status, requested_studio_id, requested_at")
    .eq("requested_studio_id", profile.studio_id)
    .eq("membership_status", "pending_approval")
    .order("requested_at", { ascending: true });

  const rows = (pendingUsers ?? []).map((u) => ({
    id: u.id as string,
    display_name: u.display_name as string,
    requested_at: (u.requested_at as string | null) ?? null,
    current_role: u.role as "owner" | "manager" | "staff",
    membership_status: u.membership_status as string,
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
