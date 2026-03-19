import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminAuditPage() {
  await requireSuperAdmin();

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold">Audit</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 text-sm text-muted-foreground">Audit log coming next.</CardContent>
      </Card>
    </div>
  );
}
