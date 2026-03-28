"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";
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

import { setStudioMemberRole } from "./actions";

type Row = {
  id: string;
  display_name: string;
  role: "owner" | "manager" | "staff";
};

const ROLES = ["owner", "manager", "staff"] as const;

export function MembersTable({
  rows,
  currentUserRole,
}: {
  rows: Row[];
  currentUserRole: "owner" | "manager" | "staff";
}) {
  const [isPending, startTransition] = useTransition();
  const { t } = useI18n();

  const initialDraft = useMemo(
    () => Object.fromEntries(rows.map((r) => [r.id, r.role])) as Record<string, Row["role"]>,
    [rows],
  );

  const [draftRole, setDraftRole] = useState<Record<string, Row["role"]>>(initialDraft);

  function save(userId: string) {
    const role = draftRole[userId];
    startTransition(async () => {
      const res = await setStudioMemberRole({ userId, role });
      if (!res.ok) {
        toast.error(t("staff.members.updateFailed"), { description: res.error });
        return;
      }
      toast.success(t("staff.members.roleUpdated"));
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("staff.members.member")}
          </TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("staff.members.role")}
          </TableHead>
          <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("staff.members.action")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => {
          const canAssignOwner = currentUserRole === "owner";
          const canEditRole = currentUserRole === "owner" || currentUserRole === "manager";

          const nextRole = draftRole[r.id] ?? r.role;

          return (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.display_name}</TableCell>
              <TableCell>
                <Select
                  value={nextRole}
                  onValueChange={(v) => setDraftRole((p) => ({ ...p, [r.id]: v as Row["role"] }))}
                  disabled={
                    isPending ||
                    !canEditRole ||
                    (currentUserRole === "manager" && nextRole === "owner") ||
                    (currentUserRole === "manager" && r.role === "owner")
                  }
                >
                  <SelectTrigger className="h-9 w-[140px]">
                    <SelectValue placeholder={t("staff.members.rolePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.filter((role) => (canAssignOwner ? true : role !== "owner")).map((role) => (
                      <SelectItem key={role} value={role}>
                        {t(`role.${role}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-right">
                {canEditRole ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending || nextRole === r.role}
                    onClick={() => save(r.id)}
                    className="group gap-1.5 rounded-lg transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm hover:-translate-y-0.5 disabled:opacity-40"
                  >
                    {isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                    )}
                    {isPending ? t("staff.members.saving") : t("staff.members.save")}
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}

        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} className="py-12 text-center text-sm text-muted-foreground">
              {t("staff.members.none")}
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}
