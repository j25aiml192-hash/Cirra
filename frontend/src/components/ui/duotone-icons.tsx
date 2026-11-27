"use client";

import * as React from "react";

export interface DuotoneIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

// 1. Chat Bubbles (Pink + Lime + Black bars)
export function DuotoneChatIcon({ size = 32, className = "", ...props }: DuotoneIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Lime Bubble in back with black shadow */}
      <path
        d="M26 18h10a6 6 0 0 1 6 6v7a6 6 0 0 1-6 6h-2v4.5a1.5 1.5 0 0 1-2.5 1.1L26 37h-3a6 6 0 0 1-6-6v-3h9a6 6 0 0 0 6-6v-4z"
        fill="#A6FF38"
      />
      <path d="M23 28h-3v3a6 6 0 0 0 6 6h2v-4a5 5 0 0 1-5-5z" fill="#121217" />
      {/* Pink Bubble in front */}
      <path
        d="M6 14a8 8 0 0 1 8-8h14a8 8 0 0 1 8 8v10a8 8 0 0 1-8 8h-4.5L13 36.8a1.5 1.5 0 0 1-2.5-1.1V32H14a8 8 0 0 1-8-8V14z"
        fill="#FF7EA5"
      />
      {/* Solid Black Text Bars */}
      <rect x="13" y="14" width="13" height="3.5" rx="1.75" fill="#121217" />
      <rect x="13" y="21" width="8" height="3.5" rx="1.75" fill="#121217" />
    </svg>
  );
}

// 2. Price Tag (Yellow + Pink shadow + Black slot)
export function DuotoneTagIcon({ size = 32, className = "", ...props }: DuotoneIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Pink shadow tag behind */}
      <path
        d="M13 14a6 6 0 0 1 6-6l6.5 6.5-12 24.5a6 6 0 0 1-8-2.5l-2-3.5a6 6 0 0 1 2.5-8L13 14z"
        fill="#FF7EA5"
      />
      <path d="M12.5 37l1.5-3 2 4-2.5 1a5 5 0 0 1-1-2z" fill="#121217" />
      {/* Bright Yellow Tag in front */}
      <path
        d="M17.5 12.5a6 6 0 0 1 6-6h7.5a6 6 0 0 1 4.2 1.8l9 9a6 6 0 0 1 0 8.5L34 36a6 6 0 0 1-8.5 0l-9-9a6 6 0 0 1-1.8-4.2l2.8-10.3z"
        fill="#FFF02B"
      />
      {/* Black Hole & Bar Slot */}
      <circle cx="27" cy="16" r="3" fill="#121217" />
      <rect
        x="29"
        y="25"
        width="11"
        height="3.5"
        rx="1.75"
        transform="rotate(45 29 25)"
        fill="#121217"
      />
    </svg>
  );
}

// 3. Flag (Black pole + Purple flag + Lavender tail)
export function DuotoneFlagIcon({ size = 32, className = "", ...props }: DuotoneIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Black Flagpole */}
      <rect x="8" y="7" width="5" height="34" rx="2.5" fill="#121217" />
      {/* Lavender ribbon tail */}
      <path d="M22 17h17a2 2 0 0 1 1.6 3.1L36 26l4.6 5.9A2 2 0 0 1 39 35H22V17z" fill="#D8D4FF" />
      {/* Deep Purple folded flag */}
      <path
        d="M13 10h16a5 5 0 0 1 5 5v7a5 5 0 0 1-5 5H22l-9 6V10z"
        fill="#8229F5"
      />
      <path d="M22 27l9-5v5h-9z" fill="#121217" opacity="0.8" />
    </svg>
  );
}

// 4. User Admin (Pink circle + Black user silhouette + Lime cog badge)
export function DuotoneUserAdminIcon({ size = 32, className = "", ...props }: DuotoneIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Pink circular background */}
      <circle cx="21" cy="24" r="17" fill="#FF7EA5" />
      {/* Black user silhouette */}
      <circle cx="21" cy="18" r="6" fill="#121217" />
      <path d="M10.5 35a11 11 0 0 1 21 0H10.5z" fill="#121217" />
      <path d="M30 18l8 10-6 7a17 17 0 0 0 6-9c0-3.5-1.5-6.5-4-8.5l-4 .5z" fill="#121217" />
      {/* Lime Green Cog Badge */}
      <circle cx="37" cy="13" r="7.5" fill="#A6FF38" />
      <circle cx="37" cy="13" r="2.5" fill="#121217" />
      {/* Cog teeth */}
      <rect x="35.5" y="4" width="3" height="3" rx="1" fill="#121217" />
      <rect x="35.5" y="19" width="3" height="3" rx="1" fill="#121217" />
      <rect x="28" y="11.5" width="3" height="3" rx="1" fill="#121217" />
      <rect x="43" y="11.5" width="3" height="3" rx="1" fill="#121217" />
    </svg>
  );
}

