"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface ThreeDLetterSwapProps {
  /**
   * Primary text to animate. Defaults to "Cirra" if not provided.
   */
  text?: string;
  /**
   * Optional children text. Overrides `text` if provided.
   */
  children?: React.ReactNode;
  /**
   * Secondary text to reveal on 3D swap. Defaults to the same text.
   */
  secondText?: string;
  /**
   * HTML tag to render as wrapper. Defaults to "span".
   */
  as?: React.ElementType;
  /**
   * Direction to flip: "top" | "bottom" | "left" | "right". Defaults to "top".
   */
  flipDirection?: "top" | "bottom" | "left" | "right";
  /**
   * Delay interval in seconds between each staggered letter. Defaults to 0.035s.
   */
  staggerInterval?: number;
  /**
   * Origin of stagger wave: "first" | "last" | "center" | "random". Defaults to "first".
   */
  staggerOrigin?: "first" | "last" | "center" | "random";
  /**
   * Duration in seconds for each letter rotation. Defaults to 0.5s.
   */
  duration?: number;
  /**
   * Whether to apply subtle motion blur during flip. Defaults to false.
   */
  blur?: boolean;
  /**
   * Blur amount in px if blur is enabled. Defaults to 3.
   */
  blurAmount?: number;
  /**
   * Automatically play animation once on mount/viewport entrance. Defaults to true.
   */
  playOnMount?: boolean;
  /**
   * Class name for the parent container.
   */
  className?: string;
  /**
   * Class name for front-face letters.
   */
  frontFaceClassName?: string;
  /**
   * Class name for secondary-face letters.
   */
  secondFaceClassName?: string;
}

export function ThreeDLetterSwap({
  text = "Cirra",
  children,
  secondText,
  as: Component = "span",
  flipDirection = "top",
  staggerInterval = 0.035,
  staggerOrigin = "first",
  duration = 0.5,
  blur = false,
  blurAmount = 3,
  playOnMount = true,
  className,
  frontFaceClassName,
  secondFaceClassName,
}: ThreeDLetterSwapProps) {
  // Resolve primary text from children or prop
  const resolvedText = useMemo(() => {
    if (typeof children === "string") return children;
    if (Array.isArray(children)) return children.join("");
    return text || "Cirra";
  }, [children, text]);

  const resolvedSecondText = secondText || resolvedText;
  const [isFlipped, setIsFlipped] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);

  // Trigger brief initial greeting flip on mount
  useEffect(() => {
    if (!playOnMount) return;
    const timer1 = setTimeout(() => setIsFlipped(true), 600);
    const timer2 = setTimeout(() => setIsFlipped(false), 1400);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [playOnMount]);

  const letters = useMemo(() => resolvedText.split(""), [resolvedText]);
  const secondLetters = useMemo(() => resolvedSecondText.split(""), [resolvedSecondText]);
  const totalLetters = letters.length;

  // Calculate staggered delay for letter at index `i`
  const getDelay = (index: number) => {
    switch (staggerOrigin) {
      case "last":
        return (totalLetters - 1 - index) * staggerInterval;
      case "center": {
        const mid = (totalLetters - 1) / 2;
        return Math.abs(index - mid) * staggerInterval;
      }
      case "random": {
        // Deterministic pseudo-random based on index so it doesn't jitter on re-renders
        const pseudo = ((index * 9301 + 49297) % 233280) / 233280;
        return pseudo * (totalLetters * staggerInterval);
      }
      case "first":
      default:
        return index * staggerInterval;
    }
  };

  // Determine rotation transforms based on direction
  const getWrapperTransform = () => {
    if (!isFlipped) return "rotateX(0deg) rotateY(0deg)";
    switch (flipDirection) {
      case "top":
        return "rotateX(-90deg)";
      case "bottom":
        return "rotateX(90deg)";
      case "left":
        return "rotateY(-90deg)";
      case "right":
        return "rotateY(90deg)";
    }
  };

  const getSecondFaceTransform = () => {
    switch (flipDirection) {
      case "top":
        return "rotateX(90deg) translateZ(0.55em)";
      case "bottom":
        return "rotateX(-90deg) translateZ(0.55em)";
      case "left":
        return "rotateY(90deg) translateZ(0.55em)";
      case "right":
        return "rotateY(-90deg) translateZ(0.55em)";
    }
  };

  return (
    <Component
      ref={containerRef as any}
      className={cn(
        "inline-flex items-center justify-center select-none cursor-pointer group",
        className
      )}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onTouchStart={() => setIsFlipped((prev) => !prev)}
      style={{
        perspective: "1000px",
        WebkitPerspective: "1000px",
      }}
      aria-label={resolvedText}
    >
      {letters.map((char, index) => {
        const backChar = secondLetters[index] ?? char;
        const delay = getDelay(index);
        const isSpace = char === " ";

        if (isSpace) {
          return (
            <span key={index} className="inline-block w-[0.25em]">
              &nbsp;
            </span>
          );
        }

        return (
          <span
            key={index}
            className="relative inline-block"
            style={{
              height: "1.25em",
              lineHeight: "1.25em",
              verticalAlign: "middle",
              transformStyle: "preserve-3d",
              WebkitTransformStyle: "preserve-3d",
              transition: `transform ${duration}s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s, filter ${duration}s ease ${delay}s`,
              transform: getWrapperTransform(),
              filter: blur && isFlipped ? `blur(${blurAmount}px)` : "none",
            }}
          >
            {/* Front Face */}
            <span
              className={cn(
                "inline-block font-inherit transition-colors duration-200",
                frontFaceClassName || "text-[#0A192F]"
              )}
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "translateZ(0.55em)",
              }}
            >
              {char}
            </span>

            {/* Second Face */}
            <span
              className={cn(
                "absolute inset-0 flex items-center justify-center font-inherit transition-colors duration-200",
                secondFaceClassName || "text-[#0062E0]"
              )}
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: getSecondFaceTransform(),
              }}
            >
              {backChar}
            </span>
          </span>
        );
      })}
    </Component>
  );
}

export default ThreeDLetterSwap;
