import * as React from "react";

export interface CirraLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  variant?: "mark" | "badge" | "inverted";
}

/**
 * Cirra Golden Ratio Geometric Logo Mark
 * Φ = 1.618... proportioned geometry:
 * - Outer golden squircle capsule
 * - Internal fluid logarithmic spiral helix representing autonomous cloud telemetry & AI velocity
 */
export function CirraLogo({
  size = 32,
  className = "",
  variant = "badge",
  ...props
}: CirraLogoProps) {
  // Golden ratio proportion calculations
  // Dimensions based on golden scale: 100 base, 61.8 inner, 38.2 core, 23.6 focal
  if (variant === "mark") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
      >
        <defs>
          <linearGradient id="cirra-gold-spiral" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="61.8%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Fluid logarithmic spiral 'C' helix proportioned to phi = 1.618 */}
        <path
          d="M 68 28
             C 48 16, 24 28, 20 50
             C 16 72, 34 84, 52 84
             C 72 84, 82 68, 78 56
             C 74 44, 58 44, 50 50
             C 42 56, 44 66, 52 66
             C 60 66, 62 60, 60 56
             C 54 50, 40 54, 38 64
             C 34 76, 58 76, 68 64
             C 78 52, 70 32, 50 32
             C 30 32, 28 54, 32 64"
          fill="currentColor"
          fillRule="evenodd"
        />
      </svg>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-xl overflow-hidden bg-white flex items-center justify-center shrink-0 shadow-sm transition-transform ${className}`}
    >
      <img
        src="/cirra-mark.png"
        alt="Cirra Logo"
        className="w-full h-full object-cover p-0.5"
      />
    </div>
  );
}