// 5. Wallet (Pink body + Lime green money peek + Black interior & snap)
export function DuotoneWalletIcon({ size = 32, className = "", ...props }: DuotoneIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Black Wallet Base & Interior */}
      <rect x="7" y="13" width="34" height="26" rx="8" fill="#121217" />
      {/* Lime Green Money Bill sticking out */}
      <path d="M13 17L24 7l11 10H13z" fill="#A6FF38" />
      <circle cx="24" cy="13" r="2.5" fill="#121217" opacity="0.3" />
      {/* Pink Wallet Front Flap Body */}
      <path
        d="M7 20h29a6 6 0 0 1 6 6v7a6 6 0 0 1-6 6H15a8 8 0 0 1-8-8V20z"
        fill="#FF7EA5"
      />
      {/* Black Snap Clasp Dot */}
      <circle cx="35" cy="29.5" r="3" fill="#121217" />
    </svg>
  );
}

// 6. Globe with Check Badge (Lavender sphere + Purple equator + Yellow Check)
export function DuotoneGlobeIcon({ size = 32, className = "", ...props }: DuotoneIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Lavender Globe Sphere */}
      <circle cx="21" cy="24" r="17" fill="#D8D4FF" />
      {/* Purple Equator Band */}
      <path d="M4.5 19.5h33a17 17 0 0 1 0 9h-33a17 17 0 0 1 0-9z" fill="#8229F5" />
      {/* Deep Black Inner Core Segment */}
      <rect x="13.5" y="19.5" width="15" height="9" rx="2" fill="#121217" />
      {/* Longitude ellipses */}
      <ellipse cx="21" cy="24" rx="7.5" ry="17" stroke="#D8D4FF" strokeWidth="2.5" />
      {/* Yellow Circular Checkmark Badge */}
      <circle cx="37" cy="15" r="8" fill="#FFF02B" />
      <path
        d="M33 15l3 3 5.5-5.5"
        stroke="#121217"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 7. House / Home (Lavender body + Purple chimney + Black circle window & door)
export function DuotoneHouseIcon({ size = 32, className = "", ...props }: DuotoneIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Deep Purple Chimney */}
      <rect x="31" y="9" width="6" height="14" rx="2.5" fill="#8229F5" />
      {/* Soft Lavender House Silhouette */}
      <path
        d="M21.5 7.5a4 4 0 0 1 5 0l13.5 11a4 4 0 0 1 1.5 3.1V36a5 5 0 0 1-5 5H11.5a5 5 0 0 1-5-5V21.6a4 4 0 0 1 1.5-3.1l13.5-11z"
        fill="#D8D4FF"
      />
      {/* Black Circular Attic Window */}
      <circle cx="24" cy="19.5" r="3.2" fill="#121217" />
      {/* Black Rounded Arch Doorway */}
      <path d="M19 41v-7a5 5 0 0 1 10 0v7H19z" fill="#121217" />
    </svg>
  );
}

// 8. Phone / Call Bubble (Purple handset + Lavender bubble + 3 Black dots)
export function DuotonePhoneCallIcon({ size = 32, className = "", ...props }: DuotoneIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Lavender Message Bubble with 3 Black dots */}
      <path
        d="M26 8a5 5 0 0 1 5-5h10a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5h-4.5L34 26a1.2 1.2 0 0 1-2-.9V21h-1a5 5 0 0 1-5-5V8z"
        fill="#D8D4FF"
      />
      <circle cx="32" cy="13" r="1.75" fill="#121217" />
      <circle cx="36" cy="13" r="1.75" fill="#121217" />
      <circle cx="40" cy="13" r="1.75" fill="#121217" />
      {/* Deep Purple Phone Handset */}
      <path
        d="M12.5 12a3 3 0 0 1 3-2.5h3.8a2.5 2.5 0 0 1 2.5 2l1 5.2a2.5 2.5 0 0 1-.8 2.3l-3.2 2.7a20 20 0 0 0 8.5 8.5l2.7-3.2a2.5 2.5 0 0 1 2.3-.8l5.2 1a2.5 2.5 0 0 1 2 2.5V33a3 3 0 0 1-3.2 3A28 28 0 0 1 8.5 15.2a3 3 0 0 1 4-3.2z"
        fill="#8229F5"
      />
    </svg>
  );
}

