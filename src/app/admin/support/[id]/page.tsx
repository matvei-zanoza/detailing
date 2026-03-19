import { notFound } from "next/navigation";

import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { AdminTicketThread } from "./thread";

export default async function AdminSupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireSuperAdmin();
  const { id } = await params;

  const ticketRes = await supabase
    .from("support_tickets")
    .select("id, studio_id, subject, category, status, last_message_at")
    .eq("id", id)
    .maybeSingle();

  if (ticketRes.error) throw ticketRes.error;
  if (!ticketRes.data) notFound();

  const messagesRes = await supabase
    .from("support_messages")
    .select("id, sender_user_id, sender_type, body, created_at")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true });

  if (messagesRes.error) throw messagesRes.error;

  const rows = (messagesRes.data ?? []).map((m) => ({
    id: m.id as string,
    sender_type: m.sender_type as "studio_user" | "super_admin",
    body: m.body as string,
    created_at: m.created_at as string,
  }));

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold">{ticketRes.data.subject as string}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <AdminTicketThread ticketId={id} status={ticketRes.data.status as string} rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
