import { Building2, Shield, Clock, ArrowRight } from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { StudioSelectForm } from "./studio-select-form";

export default async function SelectStudioPage() {
  const supabase = await createSupabaseServerClient();

  const { data: directoryRes } = await supabase
    .from("studio_directory")
    .select("studio_id, public_name")
    .order("public_name", { ascending: true });

  const studios = (directoryRes ?? []).map((s) => ({
    id: s.studio_id as string,
    name: s.public_name as string,
  }));

  return (
    <div className="w-full max-w-lg space-y-6">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
          <Building2 className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Select Your Studio</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Join your team and start collaborating
          </p>
        </div>
      </div>

      {/* Main Card */}
      <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm shadow-lg">
        <CardContent className="p-6 space-y-6">
          {/* Info Banner */}
          <div className="flex items-start gap-3 rounded-xl bg-muted/50 p-4 ring-1 ring-border/50">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Access Request Required</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                After selecting your studio, an administrator will review and approve your access request.
              </p>
            </div>
          </div>

          {/* Studio Selection Form */}
          <StudioSelectForm studios={studios} />

          {/* Process Steps */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="flex flex-col items-center text-center p-3 rounded-xl bg-muted/30 ring-1 ring-border/30">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary mb-2">
                1
              </div>
              <span className="text-xs text-muted-foreground">Select studio</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-xl bg-muted/30 ring-1 ring-border/30">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground mb-2">
                2
              </div>
              <span className="text-xs text-muted-foreground">Wait for approval</span>
            </div>
            <div className="flex flex-col items-center text-center p-3 rounded-xl bg-muted/30 ring-1 ring-border/30">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground mb-2">
                3
              </div>
              <span className="text-xs text-muted-foreground">Start working</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Note */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span>Usually approved within 24 hours</span>
      </div>
    </div>
  );
}
