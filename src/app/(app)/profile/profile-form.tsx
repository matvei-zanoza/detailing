"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({
  userId,
  email,
  initialDisplayName,
  initialAvatarUrl,
}: {
  userId: string;
  email: string;
  initialDisplayName: string;
  initialAvatarUrl: string | null;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();

  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  async function saveProfile() {
    startTransition(async () => {
      const update = await supabase
        .from("user_profiles")
        .update({ display_name: displayName })
        .eq("id", userId);

      if (update.error) {
        toast.error("Save failed", { description: update.error.message });
        return;
      }

      toast.success("Profile saved");
      router.refresh();
    });
  }

  async function uploadAvatar() {
    if (!file) return;

    startTransition(async () => {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `${userId}/avatar-${Date.now()}.${ext}`;

      const up = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type || undefined });

      if (up.error) {
        toast.error("Upload failed", { description: up.error.message });
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = data.publicUrl;

      const update = await supabase
        .from("user_profiles")
        .update({ avatar_url: url })
        .eq("id", userId);

      if (update.error) {
        toast.error("Save failed", { description: update.error.message });
        return;
      }

      setAvatarUrl(url);
      setFile(null);
      toast.success("Avatar updated");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12" size="lg">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground">{displayName}</div>
          <div className="text-xs text-muted-foreground">{email}</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Display name</Label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Avatar</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" onClick={uploadAvatar} disabled={isPending || !file}>
          {isPending ? "Uploading…" : "Upload avatar"}
        </Button>
        <Button onClick={saveProfile} disabled={isPending || !displayName.trim()}>
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
