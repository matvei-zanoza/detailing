import { Package, DollarSign, Users, Layers } from "lucide-react";

import { requireProfile } from "@/lib/auth/require-profile";
import { formatMoneyFromCents } from "@/lib/format";
import { one } from "@/lib/supabase/normalize";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { createPackage, updatePackage } from "./actions";
import { PackageDialog } from "./package-dialog";

export default async function PackagesPage() {
  const { supabase, profile } = await requireProfile();

  const [{ data: studio }, servicesRes, packagesRes, packageItemsRes] =
    await Promise.all([
      supabase
        .from("studios")
        .select("currency")
        .eq("id", profile.studio_id)
        .single(),
      supabase
        .from("services")
        .select("id, name, category")
        .eq("studio_id", profile.studio_id)
        .order("category", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("packages")
        .select("id, name, description, target_profile, base_price_cents, is_active")
        .eq("studio_id", profile.studio_id)
        .order("is_active", { ascending: false })
        .order("name", { ascending: true }),
      supabase
        .from("package_items")
        .select("package_id, service_id, services(id, name)")
        .eq("studio_id", profile.studio_id)
        .limit(1000),
    ]);

  const currency = studio?.currency ?? "USD";
  const services = (servicesRes.data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
  }));

  const servicesById = new Map(services.map((s) => [s.id, s] as const));

  const includedByPackage = new Map<string, string[]>();
  for (const row of packageItemsRes.data ?? []) {
    const list = includedByPackage.get(row.package_id) ?? [];
    list.push(row.service_id);
    includedByPackage.set(row.package_id, list);
  }

  const includedNames = (packageId: string) => {
    const ids = includedByPackage.get(packageId) ?? [];
    return ids
      .map((id) => servicesById.get(id)?.name)
      .filter(Boolean) as string[];
  };

  const activeCount = (packagesRes.data ?? []).filter((p) => p.is_active).length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Packages</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Premium service bundles that combine multiple detailing services.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 px-4 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/10">
              <Package className="h-4 w-4 text-accent" />
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">{activeCount}</div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Active Packages
              </div>
            </div>
          </div>
          <PackageDialog
            triggerLabel="New package"
            title="Create package"
            services={services}
            onSubmitAction={createPackage}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold">Package Tiers</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Package
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Included Services
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Target
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Price
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(packagesRes.data ?? []).map((p) => {
                const included = includedNames(p.id);
                return (
                  <TableRow key={p.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                          <Layers className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{p.name}</div>
                          <div className="line-clamp-1 text-xs text-muted-foreground">
                            {p.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {included.slice(0, 3).map((n) => (
                          <span
                            key={n}
                            className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                          >
                            {n}
                          </span>
                        ))}
                        {included.length > 3 && (
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            +{included.length - 3} more
                          </span>
                        )}
                        {included.length === 0 && (
                          <span className="text-xs text-muted-foreground/60">No services</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {p.target_profile}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-semibold text-foreground">
                        <DollarSign className="h-3.5 w-3.5 text-accent" />
                        {formatMoneyFromCents(p.base_price_cents ?? 0, currency)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          p.is_active
                            ? "bg-success/15 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {p.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <PackageDialog
                        triggerLabel="Edit"
                        title="Edit package"
                        services={services}
                        initialValues={{
                          name: p.name,
                          description: p.description,
                          target_profile: p.target_profile,
                          base_price: (p.base_price_cents ?? 0) / 100,
                          is_active: p.is_active,
                          included_service_ids: includedByPackage.get(p.id) ?? [],
                        }}
                        onSubmitAction={async (values) => updatePackage(p.id, values)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
              {(packagesRes.data ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
                        <Package className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">No packages yet</p>
                        <p className="text-sm text-muted-foreground">
                          Create your first package bundle to get started.
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
