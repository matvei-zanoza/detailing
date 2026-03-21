"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { setStudioListing, switchToStudio } from "./actions";

type Row = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  listed_name: string | null;
  listed_active: boolean;
};

export function StudiosTable({ rows }: { rows: Row[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [draftName, setDraftName] = useState<Record<string, string>>(
    Object.fromEntries(rows.map((r) => [r.id, r.listed_name ?? r.name])),
  );

  function toggle(row: Row, nextActive: boolean) {
    startTransition(async () => {
      const publicName = draftName[row.id] ?? row.name;
      const res = await setStudioListing({ studioId: row.id, publicName, isActive: nextActive });
      if (!res.ok) {
        toast.error("Update failed", { description: res.error });
        return;
      }
      toast.success("Saved");
      router.refresh();
    });
  }

  function onSwitch(row: Row) {
    startTransition(async () => {
      const res = await switchToStudio({ studioId: row.id });
      if (!res.ok) {
        toast.error("Switch failed", { description: res.error });
        return;
      }
      toast.success("Switched");
      router.refresh();
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Studio
          </TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Slug
          </TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Directory name
          </TableHead>
          <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-medium">{r.name}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{r.slug}</TableCell>
            <TableCell>
              <Input
                value={draftName[r.id] ?? ""}
                onChange={(e) => setDraftName((p) => ({ ...p, [r.id]: e.target.value }))}
                disabled={isPending}
                className="h-9"
              />
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button variant="secondary" disabled={isPending} onClick={() => onSwitch(r)}>
                  Switch
                </Button>
                <Button
                  variant="outline"
                  disabled={isPending}
                  onClick={() => toggle(r, false)}
                >
                  Hide
                </Button>
                <Button disabled={isPending} onClick={() => toggle(r, true)}>
                  {isPending ? "Saving…" : r.listed_active ? "Listed" : "List"}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
              No studios
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
