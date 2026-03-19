import { requireAppAdmin } from "@/lib/auth/require-app-admin";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminsTable } from "./admins-table";
import { AddAdminForm } from "./add-admin-form";

export default async function AdminAdminsPage() {
  const { supabase } = await requireAppAdmin();

  const { data } = await supabase.from("app_admins").select("user_id, created_at").order("created_at");

  const rows = (data ?? []).map((r) => ({
    user_id: r.user_id as string,
    created_at: r.created_at as string,
  }));

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-lg font-semibold">Add admin</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <AddAdminForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-lg font-semibold">Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-6 text-sm text-muted-foreground">
            <div>Admins can create studios and manage which studios are visible during onboarding.</div>
            <div>Adding admins requires service role access on server.</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold">Current admins</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <AdminsTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
