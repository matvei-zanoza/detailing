"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Car,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  Users,
  Workflow,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { UserMenu } from "@/components/app/user-menu";

type NavItem = { href: string; label: string; icon: React.ReactNode };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/bookings", label: "Bookings", icon: <BookOpen className="h-4 w-4" /> },
  { href: "/workflow", label: "Workflow", icon: <Workflow className="h-4 w-4" /> },
  { href: "/customers", label: "Customers", icon: <Users className="h-4 w-4" /> },
  { href: "/cars", label: "Cars", icon: <Car className="h-4 w-4" /> },
  { href: "/services", label: "Services", icon: <ShoppingBag className="h-4 w-4" /> },
  { href: "/packages", label: "Packages", icon: <Package className="h-4 w-4" /> },
  { href: "/staff", label: "Staff", icon: <Users className="h-4 w-4" /> },
  { href: "/analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
  { href: "/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
];

function SidebarNav({ studioName }: { studioName: string }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-foreground text-background grid place-items-center text-sm font-semibold">
            DO
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">DetailingOS</div>
            <div className="text-xs text-muted-foreground line-clamp-1">
              {studioName}
            </div>
          </div>
        </Link>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 p-2">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 text-xs text-muted-foreground">MVP demo</div>
    </div>
  );
}

export function AppShell({
  children,
  studioName,
  userDisplayName,
}: {
  children: React.ReactNode;
  studioName: string;
  userDisplayName: string;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 md:grid-cols-[260px_1fr]">
        <aside className="sticky top-0 hidden h-screen border-r md:block">
          <SidebarNav studioName={studioName} />
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
            <div className="flex h-14 items-center justify-between gap-2 px-4">
              <div className="flex items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="md:hidden">
                      <span className="sr-only">Open navigation</span>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                      >
                        <path
                          d="M4 6h16M4 12h16M4 18h16"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0">
                    <SidebarNav studioName={studioName} />
                  </SheetContent>
                </Sheet>
                <div className="text-sm font-medium">{studioName}</div>
              </div>
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <UserMenu displayName={userDisplayName} studioName={studioName} />
              </div>
            </div>
          </header>

          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
