import Link from "next/link";
import {
  User,
  ChevronRight,
  Wallet,
  CalendarClock,
  Car,
  StickyNote,
  History,
  Tag,
} from "lucide-react";

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

  const currency = studioRes.data?.currency ?? "THB";
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
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/customers" className="hover:text-foreground transition-colors">
          Customers
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">{customerRes.data.display_name}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {customerRes.data.display_name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {tags.map((t) => (
                <Badge key={t} variant="secondary" className="font-medium">
                  {t}
                </Badge>
              ))}
              {tags.length === 0 && (
                <span className="text-sm text-muted-foreground">No tags assigned</span>
              )}
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent" />
            <CardHeader className="relative pb-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
                <Wallet className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-xl font-bold text-foreground">
                {formatMoneyFromCents(totalSpend, currency)}
              </div>
              <p className="text-xs text-muted-foreground">Total Spend</p>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
            <CardHeader className="relative pb-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                <CalendarClock className="h-4 w-4 text-accent" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-xl font-bold text-foreground">{lastVisit ?? "—"}</div>
              <p className="text-xs text-muted-foreground">Last Visit</p>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <CardHeader className="relative pb-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Car className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-xl font-bold text-foreground">
                {(carsRes.data ?? []).length}
              </div>
              <p className="text-xs text-muted-foreground">Vehicles</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-semibold">Notes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {customerRes.data.notes || "No notes added for this customer."}
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-semibold">Vehicles Owned</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
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
                        {car.year || car.color ? (
                          <>
                            {car.year ?? "—"} • {car.color ?? "—"}
                          </>
                        ) : (
                          "—"
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {car.category ? String(car.category).replace("_", " ") : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {car.license_plate ?? "—"}
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

      {/* Booking History */}
      <Card>
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Booking History</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
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
