"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { approveMember, rejectMember } from "./actions";

type Row = {
  id: string;
  display_name: string;
  email: string | null;
  requested_at: string | null;
};

export function RequestsTable({ rows }: { rows: Row[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const { locale, t } = useI18n();

  function onApprove(userId: string) {
    startTransition(async () => {
      setPendingUserId(userId);
      const res = await approveMember(userId);
      if (!res.ok) {
        toast.error(t("staff.requests.approveFailed"), { description: res.error });
        setPendingUserId(null);
        return;
      }
      toast.success(t("staff.requests.approved"));
      router.refresh();
      setPendingUserId(null);
    });
  }

  function onReject(userId: string) {
    startTransition(async () => {
      setPendingUserId(userId);
      const res = await rejectMember(userId);
      if (!res.ok) {
        toast.error(t("staff.requests.rejectFailed"), { description: res.error });
        setPendingUserId(null);
        return;
      }
      toast.success(t("staff.requests.rejected"));
      router.refresh();
      setPendingUserId(null);
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("staff.requests.user")}
          </TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("staff.requests.email")}
          </TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("staff.requests.requested")}
          </TableHead>
          <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("staff.requests.action")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-medium">{r.display_name}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{r.email ?? "—"}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {r.requested_at ? new Date(r.requested_at).toLocaleString(locale === "th" ? "th-TH" : "en-US") : "—"}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending || pendingUserId === r.id}
                  onClick={() => onReject(r.id)}
                  className="group gap-1.5 rounded-lg border-red-200 bg-red-50/50 text-red-600 transition-all duration-200 hover:border-red-300 hover:bg-red-100 hover:text-red-700 hover:shadow-sm dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:border-red-800 dark:hover:bg-red-950/50"
                >
                  {isPending && pendingUserId === r.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                  )}
                  {t("staff.requests.reject")}
                </Button>
                <Button 
                  size="sm"
                  disabled={isPending || pendingUserId === r.id} 
                  onClick={() => onApprove(r.id)}
                  className="group gap-1.5 rounded-lg bg-emerald-600 text-white transition-all duration-200 hover:bg-emerald-500 hover:shadow-md hover:shadow-emerald-500/20 hover:-translate-y-0.5"
                >
                  {isPending && pendingUserId === r.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                  )}
                  {isPending && pendingUserId === r.id ? t("staff.members.saving") : t("staff.requests.approve")}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
              {t("staff.requests.nonePending")}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
