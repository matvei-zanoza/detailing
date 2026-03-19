import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

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

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold">Join requests</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <RequestsTable
            rows={rows.map((r) => ({
              id: r.id as string,
              studio_id: r.studio_id as string,
              user_id: r.user_id as string,
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
