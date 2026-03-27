"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, ExternalLink, X } from "lucide-react";

import { one } from "@/lib/supabase/normalize";
import { useI18n } from "@/components/i18n/i18n-provider";

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
  if (t === "review_request") return "followUps.type.review";
  if (t === "rebook_reminder") return "followUps.type.rebook";
  return "followUps.type.inactive";
}

function templateFallback(type: TaskRow["type"]) {
  if (type === "review_request") return "followUps.template.review";
  if (type === "rebook_reminder") return "followUps.template.rebook";
  return "followUps.template.inactive";
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
  const { locale, t } = useI18n();

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
      toast.success(t("followUps.copied"));
    } catch {
      toast.error(t("followUps.copyFailed"));
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
        toast.error(t("followUps.updateFailed"), { description: res.error });
        return;
      }
      toast.success(t("followUps.markedSent"));
      router.refresh();
    });
  }

  function markSkipped(taskId: string) {
    startTransition(async () => {
      const res = await markFollowUpSkipped(taskId);
      if (!res.ok) {
        toast.error(t("followUps.updateFailed"), { description: res.error });
        return;
      }
      toast.success(t("followUps.skipped"));
      router.refresh();
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("followUps.type")}
          </TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("dashboard.customer")}
          </TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("followUps.car")}
          </TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("followUps.scheduled")}
          </TableHead>
          <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("followUps.actions")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => {
          const customer = one(task.customers as any) as any;
          const car = one(task.cars as any) as any;

          const customerName = customer?.display_name ?? t("followUps.customerPlaceholder");
          const carLabel = car ? `${car.brand} ${car.model}` : t("followUps.carPlaceholder");

          const template =
            templateMap.get(`${task.type}:${locale}`) ??
            templateMap.get(`${task.type}:en`) ??
            templateMap.get(`${task.type}:th`) ??
            t(templateFallback(task.type));

          const message = buildMessage({
            studioName,
            customerName,
            carLabel,
            template,
          });

          const contact = (customer?.whatsapp ?? customer?.phone ?? null) as string | null;

          return (
            <TableRow key={task.id}>
              <TableCell>
                <Badge variant="secondary" className="font-semibold">
                  {t(labelType(task.type))}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{customerName}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{carLabel}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(task.scheduled_for).toLocaleString(locale === "th" ? "th-TH" : "en-US")}
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
                    {t("followUps.copy")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => openWhatsApp(contact, message)}
                    className="gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t("followUps.whatsapp")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => openLine(message)}
                    className="gap-1.5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t("followUps.line")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => markSkipped(task.id)}
                    className="gap-1.5"
                  >
                    <X className="h-3.5 w-3.5" />
                    {t("followUps.skip")}
                  </Button>
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => markSent(task.id)}
                    className="gap-1.5"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {t("followUps.sent")}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}

        {tasks.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
              {t("followUps.nonePending")}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
