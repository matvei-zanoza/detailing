import { requireProfile } from "@/lib/auth/require-profile";
import { todayISODate } from "@/lib/time";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { WorkflowBoard } from "./workflow-board";

export default async function WorkflowPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const date = (typeof sp.date === "string" ? sp.date : null) ?? todayISODate();

  const { supabase, profile } = await requireProfile();

  const [studioRes, bookingsRes] = await Promise.all([
    supabase
      .from("studios")
      .select("currency")
      .eq("id", profile.studio_id)
      .single(),
    supabase
      .from("bookings")
      .select(
        "id, booking_date, start_time, status, price_cents, customers(display_name), cars(brand, model), staff_profiles(display_name), services(name), packages(name)",
      )
      .eq("studio_id", profile.studio_id)
      .eq("booking_date", date)
      .neq("status", "cancelled")
      .order("start_time", { ascending: true }),
  ]);

  const currency = studioRes.data?.currency ?? "USD";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workflow</h1>
          <div className="text-sm text-muted-foreground">
            Kanban view of jobs for <span className="font-medium text-foreground">{date}</span>
          </div>
        </div>
        <Badge variant="secondary">{(bookingsRes.data ?? []).length} jobs</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Job board</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkflowBoard currency={currency} bookings={(bookingsRes.data ?? []) as any} />
        </CardContent>
      </Card>
    </div>
  );
}
