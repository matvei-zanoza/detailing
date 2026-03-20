'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

type FallingPatternProps = React.ComponentProps<'div'> & {
  /** Number of falling particles */
  particleCount?: number;
  /** Base speed of falling particles */
  speed?: number;
  /** Blur intensity for the overlay effect */
  blurIntensity?: string;
  /** Pattern density for the dot overlay */
  density?: number;
};

interface Particle {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  width: number;
}

export function FallingPattern({
  particleCount = 50,
  speed = 0.8,
  blurIntensity = '0.6em',
  density = 1,
  className,
}: FallingPatternProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const colorRef = useRef<string>('#22c55e');

  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height * 2 - height,
        length: Math.random() * 60 + 30,
        speed: (Math.random() * 0.4 + 0.3) * speed,
        opacity: Math.random() * 0.3 + 0.1,
        width: Math.random() * 1.5 + 0.5,
      });
    }
    return particles;
  }, [particleCount, speed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      particlesRef.current = initParticles(width, height);
    };

    const updateColor = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      const primaryColor = computedStyle.getPropertyValue('--primary').trim();
      if (primaryColor) {
        colorRef.current = `oklch(${primaryColor})`;
      }
    };

    resizeCanvas();
    updateColor();

    // Listen for theme changes
    const observer = new MutationObserver(() => {
      updateColor();
    });
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class', 'style'] 
    });

    window.addEventListener('resize', resizeCanvas);

    const animate = (currentTime: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = currentTime;
      const deltaTime = Math.min((currentTime - lastTimeRef.current) / 16.67, 3);
      lastTimeRef.current = currentTime;

      ctx.clearRect(0, 0, width, height);

      const color = colorRef.current;

      for (const particle of particlesRef.current) {
        particle.y += particle.speed * deltaTime;

        if (particle.y > height + particle.length) {
          particle.y = -particle.length - Math.random() * 100;
          particle.x = Math.random() * width;
          particle.opacity = Math.random() * 0.3 + 0.1;
        }

        const gradient = ctx.createLinearGradient(
          particle.x,
          particle.y,
          particle.x,
          particle.y + particle.length
        );
        
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.2, color);
        gradient.addColorStop(0.8, color);
        gradient.addColorStop(1, 'transparent');

        ctx.globalAlpha = particle.opacity;
        ctx.strokeStyle = gradient;
        ctx.lineWidth = particle.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(particle.x, particle.y + particle.length);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      observer.disconnect();
      cancelAnimationFrame(animationRef.current);
    };
  }, [initParticles]);

  return (
    <div className={cn('relative h-full w-full', className)}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
      />
      <div
        className="absolute inset-0 z-[1]"
        style={{
          backdropFilter: `blur(${blurIntensity})`,
          backgroundImage: `radial-gradient(circle at 50% 50%, transparent 0, transparent 1.5px, var(--background) 1.5px)`,
          backgroundSize: `${6 * density}px ${6 * density}px`,
        }}
      />
    </div>
  );
}
