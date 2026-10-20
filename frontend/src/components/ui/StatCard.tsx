"use client";

import * as React from "react";

export type StatCardVariant = 'blue' | 'green' | 'red' | 'amber' | 'violet';

export interface StatCardProps {
  variant: StatCardVariant;
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  delta?: string;          // e.g. "+4.2%"
  deltaPositive?: boolean; // green if true, red if false
  progress?: number;       // 0–100, shows ring if provided
  loading?: boolean;
}

const variantStyles: Record<
  StatCardVariant,
  { bg: string; accent: string; iconBg: string }
> = {
  blue:   { bg: '#EFF6FF', accent: '#3B82F6', iconBg: '#DBEAFE' },
  green:  { bg: '#F0FDF4', accent: '#10B981', iconBg: '#DCFCE7' },
  red:    { bg: '#FFF1F2', accent: '#EF4444', iconBg: '#FFE4E8' },
  amber:  { bg: '#FFFBEB', accent: '#F59E0B', iconBg: '#FEF3C7' },
  violet: { bg: '#F5F3FF', accent: '#7C3AED', iconBg: '#EDE9FE' },
};

function CircularProgress({
  value,
  color,
  size = 48,
  strokeWidth = 4,
}: {
  value: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeOpacity={0.2}
          fill="none"
        />
        {/* Fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 700,
          color: '#0F172A',
        }}
      >
        {Math.round(clamped)}%
      </div>
    </div>
  );
}

export function StatCard({
  variant,
  icon,
  label,
  value,
  sub,
  delta,
  deltaPositive = false,
  progress,
  loading = false,
}: StatCardProps) {
  const styles = variantStyles[variant];

  if (loading) {
    return (
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          padding: 20,
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #F1F5F9',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}
      >
        <div className="animate-shimmer" style={{ width: 32, height: 32, borderRadius: 8, marginBottom: 16 }} />
        <div className="animate-shimmer" style={{ width: 140, height: 28, borderRadius: 6, marginBottom: 8 }} />
        <div className="animate-shimmer" style={{ width: 90, height: 12, borderRadius: 4, marginBottom: 6 }} />
        <div className="animate-shimmer" style={{ width: 110, height: 12, borderRadius: 4 }} />
      </div>
    );
  }

  return (
    <div
      style={{
        background: styles.bg,
        borderRadius: 16,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
      }}
    >
      {/* Decorative blob — bottom right */}
      <div
        style={{
          position: 'absolute',
          bottom: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: styles.accent,
          opacity: 0.15,
          pointerEvents: 'none',
        }}
      />

      {/* Top accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: styles.accent,
          borderRadius: '16px 16px 0 0',
        }}
      />

      {/* Content */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          {/* Icon + delta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div
              style={{
                background: styles.iconBg,
                borderRadius: 8,
                padding: 6,
                color: styles.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon}
            </div>
            {delta && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: 999,
                  background: deltaPositive ? '#DCFCE7' : '#FFE4E8',
                  color: deltaPositive ? '#059669' : '#DC2626',
                }}
              >
                {delta}
              </span>
            )}
          </div>

          <div style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {value}
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#94A3B8',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginTop: 6,
            }}
          >
            {label}
          </div>
          {sub && <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{sub}</div>}
        </div>

        {/* Circular progress ring */}
        {progress !== undefined && (
          <CircularProgress value={progress} color={styles.accent} size={48} strokeWidth={4} />
        )}
      </div>
    </div>
  );
}
