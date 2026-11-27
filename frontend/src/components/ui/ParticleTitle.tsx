"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Maths & Types                                                      */
/* ------------------------------------------------------------------ */

export type RGB = [number, number, number];
export type Box = { x: number; y: number; w: number; h: number };
export type Field = { cx: number; cy: number; rx: number; ry: number };
export type Mode = "smoke" | "vortex" | "sand" | "burst" | "sweep" | "absorb";
export type Blob = { rgb: RGB; a: number; fx: number; fy: number; fw: number; fh: number };
export type Palette = { ink: RGB; page: RGB; blobs: Blob[] };

export const MODES: Mode[] = ["smoke", "vortex", "sand", "burst", "sweep", "absorb"];
const TIMING = { hold: 4200, field: 1000, travel: 3800 };

/* Cirra Deep Space Theme Palette:
   - Particle text: Bright Soft White (#EBF4FF -> [235, 244, 255])
   - Background: Deep Space Navy (#030817 -> [3, 8, 23])
   - Particle glow: Royal Blue (#1856A8 -> [24, 86, 168])
   - Secondary glow: Electric Blue (#287FE8 -> [40, 127, 232])
   - Accent particles: Cosmic Indigo (#344F91 -> [52, 79, 145])
   - Subtle ambient highlights: Soft Blue Highlight (#68B7FF -> [104, 183, 255])
*/
const CIRRA_DARK: Palette = {
  ink: [235, 244, 255],
  page: [3, 8, 23],
  blobs: [
    { rgb: [40, 127, 232], a: 0.55, fx: 0.04, fy: 0.08, fw: 0.62, fh: 0.78 }, // Electric blue (#287FE8)
    { rgb: [24, 86, 168], a: 0.45, fx: 0.44, fy: 0.22, fw: 0.54, fh: 0.7 },   // Royal blue (#1856A8)
    { rgb: [104, 183, 255], a: 0.38, fx: 0.3, fy: 0.44, fw: 0.44, fh: 0.56 }, // Soft blue highlight (#68B7FF)
    { rgb: [52, 79, 145], a: 0.3, fx: 0.55, fy: 0.15, fw: 0.4, fh: 0.6 },    // Cosmic indigo (#344F91)
  ],
};

const CIRRA_LIGHT: Palette = {
  ink: [32, 24, 48],
  page: [248, 246, 252],
  blobs: [
    { rgb: [184, 138, 232], a: 0.45, fx: 0.04, fy: 0.08, fw: 0.62, fh: 0.78 },
    { rgb: [216, 180, 248], a: 0.4, fx: 0.44, fy: 0.22, fw: 0.54, fh: 0.7 },
    { rgb: [230, 210, 250], a: 0.35, fx: 0.3, fy: 0.44, fw: 0.44, fh: 0.56 },
  ],
};

function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => {
  const c = clamp(t);
  return c * c * (3 - 2 * c);
};
const ease = (t: number) => {
  const c = clamp(t);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};

function createModeBag(seed: number): () => Mode {
  const r = createRng(seed);
  let bag: Mode[] = [];
  let last: Mode | null = null;
  return () => {
    if (!bag.length) {
      bag = MODES.slice();
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        const currentI = bag[i];
        const currentJ = bag[j];
        if (currentI !== undefined && currentJ !== undefined) {
          bag[i] = currentJ;
          bag[j] = currentI;
        }
      }
      const lastItem = bag[bag.length - 1];
      const firstItem = bag[0];
      if (lastItem !== undefined && firstItem !== undefined && lastItem === last) {
        bag[0] = lastItem;
        bag[bag.length - 1] = firstItem;
      }
    }
    last = bag.pop() ?? "smoke";
    return last;
  };
}

function blobStrength(b: Blob, A: Box, x: number, y: number) {
  const bw = Math.max(1, b.fw * A.w), bh = Math.max(1, b.fh * A.h);
  const cx = A.x + b.fx * A.w + bw / 2, cy = A.y + b.fy * A.h + bh / 2;
  return Math.max(0, 1 - Math.hypot((x - cx) / (bw / 2), (y - cy) / (bh / 2))) * b.a;
}

