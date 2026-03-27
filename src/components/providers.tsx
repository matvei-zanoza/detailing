"use client";

import { useTheme } from "next-themes";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

function ToasterWithTheme() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster 
      richColors 
      closeButton 
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="bottom-right"
      toastOptions={{
        style: {
          background: "var(--popover)",
          border: "1px solid var(--border)",
          color: "var(--popover-foreground)",
        },
      }}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      {children}
      <ToasterWithTheme />
    </ThemeProvider>
  );
}