// 9. Cloud / Multi-Cloud Spend (Lavender cloud + Purple base + Lime check)
export function DuotoneCloudIcon({ size = 32, className = "", ...props }: DuotoneIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Deep Purple Base Shadow */}
      <path
        d="M12 36h24a8 8 0 0 0 1.5-15.8A12 12 0 0 0 14 15.5 9 9 0 0 0 12 36z"
        fill="#8229F5"
      />
      {/* Lavender Soft Cloud */}
      <path
        d="M12 32h24a8 8 0 0 0 1.5-15.8A12 12 0 0 0 14 11.5 9 9 0 0 0 12 32z"
        fill="#D8D4FF"
      />
      {/* Lime Accent Droplet / Telemetry pill */}
      <circle cx="36" cy="14" r="6.5" fill="#A6FF38" />
      <circle cx="36" cy="14" r="2.5" fill="#121217" />
    </svg>
  );
}

// 10. AI Chip / Microprocessor (Purple chip + Lime core + Black pins)
export function DuotoneAiChipIcon({ size = 32, className = "", ...props }: DuotoneIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Black Pins */}
      <path
        d="M16 4v5M24 4v5M32 4v5M16 39v5M24 39v5M32 39v5M4 16h5M4 24h5M4 32h5M39 16h5M39 24h5M39 32h5"
        stroke="#121217"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Deep Purple Chip Chassis */}
      <rect x="9" y="9" width="30" height="30" rx="8" fill="#8229F5" />
      {/* Lime Green Neural Core */}
      <rect x="17" y="17" width="14" height="14" rx="4" fill="#A6FF38" />
      <rect x="21" y="21" width="6" height="6" rx="2" fill="#121217" />
    </svg>
  );
}

// 11. Shield / Security & Guardrails (Lavender shield + Pink curve + Lime check)
export function DuotoneShieldIcon({ size = 32, className = "", ...props }: DuotoneIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Pink Shield Shadow */}
      <path
        d="M24 4a18 18 0 0 1 15 8v14c0 10-7 16.5-15 18-8-1.5-15-8-15-18V12a18 18 0 0 1 15-8z"
        fill="#FF7EA5"
      />
      {/* Lavender Main Shield Face */}
      <path
        d="M24 4a18 18 0 0 1 13 7v13c0 9-6 15-13 16.5-7-1.5-13-7.5-13-16.5V11a18 18 0 0 1 13-7z"
        fill="#D8D4FF"
      />
      {/* Solid Black Core Emblem */}
      <path d="M24 16v18c5-2 8-6 8-11v-5l-8-2z" fill="#121217" />
      {/* Lime Check Badge */}
      <circle cx="36" cy="14" r="7.5" fill="#A6FF38" />
      <path
        d="M32.5 14l2.5 2.5 4.5-4.5"
        stroke="#121217"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 12. Sparkles / AI Assistant (Purple star + Yellow & Pink sparkles)
export function DuotoneSparklesIcon({ size = 32, className = "", ...props }: DuotoneIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Big Deep Purple 4-Point Star */}
      <path
        d="M21 4c0 9-7 16-16 16 9 0 16 7 16 16 0-9 7-16 16-16-9 0-16-7-16-16z"
        fill="#8229F5"
      />
      {/* Black Center Core */}
      <circle cx="21" cy="20" r="3.5" fill="#121217" />
      {/* Yellow Satellite Sparkle */}
      <path
        d="M38 7c0 3.5-3 6.5-6.5 6.5 3.5 0 6.5 3 6.5 6.5 0-3.5 3-6.5 6.5-6.5-3.5 0-6.5-3-6.5-6.5z"
        fill="#FFF02B"
      />
      {/* Pink Satellite Sparkle */}
      <path
        d="M10 32c0 2.5-2 4.5-4.5 4.5 2.5 0 4.5 2 4.5 4.5 0-2.5 2-4.5 4.5-4.5-2.5 0-4.5-2-4.5-4.5z"
        fill="#FF7EA5"
      />
    </svg>
  );
}

