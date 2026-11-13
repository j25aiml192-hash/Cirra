"use client";

import * as React from "react";

export interface ClickStackProps {
  items?: React.ReactNode[];
  cardWidth?: string;
  spreadX?: number;
  spreadY?: number;
  className?: string;
  showControls?: boolean;
  activeIndex?: number;
  onCardChange?: (index: number) => void;
}

export function ClickStack({
  items = [],
  cardWidth = "max-w-[760px]",
  spreadX = 0,
  spreadY = 22,
  className = "",
  showControls = true,
  activeIndex,
  onCardChange,
}: ClickStackProps) {
  // Array of active card item indices in display order [front, middle, back]
  const [order, setOrder] = React.useState<number[]>(() =>
    items.map((_, i) => i)
  );
  const [animatingCard, setAnimatingCard] = React.useState<number | null>(null);
  const [animationDirection, setAnimationDirection] = React.useState<"forward" | "backward">("forward");
  const isInternalChangeRef = React.useRef(false);
  const prevActiveIndexRef = React.useRef(activeIndex);

  // Keep order in sync if items length changes
  React.useEffect(() => {
    setOrder(items.map((_, i) => i));
  }, [items.length]);

  const advanceStack = React.useCallback(() => {
    if (items.length <= 1 || animatingCard !== null || order.length === 0) return;
    const topCard = order[0] ?? 0;
    setAnimatingCard(topCard);
    setAnimationDirection("forward");
    isInternalChangeRef.current = true;

    setTimeout(() => {
      setOrder((prev) => {
        if (prev.length <= 1) return prev;
        const first = prev[0];
        const next = prev.slice(1);
        if (first !== undefined) {
          next.push(first);
        }
        if (onCardChange && next[0] !== undefined) onCardChange(next[0]);
        return next;
      });
      setAnimatingCard(null);
    }, 160);
  }, [items.length, animatingCard, order, onCardChange]);

  const selectIndex = React.useCallback(
    (targetIdx: number) => {
      if (animatingCard !== null || order.length === 0) return;
      const pos = order.indexOf(targetIdx);
      if (pos <= 0) return;
      const topCard = order[0] ?? 0;
      setAnimatingCard(topCard);
      setAnimationDirection("forward");
      isInternalChangeRef.current = true;

      setTimeout(() => {
        setOrder((prev) => {
          const clickedPos = prev.indexOf(targetIdx);
          if (clickedPos === -1) return prev;
          const next: number[] = [...prev.slice(clickedPos), ...prev.slice(0, clickedPos)];
          if (onCardChange && next[0] !== undefined) onCardChange(next[0]);
          return next;
        });
        setAnimatingCard(null);
      }, 160);
    },
    [animatingCard, order, onCardChange]
  );

  // Sync only on external activeIndex change, avoiding echo loops
  React.useEffect(() => {
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      prevActiveIndexRef.current = activeIndex;
      return;
    }
    if (activeIndex !== undefined && activeIndex !== prevActiveIndexRef.current) {
      prevActiveIndexRef.current = activeIndex;
      if (order.length > 0 && order[0] !== activeIndex) {
        selectIndex(activeIndex);
      }
    }
  }, [activeIndex, selectIndex, order]);

  if (!items || items.length === 0) return null;

  const currentFront = order[0] ?? 0;
  const maxSpreadY = Math.max(0, (items.length - 1) * spreadY);

  return (
    <div className={`flex flex-col items-center w-full select-none ${className}`}>

      {/* 3D Card Stack Container */}
      <div className={`relative w-full ${cardWidth} h-[560px] sm:h-[520px]`}>
        {/* Deep ambient elevation ground shadow beneath the stack */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[88%] h-14 bg-gradient-to-t from-[#0A192F]/16 via-[#0062E0]/10 to-transparent rounded-[100%] blur-2xl pointer-events-none" />

        {items.map((node, originalIdx) => {
          const depth = order.indexOf(originalIdx);
          const isTop = depth === 0;
          const isExiting = animatingCard === originalIdx;

          // Compute 3D stacked placement: back cards peek out at the TOP
          let translateY = maxSpreadY - depth * spreadY;
          let translateX = depth * spreadX;
          let scale = 1 - depth * 0.04;
          let rotate = depth === 0 ? 0 : depth === 1 ? 1 : -1;
          let opacity = 1;
          let zIndex = 30 - depth * 10;

          if (isExiting) {
            if (animationDirection === "forward") {
              translateY = maxSpreadY - 60;
              translateX = 36;
              scale = 0.95;
              rotate = 5;
              opacity = 0;
            } else {
              translateY = maxSpreadY + 60;
              translateX = -36;
              scale = 0.95;
              rotate = -5;
              opacity = 0;
            }
          }

          return (
            <div
              key={originalIdx}
              onClick={() => {
                if (isTop) {
                  advanceStack();
                } else {
                  selectIndex(originalIdx);
                }
              }}
              className="absolute top-0 left-0 right-0 w-full transition-[transform,opacity] duration-200 ease-out will-change-transform cursor-pointer"
              style={{
                transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale}) rotate(${rotate}deg)`,
                opacity,
                zIndex,
                transformOrigin: "center top",
              }}
            >
              <div
                className={`w-full rounded-[24px] bg-[#5F86A6] text-white border border-[#4A6E8C] transition-shadow duration-300 ${
                  isTop
                    ? "shadow-[0_32px_75px_-12px_rgba(10,25,47,0.30),0_16px_36px_-8px_rgba(0,98,224,0.18),0_4px_16px_rgba(10,25,47,0.10)] ring-1 ring-white/15 hover:shadow-[0_36px_85px_-12px_rgba(10,25,47,0.36)]"
                    : "shadow-[0_16px_42px_-8px_rgba(10,25,47,0.22),0_6px_18px_-4px_rgba(0,98,224,0.12)] hover:border-[#3D5C75]"
                }`}
              >
                {node}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Scenario Dots / Quick-Switch Pills */}
      {showControls && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {items.map((_, idx) => {
            const isActive = currentFront === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => selectIndex(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer flex items-center justify-center ${
                  isActive
                    ? "w-8 h-2.5 bg-[#0062E0]"
                    : "w-2.5 h-2.5 bg-[#CBD5E1] hover:bg-[#94A3B8]"
                }`}
                aria-label={`Jump to proposal ${idx + 1}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ClickStack;
