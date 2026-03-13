import { requireProfile } from "@/lib/auth/require-profile";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { updateStudioSettings } from "./actions";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const { supabase, profile } = await requireProfile();

  const studioRes = await supabase
    .from("studios")
    .select("name, timezone, currency, branding_color, business_hours")
    .eq("id", profile.studio_id)
    .single();

  if (studioRes.error || !studioRes.data) {
    throw studioRes.error ?? new Error("Studio not found");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <div className="text-sm text-muted-foreground">Studio profile and preferences.</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Studio profile</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm
            initialValues={{
              name: studioRes.data.name,
              timezone: studioRes.data.timezone,
              currency: studioRes.data.currency,
              branding_color: studioRes.data.branding_color,
              business_hours: JSON.stringify(studioRes.data.business_hours ?? {}, null, 2),
            }}
            onSubmitAction={updateStudioSettings}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Tax toggle, additional branding options, and logo upload are intentionally deferred for MVP.
        </CardContent>
      </Card>
    </div>
  );
}
