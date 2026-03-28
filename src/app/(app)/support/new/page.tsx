import { requireProfile } from "@/lib/auth/require-profile";
import { getRequestLocale, t as tServer } from "@/lib/i18n/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { NewTicketForm } from "./ticket-form";

export default async function NewSupportTicketPage() {
  const locale = await getRequestLocale();
  await requireProfile();

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold">{tServer(locale, "support.new.title")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <NewTicketForm />
        </CardContent>
      </Card>
    </div>
  );
}
