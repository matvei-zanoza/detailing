"use client"

import { useTheme } from "next-themes"
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
    ? ["#0f172a", "#1e3a8a", "#0e7490", "#0f766e"]
    : ["#eef2ff", "#c7d2fe", "#bae6fd", "#a7f3d0"]

  return (
    <div
      className="fixed inset-0 z-0"
      style={{
        backgroundColor: colors[0],
        backgroundImage: [
          `radial-gradient(circle at 15% 20%, ${colors[1]} 0%, transparent 55%)`,
          `radial-gradient(circle at 85% 30%, ${colors[2]} 0%, transparent 55%)`,
          `radial-gradient(circle at 40% 85%, ${colors[3]} 0%, transparent 60%)`,
        ].join(", "),
      }}
    />
  )
}
