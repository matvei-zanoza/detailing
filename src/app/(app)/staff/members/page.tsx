import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireProfile } from "@/lib/auth/require-profile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getRequestLocale, t as tServer } from "@/lib/i18n/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { MembersTable } from "./members-table";

function canManageStudio(role: string) {
  return role === "owner" || role === "manager";
}

export default async function StaffMembersPage() {
  const locale = await getRequestLocale();
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
          <div>
            <Link
              href="/staff"
              className="group inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/80 px-4 py-2.5 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground transition-all group-hover:text-primary group-hover:-translate-x-0.5" />
              {tServer(locale, "staff.members.back")}
            </Link>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">{tServer(locale, "staff.members.title")}</h1>
          <p className="text-sm text-muted-foreground">{tServer(locale, "staff.members.subtitle")}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold">{tServer(locale, "staff.members.activeMembers")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <MembersTable rows={rows} currentUserRole={profile.role} />
        </CardContent>
      </Card>
    </div>
  );
}
