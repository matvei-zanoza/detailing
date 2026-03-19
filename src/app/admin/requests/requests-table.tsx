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

import { approveJoinRequest, rejectJoinRequest } from "./actions";

type Row = {
  id: string;
  studio_id: string;
  user_id: string;
  user_email: string | null;
  user_display_name: string | null;
  status: string;
  created_at: string;
  decided_at: string | null;
};

export function RequestsTable({ rows }: { rows: Row[] }) {
  const [isPending, startTransition] = useTransition();

  function approve(requestId: string) {
    startTransition(async () => {
      const res = await approveJoinRequest({ requestId });
      if (!res.ok) {
        toast.error("Approve failed", { description: res.error });
        return;
      }
      toast.success("Approved");
    });
  }

  function reject(requestId: string) {
    startTransition(async () => {
      const res = await rejectJoinRequest({ requestId });
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
            Status
          </TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Studio
          </TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            User
          </TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Email
          </TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Created
          </TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Decided
          </TableHead>
          <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => {
          const pending = r.status === "pending";
          return (
            <TableRow key={r.id}>
              <TableCell className="text-sm text-muted-foreground">{r.status}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{r.studio_id}</TableCell>
              <TableCell className="text-sm font-medium">
                {r.user_display_name ?? r.user_id}
                <div className="font-mono text-xs text-muted-foreground">{r.user_id}</div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{r.user_email ?? "—"}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(r.created_at).toLocaleString()}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {r.decided_at ? new Date(r.decided_at).toLocaleString() : "—"}
              </TableCell>
              <TableCell className="text-right">
                {pending ? (
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" disabled={isPending} onClick={() => reject(r.id)}>
                      Reject
                    </Button>
                    <Button disabled={isPending} onClick={() => approve(r.id)}>
                      {isPending ? "Working…" : "Approve"}
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}

        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
              No join requests
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}
