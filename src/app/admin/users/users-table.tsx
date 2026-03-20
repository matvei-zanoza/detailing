"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { setUserAppAccess, setUserRole } from "./actions";

type Row = {
  id: string;
  display_name: string;
  role: string;
  app_access: "user" | "admin" | "super_admin";
  membership_status: string;
  studio_id: string | null;
  requested_studio_id: string | null;
};

const ROLES = [
  { value: "owner", label: "owner" },
  { value: "manager", label: "manager" },
  { value: "staff", label: "staff" },
] as const;

const APP_ACCESS = [
  { value: "user", label: "user" },
  { value: "admin", label: "admin" },
  { value: "super_admin", label: "super_admin" },
] as const;

export function UsersTable({ rows }: { rows: Row[] }) {
  const [isPending, startTransition] = useTransition();

  const initialDraft = useMemo(
    () => Object.fromEntries(rows.map((r) => [r.id, r.role])) as Record<string, string>,
    [rows],
  );

  const [draftRole, setDraftRole] = useState<Record<string, string>>(initialDraft);

  const initialDraftAccess = useMemo(
    () => Object.fromEntries(rows.map((r) => [r.id, r.app_access])) as Record<string, Row["app_access"]>,
    [rows],
  );

  const [draftAccess, setDraftAccess] = useState<Record<string, Row["app_access"]>>(initialDraftAccess);

  function saveRole(userId: string) {
    const role = draftRole[userId];
    startTransition(async () => {
      const res = await setUserRole({ userId, role });
      if (!res.ok) {
        toast.error("Update failed", { description: res.error });
        return;
      }
      toast.success("Role updated");
    });
  }

  function saveAccess(userId: string) {
    const access = draftAccess[userId];
    startTransition(async () => {
      const res = await setUserAppAccess({ userId, access: access === "admin" ? "admin" : "user" });
      if (!res.ok) {
        toast.error("Update failed", { description: res.error });
        return;
      }
      toast.success("Access updated");
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Name
          </TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            App
          </TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Membership
          </TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Studio
          </TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Requested
          </TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Role
          </TableHead>
          <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => {
          const canEditRole = r.membership_status === "active" && Boolean(r.studio_id);
          const canEditAccess = r.app_access !== "super_admin";
          const nextRole = draftRole[r.id] ?? r.role;
          const nextAccess = draftAccess[r.id] ?? r.app_access;
          return (
            <TableRow key={r.id}>
              <TableCell className="max-w-[320px] truncate text-sm font-medium">
                {r.display_name}
              </TableCell>
              <TableCell>
                <Select
                  value={nextAccess}
                  onValueChange={(v) => setDraftAccess((p) => ({ ...p, [r.id]: v as Row["app_access"] }))}
                  disabled={isPending || !canEditAccess}
                >
                  <SelectTrigger className="h-9 w-[160px]">
                    <SelectValue placeholder="App" />
                  </SelectTrigger>
                  <SelectContent>
                    {APP_ACCESS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} disabled={opt.value === "super_admin"}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{r.membership_status}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{r.studio_id ?? "—"}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {r.requested_studio_id ?? "—"}
              </TableCell>
              <TableCell>
                <Select
                  value={nextRole}
                  onValueChange={(v) => setDraftRole((p) => ({ ...p, [r.id]: v }))}
                  disabled={isPending || !canEditRole}
                >
                  <SelectTrigger className="h-9 w-[140px]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {canEditAccess ? (
                    <Button
                      variant="outline"
                      disabled={isPending || nextAccess === r.app_access}
                      onClick={() => saveAccess(r.id)}
                    >
                      {isPending ? "Saving…" : "Save app"}
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                  {canEditRole ? (
                    <Button
                      variant="outline"
                      disabled={isPending || nextRole === r.role}
                      onClick={() => saveRole(r.id)}
                    >
                      {isPending ? "Saving…" : "Save role"}
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}

        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
              No users
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}
