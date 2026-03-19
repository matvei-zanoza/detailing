import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RejectedPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold">Request rejected</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="text-sm text-muted-foreground">
            Your access request was rejected by the studio admin.
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href="/onboarding/select-studio">Select another studio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
