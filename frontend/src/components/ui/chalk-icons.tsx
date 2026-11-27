"use client";

import * as React from "react";

export interface ChalkIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  diskColor?: string;
  strokeColor?: string;
}

const DEFAULT_DISK = "#0F1318";
const DEFAULT_STROKE = "#FFFFFF";

// 1. Hand-Drawn Bag (Reference icon 1)
export function ChalkBagIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      {/* Hand-drawn handle */}
      <path
        d="M20 18.5 C19.5 12.5 28.5 12.5 28 18.5"
        stroke={strokeColor}
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      {/* Front bag body */}
      <path
        d="M16 19 L13 36.5 C13 37.8 14.2 38.5 15.5 38.5 L30.5 38.5 C31.8 38.5 32.8 37.8 32.5 36.5 L29.5 19 Z"
        stroke={strokeColor}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 3D side edge */}
      <path
        d="M29.5 19 L34 21.5 L35 36 L30.5 38.5"
        stroke={strokeColor}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 2. Hand-Drawn Calendar (Reference icon 2)
export function ChalkCalendarIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      {/* Top spiral rings */}
      <path
        d="M18 12.5 C18 11 20.5 11 20.5 15"
        stroke={strokeColor}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M27 12.5 C27 11 29.5 11 29.5 15"
        stroke={strokeColor}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Front calendar frame */}
      <path
        d="M13.5 15 L32.5 15.5 L31.5 36.5 L12.5 36 Z"
        stroke={strokeColor}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 3D perspective fold */}
      <path
        d="M32.5 15.5 L35.5 18 L34.5 37 L31.5 36.5"
        stroke={strokeColor}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Grid divider line */}
      <path d="M13 22 L32.5 22.5" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
      {/* Chalk grid rows and cols */}
      <path d="M13 27 L32 27.5" stroke={strokeColor} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M13 32 L31.5 32.5" stroke={strokeColor} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M18 22 L17.5 36" stroke={strokeColor} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M23 22 L22.5 36" stroke={strokeColor} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M28 22.5 L27.5 36.5" stroke={strokeColor} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// 3. Hand-Drawn Music Note (Reference icon 3)
export function ChalkMusicIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      {/* Left note head */}
      <ellipse
        cx="15.5"
        cy="33.5"
        rx="3.5"
        ry="2.8"
        transform="rotate(-20 15.5 33.5)"
        stroke={strokeColor}
        strokeWidth="2.3"
      />
      {/* Right note head */}
      <ellipse
        cx="30.5"
        cy="29.5"
        rx="3.5"
        ry="2.8"
        transform="rotate(-20 30.5 29.5)"
        stroke={strokeColor}
        strokeWidth="2.3"
      />
      {/* Stems */}
      <path d="M18.5 32 L19 16" stroke={strokeColor} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M33.5 28 L34 13" stroke={strokeColor} strokeWidth="2.4" strokeLinecap="round" />
      {/* Beam */}
      <path
        d="M19 16 L34 13 L34 17.5 L19 20.5 Z"
        stroke={strokeColor}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 4. Hand-Drawn Ouroboros Serpent & Asterisk (Reference icon 4)
export function ChalkOuroborosIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      {/* Outer Coiled Serpent Body */}
      <path
        d="M24 10 C32.5 9.5 37.5 15.5 37.5 24 C37.5 32.5 31.5 37.5 23.5 37.5 C15.5 37.5 10 32 10.5 23.5 C11 16 16.5 11 23 10.5"
        stroke={strokeColor}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Inner body line */}
      <path
        d="M24 14.5 C29.5 14 33.5 18 33.5 24 C33.5 30 29 33.5 23.5 33.5 C18 33.5 14.5 29.5 15 24 C15.5 19 18.5 15 23 14.5"
        stroke={strokeColor}
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      {/* Serpent Head biting tail */}
      <path
        d="M23 10.5 L28 12 C28.5 13 28 14.5 25.5 14.5 L21.5 13"
        stroke={strokeColor}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="26.5" cy="12.5" r="0.8" fill={strokeColor} />
      {/* Center 8-point chalk asterisk */}
      <path d="M24 20 L24 28" stroke={strokeColor} strokeWidth="2.1" strokeLinecap="round" />
      <path d="M20 24 L28 24" stroke={strokeColor} strokeWidth="2.1" strokeLinecap="round" />
      <path d="M21 21 L27 27" stroke={strokeColor} strokeWidth="1.9" strokeLinecap="round" />
      <path d="M21 27 L27 21" stroke={strokeColor} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

