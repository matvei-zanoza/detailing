"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface NeuralBackgroundProps {
  className?: string;
  color?: string;
  trailOpacity?: number;
  particleCount?: number;
  speed?: number;
  backgroundColor?: string;
}

interface ParticleData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
}

function createParticle(width: number, height: number): ParticleData {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: 0,
    vy: 0,
    age: 0,
    life: Math.random() * 200 + 100,
  };
}

function updateParticle(
  p: ParticleData,
  width: number,
  height: number,
  mouse: { x: number; y: number },
  speed: number
) {
  const angle = (Math.cos(p.x * 0.005) + Math.sin(p.y * 0.005)) * Math.PI;

  p.vx += Math.cos(angle) * 0.2 * speed;
  p.vy += Math.sin(angle) * 0.2 * speed;

  const dx = mouse.x - p.x;
  const dy = mouse.y - p.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const interactionRadius = 150;

  if (distance < interactionRadius) {
    const force = (interactionRadius - distance) / interactionRadius;
    p.vx -= dx * force * 0.05;
    p.vy -= dy * force * 0.05;
  }

  p.x += p.vx;
  p.y += p.vy;
  p.vx *= 0.95;
  p.vy *= 0.95;

  p.age++;
  if (p.age > p.life) {
    p.x = Math.random() * width;
    p.y = Math.random() * height;
    p.vx = 0;
    p.vy = 0;
    p.age = 0;
    p.life = Math.random() * 200 + 100;
  }

  if (p.x < 0) p.x = width;
  if (p.x > width) p.x = 0;
  if (p.y < 0) p.y = height;
  if (p.y > height) p.y = 0;
}

function drawParticle(
  ctx: CanvasRenderingContext2D,
  p: ParticleData,
  color: string
) {
  ctx.fillStyle = color;
  const alpha = 1 - Math.abs(p.age / p.life - 0.5) * 2;
  ctx.globalAlpha = alpha;
  ctx.fillRect(p.x, p.y, 1.5, 1.5);
}

export default function NeuralBackground({
  className,
  color = "#6366f1",
  trailOpacity = 0.15,
  particleCount = 600,
  speed = 1,
  backgroundColor = "#000000",
}: NeuralBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const hex = backgroundColor.replace("#", "");
    const bgR = parseInt(hex.slice(0, 2), 16);
    const bgG = parseInt(hex.slice(2, 4), 16);
    const bgB = parseInt(hex.slice(4, 6), 16);

    let width = container.clientWidth;
    let height = container.clientHeight;
    let particles: ParticleData[] = [];
    let animationFrameId: number;
    const mouse = { x: -1000, y: -1000 };

    const init = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(createParticle(width, height));
      }
    };

    const animate = () => {
      ctx.fillStyle = `rgba(${bgR}, ${bgG}, ${bgB}, ${trailOpacity})`;
      ctx.fillRect(0, 0, width, height);

      for (const p of particles) {
        updateParticle(p, width, height, mouse, speed);
        drawParticle(ctx, p, color);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      init();
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    init();
    animate();

    window.addEventListener("resize", handleResize);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [color, trailOpacity, particleCount, speed, backgroundColor]);

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full h-full overflow-hidden", className)}
      style={{ backgroundColor }}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
