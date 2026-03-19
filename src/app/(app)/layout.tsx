import { AppShell } from "@/components/app/app-shell";
import { requireProfile } from "@/lib/auth/require-profile";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, profile } = await requireProfile();

  const { data: isSuperAdmin } = await supabase.rpc("is_super_admin");

  const { data: studio } = await supabase
    .from("studios")
    .select("name")
    .eq("id", profile.studio_id)
    .single();

  return (
    <AppShell
      studioName={studio?.name ?? "Studio"}
      userDisplayName={profile.display_name}
      userAvatarUrl={profile.avatar_url}
      isSuperAdmin={Boolean(isSuperAdmin)}
    >
      {children}
    </AppShell>
  );
}