function rimMask(A: Box, x: number, y: number) {
  const hw = Math.max(1, A.w / 2), hh = Math.max(1, A.h / 2);
  const r = Math.hypot((x - (A.x + hw)) / hw, (y - (A.y + hh)) / hh);
  return r < 0.55 ? 1 : r >= 1 ? 0 : 1 - (r - 0.55) / 0.45;
}

function glowAt(pal: Palette, A: Box, x: number, y: number): { c: RGB; s: number } {
  let [r, g, b] = pal.page;
  let vis = 0;
  const m = rimMask(A, x, y);
  for (const bl of pal.blobs) {
    const s = blobStrength(bl, A, x, y) * m;
    r = mix(r, bl.rgb[0], s);
    g = mix(g, bl.rgb[1], s);
    b = mix(b, bl.rgb[2], s);
    vis = Math.max(vis, s);
  }
  return { c: [r, g, b], s: vis };
}

function sampleFieldPoint(pal: Palette, rand: () => number, f: Field, A: Box) {
  let best: { x: number; y: number; c: RGB; s: number } | null = null;
  for (let k = 0; k < 4; k++) {
    const a = rand() * 6.2832;
    const q = Math.pow(rand(), 0.6);
    const x = f.cx + Math.cos(a) * f.rx * q;
    const y = f.cy + Math.sin(a) * f.ry * q;
    const g = glowAt(pal, A, x, y);
    if (!best || g.s > best.s) best = { x, y, c: g.c, s: g.s };
  }
  return best as { x: number; y: number; c: RGB; s: number };
}

/* ------------------------------------------------------------------ */
/* Canvas engine                                                      */
/* ------------------------------------------------------------------ */

type Cell = {
  rx: number; ry: number; rw: number; rh: number; hx: number; hy: number; nx: number; ny: number;
  r1: number; r2: number; r3: number; size: number; fx: number; fy: number; fc: RGB;
  lt: number; bend: number; pa: number;
};

type RawPoint = {
  x: number;
  y: number;
  w: number;
  h: number;
  hx: number;
  hy: number;
};

type Phase = "text" | "dissolving" | "field" | "gathering";

function plan(mode: Mode, p: Cell, W: number, H: number) {
  switch (mode) {
    case "smoke": return { delay: (1 - clamp(p.ny)) * 0.35 + p.r3 * 0.25, bend: (p.r1 - 0.5) * 150 };
    case "vortex":
      return {
        delay: (Math.hypot(p.hx - W / 2, p.hy - H / 2) / Math.max(1, W)) * 0.9 + p.r3 * 0.15,
        bend: (p.r2 > 0.5 ? 1 : -1) * (90 + p.r1 * 140),
      };
    case "sand": return { delay: p.nx * 0.6 + p.r3 * 0.18, bend: (p.r1 - 0.5) * 60 };
    case "burst": return { delay: p.r3 * 0.1, bend: (p.r2 - 0.5) * 26 };
    case "sweep": return { delay: (1 - p.nx) * 0.6 + p.r3 * 0.18, bend: -(60 + p.r1 * 90) };
    default: return { delay: p.r1 * 0.55, bend: (p.r2 - 0.5) * 100 };
  }
}

function bowAt(a: [number, number], b: [number, number], bend: number, t: number) {
  const e = ease(t), dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
  const bow = Math.sin(e * Math.PI) * bend;
  return [mix(a[0], b[0], e) + (-dy / L) * bow, mix(a[1], b[1], e) + (dx / L) * bow, e] as const;
}

const rgbStr = (a: RGB, b: RGB, t: number) => {
  const c = (i: 0 | 1 | 2) => Math.max(0, Math.min(255, Math.round(mix(a[i], b[i], t))));
  return `rgb(${c(0)},${c(1)},${c(2)})`;
};

type Engine = { setActive: (on: boolean) => void; resize: () => void; destroy: () => void };

const FONT_STACK = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

