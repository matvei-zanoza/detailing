"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Car,
  Inbox,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  Users,
  Workflow,
  LifeBuoy,
  Menu,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { UserMenu } from "@/components/app/user-menu";

type NavItem = { href: string; label: string; icon: React.ReactNode };

const NAV_MAIN: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/incoming", label: "Incoming", icon: <Inbox className="h-4 w-4" /> },
  { href: "/bookings", label: "Bookings", icon: <BookOpen className="h-4 w-4" /> },
  { href: "/workflow", label: "Workflow", icon: <Workflow className="h-4 w-4" /> },
  { href: "/customers", label: "Customers", icon: <Users className="h-4 w-4" /> },
  { href: "/cars", label: "Cars", icon: <Car className="h-4 w-4" /> },
];

const NAV_SECONDARY: NavItem[] = [
  { href: "/services", label: "Services", icon: <ShoppingBag className="h-4 w-4" /> },
  { href: "/packages", label: "Packages", icon: <Package className="h-4 w-4" /> },
  { href: "/staff", label: "Staff", icon: <Users className="h-4 w-4" /> },
  { href: "/analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
  { href: "/support", label: "Support", icon: <LifeBuoy className="h-4 w-4" /> },
  { href: "/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
];

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors",
          isActive
            ? "bg-primary/15 text-primary"
            : "bg-muted/30 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
        )}
      >
        {item.icon}
      </span>
      <span>{item.label}</span>
      {isActive && (
        <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
      )}
    </Link>
  );
}

function SidebarNav({ studioName }: { studioName: string }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-4 py-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/images/logo-v2.png"
            alt="DetailingOS"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
            priority
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              DetailingOS
            </span>
            <span className="text-xs text-muted-foreground line-clamp-1">
              {studioName}
            </span>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Operations
          </div>
          {NAV_MAIN.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return <NavLink key={item.href} item={item} isActive={active} />;
          })}
        </div>

        <div className="space-y-1">
          <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Management
          </div>
          {NAV_SECONDARY.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return <NavLink key={item.href} item={item} isActive={active} />;
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
            Premium CRM
          </span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            v1.0
          </span>
        </div>
      </div>
    </div>
  );
}

export function AppShell({
  children,
  studioName,
  userDisplayName,
  userAvatarUrl,
  isSuperAdmin,
}: {
  children: React.ReactNode;
  studioName: string;
  userDisplayName: string;
  userAvatarUrl?: string | null;
  isSuperAdmin?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen border-r border-border/50 lg:block">
          <SidebarNav studioName={studioName} />
        </aside>

        {/* Main Content */}
        <div className="min-w-0">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 border-b border-border/50 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80">
            <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
              <div className="flex items-center gap-3">
                {/* Mobile Menu */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="lg:hidden"
                    >
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Open navigation</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[280px] p-0">
                    <SidebarNav studioName={studioName} />
                  </SheetContent>
                </Sheet>

                {/* Breadcrumb / Studio Name */}
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">
                    {studioName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Detailing Studio
                  </span>
                </div>
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <div className="ml-1 h-6 w-px bg-border/50" />
                <UserMenu
                  displayName={userDisplayName}
                  studioName={studioName}
                  avatarUrl={userAvatarUrl}
                  isSuperAdmin={Boolean(isSuperAdmin)}
                />
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
