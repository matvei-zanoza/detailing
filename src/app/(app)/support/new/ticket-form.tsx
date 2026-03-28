"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";
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
  const { t } = useI18n();

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("other");
  const [message, setMessage] = useState("");

  function submit() {
    startTransition(async () => {
      const res = await createSupportTicket({ subject, category, message });
      if (!res.ok) {
        toast.error(t("support.new.createFailed"), { description: res.error });
        return;
      }
      toast.success(t("support.new.created"));
      router.push(`/support/${res.data.ticketId}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="text-sm font-medium">{t("support.new.subject")}</div>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} disabled={isPending} />
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">{t("support.new.category")}</div>
        <Select value={category} onValueChange={setCategory} disabled={isPending}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder={t("support.new.category")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="billing">{t("support.category.billing")}</SelectItem>
            <SelectItem value="bug">{t("support.category.bug")}</SelectItem>
            <SelectItem value="feature">{t("support.category.feature")}</SelectItem>
            <SelectItem value="other">{t("support.category.other")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">{t("support.new.message")}</div>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isPending}
          rows={7}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={submit} disabled={isPending || !subject.trim() || !message.trim()}>
          {isPending ? t("support.new.creating") : t("support.new.create")}
        </Button>
      </div>
    </div>
  );
}
