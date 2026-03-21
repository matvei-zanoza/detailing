"use client"

import { useTheme } from "next-themes"
import NeuralBackground from "@/components/ui/flow-field-background"
import { useEffect, useState } from "react"

export function AdminBackground() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="fixed inset-0 bg-background" />
  }

  const isDark = resolvedTheme === "dark"

  // Colors adapted for theme
  const colors: [string, string, string, string] = isDark
    ? ["#0a0a0a", "#1a1a2e", "#16213e", "#0f3460"]
    : ["#f8fafc", "#e2e8f0", "#cbd5e1", "#f1f5f9"]

  return (
    <div className="fixed inset-0 z-0">
      <NeuralBackground
        className="h-full w-full"
        color={isDark ? colors[3] : colors[1]}
        trailOpacity={isDark ? 0.12 : 0.08}
        particleCount={650}
        speed={0.8}
      />
      {/* Subtle overlay for better content readability */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark 
            ? "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)"
            : "radial-gradient(ellipse at center, transparent 0%, rgba(255,255,255,0.5) 100%)"
        }}
      />
    </div>
  )
}
