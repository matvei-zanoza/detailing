import "server-only";

import { cache } from "react";
import { requireUser } from "@/lib/auth/require-user";

export type AppRole = "owner" | "manager" | "staff";

export type UserProfile = {
  id: string;
  studio_id: string;
  role: AppRole;
  display_name: string;
};

export const requireProfile = cache(async () => {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, studio_id, role, display_name")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    throw new Error("Missing user profile. Did you run the seed script?");
  }

  return { supabase, user, profile: data as UserProfile };
});
