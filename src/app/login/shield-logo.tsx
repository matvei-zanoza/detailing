"use client";

import Image from "next/image";
import { useState } from "react";

interface ShieldLogoProps {
  size?: number;
  className?: string;
}

export function ShieldLogo({ size = 24, className = "" }: ShieldLogoProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Calculate padding for glow effect
  const glowPadding = Math.max(size * 0.3, 12);
  const containerSize = size + glowPadding * 2;

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ 
        width: size, 
        height: size,
        // Allow overflow for glow effects
        overflow: "visible",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow background layer - positioned behind */}
      <div
        className="pointer-events-none absolute transition-all duration-300 ease-out"
        style={{
          width: containerSize,
          height: containerSize,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          background: isHovered 
            ? "radial-gradient(circle, rgba(180, 180, 180, 0.25) 0%, rgba(120, 120, 120, 0.1) 40%, transparent 70%)"
            : "none",
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* Shield Logo */}
      <Image
        src="/images/logo-v2.png"
        alt="DetailingOS"
        width={size}
        height={size}
        className={`
          relative z-10
          transition-all duration-300 ease-out
          ${isHovered ? "scale-110" : "scale-100"}
        `}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          filter: isHovered 
            ? "drop-shadow(0 0 12px rgba(200, 200, 200, 0.6)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.4))"
            : "none",
        }}
        priority
      />
      
      {/* Metallic Shine Effect - sweeping highlight */}
      <div
        className="pointer-events-none absolute z-20 transition-all duration-500 ease-out"
        style={{
          width: size,
          height: size,
          background: `linear-gradient(
            105deg,
            transparent 0%,
            transparent 40%,
            rgba(255, 255, 255, 0.5) 50%,
            transparent 60%,
            transparent 100%
          )`,
          transform: isHovered ? "translateX(50%)" : "translateX(-50%)",
          opacity: isHovered ? 1 : 0,
          maskImage: `url(/images/logo-v2.png)`,
          maskSize: "contain",
          maskPosition: "center",
          maskRepeat: "no-repeat",
          WebkitMaskImage: `url(/images/logo-v2.png)`,
          WebkitMaskSize: "contain",
          WebkitMaskPosition: "center",
          WebkitMaskRepeat: "no-repeat",
        }}
      />
    </div>
  );
}
