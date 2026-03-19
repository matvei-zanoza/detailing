import { ShieldCheck, UserPlus, Info } from "lucide-react";

import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminsTable } from "./admins-table";
import { AddAdminForm } from "./add-admin-form";

export default async function AdminAdminsPage() {
  const { supabase } = await requireSuperAdmin();

  const { data } = await supabase.from("app_admins").select("user_id, created_at").order("created_at");

  const rows = (data ?? []).map((r) => ({
    user_id: r.user_id as string,
    created_at: r.created_at as string,
  }));

  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <Card className="border-border/50">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="rounded-lg bg-amber-500/10 p-3">
            <ShieldCheck className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">{rows.length}</div>
            <div className="text-xs text-muted-foreground">System Administrators</div>
          </div>
        </CardContent>
      </Card>

      {/* Add Admin & Rules Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base font-semibold">Add Administrator</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <AddAdminForm />
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Info className="h-4 w-4 text-blue-500" />
              </div>
              <CardTitle className="text-base font-semibold">Admin Privileges</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                <div className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                <span>Admins can create studios and manage which studios are visible during onboarding.</span>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                <div className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                <span>Adding admins requires service role access on server.</span>
              </div>
              <div className="flex items-start gap-3 rounded-lg bg-red-500/10 p-3 border border-red-500/20">
                <div className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
                <span className="text-red-600 dark:text-red-400">Be careful when granting admin access. This provides full system control.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admins Table */}
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Current Administrators</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Users with system-level admin privileges</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <AdminsTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
