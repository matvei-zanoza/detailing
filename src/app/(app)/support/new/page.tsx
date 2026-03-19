import { requireProfile } from "@/lib/auth/require-profile";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { NewTicketForm } from "./ticket-form";

export default async function NewSupportTicketPage() {
  await requireProfile();

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold">New ticket</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <NewTicketForm />
        </CardContent>
      </Card>
    </div>
  );
}
