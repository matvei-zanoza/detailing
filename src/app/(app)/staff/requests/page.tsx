import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireProfile } from "@/lib/auth/require-profile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RequestsTable } from "./requests-table";

export default async function StaffRequestsPage() {
  const { supabase, profile } = await requireProfile();

  if (!(profile.role === "owner" || profile.role === "manager")) {
    redirect("/staff");
  }

  const { data: pendingRequests, error: pendingErr } = await supabase
    .from("studio_join_requests")
    .select("studio_id, user_id, status, created_at")
    .eq("studio_id", profile.studio_id)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const { data: pendingUsers, error: pendingUsersErr } = pendingErr
    ? await supabase
        .from("user_profiles")
        .select("id, display_name, requested_at")
        .eq("requested_studio_id", profile.studio_id)
        .eq("membership_status", "pending_approval")
        .order("requested_at", { ascending: true })
    : { data: null, error: null };

  if (pendingErr && !pendingUsers) {
    console.error("[staff/requests] failed to load join requests", {
      message: pendingErr.message,
      code: (pendingErr as any).code,
      details: (pendingErr as any).details,
      hint: (pendingErr as any).hint,
    });

    if (pendingUsersErr) {
      console.error("[staff/requests] failed to load pending users fallback", {
        message: pendingUsersErr.message,
        code: (pendingUsersErr as any).code,
        details: (pendingUsersErr as any).details,
        hint: (pendingUsersErr as any).hint,
      });
    }

    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div>
            <Link
              href="/staff"
              className="group inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/80 px-4 py-2.5 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground transition-all group-hover:text-primary group-hover:-translate-x-0.5" />
              Back to Staff
            </Link>
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Access Requests</h1>
            <p className="text-sm text-muted-foreground">Approve or reject new members.</p>
          </div>
        </div>

        <Card>
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-lg font-semibold">Pending approvals</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">
              Failed to load requests. Please try again later.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userIds = pendingUsers
    ? Array.from(new Set((pendingUsers ?? []).map((u) => u.id as string)))
    : Array.from(new Set((pendingRequests ?? []).map((r) => r.user_id as string)));

  const displayNameById = new Map<string, string>();
  const emailById = new Map<string, string>();
  if (userIds.length > 0) {
    let admin: ReturnType<typeof createSupabaseAdminClient> | null = null;
    try {
      admin = createSupabaseAdminClient();
    } catch {
      admin = null;
    }

    if (admin) {
      if (!pendingUsers) {
        const profilesRes = await admin.from("user_profiles").select("id, display_name").in("id", userIds);
        if (profilesRes.error) {
          console.error("[staff/requests] failed to load profiles for pending requests", {
            message: profilesRes.error.message,
            code: (profilesRes.error as any).code,
            details: (profilesRes.error as any).details,
            hint: (profilesRes.error as any).hint,
          });
        } else {
          for (const p of profilesRes.data ?? []) {
            displayNameById.set(p.id as string, p.display_name as string);
          }
        }
      } else {
        for (const u of pendingUsers ?? []) {
          displayNameById.set(u.id as string, u.display_name as string);
        }
      }

      await Promise.all(
        userIds.map(async (id) => {
          const res = await admin.auth.admin.getUserById(id);
          const email = res.data?.user?.email ?? null;
          if (email) emailById.set(id, email);
        }),
      );
    }
  }

  const createdAtById = new Map<string, string | null>();
  if (pendingUsers) {
    for (const u of pendingUsers ?? []) {
      createdAtById.set(u.id as string, (u.requested_at as string | null) ?? null);
    }
  } else {
    for (const r of pendingRequests ?? []) {
      createdAtById.set(r.user_id as string, (r.created_at as string | null) ?? null);
    }
  }

  const rows = userIds.map((id) => ({
    id,
    display_name: displayNameById.get(id) ?? "—",
    email: emailById.get(id) ?? null,
    requested_at: createdAtById.get(id) ?? null,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div>
            <Link
              href="/staff"
              className="group inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/80 px-4 py-2.5 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground transition-all group-hover:text-primary group-hover:-translate-x-0.5" />
              Back to Staff
            </Link>
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Access Requests</h1>
            <p className="text-sm text-muted-foreground">Approve or reject new members.</p>
          </div>
        </div>
        <Badge variant="secondary">{rows.length} pending</Badge>
      </div>

      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold">Pending approvals</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <RequestsTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