// 13. Robot Head / AI Agent (Lavender head + Purple ears + Black antenna/eyes)
export function DuotoneRobotIcon({ size = 32, className = "", ...props }: DuotoneIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Black Antenna */}
      <rect x="22" y="5" width="4" height="7" rx="2" fill="#121217" />
      <rect x="18" y="4" width="12" height="3.5" rx="1.75" fill="#121217" />
      {/* Purple Ear Pins */}
      <rect x="4" y="20" width="6" height="10" rx="3" fill="#8229F5" />
      <rect x="38" y="20" width="6" height="10" rx="3" fill="#8229F5" />
      {/* Lavender Squircle Head */}
      <rect x="8" y="11" width="32" height="28" rx="10" fill="#D8D4FF" />
      {/* Pill Eyes */}
      <rect x="15" y="19" width="5" height="8" rx="2.5" fill="#121217" />
      <rect x="28" y="19" width="5" height="8" rx="2.5" fill="#121217" />
      {/* Lime Smile / Mouth */}
      <rect x="19" y="30" width="10" height="4" rx="2" fill="#A6FF38" />
    </svg>
  );
}

// 14. Anomaly Warning (Yellow triangle + Black exclamation + Pink shadow)
export function DuotoneAnomalyIcon({ size = 32, className = "", ...props }: DuotoneIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Pink Shadow Triangle */}
      <path
        d="M22 6.5a4 4 0 0 1 7 0l15.5 28a4 4 0 0 1-3.5 6h-31a4 4 0 0 1-3.5-6L22 6.5z"
        fill="#FF7EA5"
      />
      {/* Yellow Front Triangle */}
      <path
        d="M20 7.5a4 4 0 0 1 7 0l14.5 26a4 4 0 0 1-3.5 6h-29a4 4 0 0 1-3.5-6L20 7.5z"
        fill="#FFF02B"
      />
      {/* Black Exclamation */}
      <rect x="21.5" y="18" width="4" height="10" rx="2" fill="#121217" />
      <circle cx="23.5" cy="33" r="2.5" fill="#121217" />
    </svg>
  );
}

// 15. Savings Ledger / Growth Bar (Lime bill + Purple bars + Black line)
export function DuotoneSavingsIcon({ size = 32, className = "", ...props }: DuotoneIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Pink Base Card */}
      <rect x="6" y="8" width="36" height="32" rx="8" fill="#FF7EA5" />
      {/* Lavender Front Plate */}
      <rect x="6" y="6" width="34" height="32" rx="8" fill="#D8D4FF" />
      {/* Growth Pill Bars */}
      <rect x="12" y="24" width="5.5" height="10" rx="2.75" fill="#121217" />
      <rect x="20" y="17" width="5.5" height="17" rx="2.75" fill="#8229F5" />
      <rect x="28" y="11" width="5.5" height="23" rx="2.75" fill="#A6FF38" />
    </svg>
  );
}

// 16. Flame / Live Incident (Purple shadow + Pink outer + Yellow inner flame + Black core)
export function DuotoneFlameIcon({ size = 32, className = "", ...props }: DuotoneIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Deep Purple Shadow */}
      <path
        d="M26 4C26 12 18 16 18 24a12 12 0 0 0 24 0c0-11-9-16-16-20z"
        fill="#8229F5"
      />
      {/* Vibrant Pink Outer Flame */}
      <path
        d="M24 6C24 13.5 16.5 17.5 16.5 25.5a11.5 11.5 0 0 0 23 0c0-10.5-8.5-15.5-15.5-19.5z"
        fill="#FF7EA5"
      />
      {/* Highlighter Yellow Inner Flame */}
      <path
        d="M25 18c0 5-4.5 7.5-4.5 12.5a7.5 7.5 0 0 0 15 0c0-6-5.5-9-10.5-12.5z"
        fill="#FFF02B"
      />
      {/* Solid Black Core */}
      <circle cx="26" cy="33" r="3" fill="#121217" />
    </svg>
  );
}

