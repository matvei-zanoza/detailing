"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth/require-profile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const createTicketSchema = z.object({
  subject: z.string().trim().min(3).max(120),
  category: z.enum(["billing", "bug", "feature", "other"]).default("other"),
  message: z.string().trim().min(1).max(4000),
});

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export async function createSupportTicket(raw: unknown): Promise<Result<{ ticketId: string }>> {
  const { user, profile } = await requireProfile();

  if (!profile.studio_id) return { ok: false, error: "Studio is required" };

  const parsed = createTicketSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const admin = createSupabaseAdminClient();

  const ticket = await admin
    .from("support_tickets")
    .insert({
      studio_id: profile.studio_id,
      created_by: user.id,
      subject: parsed.data.subject,
      category: parsed.data.category,
      status: "open",
    })
    .select("id")
    .maybeSingle();

  if (ticket.error || !ticket.data) {
    return { ok: false, error: ticket.error?.message ?? "Failed to create ticket" };
  }

  const msg = await admin.from("support_messages").insert({
    ticket_id: ticket.data.id as string,
    sender_user_id: user.id,
    sender_type: "studio_user",
    body: parsed.data.message,
  });

  if (msg.error) {
    return { ok: false, error: msg.error.message ?? "Failed to create message" };
  }

  revalidatePath("/support");
  revalidatePath(`/support/${ticket.data.id as string}`);

  return { ok: true, data: { ticketId: ticket.data.id as string } };
}

const sendMessageSchema = z.object({
  ticketId: z.string().uuid(),
  body: z.string().trim().min(1).max(4000),
});

export async function sendSupportMessage(raw: unknown): Promise<Result<{}>> {
  const { user, profile } = await requireProfile();

  const parsed = sendMessageSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = createSupabaseAdminClient();

  const ticket = await supabase
    .from("support_tickets")
    .select("id, studio_id, status")
    .eq("id", parsed.data.ticketId)
    .maybeSingle();

  if (ticket.error) {
    return { ok: false, error: ticket.error.message ?? "Failed to load ticket" };
  }

  if (!ticket.data) {
    return { ok: false, error: "Ticket not found" };
  }

  if (ticket.data.studio_id !== profile.studio_id) {
    return { ok: false, error: "Not allowed" };
  }

  if (ticket.data.status === "closed") {
    return { ok: false, error: "Ticket is closed" };
  }

  const msg = await supabase.from("support_messages").insert({
    ticket_id: ticket.data.id as string,
    sender_user_id: user.id,
    sender_type: "studio_user",
    body: parsed.data.body,
  });

  if (msg.error) {
    return { ok: false, error: msg.error.message ?? "Failed to send" };
  }

  revalidatePath("/support");
  revalidatePath(`/support/${parsed.data.ticketId}`);

  return { ok: true, data: {} };
}

export async function goToTicket(ticketId: string) {
  redirect(`/support/${ticketId}`);
}
