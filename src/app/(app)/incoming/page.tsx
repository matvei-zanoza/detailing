import Link from "next/link";
import { Inbox } from "lucide-react";

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

import { acknowledgeBookingRequest } from "./actions";

export default async function IncomingPage() {
  const { supabase, profile } = await requireProfile();

  const reqs = await supabase
    .from("booking_requests")
    .select("id, booking_id, customer_name, customer_phone, booking_date, start_time, end_time, created_at, status")
    .eq("studio_id", profile.studio_id)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (reqs.data ?? []).filter((r: any) => r.status === "new");

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-primary" />
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Incoming</h1>
          </div>
          <p className="text-sm text-muted-foreground">New booking requests that require acknowledgment.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold">New</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">When</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{r.booking_date}</div>
                    <div className="text-xs text-muted-foreground">
                      {String(r.start_time).slice(0, 5)}–{String(r.end_time).slice(0, 5)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link href={`/bookings/${r.booking_id}`} className="font-medium hover:underline">
                      {r.customer_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.customer_phone}</TableCell>
                  <TableCell className="text-right">
                    <form
                      action={async () => {
                        "use server";
                        await acknowledgeBookingRequest(r.id);
                      }}
                    >
                      <Button size="sm">OK</Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-16 text-center">
                    <div className="text-sm text-muted-foreground">No new incoming requests</div>
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
