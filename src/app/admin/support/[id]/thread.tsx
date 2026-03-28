"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/i18n/i18n-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { adminSendSupportMessage, adminSetTicketStatus } from "../actions";

type Row = {
  id: string;
  sender_type: "studio_user" | "super_admin";
  body: string;
  created_at: string;
};

const STATUSES = ["open", "waiting_admin", "waiting_studio", "closed"] as const;

export function AdminTicketThread({
  ticketId,
  status,
  rows,
}: {
  ticketId: string;
  status: string;
  rows: Row[];
}) {
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState("");
  const [nextStatus, setNextStatus] = useState(status);
  const { locale, t } = useI18n();

  function send() {
    startTransition(async () => {
      const res = await adminSendSupportMessage({ ticketId, body: text });
      if (!res.ok) {
        toast.error(t("adminSupport.thread.sendFailed"), { description: res.error });
        return;
      }
      setText("");
      toast.success(t("adminSupport.thread.sent"));
    });
  }

  function saveStatus() {
    startTransition(async () => {
      const res = await adminSetTicketStatus({ ticketId, status: nextStatus });
      if (!res.ok) {
        toast.error(t("adminSupport.thread.updateFailed"), { description: res.error });
        return;
      }
      toast.success(t("adminSupport.thread.statusUpdated"));
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">{t("adminSupport.thread.status")}</div>
          <Select value={nextStatus} onValueChange={setNextStatus} disabled={isPending}>
            <SelectTrigger className="h-9 w-[200px]">
              <SelectValue placeholder={t("adminSupport.thread.statusPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`adminSupport.status.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={saveStatus} disabled={isPending || nextStatus === status}>
            {isPending ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-md border border-border/60 p-3">
            <div className="text-xs text-muted-foreground">
              {r.sender_type === "super_admin" ? t("adminSupport.thread.admin") : t("adminSupport.thread.studio")} •{" "}
              {new Date(r.created_at).toLocaleString(locale === "th" ? "th-TH" : "en-US")}
            </div>
            <div className="mt-2 whitespace-pre-wrap text-sm">{r.body}</div>
          </div>
        ))}
        {rows.length === 0 ? <div className="text-sm text-muted-foreground">{t("adminSupport.thread.none")}</div> : null}
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">{t("adminSupport.thread.reply")}</div>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} disabled={isPending} />
        <div className="flex justify-end">
          <Button onClick={send} disabled={isPending || !text.trim() || status === "closed"}>
            {isPending
              ? t("adminSupport.thread.sending")
              : status === "closed"
                ? t("adminSupport.status.closed")
                : t("adminSupport.thread.send")}
          </Button>
        </div>
      </div>
    </div>
  );
}
