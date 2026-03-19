import Link from "next/link";

import { requireProfile } from "@/lib/auth/require-profile";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function SupportPage() {
  const { supabase, profile } = await requireProfile();

  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, subject, category, status, last_message_at, created_at")
    .eq("studio_id", profile.studio_id)
    .order("last_message_at", { ascending: false });

  if (error) throw error;

  const rows = data ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Support</h1>
          <p className="text-sm text-muted-foreground">Contact the system admins.</p>
        </div>
        <Button asChild>
          <Link href="/support/new">New ticket</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold">Tickets</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Subject
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Category
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Updated
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => (
                <TableRow key={t.id as string}>
                  <TableCell className="max-w-[420px] truncate text-sm font-medium">
                    {t.subject as string}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.category as string}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{t.status as string}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(t.last_message_at as string).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/support/${t.id as string}`}>Open</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                    No tickets yet
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
