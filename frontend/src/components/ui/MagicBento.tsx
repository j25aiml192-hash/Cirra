"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface MagicBentoProps {
  columns?: number;
  rowHeight?: number;
  gap?: number;
  radius?: number;
  enableBorderGlow?: boolean;
  enableSpotlight?: boolean;
  spotlightRadius?: number;
  clickEffect?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export interface MagicBentoCardProps {
  colSpan?: number;
  rowSpan?: number;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  radius?: number;
}

interface ClickRipple {
  id: number;
  x: number;
  y: number;
}

export function MagicBentoCard({
  colSpan = 1,
  rowSpan = 1,
  children,
  className,
  contentClassName,
  onClick,
  radius = 20,
}: MagicBentoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [ripples, setRipples] = useState<ClickRipple[]>([]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
    cardRef.current.style.setProperty("--glow-opacity", "1");
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty("--glow-opacity", "0");
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      setRipples((prev) => [...prev, { id, x, y }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 750);
    }
    if (onClick) onClick(e);
  };

  // Responsive column span classes (if used in a grid)
  const colSpanClass =
    colSpan === 4
      ? "col-span-1 md:col-span-2 lg:col-span-4"
      : colSpan === 3
      ? "col-span-1 md:col-span-2 lg:col-span-3"
      : colSpan === 2
      ? "col-span-1 md:col-span-2 lg:col-span-2"
      : colSpan === 1
      ? "col-span-1"
      : "";

  // Responsive row span classes (if used in a grid)
  const rowSpanClass =
    rowSpan === 3
      ? "row-span-1 lg:row-span-3"
      : rowSpan === 2
      ? "row-span-1 lg:row-span-2"
      : rowSpan === 1
      ? "row-span-1"
      : "";

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        borderRadius: `${radius}px`,
        ["--mouse-x" as string]: `${mousePos.x}px`,
        ["--mouse-y" as string]: `${mousePos.y}px`,
        ["--glow-opacity" as string]: "0",
      }}
      className={cn(
        "magic-bento-card group relative bg-white overflow-hidden transition-all duration-200 select-none",
        "border border-[#D1D5DB] hover:border-[#9CA3AF] shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]",
        colSpanClass,
        rowSpanClass,
        className
      )}
    >
      {/* 1. High-Visibility Cursor Spotlight Glow */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-200"
        style={{
          opacity: "var(--glow-opacity, 0)",
          background: `radial-gradient(350px circle at var(--mouse-x) var(--mouse-y), rgba(15, 23, 42, 0.08) 0%, rgba(30, 41, 59, 0.03) 45%, transparent 70%)`,
        }}
      />

      {/* 2. High-Visibility Multi-Card Edge Light */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-150 rounded-[inherit]"
        style={{
          opacity: "var(--glow-opacity, 0)",
          boxShadow: `inset 0 0 0 1px transparent`,
          background: `radial-gradient(320px circle at var(--mouse-x) var(--mouse-y), rgba(15, 23, 42, 0.95) 0%, rgba(51, 65, 85, 0.75) 30%, rgba(100, 116, 139, 0.4) 50%, transparent 70%)`,
          WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
          WebkitMaskComposite: `xor`,
          maskComposite: `exclude`,
          padding: `2px`,
        }}
      />

      {/* 3. Outer Edge Highlight Aura */}
      <div
        className="pointer-events-none absolute inset-[-1px] transition-opacity duration-200 rounded-[inherit]"
        style={{
          opacity: "var(--glow-opacity, 0)",
          background: `radial-gradient(280px circle at var(--mouse-x) var(--mouse-y), rgba(15, 23, 42, 0.12) 0%, transparent 65%)`,
        }}
      />

      {/* 4. Vivid Click Ripple Wave */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="pointer-events-none absolute rounded-full animate-ping"
          style={{
            left: ripple.x - 40,
            top: ripple.y - 40,
            width: 80,
            height: 80,
            background: "radial-gradient(circle, rgba(15, 23, 42, 0.35) 0%, rgba(15, 23, 42, 0.15) 50%, transparent 80%)",
            animationDuration: "650ms",
          }}
        />
      ))}

      {/* Card Content Container */}
      <div className={cn("relative z-10 w-full h-full p-5 sm:p-6 flex flex-col justify-between", contentClassName)}>
        {children}
      </div>
    </div>
  );
}

export default function MagicBento({
  columns = 4,
  rowHeight = 200,
  gap = 12,
  radius = 20,
  enableBorderGlow = true,
  enableSpotlight = true,
  spotlightRadius = 300,
  clickEffect = true,
  children,
  className,
}: MagicBentoProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll<HTMLDivElement>(".magic-bento-card");
    const radiusDistance = spotlightRadius || 300;

    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Distance from cursor to nearest edge of this card
      const dx = Math.max(0, Math.max(rect.left - e.clientX, e.clientX - rect.right));
      const dy = Math.max(0, Math.max(rect.top - e.clientY, e.clientY - rect.bottom));
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Smoothly bleed effect across neighboring card edges within spotlightRadius
      let opacity = 0;
      if (distance < radiusDistance) {
        opacity = Math.max(0, 1 - distance / radiusDistance);
        opacity = Math.pow(opacity, 1.2);
      }

      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
      card.style.setProperty("--glow-opacity", `${opacity.toFixed(3)}`);
    });
  };

  const handleContainerMouseLeave = () => {
    if (!containerRef.current) return;
    const cards = containerRef.current.querySelectorAll<HTMLDivElement>(".magic-bento-card");
    cards.forEach((card) => {
      card.style.setProperty("--glow-opacity", "0");
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={enableBorderGlow || enableSpotlight ? handleContainerMouseMove : undefined}
      onMouseLeave={handleContainerMouseLeave}
      style={{
        gap: `${gap}px`,
      }}
      className={cn(
        "magic-bento-grid w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 transition-all duration-300",
        `lg:auto-rows-[${rowHeight}px]`,
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<{ radius?: number }>, {
            radius: (child.props as { radius?: number }).radius ?? radius,
          });
        }
        return child;
      })}
    </div>
  );
}
