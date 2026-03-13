import Link from "next/link";
import { Car, Search, User, Palette } from "lucide-react";

import { requireProfile } from "@/lib/auth/require-profile";
import { one } from "@/lib/supabase/normalize";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function CarsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { supabase, profile } = await requireProfile();
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim();

  let query = supabase
    .from("cars")
    .select(
      "id, brand, model, year, color, license_plate, category, customers(id, display_name)",
    )
    .eq("studio_id", profile.studio_id)
    .order("created_at", { ascending: false })
    .limit(150);

  if (q) {
    query = query.or(
      `brand.ilike.%${q}%,model.ilike.%${q}%,license_plate.ilike.%${q}%`,
    );
  }

  const cars = await query;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Vehicles</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Complete vehicle registry with service history and owner details.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card/50 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <Car className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-lg font-bold text-foreground">{(cars.data ?? []).length}</div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Total Vehicles
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-lg font-semibold">Vehicle Registry</CardTitle>
            <form action="/cars" className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="q"
                  placeholder="Search brand, model, plate..."
                  defaultValue={q}
                  className="h-9 w-full bg-muted/30 pl-9 lg:w-[280px]"
                />
              </div>
              <Button type="submit" variant="secondary" size="sm">
                Search
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Vehicle
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Owner
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Category
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Plate
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(cars.data ?? []).map((car: any) => {
                const customer = one(car.customers as any) as any;
                return (
                  <TableRow key={car.id} className="group">
                    <TableCell>
                      <Link href={`/cars/${car.id}`} className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                          <Car className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground group-hover:text-primary group-hover:underline">
                            {car.brand} {car.model}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{car.year}</span>
                            <span className="flex items-center gap-1">
                              <Palette className="h-3 w-3" />
                              {car.color}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {customer ? (
                        <Link
                          href={`/customers/${customer.id}`}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:underline"
                        >
                          <User className="h-3.5 w-3.5" />
                          {customer.display_name}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground/60">No owner</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {String(car.category).replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="rounded-md bg-muted/50 px-2 py-1 font-mono text-xs text-foreground">
                        {car.license_plate}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(cars.data ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
                        <Car className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">No vehicles found</p>
                        <p className="text-sm text-muted-foreground">
                          {q ? "Try a different search term." : "Vehicles will appear here when added."}
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
