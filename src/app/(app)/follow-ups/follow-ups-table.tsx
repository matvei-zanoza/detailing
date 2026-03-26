"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, ExternalLink, X } from "lucide-react";

import { one } from "@/lib/supabase/normalize";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { markFollowUpSent, markFollowUpSkipped } from "./actions";

type Template = {
  type: "review_request" | "rebook_reminder" | "inactive_customer";
  language: string;
  body: string;
};

type TaskRow = {
  id: string;
  type: "review_request" | "rebook_reminder" | "inactive_customer";
  status: "pending" | "sent" | "skipped";
  scheduled_for: string;
  sent_at: string | null;
  customers:
    | {
        id: string;
        display_name: string;
        phone: string | null;
        whatsapp: string | null;
        line: string | null;
      }
    | { id: string; display_name: string }[]
    | null;
  cars:
    | {
        id: string;
        brand: string;
        model: string;
        license_plate: string;
      }
    | { id: string; brand: string; model: string; license_plate: string }[]
    | null;
  bookings:
    | {
        id: string;
        booking_date: string;
        price_cents: number;
      }
    | { id: string; booking_date: string; price_cents: number }[]
    | null;
};

function labelType(t: TaskRow["type"]) {
  if (t === "review_request") return "Review";
  if (t === "rebook_reminder") return "Rebook";
  return "Inactive";
}

function templateFallback(type: TaskRow["type"]) {
  if (type === "review_request") {
    return "Hi {customer}, thanks for visiting {studio}. If you have 30 seconds, could you leave us a quick review?";
  }
  if (type === "rebook_reminder") {
    return "Hi {customer}, it’s been a few weeks since we detailed your {car}. Want to book a refresh?";
  }
  return "Hi {customer}, we haven’t seen your {car} in a while — want to book your next detail?";
}

function normalizePhone(raw: string) {
  const digits = raw.replace(/[^0-9+]/g, "");
  if (!digits) return "";
  if (digits.startsWith("+")) return digits;
  return digits.replace(/[^0-9]/g, "");
}

function buildMessage(args: {
  studioName: string;
  customerName: string;
  carLabel: string;
  template: string;
}) {
  return args.template
    .replaceAll("{studio}", args.studioName)
    .replaceAll("{customer}", args.customerName)
    .replaceAll("{car}", args.carLabel);
}

export function FollowUpsTable({
  studioName,
  tasks,
  templates,
}: {
  studioName: string;
  tasks: TaskRow[];
  templates: Template[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const templateMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of templates ?? []) {
      if (!t?.type || !t?.body) continue;
      const key = `${t.type}:${t.language ?? "en"}`;
      if (!map.has(key)) map.set(key, t.body);
    }
    return map;
  }, [templates]);

  async function onCopy(message: string) {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  }

  function openWhatsApp(phoneOrNull: string | null, message: string) {
    const encoded = encodeURIComponent(message);
    const phone = phoneOrNull ? normalizePhone(phoneOrNull) : "";
    const url = phone
      ? `https://wa.me/${phone.replace(/^\+/, "")}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function openLine(message: string) {
    const encoded = encodeURIComponent(message);
    const url = `https://line.me/R/msg/text/?${encoded}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function markSent(taskId: string) {
    startTransition(async () => {
      const res = await markFollowUpSent(taskId);
      if (!res.ok) {
        toast.error("Update failed", { description: res.error });
        return;
      }
      toast.success("Marked sent");
      router.refresh();
    });
  }

  function markSkipped(taskId: string) {
    startTransition(async () => {
      const res = await markFollowUpSkipped(taskId);
      if (!res.ok) {
        toast.error("Update failed", { description: res.error });
        return;
      }
      toast.success("Skipped");
      router.refresh();
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Type
          </TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Customer
          </TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Car
          </TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Scheduled
          </TableHead>
          <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((t) => {
          const customer = one(t.customers as any) as any;
          const car = one(t.cars as any) as any;

          const customerName = customer?.display_name ?? "Customer";
          const carLabel = car ? `${car.brand} ${car.model}` : "Car";

          const template =
            templateMap.get(`${t.type}:en`) ?? templateMap.get(`${t.type}:th`) ?? templateFallback(t.type);

          const message = buildMessage({
            studioName,
            customerName,
            carLabel,
            template,
          });

          const contact = (customer?.whatsapp ?? customer?.phone ?? null) as string | null;

          return (
            <TableRow key={t.id}>
              <TableCell>
                <Badge variant="secondary" className="font-semibold">
                  {labelType(t.type)}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{customerName}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{carLabel}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(t.scheduled_for).toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => onCopy(message)}
                    className="gap-1.5"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => openWhatsApp(contact, message)}
                    className="gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => openLine(message)}
                    className="gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    LINE
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => markSkipped(t.id)}
                    className="gap-1.5"
                  >
                    <X className="h-3.5 w-3.5" />
                    Skip
                  </Button>
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => markSent(t.id)}
                    className="gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Sent
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}

        {tasks.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
              No follow-ups pending
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
