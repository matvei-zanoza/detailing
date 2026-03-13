import Link from "next/link";

import { requireProfile } from "@/lib/auth/require-profile";
import { one } from "@/lib/supabase/normalize";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cars</h1>
        <div className="text-sm text-muted-foreground">
          Each customer can own multiple cars, with service history and details.
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="text-base">Car list</CardTitle>
          <form action="/cars" className="flex gap-2">
            <Input
              name="q"
              placeholder="Search brand, model, plate…"
              defaultValue={q}
              className="w-full md:w-[300px]"
            />
          </form>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Plate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(cars.data ?? []).map((car: any) => {
                const customer = one(car.customers as any) as any;
                return (
                  <TableRow key={car.id}>
                    <TableCell>
                      <Link
                        href={`/cars/${car.id}`}
                        className="font-medium hover:underline"
                      >
                        {car.brand} {car.model}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {car.year} • {car.color}
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer ? (
                        <Link
                          href={`/customers/${customer.id}`}
                          className="text-sm text-muted-foreground hover:underline"
                        >
                          {customer.display_name}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {String(car.category).replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {car.license_plate}
                    </TableCell>
                  </TableRow>
                );
              })}
              {(cars.data ?? []).length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    No cars found.
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
