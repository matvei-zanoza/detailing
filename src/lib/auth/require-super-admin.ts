import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";

export const requireSuperAdmin = cache(async () => {
  const { supabase, user } = await requireUser();

  const { data } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("is_super_admin", true)
    .maybeSingle();

  if (!data) {
    redirect("/dashboard");
  }

  return { supabase, user };
});
