import * as React from "react";

export interface HeroBannerProps {
  chips: Array<{ icon: React.ReactNode; label: string }>;
  title: string;
}

export function HeroBanner({ chips, title }: HeroBannerProps) {
  return (
    <div
      style={{
        borderRadius: 20,
        padding: "20px 28px",
        background: "linear-gradient(135deg, #312E81 0%, #4F46E5 50%, #6D28D9 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 8px 32px rgba(79, 70, 229, 0.25)",
      }}
    >
      <div>
        <div
          style={{
            display: "inline-block",
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(8px)",
            color: "white",
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 999,
            padding: "3px 10px",
            marginBottom: 8,
            letterSpacing: "0.04em",
          }}
        >
          Executive Summary
        </div>
        <div style={{ color: "white", fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" }}>
          {title}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {chips.map((chip, index) => (
          <div
            key={index}
            style={{
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 999,
              color: "white",
              fontSize: 12,
              fontWeight: 500,
              padding: "6px 12px",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {chip.icon} {chip.label}
          </div>
        ))}
      </div>
    </div>
  );
}
