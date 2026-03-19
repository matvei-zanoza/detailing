"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createStudio } from "./actions";

export function CreateStudioForm() {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  function onSubmit() {
    startTransition(async () => {
      const res = await createStudio({ name, slug });
      if (!res.ok) {
        toast.error("Create failed", { description: res.error });
        return;
      }
      toast.success("Studio created");
      setName("");
      setSlug("");
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} disabled={isPending} />
      </div>
      <div className="space-y-2">
        <Label>Slug</Label>
        <Input value={slug} onChange={(e) => setSlug(e.target.value)} disabled={isPending} placeholder="my-studio" />
      </div>
      <Button onClick={onSubmit} disabled={isPending || !name || !slug} className="w-full">
        {isPending ? "Creating…" : "Create"}
      </Button>
    </div>
  );
}
