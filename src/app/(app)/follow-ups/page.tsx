import { requireProfile } from "@/lib/auth/require-profile";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { FollowUpsTable } from "./follow-ups-table";

export default async function FollowUpsPage() {
  const { supabase, profile } = await requireProfile();

  const studioRes = await supabase
    .from("studios")
    .select("name")
    .eq("id", profile.studio_id)
    .single();

  const tasksRes = await supabase
    .from("follow_up_tasks")
    .select(
      "id, type, status, scheduled_for, sent_at, customers(id, display_name, phone, whatsapp, line), cars(id, brand, model, license_plate), bookings(id, booking_date, price_cents)",
    )
    .eq("studio_id", profile.studio_id)
    .eq("status", "pending")
    .order("scheduled_for", { ascending: true })
    .limit(200);

  const templatesRes = await supabase
    .from("message_templates")
    .select("type, language, body")
    .eq("studio_id", profile.studio_id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Follow-ups</h1>
        <p className="text-sm text-muted-foreground">
          Review requests, rebooking reminders, and inactive client messages.
        </p>
      </div>

      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold">Queue</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <FollowUpsTable
            studioName={studioRes.data?.name ?? "Studio"}
            tasks={(tasksRes.data ?? []) as any}
            templates={(templatesRes.data ?? []) as any}
          />
        </CardContent>
      </Card>
    </div>
  );
}
