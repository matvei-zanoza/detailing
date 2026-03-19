import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminPage() {
  const { supabase } = await requireSuperAdmin();

  const [{ count: studiosCount }, { count: adminsCount }, { count: listedCount }] = await Promise.all([
    supabase.from("studios").select("id", { count: "exact", head: true }),
    supabase.from("app_admins").select("user_id", { count: "exact", head: true }),
    supabase.from("studio_directory").select("studio_id", { count: "exact", head: true }).eq("is_active", true),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-base font-semibold">Studios</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-3xl font-bold text-foreground">{studiosCount ?? 0}</div>
          <div className="mt-2 text-xs text-muted-foreground">Total studios in database</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-base font-semibold">Listed studios</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-3xl font-bold text-foreground">{listedCount ?? 0}</div>
          <div className="mt-2 text-xs text-muted-foreground">Visible in onboarding</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-base font-semibold">System admins</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold text-foreground">{adminsCount ?? 0}</div>
            <Badge variant="secondary">app_admins</Badge>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">Can manage studios + directory</div>
        </CardContent>
      </Card>
    </div>
  );
}
