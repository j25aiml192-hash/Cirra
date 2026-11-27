"use client";

import * as React from "react";

export function CursorEffect() {
  const [enabled, setEnabled] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isClicking, setIsClicking] = React.useState(false);

  const pos = React.useRef({ x: -100, y: -100 });
  const target = React.useRef({ x: -100, y: -100 });
  const ringRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Only enable on desktop with fine pointer
    if (typeof window === "undefined" || !window.matchMedia("(pointer: fine)").matches) {
      return;
    }
    setEnabled(true);

    let rafId: number;

    const onPointerMove = (e: PointerEvent) => {
      target.current = { x: e.clientX, y: e.clientY };

      // Check if hovering over interactive element
      const targetEl = e.target as HTMLElement | null;
      if (targetEl) {
        const interactive = Boolean(
          targetEl.closest("button, a, input, select, textarea, [role='button'], .cursor-pointer")
        );
        setIsHovered(interactive);
      }
    };

    const onPointerDown = () => setIsClicking(true);
    const onPointerUp = () => setIsClicking(false);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });

    // Smooth Lerp animation loop
    const animate = () => {
      // Lerp position
      pos.current.x += (target.current.x - pos.current.x) * 0.25;
      pos.current.y += (target.current.y - pos.current.y) * 0.25;

      // Update ring
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden select-none"
    >
      {/* Simple, Flat Precision Cursor (No Pop-Out, No Shadow) */}
      <div
        ref={ringRef}
        className="absolute top-0 left-0 -ml-2.5 -mt-2.5 w-5 h-5 rounded-full will-change-transform flex items-center justify-center pointer-events-none"
      >
        <div
          className={`size-full rounded-full border transition-colors duration-150 flex items-center justify-center ${
            isClicking
              ? "border-white bg-white/10"
              : isHovered
              ? "border-white/80 bg-transparent"
              : "border-white/40 bg-transparent"
          }`}
        >
          {/* Simple Center Dot */}
          <div className="size-1 rounded-full bg-white/70" />
        </div>
      </div>
    </div>
  );
}

export default CursorEffect;

