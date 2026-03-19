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
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  async function saveProfile() {
    startTransition(async () => {
      let nextAvatarUrl = avatarUrl;
      if (file) {
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
        nextAvatarUrl = data.publicUrl;
      }

      const update = await supabase
        .from("user_profiles")
        .update({ display_name: displayName, avatar_url: nextAvatarUrl })
        .eq("id", userId);

      if (update.error) {
        toast.error("Save failed", { description: update.error.message });
        return;
      }

      setAvatarUrl(nextAvatarUrl);
      setFile(null);
      toast.success("Profile saved");
      router.refresh();
    });
  }

  async function updateEmail() {
    const next = newEmail.trim();
    if (!next) return;

    startTransition(async () => {
      const res = await supabase.auth.updateUser({ email: next });
      if (res.error) {
        toast.error("Update failed", { description: res.error.message });
        return;
      }

      toast.success("Email update requested");
      setNewEmail("");
      router.refresh();
    });
  }

  async function updatePassword() {
    if (!newPassword) return;
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    startTransition(async () => {
      const res = await supabase.auth.updateUser({ password: newPassword });
      if (res.error) {
        toast.error("Update failed", { description: res.error.message });
        return;
      }

      toast.success("Password updated");
      setNewPassword("");
      setConfirmPassword("");
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={email} disabled />
        </div>
        <div className="space-y-2">
          <Label>New email</Label>
          <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={updateEmail}
          disabled={isPending || !newEmail.trim() || newEmail.trim() === email}
        >
          {isPending ? "Updating…" : "Update email"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>New password</Label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Confirm password</Label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={updatePassword}
          disabled={
            isPending ||
            !newPassword ||
            !confirmPassword ||
            newPassword !== confirmPassword
          }
        >
          {isPending ? "Updating…" : "Update password"}
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button onClick={saveProfile} disabled={isPending || !displayName.trim()}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