// 5. Hand-Drawn Star (Reference icon 5)
export function ChalkStarIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      {/* Hand-drawn wobbly 5-point star */}
      <path
        d="M24 10 L27.8 19.2 L37.2 20.2 L30 26.8 L32.2 36.8 L24 31.8 L15.8 36.8 L18 26.8 L10.8 20.2 L20.2 19.2 Z"
        stroke={strokeColor}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 6. Hand-Drawn Paw Print (Reference icon 6)
export function ChalkPawIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      {/* Main triangular rounded palm pad */}
      <path
        d="M24 25 C19.5 25 18 29.5 19.8 34 C21.5 37.5 26.5 37.5 28.2 34 C30 29.5 28.5 25 24 25 Z"
        stroke={strokeColor}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 4 Chalk Toe Droplets */}
      <path
        d="M14.5 22.5 C13 21 14 17.5 16 18.5 C18 19.5 17.5 23 15.5 23.5 Z"
        stroke={strokeColor}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.5 16.5 C19.5 14 21.5 12.5 23 14 C24.5 16 23 18.5 21.5 18.5 Z"
        stroke={strokeColor}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M27.5 16.5 C26.5 14 28.5 12.5 30 14 C31.5 16 30 18.5 28.5 18.5 Z"
        stroke={strokeColor}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M33.5 22.5 C32 21 33 17.5 35 18.5 C37 19.5 36.5 23 34.5 23.5 Z"
        stroke={strokeColor}
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 7. Hand-Drawn Cloud (Multi-Cloud Spend)
export function ChalkCloudIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      {/* Hand-drawn organic cloud */}
      <path
        d="M14 32.5 C10.5 32.5 9.5 29 11.5 26.5 C10 24 12 20.5 15.5 21 C17 15.5 24.5 14.5 27 19 C30 17.5 34.5 20 34 24.5 C37 26 36.5 30 34 32.5 C31.5 33 15.5 33 14 32.5 Z"
        stroke={strokeColor}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M16 27 C18 24.5 22 25 23 27" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// 8. Hand-Drawn AI Chip / Microprocessor
export function ChalkAiChipIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      {/* Chip square */}
      <rect
        x="15"
        y="15"
        width="18"
        height="18"
        rx="3"
        stroke={strokeColor}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner sketched core */}
      <rect
        x="20.5"
        y="20.5"
        width="7"
        height="7"
        rx="1.5"
        stroke={strokeColor}
        strokeWidth="1.8"
      />
      {/* Pins */}
      <path d="M19 11 L19 15 M24 11 L24 15 M29 11 L29 15" stroke={strokeColor} strokeWidth="2.1" strokeLinecap="round" />
      <path d="M19 33 L19 37 M24 33 L24 37 M29 33 L29 37" stroke={strokeColor} strokeWidth="2.1" strokeLinecap="round" />
      <path d="M11 19 L15 19 M11 24 L15 24 M11 29 L15 29" stroke={strokeColor} strokeWidth="2.1" strokeLinecap="round" />
      <path d="M33 19 L37 19 M33 24 L37 24 M33 29 L37 29" stroke={strokeColor} strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

// 9. Hand-Drawn Shield (Security & Attribution)
export function ChalkShieldIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      {/* Hand-drawn gothic shield outline */}
      <path
        d="M24 11.5 C29.5 13 33.5 11 34.5 12.5 C35 19 34 27.5 24 36.5 C14 27.5 13 19 13.5 12.5 C14.5 11 18.5 13 24 11.5 Z"
        stroke={strokeColor}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner chalk checkmark */}
      <path
        d="M19.5 23.5 L22.5 26.5 L28.5 20"
        stroke={strokeColor}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 10. Hand-Drawn Anomaly / Warning Triangle
