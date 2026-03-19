import { Building2, Globe, Plus, Info } from "lucide-react";

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

  const listedCount = rows.filter(r => r.listed_active).length;

  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{rows.length}</div>
              <div className="text-xs text-muted-foreground">Total Studios</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-emerald-500/10 p-3">
              <Globe className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{listedCount}</div>
              <div className="text-xs text-muted-foreground">Listed in Directory</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create & Rules Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base font-semibold">Create Studio</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <CreateStudioForm />
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Info className="h-4 w-4 text-blue-500" />
              </div>
              <CardTitle className="text-base font-semibold">Directory Rules</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                <div className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                <span>Only studios with a directory entry set to active appear on the onboarding studio selector.</span>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                <div className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                <span>You can disable a studio listing without deleting the studio.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Studios Table */}
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">All Studios</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Manage studios and their directory visibility</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <StudiosTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
