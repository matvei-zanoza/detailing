"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createSupportTicket } from "../actions";

export function NewTicketForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("other");
  const [message, setMessage] = useState("");

  function submit() {
    startTransition(async () => {
      const res = await createSupportTicket({ subject, category, message });
      if (!res.ok) {
        toast.error("Create failed", { description: res.error });
        return;
      }
      toast.success("Ticket created");
      router.push(`/support/${res.data.ticketId}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="text-sm font-medium">Subject</div>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} disabled={isPending} />
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Category</div>
        <Select value={category} onValueChange={setCategory} disabled={isPending}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="billing">billing</SelectItem>
            <SelectItem value="bug">bug</SelectItem>
            <SelectItem value="feature">feature</SelectItem>
            <SelectItem value="other">other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Message</div>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isPending}
          rows={7}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={submit} disabled={isPending || !subject.trim() || !message.trim()}>
          {isPending ? "Creating…" : "Create"}
        </Button>
      </div>
    </div>
  );
}
