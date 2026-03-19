"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const sendSchema = z.object({
  ticketId: z.string().uuid(),
  body: z.string().trim().min(1).max(4000),
});

type Result = { ok: true } | { ok: false; error: string };

export async function adminSendSupportMessage(raw: unknown): Promise<Result> {
  const { user } = await requireSuperAdmin();

  const parsed = sendSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const admin = createSupabaseAdminClient();

  const ticket = await admin
    .from("support_tickets")
    .select("id, status")
    .eq("id", parsed.data.ticketId)
    .maybeSingle();

  if (ticket.error) {
    return { ok: false, error: ticket.error.message ?? "Failed to load ticket" };
  }

  if (!ticket.data) {
    return { ok: false, error: "Ticket not found" };
  }

  if (ticket.data.status === "closed") {
    return { ok: false, error: "Ticket is closed" };
  }

  const msg = await admin.from("support_messages").insert({
    ticket_id: parsed.data.ticketId,
    sender_user_id: user.id,
    sender_type: "super_admin",
    body: parsed.data.body,
  });

  if (msg.error) {
    return { ok: false, error: msg.error.message ?? "Failed to send" };
  }

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${parsed.data.ticketId}`);

  return { ok: true };
}

const statusSchema = z.object({
  ticketId: z.string().uuid(),
  status: z.enum(["open", "waiting_admin", "waiting_studio", "closed"]),
});

export async function adminSetTicketStatus(raw: unknown): Promise<Result> {
  await requireSuperAdmin();

  const parsed = statusSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const admin = createSupabaseAdminClient();

  const up = await admin
    .from("support_tickets")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.ticketId);

  if (up.error) {
    return { ok: false, error: up.error.message ?? "Failed to update" };
  }

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${parsed.data.ticketId}`);

  return { ok: true };
}