export function ChalkAnomalyIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      {/* Hand-drawn triangle with rounded corners */}
      <path
        d="M24 12 C25.5 12 26.5 13.5 27.5 15.5 L36 31 C37 33 36 35 34 35.5 L14 35.5 C12 35 11 33 12 31 L20.5 15.5 C21.5 13.5 22.5 12 24 12 Z"
        stroke={strokeColor}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Exclamation point */}
      <path d="M24 20 L24 26" stroke={strokeColor} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="24" cy="30.5" r="1.3" fill={strokeColor} />
    </svg>
  );
}

// 11. Hand-Drawn Flame (Live Incident Simulator)
export function ChalkFlameIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      {/* Outer hand-drawn flame body */}
      <path
        d="M24 11 C24.5 17 16.5 20.5 16 26.5 C15.5 32.5 20.5 37 25.5 36.5 C31 36 34.5 31.5 33.5 25.5 C32.5 19 28.5 15 24 11 Z"
        stroke={strokeColor}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner flame lick */}
      <path
        d="M24.5 22 C25 25.5 20.5 27 20 31 C20 33.5 22 34.5 24.5 34 C27 33.5 28.5 31 27.5 27 C27 24.5 25.5 23 24.5 22 Z"
        stroke={strokeColor}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 12. Hand-Drawn Key (Leaked Key / AI API Keys)
export function ChalkKeyIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      {/* Round head */}
      <circle cx="17" cy="24" r="6" stroke={strokeColor} strokeWidth="2.3" />
      <circle cx="17" cy="24" r="2" stroke={strokeColor} strokeWidth="1.8" />
      {/* Stem */}
      <path d="M23 24 L36 24" stroke={strokeColor} strokeWidth="2.4" strokeLinecap="round" />
      {/* Teeth */}
      <path d="M31 24 L31 28.5" stroke={strokeColor} strokeWidth="2.3" strokeLinecap="round" />
      <path d="M35 24 L35 27.5" stroke={strokeColor} strokeWidth="2.3" strokeLinecap="round" />
    </svg>
  );
}

// 13. Hand-Drawn Process Loop / Runaway Process
export function ChalkProcessIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      {/* Top curved arrow */}
      <path
        d="M15 20 C17 14 26 13 32 17"
        stroke={strokeColor}
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <path d="M28 14 L33 17 L30 22" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Bottom curved arrow */}
      <path
        d="M33 28 C31 34 22 35 16 31"
        stroke={strokeColor}
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <path d="M20 34 L15 31 L18 26" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Center dot */}
      <circle cx="24" cy="24" r="2" fill={strokeColor} />
    </svg>
  );
}

// 14. Hand-Drawn Trend / Bill Surge Spike
export function ChalkTrendIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      {/* Upward zigzag surge line */}
      <path
        d="M12 33 L19 24 L25 28 L35 15"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Arrowhead */}
      <path
        d="M29 15 L35 15 L35 21"
        stroke={strokeColor}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 15. Hand-Drawn Robot Bot Head
export function ChalkRobotIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      {/* Antenna */}
      <path d="M24 10 L24 14" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="24" cy="9.5" r="1.5" fill={strokeColor} />
      {/* Head body */}
      <rect
        x="13.5"
        y="14.5"
        width="21"
        height="18"
        rx="4.5"
        stroke={strokeColor}
        strokeWidth="2.3"
      />
      {/* Ears */}
      <path d="M10.5 21 L13.5 21 M34.5 21 L37.5 21" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" />
      {/* Eyes */}
      <circle cx="19" cy="21.5" r="1.6" fill={strokeColor} />
      <circle cx="29" cy="21.5" r="1.6" fill={strokeColor} />
      {/* Mouth */}
      <path d="M19.5 27.5 L28.5 27.5" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// 16. Hand-Drawn Growth Bars / Chart
