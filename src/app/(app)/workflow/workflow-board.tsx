"use client";

import Link from "next/link";
import { useTransition } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { WORKFLOW_STATUSES, WORKFLOW_LABELS, type BookingStatus } from "@/lib/domain/booking";
import { formatMoneyFromCents, titleCase } from "@/lib/format";
import { updateBookingStatus } from "@/app/(app)/bookings/actions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BookingCard = {
  id: string;
  booking_date: string;
  start_time: string;
  status: BookingStatus;
  price_cents: number;
  customers: { display_name: string } | null;
  cars: { brand: string; model: string } | null;
  staff_profiles: { display_name: string } | null;
  services: { name: string } | null;
  packages: { name: string } | null;
};

export function WorkflowBoard({
  currency,
  bookings,
}: {
  currency: string;
  bookings: BookingCard[];
}) {
  const [isPending, startTransition] = useTransition();

  async function move(bookingId: string, status: BookingStatus) {
    startTransition(async () => {
      try {
        await updateBookingStatus(bookingId, status);
        toast.success("Status updated");
      } catch (e) {
        toast.error("Update failed", {
          description: e instanceof Error ? e.message : "Please try again",
        });
      }
    });
  }

  const grouped: Record<string, BookingCard[]> = {};
  for (const s of WORKFLOW_STATUSES) grouped[s] = [];
  for (const b of bookings) {
    if (!grouped[b.status]) continue;
    grouped[b.status]!.push(b);
  }

  return (
    <div className="grid gap-3 lg:grid-cols-6">
      {WORKFLOW_STATUSES.map((status) => {
        const col = grouped[status] ?? [];
        return (
          <div key={status} className="rounded-xl border bg-card">
            <div className="flex items-center justify-between px-3 py-3">
              <div className="text-sm font-semibold">{WORKFLOW_LABELS[status]}</div>
              <Badge variant="secondary">{col.length}</Badge>
            </div>
            <div className="space-y-2 p-2">
              {col.map((b) => {
                const customer = b.customers?.display_name ?? "Customer";
                const car = b.cars ? `${b.cars.brand} ${b.cars.model}` : "Car";
                const svc = b.services?.name ?? b.packages?.name ?? "—";
                const staff = b.staff_profiles?.display_name ?? "Unassigned";
                return (
                  <motion.div
                    key={b.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className="rounded-lg border bg-background p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/bookings/${b.id}`} className="block truncate text-sm font-semibold hover:underline">
                          {customer}
                        </Link>
                        <div className="truncate text-xs text-muted-foreground">{car}</div>
                        <div className="truncate text-xs text-muted-foreground">{svc}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">{String(b.start_time).slice(0, 5)}</div>
                        <div className="text-sm font-semibold">{formatMoneyFromCents(b.price_cents ?? 0, currency)}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="truncate text-xs text-muted-foreground">{staff}</div>
                      <Select
                        value={b.status}
                        onValueChange={(v) => move(b.id, v as BookingStatus)}
                        disabled={isPending}
                      >
                        <SelectTrigger className="h-8 w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WORKFLOW_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {titleCase(s)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="mt-2 flex justify-end">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/bookings/${b.id}`}>Open</Link>
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
              {col.length === 0 && (
                <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                  No jobs
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