// 17. Key (Pink base/shadow + Yellow head & stem + Black teeth & hole)
export function DuotoneKeyIcon({ size = 32, className = "", ...props }: DuotoneIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Pink Shadow Key */}
      <circle cx="16" cy="27" r="12" fill="#FF7EA5" />
      <rect x="23" y="24" width="18" height="6" rx="3" fill="#FF7EA5" />
      <rect x="33" y="28" width="4" height="6" rx="2" fill="#FF7EA5" />
      <rect x="39" y="28" width="4" height="4" rx="2" fill="#FF7EA5" />
      {/* Bright Yellow Key Body */}
      <circle cx="15" cy="24" r="11" fill="#FFF02B" />
      <rect x="22" y="21" width="18" height="6" rx="3" fill="#FFF02B" />
      {/* Teeth */}
      <rect x="32" y="25" width="4.5" height="7" rx="2.2" fill="#121217" />
      <rect x="38" y="25" width="4" height="5" rx="2" fill="#121217" />
      {/* Keyhole */}
      <circle cx="15" cy="24" r="4" fill="#121217" />
    </svg>
  );
}

// 18. Key Alert / Leaked Key (Yellow Key + Pink Shadow + Purple Warning Pill)
export function DuotoneKeyAlertIcon({ size = 32, className = "", ...props }: DuotoneIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Pink Shadow Key */}
      <circle cx="15" cy="27" r="11" fill="#FF7EA5" />
      <rect x="21" y="24" width="16" height="6" rx="3" fill="#FF7EA5" />
      {/* Yellow Key Body */}
      <circle cx="14" cy="24" r="10" fill="#FFF02B" />
      <rect x="20" y="21" width="16" height="6" rx="3" fill="#FFF02B" />
      <rect x="29" y="25" width="4" height="6" rx="2" fill="#121217" />
      <circle cx="14" cy="24" r="3.5" fill="#121217" />
      {/* Purple Warning Shield Badge in top right */}
      <circle cx="36" cy="13" r="8" fill="#8229F5" />
      <rect x="34.5" y="8" width="3" height="6" rx="1.5" fill="#FFF02B" />
      <circle cx="36" cy="17" r="1.5" fill="#FFF02B" />
    </svg>
  );
}

// 19. Process Loop / Runaway Loop (Purple & Lime dual curved arrows + Black gear core)
export function DuotoneProcessIcon({ size = 32, className = "", ...props }: DuotoneIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Top Purple Curved Arc with Arrowhead */}
      <path
        d="M24 8a16 16 0 0 1 15 11l-3 1a13 13 0 0 0-12-9V6l-6 5 6 5V11z"
        fill="#8229F5"
      />
      {/* Bottom Lime Curved Arc with Arrowhead */}
      <path
        d="M24 40a16 16 0 0 1-15-11l3-1a13 13 0 0 0 12 9v5l6-5-6-5v5z"
        fill="#A6FF38"
      />
      {/* Black Center Loop Dot */}
      <circle cx="24" cy="24" r="5" fill="#121217" />
      <circle cx="24" cy="24" r="2.5" fill="#D8D4FF" />
    </svg>
  );
}

// 20. Trend Spike / Bill Spike (Pink spike shadow + Yellow Lightning Bolt + Black arrow)
export function DuotoneTrendIcon({ size = 32, className = "", ...props }: DuotoneIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Pink Shadow Path */}
      <path
        d="M6 35l11-13 8 7 13-17h4v4L27 34l-8-7-9 11H6z"
        fill="#FF7EA5"
      />
      {/* Yellow/Lime Neon Spike Trend */}
      <path
        d="M7 32l11-13 8 7 12-16h-7V7h13v13h-3v-7L26 31l-8-7-9 11H7z"
        fill="#FFF02B"
      />
      {/* Solid Black Arrow Tip */}
      <path
        d="M36 7h7v7l-3-3-4 4-3-3 4-4-1-1z"
        fill="#121217"
      />
      {/* Deep Purple Accent Pill */}
      <circle cx="18" cy="19" r="3" fill="#8229F5" />
      <circle cx="26" cy="26" r="3" fill="#A6FF38" />
    </svg>
  );
}

