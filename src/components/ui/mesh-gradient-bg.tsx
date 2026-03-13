"use client";

import React from "react";

interface MeshGradientBgProps {
  colors?: string[];
  distortion?: number;
  swirl?: number;
  speed?: number;
  offsetX?: number;
  veilOpacity?: string;
  className?: string;
}

export function MeshGradientBg({
  colors = ["#1a1a2e", "#16213e", "#0f3460", "#1a1a2e", "#0a1628", "#162447"],
  distortion = 0.8,
  swirl = 0.6,
  speed = 0.3,
  offsetX = 0.08,
  veilOpacity = "bg-black/40",
  className = "",
}: MeshGradientBgProps) {
  void distortion;
  void swirl;
  void speed;
  void offsetX;

  const c = (i: number) => colors[Math.min(i, colors.length - 1)] ?? "#000";
  const backgroundImage = [
    `radial-gradient(900px circle at 10% 10%, ${c(0)} 0%, transparent 60%)`,
    `radial-gradient(900px circle at 90% 15%, ${c(1)} 0%, transparent 60%)`,
    `radial-gradient(900px circle at 85% 85%, ${c(2)} 0%, transparent 60%)`,
    `radial-gradient(900px circle at 15% 90%, ${c(3)} 0%, transparent 60%)`,
    `radial-gradient(1000px circle at 40% 55%, ${c(4)} 0%, transparent 65%)`,
    `radial-gradient(1100px circle at 60% 40%, ${c(5)} 0%, transparent 65%)`,
    "linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.35))",
  ].join(",");

  return (
    <div className={`fixed inset-0 w-screen h-screen ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "saturate(1.05)",
        }}
      />
      <div className={`absolute inset-0 pointer-events-none ${veilOpacity}`} />
    </div>
  );
}
