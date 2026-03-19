import Link from "next/link";

import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

import { AdminNav } from "./nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperAdmin();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl p-4 lg:p-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">System</div>
            <div className="text-2xl font-semibold tracking-tight text-foreground">Admin</div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <AdminNav />
            <Link className="text-sm text-muted-foreground hover:text-foreground" href="/dashboard">
              Back to app
            </Link>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
