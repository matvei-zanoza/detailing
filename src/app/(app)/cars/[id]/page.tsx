import Link from "next/link";

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

export default async function CarDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, profile } = await requireProfile();

  const [studioRes, carRes, bookingsRes] = await Promise.all([
    supabase
      .from("studios")
      .select("currency")
      .eq("id", profile.studio_id)
      .single(),
    supabase
      .from("cars")
      .select(
        "id, brand, model, year, color, license_plate, category, customers(id, display_name)",
      )
      .eq("studio_id", profile.studio_id)
      .eq("id", id)
      .single(),
    supabase
      .from("bookings")
      .select(
        "id, booking_date, start_time, status, price_cents, customers(display_name), services(name), packages(name)",
      )
      .eq("studio_id", profile.studio_id)
      .eq("car_id", id)
      .order("booking_date", { ascending: false })
      .order("start_time", { ascending: false })
      .limit(60),
  ]);

  if (carRes.error || !carRes.data) {
    throw carRes.error ?? new Error("Car not found");
  }

  const currency = studioRes.data?.currency ?? "USD";
  const owner = one(carRes.data.customers as any) as any;

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        <Link href="/cars" className="hover:underline">
          Cars
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">
          {carRes.data.brand} {carRes.data.model}
        </span>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {carRes.data.brand} {carRes.data.model}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary">{carRes.data.year}</Badge>
            <Badge variant="secondary">{carRes.data.color}</Badge>
            <Badge variant="secondary">
              {String(carRes.data.category).replace("_", " ")}
            </Badge>
            <Badge variant="outline" className="font-mono">
              {carRes.data.license_plate}
            </Badge>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Owner:{" "}
          {owner ? (
            <Link
              href={`/customers/${owner.id}`}
              className="font-medium text-foreground hover:underline"
            >
              {owner.display_name}
            </Link>
          ) : (
            "—"
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service history</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(bookingsRes.data ?? []).map((b: any) => {
                const customer = one(b.customers as any) as any;
                const svc = one(b.services as any) as any;
                const pkg = one(b.packages as any) as any;
                return (
                  <TableRow key={b.id}>
                    <TableCell>
                      <Link href={`/bookings/${b.id}`} className="font-medium hover:underline">
                        {b.booking_date}
                      </Link>
                      <div className="text-xs text-muted-foreground">{String(b.start_time).slice(0, 5)}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {customer?.display_name ?? "—"}
                    </TableCell>
                    <TableCell>{svc?.name ?? pkg?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {String(b.status).replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoneyFromCents(b.price_cents ?? 0, currency)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {(bookingsRes.data ?? []).length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No bookings yet for this car.
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
