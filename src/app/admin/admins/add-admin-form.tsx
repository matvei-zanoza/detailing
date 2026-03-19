"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { addAdminByEmail } from "./actions";

export function AddAdminForm() {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");

  function onSubmit() {
    startTransition(async () => {
      const res = await addAdminByEmail({ email });
      if (!res.ok) {
        toast.error("Add failed", { description: res.error });
        return;
      }
      toast.success("Admin added");
      setEmail("");
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} disabled={isPending} />
      </div>
      <Button onClick={onSubmit} disabled={isPending || !email} className="w-full">
        {isPending ? "Adding…" : "Add"}
      </Button>
    </div>
  );
}
