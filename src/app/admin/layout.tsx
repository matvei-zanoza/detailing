import Link from "next/link";

import { requireAppAdmin } from "@/lib/auth/require-app-admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAppAdmin();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl p-4 lg:p-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">System</div>
            <div className="text-2xl font-semibold tracking-tight text-foreground">Admin</div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link className="text-muted-foreground hover:text-foreground" href="/admin">
              Overview
            </Link>
            <Link className="text-muted-foreground hover:text-foreground" href="/admin/studios">
              Studios
            </Link>
            <Link className="text-muted-foreground hover:text-foreground" href="/admin/admins">
              Admins
            </Link>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
