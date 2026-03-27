"use client";

import { useMemo, useState } from "react";
import { Clock, ShoppingBag, Tag } from "lucide-react";

import { formatMoneyFromCents } from "@/lib/format";
import { useI18n } from "@/components/i18n/i18n-provider";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ServiceDialog } from "./service-dialog";

type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  base_price_cents: number | null;
  category: string;
  is_active: boolean;
};

export function ServicesTable({
  services,
  currency,
}: {
  services: ServiceRow[];
  currency: string;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { t } = useI18n();

  const editing = useMemo(() => {
    if (!editingId) return null;
    return services.find((s) => s.id === editingId) ?? null;
  }, [editingId, services]);

  function onEdit(id: string) {
    setEditingId(id);
    setEditOpen(true);
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("services.table.service")}
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("services.table.category")}
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("services.table.duration")}
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("common.price")}
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("services.table.status")}
            </TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("common.actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((s) => (
            <TableRow key={s.id} className="group">
              <TableCell>
                <div>
                  <div className="font-semibold text-foreground">{s.name}</div>
                  <div className="line-clamp-1 text-xs text-muted-foreground">{s.description}</div>
                </div>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-0.5 text-xs font-medium text-foreground">
                  <Tag className="h-3 w-3" />
                  {s.category}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {s.duration_minutes} {t("common.minutesShort")}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <span className="text-sm font-semibold leading-none text-accent">฿</span>
                  {formatMoneyFromCents(s.base_price_cents ?? 0, currency)}
                </div>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    s.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.is_active ? t("common.active") : t("common.inactive")}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="secondary" size="sm" onClick={() => onEdit(s.id)}>
                  {t("common.edit")}
                </Button>
              </TableCell>
            </TableRow>
          ))}

          {services.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
                    <ShoppingBag className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t("services.emptyTitle")}</p>
                    <p className="text-sm text-muted-foreground">{t("services.emptyHint")}</p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <ServiceDialog
        title={t("services.editTitle")}
        mode="edit"
        serviceId={editing?.id}
        initialValues={
          editing
            ? {
                name: editing.name,
                description: editing.description ?? "",
                duration_minutes: editing.duration_minutes,
                base_price: (editing.base_price_cents ?? 0) / 100,
                category: editing.category,
                is_active: editing.is_active,
              }
            : undefined
        }
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditingId(null);
        }}
        hideTrigger
      />
    </>
  );
}
