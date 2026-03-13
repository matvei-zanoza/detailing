"use client";

import { MeshGradient } from "@paper-design/shaders-react";
import { useEffect, useState } from "react";

export function LoginBackground() {
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () =>
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (!mounted) {
    return <div className="fixed inset-0 bg-[#0a1628]" />;
  }

  return (
    <div className="fixed inset-0 w-screen h-screen">
      <MeshGradient
        width={dimensions.width}
        height={dimensions.height}
        colors={["#0f172a", "#1e3a5f", "#0d2847", "#1a365d", "#0c2d48", "#15354a"]}
        distortion={0.6}
        swirl={0.4}
        grainMixer={0}
        grainOverlay={0}
        speed={0.25}
        offsetX={0.08}
      />
      <div className="absolute inset-0 pointer-events-none bg-black/30" />
    </div>
  );
}
