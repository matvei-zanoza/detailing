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

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, profile } = await requireProfile();

  const [studioRes, customerRes, carsRes, bookingsRes, tagRes, paymentsRes] =
    await Promise.all([
      supabase
        .from("studios")
        .select("currency")
        .eq("id", profile.studio_id)
        .single(),
      supabase
        .from("customers")
        .select("id, display_name, notes")
        .eq("studio_id", profile.studio_id)
        .eq("id", id)
        .single(),
      supabase
        .from("cars")
        .select("id, brand, model, year, color, license_plate, category")
        .eq("studio_id", profile.studio_id)
        .eq("customer_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("bookings")
        .select(
          "id, booking_date, start_time, status, price_cents, cars(brand, model), services(name), packages(name)",
        )
        .eq("studio_id", profile.studio_id)
        .eq("customer_id", id)
        .order("booking_date", { ascending: false })
        .order("start_time", { ascending: false })
        .limit(60),
      supabase
        .from("customer_tag_assignments")
        .select("customer_tags(name)")
        .eq("studio_id", profile.studio_id)
        .eq("customer_id", id)
        .limit(20),
      supabase
        .from("payments")
        .select("amount_cents, booking_id, paid_at")
        .eq("studio_id", profile.studio_id)
        .order("paid_at", { ascending: false })
        .limit(600),
    ]);

  if (customerRes.error || !customerRes.data) {
    throw customerRes.error ?? new Error("Customer not found");
  }

  const currency = studioRes.data?.currency ?? "USD";
  const bookingIds = new Set((bookingsRes.data ?? []).map((b) => b.id));
  const customerPayments = (paymentsRes.data ?? []).filter((p) =>
    bookingIds.has(p.booking_id),
  );

  const totalSpend = customerPayments.reduce(
    (sum, p) => sum + (p.amount_cents ?? 0),
    0,
  );

  const lastVisit = (bookingsRes.data ?? [])[0]?.booking_date ?? null;

  const tags = (tagRes.data ?? [])
    .map((t) => {
      const obj = one(t.customer_tags as any) as any;
      return obj?.name as string | undefined;
    })
    .filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        <Link href="/customers" className="hover:underline">
          Customers
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{customerRes.data.display_name}</span>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {customerRes.data.display_name}
          </h1>
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((t) => (
              <Badge key={t} variant="secondary">
                {t}
              </Badge>
            ))}
            {tags.length === 0 ? (
              <span className="text-sm text-muted-foreground">No tags</span>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total spend</CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-semibold">
              {formatMoneyFromCents(totalSpend, currency)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Last visit</CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-semibold">
              {lastVisit ?? "—"}
            </CardContent>
          </Card>
          <Card className="hidden md:block">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cars</CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-semibold">
              {(carsRes.data ?? []).length}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {customerRes.data.notes ?? "No notes."}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Cars owned</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Plate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(carsRes.data ?? []).map((car) => (
                  <TableRow key={car.id}>
                    <TableCell>
                      <Link href={`/cars/${car.id}`} className="font-medium hover:underline">
                        {car.brand} {car.model}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {car.year} • {car.color}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {String(car.category).replace("_", " ")}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {car.license_plate}
                    </TableCell>
                  </TableRow>
                ))}
                {(carsRes.data ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
                      No cars added.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Booking history</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Car</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(bookingsRes.data ?? []).map((b: any) => {
                const car = one(b.cars as any) as any;
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
                      {car?.brand} {car?.model}
                    </TableCell>
                    <TableCell>{svc?.name ?? pkg?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{String(b.status).replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoneyFromCents(b.price_cents ?? 0, currency)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {(bookingsRes.data ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No bookings yet.
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
