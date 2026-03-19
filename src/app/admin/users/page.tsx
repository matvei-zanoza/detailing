import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminUsersPage() {
  const { supabase } = await requireSuperAdmin();

  const { data, error } = await supabase
    .from("user_profiles")
    .select(
      "id, display_name, role, membership_status, studio_id, requested_studio_id, requested_at, approved_at, approved_by",
    )
    .order("requested_at", { ascending: false, nullsFirst: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []).slice(0, 200);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold">Users</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Name
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Role
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Membership
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Studio ID
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Requested studio
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id as string}>
                  <TableCell className="max-w-[320px] truncate text-sm font-medium">
                    {r.display_name as string}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.role as string}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.membership_status as string}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {(r.studio_id as string | null) ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {(r.requested_studio_id as string | null) ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    No users
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
