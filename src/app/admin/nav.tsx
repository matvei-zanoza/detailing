"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Building2, 
  ShieldCheck, 
  Headphones, 
  ScrollText, 
  Settings2 
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/requests", label: "Join Requests", icon: UserPlus },
  { href: "/admin/studios", label: "Studios", icon: Building2 },
  { href: "/admin/admins", label: "Admins", icon: ShieldCheck },
  { href: "/admin/support", label: "Support", icon: Headphones },
  { href: "/admin/audit", label: "Audit", icon: ScrollText },
  { href: "/admin/system", label: "System", icon: Settings2 },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1.5 overflow-x-auto py-3 scrollbar-hide">
      {NAV.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200",
              active 
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            <Icon className={cn(
              "h-4 w-4 transition-transform duration-200",
              active ? "" : "group-hover:scale-110"
            )} />
            {item.label}
            {active && (
              <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
