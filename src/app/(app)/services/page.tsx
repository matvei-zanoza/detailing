import { ShoppingBag, Clock, DollarSign, Tag } from "lucide-react";

import { requireProfile } from "@/lib/auth/require-profile";
import { formatMoneyFromCents } from "@/lib/format";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
            onSubmitAction={createService}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold">Service Catalog</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Service
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Category
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Duration
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
              {(services.data ?? []).map((s) => (
                <TableRow key={s.id} className="group">
                  <TableCell>
                    <div>
                      <div className="font-semibold text-foreground">{s.name}</div>
                      <div className="line-clamp-1 text-xs text-muted-foreground">
                        {s.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-0.5 text-xs font-medium text-foreground">
                      <Tag className="h-3 w-3" />
                      {s.category}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {s.duration_minutes} min
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <DollarSign className="h-3.5 w-3.5 text-accent" />
                      {formatMoneyFromCents(s.base_price_cents ?? 0, currency)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        s.is_active
                          ? "bg-success/15 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
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
                  <TableCell colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
                        <ShoppingBag className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">No services yet</p>
                        <p className="text-sm text-muted-foreground">
                          Create your first service to get started.
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
