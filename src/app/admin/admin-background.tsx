"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import NeuralBackground from "@/components/ui/flow-field-background";

export function AdminBackground() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Different colors for light/dark themes
  const color = resolvedTheme === "dark" ? "#5a6a7a" : "#94a3b8";
  const trailOpacity = resolvedTheme === "dark" ? 0.08 : 0.15;

  return (
    <div className="fixed inset-0 w-screen h-screen z-0">
      <NeuralBackground 
        color={color}
        trailOpacity={trailOpacity}
        particleCount={500}
        speed={0.5}
      />
      {/* Overlay to blend with background */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80 pointer-events-none"
      />
    </div>
  );
}
