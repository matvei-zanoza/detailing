"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { approveMember, rejectMember } from "./actions";

type Row = {
  id: string;
  display_name: string;
  requested_at: string | null;
  current_role: "owner" | "manager" | "staff";
  membership_status: string;
};

export function RequestsTable({ rows }: { rows: Row[] }) {
  const [isPending, startTransition] = useTransition();

  function onApprove(userId: string) {
    startTransition(async () => {
      const res = await approveMember(userId);
      if (!res.ok) {
        toast.error("Approve failed", { description: res.error });
        return;
      }
      toast.success("Approved");
    });
  }

  function onReject(userId: string) {
    startTransition(async () => {
      const res = await rejectMember(userId);
      if (!res.ok) {
        toast.error("Reject failed", { description: res.error });
        return;
      }
      toast.success("Rejected");
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            User
          </TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Requested
          </TableHead>
          <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Action
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-medium">{r.display_name}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {r.requested_at ? new Date(r.requested_at).toLocaleString() : "—"}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button variant="outline" disabled={isPending} onClick={() => onReject(r.id)}>
                  Reject
                </Button>
                <Button disabled={isPending} onClick={() => onApprove(r.id)}>
                  {isPending ? "Saving…" : "Approve"}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={3} className="py-12 text-center text-sm text-muted-foreground">
              No pending requests
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
