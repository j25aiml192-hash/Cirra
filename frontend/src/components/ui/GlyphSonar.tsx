"use client";

import React, { useEffect, useRef } from "react";

export interface GlyphSonarProps {
  className?: string;
  theme?: "dark-blue" | "dark" | "default";
  backgroundColor?: string;
  glyphColor?: string;
  activeGlyphColor?: string;
  pingColor?: string;
  beamColor?: string;
  sonarSpeed?: number;
  glyphCount?: number;
  showRings?: boolean;
  showSweep?: boolean;
  interactive?: boolean;
}

interface GlyphParticle {
  x: number;
  y: number;
  char: string;
  baseSize: number;
  vx: number;
  vy: number;
  brightness: number;
  targetBrightness: number;
  lastPingTime: number;
}

const GLYPH_CHARS = [
  "0", "1", "Δ", "λ", "Ω", "π", "Σ", "Ψ", "◈", "⬡", "⬢", "⌖", "⟡", "✦",
  "+", "×", "÷", "%", "$", "#", "@", "&", "~", "≈", "≠", "≡", "√", "∫",
  "⊞", "⌁", "⍉", "::", ">>", "//", "{", "}"
];

export function GlyphSonar({
  className = "",
  theme = "dark-blue",
  backgroundColor = "#050B18",
  glyphColor = "rgba(56, 189, 248, 0.16)",
  activeGlyphColor = "rgba(186, 230, 253, 0.95)",
  pingColor = "rgba(56, 189, 248, 0.45)",
  beamColor = "rgba(14, 165, 233, 0.22)",
  sonarSpeed = 0.65,
  glyphCount = 130,
  showRings = true,
  showSweep = true,
  interactive = true,
}: GlyphSonarProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -1000,
    y: -1000,
    active: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    let glyphs: GlyphParticle[] = [];

    const initGlyphs = (w: number, h: number) => {
      glyphs = [];
      const count = Math.max(70, Math.floor((w * h) / 12000));
      for (let i = 0; i < count; i++) {
        const char = GLYPH_CHARS[Math.floor(Math.random() * GLYPH_CHARS.length)] || "◈";
        glyphs.push({
          x: Math.random() * w,
          y: Math.random() * h,
          char,
          baseSize: 11 + Math.random() * 5,
          vx: (Math.random() - 0.5) * 0.18,
          vy: (Math.random() - 0.5) * 0.18,
          brightness: 0.15 + Math.random() * 0.15,
          targetBrightness: 0.15,
          lastPingTime: 0,
        });
      }
    };

    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      initGlyphs(width, height);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    if (interactive && canvas) {
      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("mouseleave", handleMouseLeave);
    }

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (width <= 10 || height <= 10) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const cx = width / 2;
      const cy = height * 0.45;

      // Deep dark blue base with subtle vignette
      const maxDim = Math.max(width, height);
      const bgR0 = Math.max(0, Math.min(40, maxDim * 0.08));
      const bgR1 = Math.max(bgR0 + 20, maxDim * 0.85);
      const bgGrad = ctx.createRadialGradient(cx, cy, bgR0, cx, cy, bgR1);
      bgGrad.addColorStop(0, "#010710ff");
      bgGrad.addColorStop(0.5, "#000208ff");
      bgGrad.addColorStop(1, backgroundColor);

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Ambient organic shimmer and shoals of glyphs without radar sweep or circle rings


      // 4. Update & Render Glyphs Shoals
      ctx.save();
      for (const g of glyphs) {
        if (!g) continue;

        // Drift slowly like particles in a shoal
        g.x += g.vx;
        g.y += g.vy;
        if (g.x < 0) g.x = width;
        if (g.x > width) g.x = 0;
        if (g.y < 0) g.y = height;
        if (g.y > height) g.y = 0;

        // Gentle organic twinkle shimmer across the matrix
        const wave = Math.sin(time * 0.0012 + g.x * 0.008 + g.y * 0.006);
        const organicTwinkle = 0.12 + Math.max(0, wave) * 0.35;

        // Mouse hover interaction illumination
        let mouseBoost = 0;
        if (mouseRef.current.active) {
          const mdx = g.x - mouseRef.current.x;
          const mdy = g.y - mouseRef.current.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist < 160) {
            mouseBoost = (1 - mdist / 160) * 0.85;
          }
        }

        // Target brightness combining ambient twinkle and mouse glow
        const targetBrightness = Math.max(organicTwinkle, mouseBoost);
        if (targetBrightness > g.brightness) {
          g.brightness += (targetBrightness - g.brightness) * 0.15;
        } else {
          g.brightness -= (g.brightness - targetBrightness) * 0.05;
        }

        // Render Glyph
        ctx.font = `${Math.round(g.baseSize + g.brightness * 2)}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (g.brightness > 0.45) {
          // Bright illuminated state with soft cyan glow
          ctx.shadowColor = "#38BDF8";
          ctx.shadowBlur = g.brightness * 10;
          ctx.fillStyle = `rgba(224, 242, 254, ${Math.min(1, g.brightness * 1.1)})`;
          ctx.fillText(g.char, g.x, g.y);
          ctx.shadowBlur = 0;
        } else {
          // Ambient dormant state
          ctx.fillStyle = `rgba(56, 189, 248, ${g.brightness})`;
          ctx.fillText(g.char, g.x, g.y);
        }
      }

      ctx.restore();

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      if (interactive && canvas) {
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, [
    backgroundColor,
    glyphColor,
    activeGlyphColor,
    pingColor,
    beamColor,
    sonarSpeed,
    glyphCount,
    showRings,
    showSweep,
    interactive,
  ]);

  return (
    <div className={`absolute inset-0 pointer-events-none select-none overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

export default GlyphSonar;
