"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import NeuralBackground from "@/components/ui/flow-field-background";

export function LoginBackground() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Default to light theme values before mount
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div className="fixed inset-0 w-screen h-screen">
      <NeuralBackground 
        color={isDark ? "#5a6a7a" : "#8a9aaa"}
        trailOpacity={isDark ? 0.08 : 0.06}
        particleCount={420}
        speed={0.6}
        backgroundColor={isDark ? "#000000" : "#f8f9fa"}
      />
    </div>
  );
}
