import { requireProfile } from "@/lib/auth/require-profile";
import { todayISODate } from "@/lib/time";
import { Workflow, CalendarDays, Car } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
  const jobCount = (bookingsRes.data ?? []).length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Workflow Board</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Visual kanban for tracking job progress through your detailing pipeline.
          </p>
        </div>

        {/* Date Picker & Stats */}
        <div className="flex items-center gap-4">
          <form method="get" action="/workflow" className="flex items-center gap-2">
            <Input
              type="date"
              name="date"
              defaultValue={date}
              className="h-9 w-[160px] bg-muted/30"
            />
            <Button type="submit" variant="secondary" size="sm">
              Go
            </Button>
          </form>
          <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 px-4 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <Car className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">{jobCount}</div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Active Jobs
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Date Indicator */}
      <div className="flex items-center gap-2 text-sm">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">Viewing jobs for</span>
        <span className="font-semibold text-foreground">{date}</span>
      </div>

      {/* Workflow Board */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/20">
          <CardTitle className="text-base font-semibold">Job Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <WorkflowBoard currency={currency} bookings={(bookingsRes.data ?? []) as any} />
        </CardContent>
      </Card>
    </div>
  );
}
