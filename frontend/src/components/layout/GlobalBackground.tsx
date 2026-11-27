"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { GlyphBackground } from "@/components/ui/backgrounds-glyph";

export function GlobalBackground() {
  const pathname = usePathname();
  // Exclude Ask Cirra (dedicated sky theme) and Dashboard (uses MosaicShaderBackground)
  const isExcluded =
    pathname === "/ask" ||
    pathname?.startsWith("/ask") ||
    pathname === "/dashboard" ||
    pathname?.startsWith("/dashboard");

  if (isExcluded) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    >
      <GlyphBackground
        className="size-full"
        glowColor="#94A3B8"
        shapeColor="#0062E0"
        fontSize={11}
        interactive={true}
      />
    </div>
  );
}

export default GlobalBackground;
