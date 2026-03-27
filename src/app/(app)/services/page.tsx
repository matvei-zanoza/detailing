import { ShoppingBag } from "lucide-react";

import { requireProfile } from "@/lib/auth/require-profile";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ServiceDialog } from "./service-dialog";
import { ServicesTable } from "./services-table";

export default async function ServicesPage() {
  const { supabase, profile } = await requireProfile();

  const { data: studio } = await supabase
    .from("studios")
    .select("currency")
    .eq("id", profile.studio_id)
    .single();

  const currency = studio?.currency ?? "THB";

  const services = await supabase
    .from("services")
    .select("id, name, description, duration_minutes, base_price_cents, category, is_active")
    .eq("studio_id", profile.studio_id)
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  const activeCount = (services.data ?? []).filter((s) => s.is_active).length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Services</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Define and manage your detailing service catalog.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 px-4 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-success/10">
              <ShoppingBag className="h-4 w-4 text-success" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">{activeCount}</div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Active Services
              </div>
            </div>
          </div>
          <ServiceDialog
            triggerLabel="New service"
            title="Create service"
            mode="create"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold">Service Catalog</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ServicesTable services={(services.data ?? []) as any} currency={currency} />
        </CardContent>
      </Card>
    </div>
  );
}
