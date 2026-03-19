"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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

  function send() {
    startTransition(async () => {
      const res = await sendSupportMessage({ ticketId, body: text });
      if (!res.ok) {
        toast.error("Send failed", { description: res.error });
        return;
      }
      setText("");
      toast.success("Sent");
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-md border border-border/60 p-3">
            <div className="text-xs text-muted-foreground">
              {r.sender_type === "super_admin" ? "Admin" : "You"} • {new Date(r.created_at).toLocaleString()}
            </div>
            <div className="mt-2 whitespace-pre-wrap text-sm">{r.body}</div>
          </div>
        ))}
        {rows.length === 0 ? <div className="text-sm text-muted-foreground">No messages yet</div> : null}
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Reply</div>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} disabled={isPending} />
        <div className="flex justify-end">
          <Button onClick={send} disabled={isPending || !text.trim() || status === "closed"}>
            {isPending ? "Sending…" : status === "closed" ? "Closed" : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