function createEngine(
  cv: HTMLCanvasElement,
  text: string,
  pal: Palette,
  fontFamily: string = FONT_STACK,
  fontWeight: string | number = 700
): Engine | null {
  const ctx = cv.getContext("2d");
  if (!ctx) return null;
  const textCv = document.createElement("canvas");
  const nextMode = createModeBag((Date.now() & 0xffff) ^ 0x5a5a);
  let W = 0, H = 0, dpr = 1;
  let field: Field = { cx: 0, cy: 0, rx: 0, ry: 0 };
  let box: Box = { x: 0, y: 0, w: 0, h: 0 };
  let parts: Cell[] = [];
  let phase: Phase = "text";
  let mode: Mode = nextMode();
  let phaseStart = performance.now();
  let raf = 0;
  let timer: any = 0;
  let active = true;
  let destroyed = false;

  function reroll() {
    const r = createRng((Math.random() * 1e9) | 0);
    for (const p of parts) {
      const q = sampleFieldPoint(pal, r, field, box);
      p.fx = q.x;
      p.fy = q.y;
      p.fc = q.c;
    }
  }

  function build() {
    if (destroyed) return;
    const rect = cv.getBoundingClientRect();
    W = rect.width || cv.clientWidth || cv.parentElement?.clientWidth || 600;
    H = rect.height || cv.clientHeight || cv.parentElement?.clientHeight || 88;
    dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);

    cv.width = Math.max(1, Math.round(W * dpr));
    cv.height = Math.max(1, Math.round(H * dpr));
    textCv.width = cv.width;
    textCv.height = cv.height;

    // Responsive font sizing matching existing 3xl/4xl heading
    const fs = W >= 768 ? 36 : Math.max(20, Math.min(32, Math.round(W * 0.052)));
    const ty = H / 2;
    box = { x: 0, y: 0, w: Math.max(1, W), h: Math.max(1, H) };
    field = {
      cx: W / 2,
      cy: H / 2,
      rx: Math.min(320, W * 0.44),
      ry: Math.min(46, H * 0.4),
    };

    const o = textCv.getContext("2d");
    if (!o) return;
    o.setTransform(dpr, 0, 0, dpr, 0, 0);
    o.clearRect(0, 0, W, H);
    o.font = `${fontWeight} ${fs}px ${fontFamily}`;
    o.textAlign = "center";
    o.textBaseline = "middle";

    const tx = W / 2;
    o.fillStyle = `rgba(${pal.ink.join(",")},0.95)`;
    o.fillText(text, tx, ty);

    const m = o.measureText(text);
    const tw = m.width || W * 0.8;
    const X0 = Math.max(0, Math.floor((tx - tw / 2 - 10) * dpr));
    const X1 = Math.min(cv.width, Math.ceil((tx + tw / 2 + 10) * dpr));
    const Y0 = Math.max(0, Math.floor((ty - fs - 6) * dpr));
    const Y1 = Math.min(cv.height, Math.ceil((ty + fs + 6) * dpr));
    const d = o.getImageData(0, 0, cv.width, cv.height).data;

    let cs = Math.max(2, Math.round(3 * dpr));
    let pts: RawPoint[] = [];
    for (;;) {
      pts = [];
      for (let y = Y0; y < Y1; y += cs) {
        for (let x = X0; x < X1; x += cs) {
          const w = Math.min(cs, cv.width - x), h = Math.min(cs, cv.height - y);
          let hit = false;
          for (let yy = y; yy < y + h && !hit; yy++) {
            for (let xx = x; xx < x + w; xx++) {
              const idx = (yy * cv.width + xx) * 4 + 3;
              if ((d[idx] ?? 0) > 0) {
                hit = true;
                break;
              }
            }
          }
          if (hit) {
            pts.push({
              x,
              y,
              w,
              h,
              hx: (x + w / 2) / dpr,
              hy: (y + h / 2) / dpr,
            });
          }
        }
      }
      if (pts.length <= 2400) break;
      cs++;
    }

    let minX = 1e9, maxX = -1e9;
    for (const p of pts) {
      if (p.hx < minX) minX = p.hx;
      if (p.hx > maxX) maxX = p.hx;
    }
    const r = createRng(7);
    parts = pts.map((p) => {
      const u = r(), size = u < 0.62 ? 0.9 + r() * 0.8 : u < 0.9 ? 1.8 + r() * 1.4 : 3.4 + r() * 3.2;
      return {
        rx: p.x, ry: p.y, rw: p.w, rh: p.h, hx: p.hx, hy: p.hy,
        nx: (p.hx - minX) / Math.max(1, maxX - minX),
        ny: (p.hy - (ty - fs / 2)) / fs,
        r1: r(), r2: r(), r3: r(), size,
        fx: 0, fy: 0, fc: [0, 0, 0] as RGB,
        lt: 0, bend: 0, pa: 0,
      };
    });
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    reroll();
  }

  function drawRealText() {
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.globalAlpha = 1;
    ctx.drawImage(textCv, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function stopWork() {
    if (timer) {
      clearTimeout(timer);
      timer = 0;
    }
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  function frame(now: number) {
    raf = 0;
    if (destroyed || !active) return;

    const c = ctx as CanvasRenderingContext2D;
    const elapsed = Math.max(0, now - phaseStart);
    const prog = clamp(elapsed / TIMING.travel);
    const out = phase === "dissolving";

    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, cv.width, cv.height);

    for (const p of parts) {
      const pl = plan(mode, p, W, H);
      const lt = clamp((prog - pl.delay * 0.55) / 0.45);
      p.lt = lt;
      p.bend = pl.bend;
      p.pa = out ? 1 - smooth(lt / 0.18) : smooth((lt - 0.82) / 0.18);
      if (p.pa <= 0.002) continue;
      c.globalAlpha = p.pa;
      c.drawImage(textCv, p.rx, p.ry, p.rw, p.rh, p.rx, p.ry, p.rw, p.rh);
    }
    c.setTransform(dpr, 0, 0, dpr, 0, 0);

    for (const p of parts) {
      const lt = p.lt;
      if (lt <= 0 || lt >= 1) continue;
      const a: [number, number] = out ? [p.hx, p.hy] : [p.fx, p.fy];
      const b: [number, number] = out ? [p.fx, p.fy] : [p.hx, p.hy];
      const q = bowAt(a, b, out ? p.bend : -p.bend, lt);
      const e = out ? q[2] : 1 - q[2];
      let alpha = 0.1 + 0.9 * (1 - smooth((e - 0.45) / 0.55));
      alpha *= out ? 1 - smooth((lt - 0.85) / 0.15) : smooth(lt / 0.15) * (1 - p.pa);
      if (alpha <= 0.004) continue;
      c.globalAlpha = Math.min(1, alpha);
      c.fillStyle = rgbStr(pal.ink, p.fc, smooth(e / 0.6));
      c.beginPath();
      c.arc(q[0], q[1], (p.size * mix(1, 1.7, smooth(e))) / 2, 0, 6.2832);
      c.fill();
    }
    c.globalAlpha = 1;

    if (prog < 1) {
      raf = requestAnimationFrame(frame);
    } else {
      advance();
    }
  }

  function enter(next: Phase) {
    if (destroyed) return;
    phase = next;
    phaseStart = performance.now();
    stopWork();
    if (!active) return;

    if (next === "text") {
      drawRealText();
      timer = window.setTimeout(advance, TIMING.hold);
    } else if (next === "field") {
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.clearRect(0, 0, cv.width, cv.height);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      timer = window.setTimeout(advance, TIMING.field);
    } else {
      if (next === "dissolving") {
        mode = nextMode();
        reroll();
      }
      raf = requestAnimationFrame(frame);
    }
  }

  function advance() {
    if (destroyed || !active) return;
    const nextPhase: Phase =
      phase === "text"
        ? "dissolving"
        : phase === "dissolving"
        ? "field"
        : phase === "field"
        ? "gathering"
        : "text";
    enter(nextPhase);
  }

  // Initialize and begin in crisp text phase
  build();
  enter("text");

  return {
    setActive(on: boolean) {
      if (destroyed) return;
      if (on === active) return;
      active = on;
      if (on) {
        stopWork();
        phaseStart = performance.now();
        if (phase === "text") {
          drawRealText();
          timer = window.setTimeout(advance, TIMING.hold);
        } else if (phase === "field") {
          ctx!.setTransform(1, 0, 0, 1, 0, 0);
          ctx!.clearRect(0, 0, cv.width, cv.height);
          ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
          timer = window.setTimeout(advance, TIMING.field);
        } else {
          raf = requestAnimationFrame(frame);
        }
      } else {
        stopWork();
      }
    },
    resize() {
      if (destroyed) return;
      stopWork();
      build();
      if (active) {
        if (phase === "text") {
          drawRealText();
          timer = window.setTimeout(advance, TIMING.hold);
        } else {
          enter(phase);
        }
      } else {
        drawRealText();
      }
    },
    destroy() {
      destroyed = true;
      active = false;
      stopWork();
    },
  };
}

/* ------------------------------------------------------------------ */
/* React Hooks                                                        */
/* ------------------------------------------------------------------ */

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduce(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduce;
}

function useIsDark() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const read = () => {
      const explicit =
        root.classList.contains("dark") || root.dataset.theme === "dark"
          ? true
          : root.classList.contains("light") || root.dataset.theme === "light"
          ? false
          : null;
      setDark(explicit ?? true);
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(root, { attributes: true, attributeFilter: ["class", "data-theme"] });
    mq.addEventListener("change", read);
    return () => {
      mo.disconnect();
      mq.removeEventListener("change", read);
    };
  }, []);
  return dark;
}

