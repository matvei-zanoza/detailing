import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { UsersTable } from "./users-table";

export default async function AdminUsersPage() {
  const { supabase } = await requireSuperAdmin();

  const { data, error } = await supabase
    .from("user_profiles")
    .select(
      "id, display_name, role, membership_status, studio_id, requested_studio_id, requested_at, approved_at, approved_by",
    )
    .order("requested_at", { ascending: false, nullsFirst: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []).slice(0, 200);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold">Users</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <UsersTable
            rows={rows.map((r) => ({
              id: r.id as string,
              display_name: r.display_name as string,
              role: r.role as string,
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
