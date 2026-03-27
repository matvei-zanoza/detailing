import Link from "next/link";
import {
  Car,
  ChevronRight,
  User,
  Calendar,
  Palette,
  Tag,
  History,
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

  const currency = studioRes.data?.currency ?? "THB";
  const owner = one(carRes.data.customers as any) as any;

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/cars" className="hover:text-foreground transition-colors">
          Cars
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-foreground">
          {carRes.data.brand} {carRes.data.model}
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
            <Car className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {carRes.data.brand} {carRes.data.model}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {carRes.data.year && (
                <Badge variant="secondary" className="flex items-center gap-1.5 font-medium">
                  <Calendar className="h-3 w-3" />
                  {carRes.data.year}
                </Badge>
              )}
              {carRes.data.color && (
                <Badge variant="secondary" className="flex items-center gap-1.5 font-medium">
                  <Palette className="h-3 w-3" />
                  {carRes.data.color}
                </Badge>
              )}
              {carRes.data.category && (
                <Badge variant="secondary" className="flex items-center gap-1.5 font-medium">
                  <Tag className="h-3 w-3" />
                  {String(carRes.data.category).replace("_", " ")}
                </Badge>
              )}
              {carRes.data.license_plate && (
                <Badge variant="outline" className="font-mono font-semibold">
                  {carRes.data.license_plate}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Owner Card */}
        <Card className="shrink-0">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <User className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Owner</p>
              {owner ? (
                <Link
                  href={`/customers/${owner.id}`}
                  className="font-semibold text-foreground hover:text-primary transition-colors"
                >
                  {owner.display_name}
                </Link>
              ) : (
                <span className="text-muted-foreground">No owner assigned</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service History */}
      <Card>
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Service History</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
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
