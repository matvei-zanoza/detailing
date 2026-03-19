import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="mx-auto max-w-lg space-y-6">
      <Card>
        <CardHeader className="border-b border-border/50">
          <CardTitle className="text-lg font-semibold">Select your studio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="text-sm text-muted-foreground">
            Choose the studio you work at. Your access will be granted after an admin approves your request.
          </div>
          <StudioSelectForm studios={studios} />
        </CardContent>
      </Card>
    </div>
  );
}
