"use client";

import React from "react";
import { AuroraBackground } from "@/components/ui/aurora-background";

/**
 * AskCirraBackground
 * Provides an atmospheric Deep Space Aurora canvas exclusively for the Ask Cirra interface.
 * Features deep space navy (#030817), royal blue (#123B78), electric blue (#1856A8 / #287FE8),
 * and subtle cosmic highlights.
 */
export function AskCirraBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#030817]">
      {/* Deep Space radial foundation */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#0A1931_0%,#030817_60%,#01040D_100%)] opacity-90" />

      {/* Live Aurora Canvas (Space Blue Variant) */}
      <AuroraBackground
        variant="space"
        speed={0.8}
        blobCount={5}
        className="absolute inset-0 opacity-45 mix-blend-screen"
      />

      {/* Cosmic Electric Blue & Indigo Glow Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[460px] bg-[radial-gradient(ellipse_at_center,rgba(40,127,232,0.18),rgba(18,59,120,0.08),transparent_70%)] blur-3xl" />
      <div className="absolute bottom-12 right-1/4 w-[520px] h-[360px] bg-[radial-gradient(ellipse_at_center,rgba(24,86,168,0.22),transparent_70%)] blur-2xl" />

      {/* Deep space translucent star-grid dot pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(40,127,232,0.18)_1px,transparent_1px)] [background-size:24px_24px] opacity-35" />
    </div>
  );
}

export default AskCirraBackground;

