"use client";

import * as React from "react";

export interface ConcaveCarouselProps {
  items?: React.ReactNode[];
  children?: React.ReactNode;
  className?: string;
  curvature?: number;
  perspective?: number;
  selectedIndex?: number;
  onSelect?: (index: number) => void;
}

export function ConcaveCarousel({
  items,
  children,
  className = "",
  curvature = 24,
  perspective = 850,
  selectedIndex,
  onSelect,
}: ConcaveCarouselProps) {
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);

  // Collect card nodes either from items prop or React children
  const rawCards = React.useMemo(() => {
    if (items && items.length > 0) return items;
    if (children) return React.Children.toArray(children);
    return [];
  }, [items, children]);

  if (rawCards.length === 0) return null;

  const count = rawCards.length;
  const centerIdx = (count - 1) / 2;

  return (
    <div
      className={`w-full py-6 overflow-visible select-none ${className}`}
      style={{
        perspective: `${perspective}px`,
      }}
    >
      <div
        className="w-full max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 transition-all duration-500 ease-out"
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {rawCards.map((card, idx) => {
          // Relative position from center: left is -1, center is 0, right is +1
          const offset = idx - centerIdx;
          const isHovered = hoveredIdx === idx;
          const isSelected = selectedIndex === idx;

          // Strong concave curvature with edge-anchoring:
          // Left card rotates inward around its right hinge
          // Right card rotates inward around its left hinge
          // Center card remains straight
          const baseRotateY = -offset * curvature;
          const transformOrigin =
            offset < 0 ? "right center" : offset > 0 ? "left center" : "center center";

          const baseTranslateZ = offset === 0 ? 16 : -20;
          const baseScale = offset === 0 ? 1.02 : 0.98;

          // Active transforms on hover or selection
          const activeRotateY = isHovered ? baseRotateY * 0.35 : baseRotateY;
          const activeTranslateZ = isHovered ? 36 : isSelected ? baseTranslateZ + 12 : baseTranslateZ;
          const activeScale = isHovered ? 1.04 : isSelected ? 1.02 : baseScale;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => onSelect?.(idx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect?.(idx);
                }
              }}
              className="relative cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-transform outline-none focus-visible:ring-2 focus-visible:ring-[#0A192F] rounded-[24px]"
              style={{
                transform: `rotateY(${activeRotateY}deg) translateZ(${activeTranslateZ}px) scale(${activeScale})`,
                transformOrigin,
                transformStyle: "preserve-3d",
                zIndex: isHovered ? 40 : isSelected ? 35 : offset === 0 ? 30 : 20,
              }}
            >
              <div
                className={`w-full h-full rounded-[24px] bg-white transition-all duration-300 ${
                  isSelected
                    ? "border-2 border-[#5F86A6] ring-4 ring-[#5F86A6]/20 shadow-[0_24px_50px_-10px_rgba(95,134,166,0.30)]"
                    : isHovered
                    ? "border-2 border-[#5F86A6]/60 shadow-[0_24px_50px_-12px_rgba(95,134,166,0.22)]"
                    : offset === 0
                    ? "border border-[#D6E4F5] shadow-[0_16px_40px_-10px_rgba(12,48,96,0.12)]"
                    : "border border-[#D6E4F5] shadow-[0_12px_32px_-8px_rgba(12,48,96,0.10)]"
                }`}
              >
                {card}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ConcaveCarousel;
