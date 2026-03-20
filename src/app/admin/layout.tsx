import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { FallingPattern } from "@/components/ui/falling-pattern";

import { AdminNav } from "./nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperAdmin();

  return (
    <div className="relative min-h-screen bg-background">
      {/* Falling Pattern Background - canvas animation */}
      <FallingPattern 
        className="fixed inset-0 h-full w-full"
        particleCount={40}
        speed={0.6}
        blurIntensity="0.5em"
        density={1}
      />

      {/* Content wrapper with z-index above background */}
      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              {/* Left - Brand */}
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 backdrop-blur-sm">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">System Admin</div>
                  <div className="text-xs text-muted-foreground">Management Console</div>
                </div>
              </div>

              {/* Right - Theme Toggle & Back Link */}
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Link 
                  className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" 
                  href="/dashboard"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to App
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <AdminNav />
          </div>
        </div>

        {/* Main Content */}
        <main className="mx-auto max-w-7xl p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
