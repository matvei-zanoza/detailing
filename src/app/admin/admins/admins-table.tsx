"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Row = { user_id: string; created_at: string };

export function AdminsTable({ rows }: { rows: Row[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            User ID
          </TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Added
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.user_id}>
            <TableCell className="font-mono text-xs">{r.user_id}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {new Date(r.created_at).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={2} className="py-12 text-center text-sm text-muted-foreground">
              No admins
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
