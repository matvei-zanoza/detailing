import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getRequestLocale, t as tServer } from "@/lib/i18n/server";

export default async function RejectedPage() {
  const locale = await getRequestLocale();
  return (
    <div className="w-full max-w-lg space-y-6">
      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold">{tServer(locale, "onboarding.rejected.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="text-sm text-muted-foreground">
            {tServer(locale, "onboarding.rejected.body")}
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href="/onboarding/select-studio">{tServer(locale, "onboarding.rejected.selectAnother")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
