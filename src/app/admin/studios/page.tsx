import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudiosTable } from "./studios-table";
import { CreateStudioForm } from "./create-studio-form";

export default async function AdminStudiosPage() {
  const { supabase } = await requireSuperAdmin();

  const { data } = await supabase
    .from("studios")
    .select("id, name, slug, timezone, currency, branding_color, studio_directory(public_name, is_active)")
    .order("created_at", { ascending: false });

  const rows = (data ?? []).map((s: any) => ({
    id: s.id as string,
    name: s.name as string,
    slug: s.slug as string,
    timezone: (s.timezone as string) ?? "UTC",
    currency: (s.currency as string) ?? "USD",
    listed_name: (s.studio_directory?.[0]?.public_name as string | undefined) ?? null,
    listed_active: (s.studio_directory?.[0]?.is_active as boolean | undefined) ?? false,
  }));

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-lg font-semibold">Create studio</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <CreateStudioForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-lg font-semibold">Directory rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-6 text-sm text-muted-foreground">
            <div>Only studios with a directory entry set to active appear on the onboarding studio selector.</div>
            <div>You can disable a studio listing without deleting the studio.</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold">Studios</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <StudiosTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
