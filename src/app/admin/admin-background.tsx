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

  // More vibrant colors for better visibility
  const colors: [string, string, string, string] = isDark
    ? ["#0f172a", "#1e3a5f", "#0d4f6e", "#134e4a"]
    : ["#f0f9ff", "#e0f2fe", "#bae6fd", "#a5f3fc"]

  return (
    <div className="fixed inset-0 z-0">
      <MeshGradient
        className="h-full w-full opacity-90"
        colors={colors}
        speed={0.4}
      />
    </div>
  )
}
