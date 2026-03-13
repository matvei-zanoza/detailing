"use client";

import NeuralBackground from "@/components/ui/flow-field-background";

export function LoginBackground() {
  return (
    <div className="fixed inset-0 w-screen h-screen">
      <NeuralBackground 
        color="#818cf8"
        trailOpacity={0.08}
        particleCount={700}
        speed={0.7}
      />
    </div>
  );
}
