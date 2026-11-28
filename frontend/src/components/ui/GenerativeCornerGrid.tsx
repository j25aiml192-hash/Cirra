"use client";

import React, { useEffect, useState } from "react";

// Crisp, generative moving corner grid boxes with high contrast and visibility
export function GenerativeCornerGrid({ position }: { position: "top-left" | "bottom-right" }) {
  const rows = 14;
  const cols = 14;
  const [activeIndices, setActiveIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Generate initial pattern of corner grid squares
    const updatePattern = () => {
      const next = new Set<number>();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const index = r * cols + c;
          const dist = position === "top-left" ? r + c : (rows - 1 - r) + (cols - 1 - c);
          if (dist < 13) {
            const probability = Math.max(0.25, 0.9 - dist * 0.07);
            if (Math.random() < probability) {
              next.add(index);
            }
          }
        }
      }
      setActiveIndices(next);
    };

    updatePattern();
    const interval = setInterval(updatePattern, 2000);
    return () => clearInterval(interval);
  }, [position]);

  return (
    <div
      className={`absolute pointer-events-none z-0 overflow-hidden select-none ${
        position === "top-left" ? "top-0 left-0" : "bottom-0 right-0"
      }`}
    >
      <div
        className="grid gap-[3px] p-2"
        style={{
          gridTemplateColumns: `repeat(${cols}, 32px)`,
          gridTemplateRows: `repeat(${rows}, 32px)`,
        }}
      >
        {Array.from({ length: rows * cols }).map((_, i) => {
          const isActive = activeIndices.has(i);
          return (
            <div
              key={i}
              className={`w-[32px] h-[32px] transition-all duration-700 ease-in-out ${
                isActive
                  ? "border border-zinc-600/90 bg-zinc-800/60 shadow-[0_0_12px_rgba(255,255,255,0.06)]"
                  : "border border-zinc-900/60 bg-transparent"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
