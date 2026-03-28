import { Headphones, MessageSquare, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";

import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { getRequestLocale, t as tServer } from "@/lib/i18n/server";

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
  const locale = await getRequestLocale();
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
        return (
          <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400">
            {tServer(locale, "adminSupport.open")}
          </Badge>
        );
      case 'closed':
        return (
          <Badge variant="outline" className="border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            {tServer(locale, "adminSupport.closed")}
          </Badge>
        );
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
              <div className="text-xs text-muted-foreground">{tServer(locale, "adminSupport.totalTickets")}</div>
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
              <div className="text-xs text-muted-foreground">{tServer(locale, "adminSupport.open")}</div>
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
              <div className="text-xs text-muted-foreground">{tServer(locale, "adminSupport.closed")}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Support Tickets Table */}
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">{tServer(locale, "adminSupport.supportTickets")}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{tServer(locale, "adminSupport.subtitle")}</p>
            </div>
            {openTickets > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-500/10 px-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                {tServer(locale, "adminSupport.openCount").replace("{count}", String(openTickets))}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {tServer(locale, "adminSupport.table.studio")}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {tServer(locale, "adminSupport.table.subject")}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {tServer(locale, "adminSupport.table.category")}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {tServer(locale, "adminSupport.table.status")}
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {tServer(locale, "adminSupport.table.updated")}
                </TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {tServer(locale, "adminSupport.table.action")}
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
                    <Badge variant="secondary" className="text-xs">
                      {t.category ? tServer(locale, `support.category.${String(t.category)}`) : "—"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(t.status as string)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(t.last_message_at as string).toLocaleDateString(locale === "th" ? "th-TH" : "en-US")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm" className="opacity-0 transition-opacity group-hover:opacity-100">
                      <Link href={`/admin/support/${t.id as string}`}>{tServer(locale, "adminSupport.openTicket")}</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Headphones className="h-8 w-8 text-muted-foreground/50" />
                      <span className="text-sm text-muted-foreground">{tServer(locale, "adminSupport.none")}</span>
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
