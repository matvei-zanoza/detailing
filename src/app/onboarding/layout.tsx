import { LogOut } from "lucide-react";

import { LocaleToggle } from "@/components/app/locale-toggle";
import { LogoutButton } from "./logout-button";
import { OnboardingBackground } from "./onboarding-background";
import { getRequestLocale, t as tServer } from "@/lib/i18n/server";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const locale = await getRequestLocale();
  return (
    <div className="relative min-h-screen bg-background">
      {/* Smoke Shader Background */}
      <OnboardingBackground />
      
      {/* Content */}
      <div className="relative z-10">
        <header className="flex items-center justify-between p-4 lg:p-6">
          <LocaleToggle />
          <LogoutButton>
            <LogOut className="mr-2 h-4 w-4" /> {tServer(locale, "common.logout")}
          </LogoutButton>
        </header>
        <main className="flex flex-1 items-center justify-center p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
