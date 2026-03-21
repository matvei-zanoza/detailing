import { ScrollText, Construction, FileText, Clock } from "lucide-react";

import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

import { Card, CardContent } from "@/components/ui/card";

export default async function AdminAuditPage() {
  await requireSuperAdmin();

  return (
    <div className="space-y-8">
      {/* Coming Soon Card */}
      <Card className="border-border/50">
        <CardContent className="py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-6 rounded-2xl bg-amber-500/10 p-4">
              <Construction className="h-10 w-10 text-amber-500" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-foreground">Audit Log Coming Soon</h2>
            <p className="mb-8 max-w-md text-sm text-muted-foreground">
              We are building a comprehensive audit system to track all administrative actions and changes across the platform.
            </p>

            {/* Features Preview */}
            <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <ScrollText className="h-5 w-5 text-primary" />
                </div>
                <div className="text-sm font-medium text-foreground">Activity Logs</div>
                <div className="mt-1 text-xs text-muted-foreground">Track all system actions</div>
              </div>

              <div className="rounded-xl border border-border/50 bg-card p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="text-sm font-medium text-foreground">Change History</div>
                <div className="mt-1 text-xs text-muted-foreground">See what was modified</div>
              </div>

              <div className="rounded-xl border border-border/50 bg-card p-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="text-sm font-medium text-foreground">Timestamps</div>
                <div className="mt-1 text-xs text-muted-foreground">Precise action timing</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
