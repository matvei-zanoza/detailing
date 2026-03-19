import { Headphones, MessageSquare, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";

import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

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
import { Badge } from "@/components/ui/badge";

export default async function AdminSupportPage() {
  const { supabase } = await requireSuperAdmin();

  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, studio_id, subject, category, status, last_message_at, created_at")
    .order("last_message_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []).slice(0, 300);

  // Stats
  const openTickets = rows.filter(r => r.status === 'open').length;
  const closedTickets = rows.filter(r => r.status === 'closed').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400">Open</Badge>;
      case 'closed':
        return <Badge variant="outline" className="border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Headphones className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{rows.length}</div>
              <div className="text-xs text-muted-foreground">Total Tickets</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-amber-500/10 p-3">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{openTickets}</div>
              <div className="text-xs text-muted-foreground">Open</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-emerald-500/10 p-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{closedTickets}</div>
              <div className="text-xs text-muted-foreground">Closed</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Support Tickets Table */}
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Support Tickets</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">View and manage support requests from studios</p>
            </div>
            {openTickets > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-500/10 px-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                {openTickets} open
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Studio
                </TableHead>
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
                <TableRow key={t.id as string} className="group">
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {(t.studio_id as string).slice(0, 8)}...
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{t.subject as string}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{t.category as string}</Badge>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(t.status as string)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(t.last_message_at as string).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm" className="opacity-0 transition-opacity group-hover:opacity-100">
                      <Link href={`/admin/support/${t.id as string}`}>Open</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Headphones className="h-8 w-8 text-muted-foreground/50" />
                      <span className="text-sm text-muted-foreground">No support tickets yet</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
