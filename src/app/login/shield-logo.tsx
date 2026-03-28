"use client";

import Image from "next/image";
import { useState } from "react";

interface ShieldLogoProps {
  size?: number;
  className?: string;
}

export function ShieldLogo({ size = 24, className = "" }: ShieldLogoProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Shield Logo */}
      <Image
        src="/images/logo-v2.png"
        alt="DetailingOS"
        width={size}
        height={size}
        className={`
          h-full w-full object-contain
          transition-all duration-300 ease-out
          ${isHovered ? "scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "scale-100"}
        `}
        priority
      />
      
      {/* Metallic Shine Effect - sweeping highlight */}
      <div
        className={`
          pointer-events-none absolute inset-0
          transition-all duration-700 ease-out
        `}
        style={{
          background: `linear-gradient(
            105deg,
            transparent 20%,
            rgba(255, 255, 255, 0) 40%,
            rgba(255, 255, 255, 0.6) 50%,
            rgba(255, 255, 255, 0) 60%,
            transparent 80%
          )`,
          transform: isHovered ? "translateX(100%)" : "translateX(-100%)",
        }}
      />
      
      {/* Protective glow effect */}
      <div
        className={`
          pointer-events-none absolute inset-0 rounded-full
          transition-all duration-300 ease-out
        `}
        style={{
          boxShadow: isHovered 
            ? "inset 0 0 10px rgba(255, 255, 255, 0.3), 0 0 20px rgba(150, 150, 150, 0.4)"
            : "none",
        }}
      />
    </div>
  );
}
