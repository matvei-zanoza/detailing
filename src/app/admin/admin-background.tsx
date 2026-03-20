"use client"

import { useTheme } from "next-themes"
import { MeshGradient } from "@paper-design/shaders-react"
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
    ? ["#000000", "#0a0a0a", "#1a1a1a", "#2a2a2a"]
    : ["#f5f5f5", "#e8e8e8", "#d4d4d4", "#ffffff"]

  const backgroundColor = isDark ? "#000000" : "#fafafa"

  return (
    <div className="fixed inset-0 z-0">
      <MeshGradient
        className="h-full w-full"
        colors={colors}
        speed={0.15}
        backgroundColor={backgroundColor}
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
