import { requireProfile } from "@/lib/auth/require-profile";
import { formatMoneyFromCents } from "@/lib/format";

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

import { createService, updateService } from "./actions";
import { ServiceDialog } from "./service-dialog";

export default async function ServicesPage() {
  const { supabase, profile } = await requireProfile();

  const { data: studio } = await supabase
    .from("studios")
    .select("currency")
    .eq("id", profile.studio_id)
    .single();

  const currency = studio?.currency ?? "USD";

  const services = await supabase
    .from("services")
    .select("id, name, description, duration_minutes, base_price_cents, category, is_active")
    .eq("studio_id", profile.studio_id)
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Services</h1>
          <div className="text-sm text-muted-foreground">
            Manage your studio’s service catalog.
          </div>
        </div>
        <ServiceDialog
          triggerLabel="New service"
          title="Create service"
          onSubmitAction={createService}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service list</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(services.data ?? []).map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {s.description}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.category}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.duration_minutes} min
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatMoneyFromCents(s.base_price_cents ?? 0, currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.is_active ? "secondary" : "outline"}>
                      {s.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <ServiceDialog
                      triggerLabel="Edit"
                      title="Edit service"
                      initialValues={{
                        name: s.name,
                        description: s.description,
                        duration_minutes: s.duration_minutes,
                        base_price: (s.base_price_cents ?? 0) / 100,
                        category: s.category,
                        is_active: s.is_active,
                      }}
                      onSubmitAction={async (values) => updateService(s.id, values)}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {(services.data ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                    No services yet.
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
