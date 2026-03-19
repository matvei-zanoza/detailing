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
