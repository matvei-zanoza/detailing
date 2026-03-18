import { notFound } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatMoneyFromCents } from "@/lib/format";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicBookingForm } from "./public-booking-form";

export default async function PublicBookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createSupabaseAdminClient();

  const studioRes = await supabase
    .from("studios")
    .select("id, name, currency")
    .eq("slug", slug)
    .maybeSingle();

  if (studioRes.error || !studioRes.data) {
    notFound();
  }

  const studioId = studioRes.data.id as string;
  const currency = (studioRes.data.currency as string) ?? "USD";

  const [servicesRes, packagesRes] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, base_price_cents")
      .eq("studio_id", studioId)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("packages")
      .select("id, name, base_price_cents")
      .eq("studio_id", studioId)
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  const services = (servicesRes.data ?? []).map((s) => ({
    id: s.id,
    label: s.name,
    priceLabel: formatMoneyFromCents(s.base_price_cents ?? 0, currency),
  }));

  const packages = (packagesRes.data ?? []).map((p) => ({
    id: p.id,
    label: p.name,
    priceLabel: formatMoneyFromCents(p.base_price_cents ?? 0, currency),
  }));

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Book an appointment</h1>
          <p className="text-sm text-muted-foreground">
            {studioRes.data.name}
          </p>
        </div>

        <Card>
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-lg font-semibold">Preferred drop-off</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <PublicBookingForm studioSlug={slug} services={services} packages={packages} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
