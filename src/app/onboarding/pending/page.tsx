import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PendingApprovalPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold">Waiting for approval</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-6">
          <div className="text-sm text-muted-foreground">
            Your request was sent to the studio admin. You will get access after they approve you.
          </div>
          <div className="text-xs text-muted-foreground">
            If you think this is taking too long, contact the studio admin.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
