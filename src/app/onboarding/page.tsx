import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/require-user";

export default async function OnboardingIndexPage() {
  const { supabase, user } = await requireUser();

  const { data } = await supabase
    .from("user_profiles")
    .select("membership_status, requested_studio_id")
    .eq("id", user.id)
    .maybeSingle();

  const status = data?.membership_status as string | undefined;

  if (!status || status === "pending_studio") {
    redirect("/onboarding/select-studio");
  }

  if (status === "pending_approval") {
    redirect("/onboarding/pending");
  }

  if (status === "rejected") {
    redirect("/onboarding/rejected");
  }

  redirect("/dashboard");
}
