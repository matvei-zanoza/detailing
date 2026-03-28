"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LoginThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Toggle theme"
        disabled
        className="border border-foreground/10 bg-foreground/5 backdrop-blur-sm hover:bg-foreground/10"
      >
        <Sun className="h-4 w-4 text-foreground/60" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="border border-foreground/10 bg-foreground/5 backdrop-blur-sm hover:bg-foreground/10"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-foreground/80" />
      ) : (
        <Moon className="h-4 w-4 text-foreground/80" />
      )}
    </Button>
  );
}
