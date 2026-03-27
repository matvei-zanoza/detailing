import { Settings, Building2, Palette, Clock, Info } from "lucide-react";

import { requireProfile } from "@/lib/auth/require-profile";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { updateStudioSettings } from "./actions";
import { SettingsForm } from "./settings-form";
import { JoinCodeForm } from "./join-code-form";

export default async function SettingsPage() {
  const { supabase, profile } = await requireProfile();

  if (!profile.studio_id) {
    throw new Error("Studio not set");
  }

  const studioRes = await supabase
    .from("studios")
    .select("name, timezone, currency, branding_color, business_hours")
    .eq("id", profile.studio_id)
    .single();

  if (studioRes.error || !studioRes.data) {
    throw studioRes.error ?? new Error("Studio not found");
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your studio profile, preferences, and business configuration.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Settings Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Studio Profile</CardTitle>
                <p className="text-sm text-muted-foreground">Basic information and identity</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <SettingsForm
              initialValues={{
                name: studioRes.data.name,
                timezone: studioRes.data.timezone,
                currency: studioRes.data.currency,
                branding_color: studioRes.data.branding_color,
                business_hours: JSON.stringify(studioRes.data.business_hours ?? {}, null, 2),
              }}
              submitAction={updateStudioSettings}
            />
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Info Card */}
          <Card>
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base font-semibold">Quick Info</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Studio Name</div>
                  <div className="font-medium text-foreground">{studioRes.data.name}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/10">
                  <Clock className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Timezone</div>
                  <div className="font-medium text-foreground">{studioRes.data.timezone}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-warning/10">
                  <Palette className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Brand Color</div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded-full border border-border/50"
                      style={{ backgroundColor: studioRes.data.branding_color || "#3b82f6" }}
                    />
                    <span className="font-mono text-sm text-foreground">
                      {studioRes.data.branding_color || "#3b82f6"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {(profile.role === "owner" || profile.role === "manager") && (
            <Card>
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-base font-semibold">Studio join code</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <JoinCodeForm studioId={profile.studio_id} />
              </CardContent>
            </Card>
          )}

          {/* Preferences Card */}
          <Card>
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-base font-semibold">Preferences</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="rounded-lg border border-border/50 bg-muted/20 p-4 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Tax toggles, additional branding, and logo upload coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
