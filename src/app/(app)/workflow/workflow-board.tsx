"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Clock, User, ExternalLink, ChevronRight } from "lucide-react";

import { WORKFLOW_STATUSES, WORKFLOW_LABELS, type BookingStatus } from "@/lib/domain/booking";
import { formatMoneyFromCents, titleCase } from "@/lib/format";
import { updateBookingStatus } from "@/app/(app)/bookings/actions";

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

// Column header colors based on workflow stage
const COLUMN_STYLES: Record<string, { bg: string; accent: string; count: string }> = {
  scheduled: { bg: "bg-muted/30", accent: "text-muted-foreground", count: "bg-muted text-muted-foreground" },
  arrived: { bg: "bg-primary/5", accent: "text-primary", count: "bg-primary/15 text-primary" },
  in_progress: { bg: "bg-warning/5", accent: "text-warning", count: "bg-warning/15 text-warning" },
  quality_check: { bg: "bg-accent/5", accent: "text-accent", count: "bg-accent/15 text-accent" },
  finished: { bg: "bg-success/5", accent: "text-success", count: "bg-success/15 text-success" },
  paid: { bg: "bg-success/10", accent: "text-success", count: "bg-success/20 text-success" },
};

export function WorkflowBoard({
  currency,
  bookings,
}: {
  currency: string;
  bookings: BookingCard[];
}) {
  const [isPending, setIsPending] = useState(false);

  async function move(bookingId: string, status: BookingStatus) {
    setIsPending(true);
    try {
      await updateBookingStatus(bookingId, status);
      toast.success("Status updated");
    } catch (e) {
      toast.error("Update failed", {
        description: e instanceof Error ? e.message : "Please try again",
      });
    } finally {
      setIsPending(false);
    }
  }

  const grouped: Record<string, BookingCard[]> = {};
  for (const s of WORKFLOW_STATUSES) grouped[s] = [];
  for (const b of bookings) {
    if (!grouped[b.status]) continue;
    grouped[b.status]!.push(b);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-6">
      {WORKFLOW_STATUSES.map((status) => {
        const col = grouped[status] ?? [];
        const styles = COLUMN_STYLES[status] || COLUMN_STYLES.scheduled;

        return (
          <div
            key={status}
            className={`rounded-xl border border-border/50 ${styles.bg} min-h-[400px]`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between border-b border-border/30 px-3 py-3">
              <div className={`text-sm font-semibold ${styles.accent}`}>
                {WORKFLOW_LABELS[status]}
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${styles.count}`}
              >
                {col.length}
              </span>
            </div>

            {/* Cards Container */}
            <div className="space-y-3 p-3">
              {col.map((b) => {
                const customer = b.customers?.display_name ?? "Customer";
                const car = b.cars ? `${b.cars.brand} ${b.cars.model}` : "Car";
                const svc = b.services?.name ?? b.packages?.name ?? "—";
                const staff = b.staff_profiles?.display_name ?? "Unassigned";

                return (
                  <motion.div
                    key={b.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="group rounded-lg border border-border/50 bg-card p-3 shadow-sm transition-all hover:border-border hover:shadow-md"
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/bookings/${b.id}`}
                          className="block truncate text-sm font-semibold text-foreground hover:text-primary"
                        >
                          {customer}
                        </Link>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {car}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {String(b.start_time).slice(0, 5)}
                        </div>
                        <div className="mt-0.5 text-sm font-bold text-foreground">
                          {formatMoneyFromCents(b.price_cents ?? 0, currency)}
                        </div>
                      </div>
                    </div>

                    {/* Service */}
                    <div className="mt-2 truncate rounded-md bg-muted/40 px-2 py-1 text-xs font-medium text-foreground">
                      {svc}
                    </div>

                    {/* Staff & Status */}
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span className="truncate max-w-[80px]">{staff}</span>
                      </div>
                      <Select
                        value={b.status}
                        onValueChange={(v) => move(b.id, v as BookingStatus)}
                        disabled={isPending}
                      >
                        <SelectTrigger className="h-7 w-[110px] text-xs bg-muted/30 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WORKFLOW_STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">
                              {titleCase(s)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Action Link */}
                    <div className="mt-2 flex justify-end">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Link href={`/bookings/${b.id}`}>
                          Details
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </motion.div>
                );
              })}

              {/* Empty State */}
              {col.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/50 py-8 text-center">
                  <div className="text-xs text-muted-foreground/70">No jobs</div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
