import { User, Shield } from "lucide-react";

import { requireProfile } from "@/lib/auth/require-profile";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ProfileForm } from "./profile-form";

function labelRole(role: string) {
  if (role === "owner") return "Owner";
  if (role === "manager") return "Manager";
  return "Staff";
}

function labelMembershipStatus(status: string) {
  if (status === "active") return "Active";
  if (status === "pending_studio") return "Pending studio";
  if (status === "pending_approval") return "Pending approval";
  if (status === "rejected") return "Rejected";
  return status;
}

export default async function ProfilePage() {
  const { supabase, user, profile } = await requireProfile();

  const { data: isSuperAdmin } = await supabase.rpc("is_super_admin");

  const { data: studio } = await supabase
    .from("studios")
    .select("name")
    .eq("id", profile.studio_id)
    .single();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Profile</h1>
          </div>
          <p className="text-sm text-muted-foreground">Manage your personal account details.</p>
        </div>
        {isSuperAdmin ? (
          <Button asChild>
            <a href="/admin">
              <Shield className="mr-2 h-4 w-4" /> Admin panel
            </a>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-semibold">Your account</CardTitle>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{labelRole(profile.role)}</Badge>
                  <Badge variant={profile.membership_status === "active" ? "default" : "outline"}>
                    {labelMembershipStatus(profile.membership_status)}
                  </Badge>
                  {isSuperAdmin ? <Badge>Super admin</Badge> : null}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Studio</div>
                <div className="text-sm font-medium text-foreground">{studio?.name ?? "Studio"}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ProfileForm
              userId={user.id}
              email={user.email ?? ""}
              initialDisplayName={profile.display_name}
              initialAvatarUrl={profile.avatar_url}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-base font-semibold">IDs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div>
                <div className="text-xs text-muted-foreground">User ID</div>
                <div className="break-all font-mono text-xs text-foreground">{user.id}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Profile ID</div>
                <div className="break-all font-mono text-xs text-foreground">{profile.id}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