const css = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

/* ------------------------------------------------------------------ */
/* Component Props                                                    */
/* ------------------------------------------------------------------ */

export interface ParticleTitleProps {
  /** Title text. The real <h2> stays accessible for screen readers. */
  text?: string;
  className?: string;
  fontFamily?: string;
  fontWeight?: string | number;
}

/**
 * Animated ParticleTitle that dissolves text into floating purple & magenta particles,
 * rotates through 6 modes (smoke, vortex, sand, burst, sweep, absorb), and gathers back.
 * Adapts to Cirra's black-and-purple theme with accessible fallback for prefers-reduced-motion.
 */
export function ParticleTitle({
  text = "Ask anything about your spend",
  className = "",
  fontFamily = FONT_STACK,
  fontWeight = 700,
}: ParticleTitleProps) {
  const reduce = usePrefersReducedMotion();
  const dark = useIsDark();
  const pal = dark ? CIRRA_DARK : CIRRA_LIGHT;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || reduce) return;

    const engine = createEngine(cv, text, pal, fontFamily, fontWeight);
    if (!engine) return;

    // Handle tab visibility and window focus
    const handleVisibility = () => {
      engine.setActive(!document.hidden);
    };
    const handleFocus = () => {
      engine.setActive(true);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    // Font readiness check
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => {
        engine.resize();
      });
    }

    // Resize observer with debounce
    let rz = 0;
    let size = `${cv.clientWidth}x${cv.clientHeight}`;
    const ro = new ResizeObserver(() => {
      if (!cv) return;
      const nw = cv.clientWidth;
      const nh = cv.clientHeight;
      if (nw === 0 || nh === 0) return;
      const next = `${nw}x${nh}`;
      if (next === size) return;
      size = next;
      clearTimeout(rz);
      rz = window.setTimeout(() => {
        engine.resize();
      }, 100);
    });
    ro.observe(cv);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
      clearTimeout(rz);
      ro.disconnect();
      engine.destroy();
    };
  }, [reduce, pal, text, fontFamily, fontWeight]);

  const blobPos = [
    "left-[6%] top-[10%] w-[58%] h-[75%]",
    "left-[42%] top-[20%] w-[52%] h-[68%]",
    "left-[28%] top-[38%] w-[42%] h-[54%]",
    "left-[55%] top-[15%] w-[38%] h-[58%]",
  ];

  return (
    <div
      className={cn(
        "relative isolate flex items-center justify-center overflow-hidden",
        className || "h-[80px] sm:h-[96px] w-full"
      )}
    >
      {/* Soft Ambient Glow Mask */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          WebkitMaskImage: "radial-gradient(closest-side, #000 55%, transparent 100%)",
          maskImage: "radial-gradient(closest-side, #000 55%, transparent 100%)",
        }}
      >
        {pal.blobs.map((b, i) => (
          <div
            key={i}
            className={`absolute rounded-full pointer-events-none ${blobPos[i] || blobPos[0]}`}
            style={{
              background: `radial-gradient(closest-side, ${css(b.rgb, b.a * 0.45)}, ${css(b.rgb, 0)} 100%)`,
            }}
          />
        ))}
      </div>

      {/* Animation Canvas - Always mounted in DOM so canvasRef is immediately available */}
      {!reduce && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
      )}

      {/* Accessible DOM Heading for SEO & Screen Readers */}
      <h2
        className={
          reduce
            ? "relative z-10 m-0 px-4 text-center text-3xl sm:text-4xl font-extrabold text-[#F3EFFA] tracking-tight font-mono"
            : "sr-only"
        }
      >
        {text}
      </h2>
    </div>
  );
}

export default ParticleTitle;
