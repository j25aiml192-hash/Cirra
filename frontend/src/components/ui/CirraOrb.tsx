"use client";

import React, { useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/* LIGHT Palette & Types from supplied specification                  */
/* ------------------------------------------------------------------ */

type RGB = [number, number, number];
type Blob = { rgb: RGB; a: number; fx: number; fy: number; fw: number; fh: number };
type Palette = { ink: RGB; page: RGB; blobs: Blob[] };

const LIGHT: Palette = {
  ink: [32, 32, 32],
  page: [244, 245, 247],
  blobs: [
    { rgb: [176, 196, 214], a: 0.55, fx: 0.04, fy: 0.08, fw: 0.62, fh: 0.78 },
    { rgb: [255, 255, 255], a: 0.85, fx: 0.44, fy: 0.22, fw: 0.54, fh: 0.7 },
    { rgb: [226, 208, 196], a: 0.42, fx: 0.3, fy: 0.44, fw: 0.44, fh: 0.56 },
  ],
};

const css = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduce(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduce;
}

export interface CirraOrbProps {
  className?: string;
  size?: number; // Orb diameter in px, defaults to 176px
}

/**
 * Animated AI Orb inspired by ChatGPT Voice mode.
 * Features:
 * - Upper half: Vibrant cerulean / sky blue gradient.
 * - Lower half: Soft icy-white / pale azure gradient.
 * - Interior: Fluid cloudy, atmospheric drifting texture.
 * - Ambient: Light palette atmospheric background glow using LIGHT blobs.
 * - Lighting: Gentle blue-white outer glow with glass specular sheen.
 * - Motion: Smooth, slow breathing animation (strictly light palette, no purple).
 */
export function CirraOrb({ className = "", size = 176 }: CirraOrbProps) {
  const reduce = usePrefersReducedMotion();

  // Positions for the 3 ambient background blobs from the supplied specification
  const blobPos = [
    "left-[4%] top-[8%] w-[62%] h-[78%]",
    "left-[44%] top-[22%] w-[54%] h-[70%]",
    "left-[30%] top-[44%] w-[44%] h-[56%]",
  ];

  const containerSize = Math.max(260, size + 90);

  return (
    <div
      className={`relative isolate flex items-center justify-center select-none ${className}`}
      style={{
        width: containerSize,
        height: containerSize,
      }}
    >
      {/* ------------------------------------------------------------- */}
      {/* Ambient background effect using supplied LIGHT palette         */}
      {/* ------------------------------------------------------------- */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          WebkitMaskImage: "radial-gradient(closest-side, #000 55%, transparent 100%)",
          maskImage: "radial-gradient(closest-side, #000 55%, transparent 100%)",
        }}
      >
        {LIGHT.blobs.map((b, i) => (
          <div
            key={i}
            className={`absolute rounded-full ${blobPos[i]} transition-transform duration-1000 ease-in-out`}
            style={{
              background: `radial-gradient(closest-side, ${css(b.rgb, b.a)}, ${css(b.rgb, 0)} 100%)`,
              animation: reduce
                ? "none"
                : `cirra-ambient-drift ${12 + i * 3}s ease-in-out infinite alternate`,
              animationDelay: `${i * 1.5}s`,
            }}
          />
        ))}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* External Soft Glows (Sky Blue & Icy White Bloom)               */}
      {/* ------------------------------------------------------------- */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full"
        style={{
          width: size * 1.38,
          height: size * 1.38,
          background:
            "radial-gradient(circle, rgba(56, 189, 248, 0.28) 0%, rgba(186, 230, 253, 0.18) 45%, transparent 70%)",
          filter: "blur(28px)",
          animation: reduce ? "none" : "cirra-glow-pulse 5.6s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full"
        style={{
          width: size * 0.95,
          height: size * 0.95,
          background:
            "radial-gradient(circle, rgba(255, 255, 255, 0.65) 0%, rgba(224, 242, 254, 0.28) 50%, transparent 75%)",
          filter: "blur(14px)",
        }}
      />

      {/* ------------------------------------------------------------- */}
      {/* ChatGPT Voice Inspired Animated AI Orb                         */}
      {/* ------------------------------------------------------------- */}
      <div
        role="img"
        aria-label="Ask Cirra AI Orb"
        className="relative rounded-full overflow-hidden cursor-default"
        style={{
          width: size,
          height: size,
          boxShadow: `
            0 0 24px 2px rgba(255, 255, 255, 0.9),
            0 0 48px 10px rgba(56, 189, 248, 0.35),
            0 0 85px 22px rgba(186, 230, 253, 0.28),
            0 12px 28px -4px rgba(12, 74, 110, 0.12),
            inset 0 2px 4px 0 rgba(255, 255, 255, 0.9),
            inset 0 -6px 16px 0 rgba(147, 197, 253, 0.35)
          `,
          animation: reduce
            ? "none"
            : "cirra-orb-breathe 5.6s ease-in-out infinite",
          willChange: "transform, box-shadow",
        }}
      >
        {/* Base 3D Sphere Gradient: Rich Sky-Blue top into Icy-White bottom */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `
              radial-gradient(circle at 50% 28%, #38bdf8 0%, #0ea5e9 40%, #0284c7 65%),
              linear-gradient(180deg, transparent 40%, #bae6fd 70%, #f0f9ff 90%, #ffffff 100%)
            `,
          }}
        />

        {/* Lower hemisphere icy mist blend */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "linear-gradient(to top, #ffffff 0%, rgba(240, 249, 255, 0.95) 25%, rgba(186, 230, 253, 0.55) 52%, transparent 75%)",
          }}
        />

        {/* ----------------------------------------------------------- */}
        {/* Cloudy Atmospheric Texture Layers (Internal Fluid Motion)   */}
        {/* ----------------------------------------------------------- */}

        {/* Cloud Layer 1: Ethereal White & Pale Icy-Blue Wave */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: "125%",
            height: "125%",
            top: "-12%",
            left: "-12%",
            background:
              "radial-gradient(circle at 40% 60%, rgba(255, 255, 255, 0.85) 0%, rgba(224, 242, 254, 0.45) 45%, transparent 70%)",
            filter: "blur(14px)",
            borderRadius: "44% 56% 62% 38% / 42% 48% 52% 58%",
            animation: reduce
              ? "none"
              : "cirra-cloud-drift-1 14s ease-in-out infinite alternate",
          }}
        />

        {/* Cloud Layer 2: Atmospheric Sky Swirl */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: "115%",
            height: "115%",
            top: "-5%",
            left: "-15%",
            background:
              "radial-gradient(circle at 60% 35%, rgba(14, 165, 233, 0.65) 0%, rgba(56, 189, 248, 0.35) 45%, transparent 70%)",
            filter: "blur(16px)",
            borderRadius: "58% 42% 36% 64% / 54% 62% 38% 46%",
            animation: reduce
              ? "none"
              : "cirra-cloud-drift-2 18s ease-in-out infinite alternate",
          }}
        />

        {/* Cloud Layer 3: Central Soft Luminescent Core */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: "80%",
            height: "80%",
            top: "12%",
            left: "10%",
            background:
              "radial-gradient(circle, rgba(255, 255, 255, 0.72) 0%, rgba(186, 230, 253, 0.35) 45%, transparent 70%)",
            filter: "blur(10px)",
            animation: reduce
              ? "none"
              : "cirra-cloud-pulse 7s ease-in-out infinite",
          }}
        />

        {/* ----------------------------------------------------------- */}
        {/* Specular Highlight / Glass Sheen (ChatGPT Voice Lighting)   */}
        {/* ----------------------------------------------------------- */}

        {/* Upper-left curved glossy reflection */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 38% 22%, rgba(255, 255, 255, 0.78) 0%, rgba(255, 255, 255, 0.18) 35%, transparent 60%)",
          }}
        />

        {/* Subtle rim highlight for spherical depth */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow: `
              inset 0 1.5px 3px 0 rgba(255, 255, 255, 0.95),
              inset 0 -3px 8px 0 rgba(14, 165, 233, 0.25)
            `,
            border: "1px solid rgba(255, 255, 255, 0.55)",
          }}
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Lightweight Keyframe Styles for Smooth Motion & Texture       */}
      {/* ------------------------------------------------------------- */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes cirra-orb-breathe {
              0%, 100% {
                transform: scale(1) translateY(0px);
                box-shadow:
                  0 0 24px 2px rgba(255, 255, 255, 0.9),
                  0 0 48px 10px rgba(56, 189, 248, 0.32),
                  0 0 85px 22px rgba(186, 230, 253, 0.26),
                  0 12px 28px -4px rgba(12, 74, 110, 0.12),
                  inset 0 2px 4px 0 rgba(255, 255, 255, 0.9),
                  inset 0 -6px 16px 0 rgba(147, 197, 253, 0.35);
              }
              50% {
                transform: scale(1.036) translateY(-2px);
                box-shadow:
                  0 0 34px 4px rgba(255, 255, 255, 0.95),
                  0 0 68px 16px rgba(56, 189, 248, 0.42),
                  0 0 110px 30px rgba(186, 230, 253, 0.36),
                  0 16px 34px -4px rgba(12, 74, 110, 0.15),
                  inset 0 2.5px 5px 0 rgba(255, 255, 255, 0.95),
                  inset 0 -8px 20px 0 rgba(147, 197, 253, 0.42);
              }
            }

            @keyframes cirra-glow-pulse {
              0%, 100% {
                opacity: 0.75;
                transform: scale(1);
              }
              50% {
                opacity: 0.95;
                transform: scale(1.07);
              }
            }

            @keyframes cirra-cloud-drift-1 {
              0% {
                transform: translate(0, 0) rotate(0deg);
              }
              50% {
                transform: translate(6px, -4px) rotate(14deg);
              }
              100% {
                transform: translate(-4px, 5px) rotate(-10deg);
              }
            }

            @keyframes cirra-cloud-drift-2 {
              0% {
                transform: translate(0, 0) rotate(0deg);
              }
              50% {
                transform: translate(-7px, 5px) rotate(-16deg);
              }
              100% {
                transform: translate(5px, -5px) rotate(12deg);
              }
            }

            @keyframes cirra-cloud-pulse {
              0%, 100% {
                opacity: 0.65;
                transform: scale(1);
              }
              50% {
                opacity: 0.9;
                transform: scale(1.06);
              }
            }

            @keyframes cirra-ambient-drift {
              0% {
                transform: translate(0px, 0px) scale(1);
              }
              50% {
                transform: translate(8px, -6px) scale(1.04);
              }
              100% {
                transform: translate(-6px, 8px) scale(0.98);
              }
            }
          `,
        }}
      />
    </div>
  );
}

export default CirraOrb;