export function ChalkChartIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      <path d="M11 35 L37 35" stroke={strokeColor} strokeWidth="2.3" strokeLinecap="round" />
      <rect x="14" y="27" width="4.5" height="8" rx="1.5" stroke={strokeColor} strokeWidth="2" />
      <rect x="21.5" y="20" width="4.5" height="15" rx="1.5" stroke={strokeColor} strokeWidth="2" />
      <rect x="29" y="14" width="4.5" height="21" rx="1.5" stroke={strokeColor} strokeWidth="2" />
    </svg>
  );
}

// 17. Hand-Drawn Wallet
export function ChalkWalletIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      {/* Wallet body */}
      <rect x="12" y="17" width="24" height="18" rx="3.5" stroke={strokeColor} strokeWidth="2.3" />
      {/* Cash sticking out */}
      <path d="M16 17 L16 13 L28 13 L28 17" stroke={strokeColor} strokeWidth="1.9" strokeLinecap="round" />
      {/* Clasp flap */}
      <path d="M29 23 L36 23 L36 29 L29 29 Z" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="32" cy="26" r="1" fill={strokeColor} />
    </svg>
  );
}

// 18. Hand-Drawn Sparkles / Magic Stars (Ask Cirra AI)
export function ChalkSparklesIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      {/* Center 4-point organic sparkle */}
      <path
        d="M24 12 C24 17.5 20.5 21 15 21.5 C20.5 22 24 25.5 24 31 C24 25.5 27.5 22 33 21.5 C27.5 21 24 17.5 24 12 Z"
        stroke={strokeColor}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Top right secondary sparkle */}
      <path
        d="M32 14 C32 16.5 30.5 18 28.5 19 C30.5 20 32 21.5 32 24 C32 21.5 33.5 20 35.5 19 C33.5 18 32 16.5 32 14 Z"
        stroke={strokeColor}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom left tertiary sparkle */}
      <circle cx="16.5" cy="30.5" r="1.5" fill={strokeColor} />
    </svg>
  );
}

// 19. Hand-Drawn Layers (Allocation & Stacks)
export function ChalkLayersIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      {/* Top diamond sheet */}
      <path
        d="M24 13 L35 18.5 L24 24 L13 18.5 Z"
        stroke={strokeColor}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Middle sheet curve */}
      <path
        d="M13 24 L24 29.5 L35 24"
        stroke={strokeColor}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom sheet curve */}
      <path
        d="M13 29.5 L24 35 L35 29.5"
        stroke={strokeColor}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 20. Hand-Drawn Receipt / Bill (Savings & Invoices)
export function ChalkReceiptIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      {/* Receipt body with zigzag bottom */}
      <path
        d="M15 12 L33 12 L33 34 L30 32 L27 34 L24 32 L21 34 L18 32 L15 34 Z"
        stroke={strokeColor}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M19 18 L29 18" stroke={strokeColor} strokeWidth="2.1" strokeLinecap="round" />
      <path d="M19 23 L29 23" stroke={strokeColor} strokeWidth="2.1" strokeLinecap="round" />
      <path d="M19 28 L25 28" stroke={strokeColor} strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

// 21. Hand-Drawn Check Circle (Actions & Auto-Dismissed)
export function ChalkCheckCircleIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      {/* Inner circular chalk ring */}
      <circle
        cx="24"
        cy="24"
        r="14"
        stroke={strokeColor}
        strokeWidth="2.1"
      />
      {/* Bold checkmark */}
      <path
        d="M18.5 24.5 L22.5 28.5 L29.5 19.5"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 22. Hand-Drawn Clock (Avg Resolution Time)
export function ChalkClockIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      {/* Clock outline */}
      <circle cx="24" cy="24" r="14" stroke={strokeColor} strokeWidth="2.3" />
      {/* Hands */}
      <path d="M24 16 L24 24 L29.5 27" stroke={strokeColor} strokeWidth="2.3" strokeLinecap="round" />
      <circle cx="24" cy="24" r="1.5" fill={strokeColor} />
    </svg>
  );
}

