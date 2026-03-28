"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/i18n/i18n-provider";

import { sendSupportMessage } from "../actions";

type Row = {
  id: string;
  sender_type: "studio_user" | "super_admin";
  body: string;
  created_at: string;
};

export function TicketThread({
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
  const { locale, t } = useI18n();

  function send() {
    startTransition(async () => {
      const res = await sendSupportMessage({ ticketId, body: text });
      if (!res.ok) {
        toast.error(t("support.thread.sendFailed"), { description: res.error });
        return;
      }
      setText("");
      toast.success(t("support.thread.sent"));
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-md border border-border/60 p-3">
            <div className="text-xs text-muted-foreground">
              {r.sender_type === "super_admin" ? t("support.thread.admin") : t("support.thread.you")} •{" "}
              {new Date(r.created_at).toLocaleString(locale === "th" ? "th-TH" : "en-US")}
            </div>
            <div className="mt-2 whitespace-pre-wrap text-sm">{r.body}</div>
          </div>
        ))}
        {rows.length === 0 ? <div className="text-sm text-muted-foreground">{t("support.thread.none")}</div> : null}
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">{t("support.thread.reply")}</div>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} disabled={isPending} />
        <div className="flex justify-end">
          <Button onClick={send} disabled={isPending || !text.trim() || status === "closed"}>
            {isPending
              ? t("support.thread.sending")
              : status === "closed"
                ? t("support.thread.closed")
                : t("support.thread.send")}
          </Button>
        </div>
      </div>
    </div>
  );
}
