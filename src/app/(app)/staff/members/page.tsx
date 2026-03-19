import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth/require-profile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { MembersTable } from "./members-table";

function canManageStudio(role: string) {
  return role === "owner" || role === "manager";
}

export default async function StaffMembersPage() {
  const { profile } = await requireProfile();

  if (!canManageStudio(profile.role)) {
    redirect("/staff");
  }

  const admin = createSupabaseAdminClient();

  const [membersRes, adminsRes] = await Promise.all([
    admin
      .from("user_profiles")
      .select("id, display_name, role")
      .eq("studio_id", profile.studio_id)
      .eq("membership_status", "active")
      .order("display_name", { ascending: true }),
    admin.from("app_admins").select("user_id, is_super_admin").eq("is_super_admin", true),
  ]);

  if (membersRes.error) {
    throw membersRes.error;
  }

  if (adminsRes.error) {
    throw adminsRes.error;
  }

  const superAdmins = new Set((adminsRes.data ?? []).map((a) => a.user_id as string));

  const rows = (membersRes.data ?? [])
    .filter((m) => !superAdmins.has(m.id as string))
    .map((m) => ({
      id: m.id as string,
      display_name: m.display_name as string,
      role: m.role as "owner" | "manager" | "staff",
    }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Members</h1>
          <p className="text-sm text-muted-foreground">Manage studio users and roles.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold">Active members</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <MembersTable rows={rows} currentUserRole={profile.role} />
        </CardContent>
      </Card>
    </div>
  );
}
