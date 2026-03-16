"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { customerSchema, type CustomerValues } from "@/lib/schemas/customer";

import { createCustomer } from "./actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CustomerDialog({
  triggerLabel,
  title,
  onCreated,
}: {
  triggerLabel: string;
  title: string;
  onCreated?: (customer: { id: string; label: string }) => void;
}) {
  const [isPending, setIsPending] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm<CustomerValues>({
    resolver: zodResolver(customerSchema) as unknown as Resolver<CustomerValues>,
    defaultValues: {
      display_name: "",
      email: null,
      phone: null,
      notes: null,
    },
  });

  async function submit(values: CustomerValues) {
    setIsPending(true);
    try {
      const res = await createCustomer(values);
      toast.success("Customer created");
      onCreated?.({ id: res.id, label: res.display_name });
      setOpen(false);
      form.reset();
    } catch (e) {
      toast.error("Create failed", {
        description: e instanceof Error ? e.message : "Please try again",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerLabel === "New customer" ? "default" : "outline"}>
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Add a new customer to your studio.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={form.handleSubmit(submit as any)}>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input {...form.register("display_name")} placeholder="e.g. Alex Johnson" />
            {form.formState.errors.display_name && (
              <div className="text-xs text-destructive">{form.formState.errors.display_name.message}</div>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Email (optional)</Label>
              <Input {...form.register("email")} placeholder="name@example.com" />
              {form.formState.errors.email && (
                <div className="text-xs text-destructive">{form.formState.errors.email.message}</div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Phone (optional)</Label>
              <Input {...form.register("phone")} placeholder="+1 555 123 456" />
              {form.formState.errors.phone && (
                <div className="text-xs text-destructive">{form.formState.errors.phone.message}</div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea rows={3} {...form.register("notes")} />
            {form.formState.errors.notes && (
              <div className="text-xs text-destructive">{form.formState.errors.notes.message}</div>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
