"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";

export interface CirraOrbitLogoProps {
  className?: string;
  sizeClassName?: string;
  logoSizeClassName?: string;
}

/**
 * Animated rotating orbit illustration surrounding the stationary Cirra logo.
 * Preserves latitude, longitude, and orbital trail geometries in Cirra's purple palette:
 * - Bright orbital trails: #B52BE8
 * - Secondary trails: #7735C5
 * - Subtle trails: #653A94
 * - Highlight accents: #D68BFF
 * - Stationary central Cirra core logo
 */
export function CirraOrbitLogo({
  className = "",
  sizeClassName = "w-52 h-52 sm:w-60 sm:h-60 md:w-64 md:h-64",
  logoSizeClassName = "w-[44px] h-[44px] sm:w-[50px] sm:h-[50px] md:w-[56px] md:h-[56px]",
}: CirraOrbitLogoProps) {
  const rawId = useId();
  const uid = rawId.replace(/:/g, "_");

  const hubGlowId = `cirra_orbit_hub_${uid}`;
  const brightTrailId = `cirra_trail_bright_${uid}`;
  const secTrailId = `cirra_trail_sec_${uid}`;
  const dimTrailId = `cirra_trail_dim_${uid}`;
  const accentTrailId = `cirra_trail_accent_${uid}`;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center select-none my-[-6px] sm:my-[-10px]",
        className
      )}
    >
      {/* Outer Orbit Container */}
      <div className={cn("relative flex items-center justify-center", sizeClassName)}>
        {/* Animated Rotating Orbit SVG */}
        <svg
          viewBox="0 0 300 300"
          className="h-full w-full pointer-events-none overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            {/* Core Hub Glow - Soft radial deep space blue aura behind the logo */}
            <radialGradient id={hubGlowId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#287FE8" stopOpacity="0.38" />
              <stop offset="45%" stopColor="#1856A8" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#030817" stopOpacity="0" />
            </radialGradient>

            {/* Bright Orbital Trails (#287FE8 to #68B7FF) */}
            <linearGradient id={brightTrailId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#68B7FF" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#287FE8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#1856A8" stopOpacity="0.4" />
            </linearGradient>

            {/* Secondary Trails (#1856A8) */}
            <linearGradient id={secTrailId} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#287FE8" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#1856A8" stopOpacity="0.35" />
            </linearGradient>

            {/* Subtle Trails (#123B78) */}
            <linearGradient id={dimTrailId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1856A8" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#123B78" stopOpacity="0.25" />
            </linearGradient>

            {/* Highlight Accents (#68B7FF) */}
            <linearGradient id={accentTrailId} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#68B7FF" stopOpacity="0.95" />
              <stop offset="55%" stopColor="#B52BE8" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#653A94" stopOpacity="0.18" />
            </linearGradient>
          </defs>

          {/* Central Hub Glow Sphere */}
          <circle cx="150" cy="150" r="62" fill={`url(#${hubGlowId})`} />

          {/* Unified Rotating Orbit Composition */}
          <g
            className="cirra-orbit-rotation"
            style={{
              transformOrigin: "150px 150px",
              animation: "cirraOrbitSpin 28s linear infinite",
            }}
          >
            {/* Latitude Lines (6 tilted concentric orbital tracks) */}
            {[...Array(6)].map((_, i) => (
              <ellipse
                key={`lat-${i}`}
                cx="150"
                cy="150"
                rx={120}
                ry={40 + i * 12}
                stroke={`url(#${dimTrailId})`}
                strokeWidth="1.2"
                fill="none"
                strokeDasharray="5 5"
                className="cirra-orbit-flow-forward"
                style={{ animation: "cirraFlowForward 10s linear infinite" }}
                opacity={0.55 + (i % 2) * 0.22}
                transform="rotate(-25,150,150)"
              />
            ))}

            {/* Longitude Lines (8 spherical geodesic meridian curves) */}
            {[...Array(8)].map((_, i) => (
              <path
                key={`lon-${i}`}
                d="M150,30 A120,120 0 0,1 150,270"
                stroke={`url(#${i % 2 === 0 ? secTrailId : dimTrailId})`}
                strokeWidth="1.2"
                fill="none"
                strokeDasharray="4 4"
                className="cirra-orbit-flow-reverse"
                style={{ animation: "cirraFlowReverse 12s linear infinite" }}
                opacity={0.6 + (i % 3) * 0.16}
                transform={`rotate(${i * 22.5},150,150)`}
              />
            ))}

            {/* Primary Bright Orbital Trail (#B52BE8) */}
            <ellipse
              cx="150"
              cy="150"
              rx="140"
              ry="60"
              stroke={`url(#${brightTrailId})`}
              strokeWidth="2.8"
              fill="none"
              strokeDasharray="10 10"
              className="cirra-orbit-flow-forward"
              style={{ animation: "cirraFlowForward 14s linear infinite" }}
              opacity="0.95"
              transform="rotate(20,150,150)"
            />

            {/* Secondary Orbital Trail (#7735C5) */}
            <ellipse
              cx="150"
              cy="150"
              rx="130"
              ry="50"
              stroke={`url(#${secTrailId})`}
              strokeWidth="2.2"
              fill="none"
              strokeDasharray="12 12"
              className="cirra-orbit-flow-reverse"
              style={{ animation: "cirraFlowReverse 9s linear infinite" }}
              opacity="0.88"
              transform="rotate(-40,150,150)"
            />

            {/* Accent Highlight Orbital Trail (#D68BFF) */}
            <ellipse
              cx="150"
              cy="150"
              rx="135"
              ry="54"
              stroke={`url(#${accentTrailId})`}
              strokeWidth="1.8"
              fill="none"
              strokeDasharray="8 14"
              className="cirra-orbit-flow-forward"
              style={{ animation: "cirraFlowForward 16s linear infinite" }}
              opacity="0.8"
              transform="rotate(65,150,150)"
            />
          </g>
        </svg>

        {/* Layer 3: Stationary Transparent 3D Cirra Logo directly at geometric center */}
        <div
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none select-none z-20",
            logoSizeClassName
          )}
          title="Cirra AI"
        >
          <img
            src="/cirra-3d-logo.png"
            alt="Cirra 3D Logo"
            className="w-full h-full object-contain pointer-events-none drop-shadow-[0_2px_8px_rgba(3,8,23,0.4)]"
          />
        </div>
      </div>

      {/* CSS Animations & Reduced Motion Compatibility */}
      <style>{`
        @keyframes cirraOrbitSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes cirraFlowForward {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: -100;
          }
        }
        @keyframes cirraFlowReverse {
          from {
            stroke-dashoffset: 0;
          }
          to {
            stroke-dashoffset: 100;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .cirra-orbit-rotation,
          .cirra-orbit-flow-forward,
          .cirra-orbit-flow-reverse {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default CirraOrbitLogo;