// 23. Hand-Drawn Phone (Voice Calls)
export function ChalkPhoneIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      {/* Handset receiver */}
      <path
        d="M17 17.5 C17 15.5 19 14 21 15.5 L23.5 19 C24.5 20 23.8 21.5 22.5 22.2 C21.8 22.8 21.5 24 23.5 27 C25.5 30 26.8 29.8 27.5 29 C28.2 27.8 29.8 27 30.8 28 L34 30.5 C35.2 32.5 34 34.5 32 34.5 C26.5 34.5 17 26.5 17 17.5 Z"
        stroke={strokeColor}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 24. Hand-Drawn Settings / Cog Gear
export function ChalkSettingsIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      {/* Cog body */}
      <path
        d="M21.5 12 L26.5 12 L27.2 15 C28.3 15.5 29.3 16.2 30.2 17 L33.2 15.8 L35.5 19.5 L33.2 22 C33.6 22.9 33.8 23.9 33.8 24.9 C33.8 25.9 33.6 26.9 33.2 27.8 L35.5 30.3 L33.2 34 L30.2 32.8 C29.3 33.6 28.3 34.3 27.2 34.8 L26.5 37.8 L21.5 37.8 L20.8 34.8 C19.7 34.3 18.7 33.6 17.8 32.8 L14.8 34 L12.5 30.3 L14.8 27.8 C14.4 26.9 14.2 25.9 14.2 24.9 C14.2 23.9 14.4 22.9 14.8 22 L12.5 19.5 L14.8 15.8 L17.8 17 C18.7 16.2 19.7 15.5 20.8 15 Z"
        stroke={strokeColor}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Center hole */}
      <circle cx="24" cy="24.9" r="3.8" stroke={strokeColor} strokeWidth="2.1" />
    </svg>
  );
}

// 25. Hand-Drawn Price Tag
export function ChalkTagIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      {/* Slanted tag */}
      <path
        d="M17 14 L27 14 L34 21 L26 29 L19 22 L17 14 Z"
        stroke={strokeColor}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22" cy="18" r="1.5" stroke={strokeColor} strokeWidth="1.8" />
    </svg>
  );
}

// 26. Hand-Drawn Chat Speech Bubble
export function ChalkChatIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      {/* Bubble body with tail */}
      <path
        d="M14 16 C14 13.8 16 12 18.5 12 L29.5 12 C32 12 34 13.8 34 16 L34 26 C34 28.2 32 30 29.5 30 L22 30 L16 35 L17 30 L18.5 30 C16 30 14 28.2 14 26 Z"
        stroke={strokeColor}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M19 18 L29 18 M19 23 L26 23" stroke={strokeColor} strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}

// 27. Hand-Drawn Flag
export function ChalkFlagIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      <path d="M17 12 L17 36" stroke={strokeColor} strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M17 13 L32 18 L17 24 Z"
        stroke={strokeColor}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 36 L20 36" stroke={strokeColor} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

// 28. Hand-Drawn User Profile
export function ChalkUserIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      <circle cx="24" cy="18" r="5" stroke={strokeColor} strokeWidth="2.3" />
      <path
        d="M14 34 C14 28.5 18 26.5 24 26.5 C30 26.5 34 28.5 34 34"
        stroke={strokeColor}
        strokeWidth="2.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 29. Hand-Drawn Sun (Theme Toggle)
export function ChalkSunIcon({
  size = 32,
  className = "",
  diskColor = DEFAULT_DISK,
  strokeColor = DEFAULT_STROKE,
  ...props
}: ChalkIconProps) {
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
      <circle cx="24" cy="24" r="22" fill={diskColor} />
      <circle cx="24" cy="24" r="6" stroke={strokeColor} strokeWidth="2.3" />
      <path d="M24 11 L24 14 M24 34 L24 37 M11 24 L14 24 M34 24 L37 24 M15 15 L17.5 17.5 M30.5 30.5 L33 33 M15 33 L17.5 30.5 M30.5 17.5 L33 15" stroke={strokeColor} strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}
