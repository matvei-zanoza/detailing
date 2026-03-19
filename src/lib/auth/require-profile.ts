import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";

export type AppRole = "owner" | "manager" | "staff";

export type MembershipStatus = "pending_studio" | "pending_approval" | "active" | "rejected";

export type UserProfile = {
  id: string;
  studio_id: string | null;
  role: AppRole;
  display_name: string;
  membership_status: MembershipStatus;
  requested_studio_id: string | null;
};

export const requireProfile = cache(async () => {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, studio_id, role, display_name, membership_status, requested_studio_id")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    redirect("/login?error=missing_profile");
  }

  const profile = data as UserProfile;
  if (profile.membership_status !== "active" || !profile.studio_id) {
    redirect("/onboarding");
  }

  return { supabase, user, profile };
});
