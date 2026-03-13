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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Packages</h1>
          <div className="text-sm text-muted-foreground">
            Tiers that bundle multiple services into one offering.
          </div>
        </div>
        <PackageDialog
          triggerLabel="New package"
          title="Create package"
          services={services}
          onSubmitAction={createPackage}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Package list</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Included</TableHead>
                <TableHead>Target profile</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(packagesRes.data ?? []).map((p) => {
                const included = includedNames(p.id);
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {p.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {included.slice(0, 3).map((n) => (
                          <Badge key={n} variant="secondary">
                            {n}
                          </Badge>
                        ))}
                        {included.length > 3 ? (
                          <Badge variant="outline">+{included.length - 3}</Badge>
                        ) : null}
                        {included.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.target_profile}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatMoneyFromCents(p.base_price_cents ?? 0, currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.is_active ? "secondary" : "outline"}>
                        {p.is_active ? "Active" : "Inactive"}
                      </Badge>
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
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    No packages yet.
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
