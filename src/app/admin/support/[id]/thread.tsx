"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

  function send() {
    startTransition(async () => {
      const res = await adminSendSupportMessage({ ticketId, body: text });
      if (!res.ok) {
        toast.error("Send failed", { description: res.error });
        return;
      }
      setText("");
      toast.success("Sent");
    });
  }

  function saveStatus() {
    startTransition(async () => {
      const res = await adminSetTicketStatus({ ticketId, status: nextStatus });
      if (!res.ok) {
        toast.error("Update failed", { description: res.error });
        return;
      }
      toast.success("Status updated");
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">Status</div>
          <Select value={nextStatus} onValueChange={setNextStatus} disabled={isPending}>
            <SelectTrigger className="h-9 w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={saveStatus} disabled={isPending || nextStatus === status}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-md border border-border/60 p-3">
            <div className="text-xs text-muted-foreground">
              {r.sender_type === "super_admin" ? "Admin" : "Studio"} • {new Date(r.created_at).toLocaleString()}
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
