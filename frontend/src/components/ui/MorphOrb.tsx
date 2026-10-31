"use client";

import React, { useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/* Mathematical constants & Utilities                                 */
/* ------------------------------------------------------------------ */

const PI2 = Math.PI * 2;
const CLAMP01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const LERP = (a: number, b: number, t: number) => a + (b - a) * t;

/* ------------------------------------------------------------------ */
/* Mulberry32 PRNG (Original MorphOrb Seed Generator)                 */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 1831565813) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* Dotted Spherical Geometry (Original 16-Ring Fibonacci Distribution) */
/* ------------------------------------------------------------------ */

const RINGS = 16;
interface SpherePoint {
  x: number;
  y: number;
  z: number;
  u: number;
  seed: number;
}

const SPHERE_POINTS: SpherePoint[] = (() => {
  const rand = mulberry32(7);
  const pts: SpherePoint[] = [];
  for (let i = 0; i < RINGS; i++) {
    const y = 1 - ((i + 0.5) / RINGS) * 2;
    const ringRadius = Math.sqrt(Math.max(0, 1 - y * y));
    const count = Math.max(4, Math.round(30 * ringRadius));
    for (let j = 0; j < count; j++) {
      const angle = (j / count) * PI2 + i * 0.35;
      pts.push({
        x: Math.cos(angle) * ringRadius,
        y: y,
        z: Math.sin(angle) * ringRadius,
        u: (1 - y) / 2,
        seed: rand() * 6.283,
      });
    }
  }
  return pts;
})();

const POINT_COUNT = SPHERE_POINTS.length;
const POINT_X = Float32Array.from(SPHERE_POINTS, (p) => p.x);
const POINT_Y = Float32Array.from(SPHERE_POINTS, (p) => p.y);
const POINT_Z = Float32Array.from(SPHERE_POINTS, (p) => p.z);
const POINT_U = Float32Array.from(SPHERE_POINTS, (p) => p.u);
const POINT_SEED = Float32Array.from(SPHERE_POINTS, (p) => p.seed);

/* ------------------------------------------------------------------ */
/* CIRRA Blue Color Palette Lookup Table                              */
/* - Primary: vivid sky blue (rgb 14, 165, 233)                       */
/* - Secondary: soft azure (rgb 56, 189, 248)                         */
/* - Highlights: icy white (rgb 240, 249, 255 -> 255, 255, 255)       */
/* - Glow: subtle light blue                                          */
/* ------------------------------------------------------------------ */

const COLOR_STEPS_U = 24;
const ALPHA_STEPS = 48;

const CIRRA_COLOR_LUT: string[] = (() => {
  const table: string[] = [];
  for (let uStep = 0; uStep <= COLOR_STEPS_U; uStep++) {
    const progress = uStep / COLOR_STEPS_U;
    // Base sky blue / azure (progress = 0) -> Icy white highlight (progress = 1)
    const r = Math.round(LERP(14, 248, progress));
    const g = Math.round(LERP(155, 252, progress));
    const b = Math.round(LERP(235, 255, progress));

    for (let aStep = 0; aStep <= ALPHA_STEPS; aStep++) {
      const alpha = (aStep / ALPHA_STEPS).toFixed(3);
      table.push(`rgba(${r},${g},${b},${alpha})`);
    }
  }
  return table;
})();

/* ------------------------------------------------------------------ */
/* MorphOrb Component Props                                           */
/* ------------------------------------------------------------------ */

export interface MorphOrbProps {
  className?: string;
  diameter?: number; // Target diameter in px (110–130px, default 120px)
  isThinking?: boolean; // Connected to chat loading state
}

/**
 * Exact MorphOrb Dotted Spherical Particle Animation (21st.dev / anark17r)
 * Customized with CIRRA Blue palette and connected to live thinking state.
 */
export function MorphOrb({
  className = "",
  diameter = 120,
  isThinking = false,
}: MorphOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fixed internal canvas resolution (220x220 as in original component)
    const CANVAS_SIZE = 220;
    const CENTER = CANVAS_SIZE / 2;
    // Radius scaled to produce exact 110–130px diameter
    const BASE_RADIUS = Math.max(54, Math.min(65, diameter / 2));

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(CANVAS_SIZE * dpr);
    canvas.height = Math.round(CANVAS_SIZE * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Dynamic wave & coordinate buffers
    const waveN = new Float32Array(POINT_COUNT);
    const screenX = new Float32Array(POINT_COUNT);
    const screenY = new Float32Array(POINT_COUNT);
    const pointRadii = new Float32Array(POINT_COUNT);
    const depthZ = new Float32Array(POINT_COUNT);
    const colorIndices = new Int16Array(POINT_COUNT);

    // Thinking mode weights [swirl, spotlights, scan, surge]
    const modeWeights: [number, number, number, number] = [1, 0, 0, 0];
    let time = 0;
    let rotation = 0;
    let animFrame = 0;
    let lastStamp = performance.now();
    let currentProg = 0;
    let progTimer = 0;
    let sweepPhase = 0;

    const tiltCos = Math.cos(0.35);
    const tiltSin = Math.sin(0.35);

    const render = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - lastStamp) / 1000));
      lastStamp = now;
      time += dt;

      // When thinking: faster spin & active mode switching; when idle: smooth ambient drift
      const targetSpin = isThinking ? 1.05 : 0.65;
      rotation += targetSpin * dt;

      // Update thinking mode progress
      if (isThinking) {
        progTimer += dt;
        if (progTimer > 1.25) {
          progTimer = 0;
          currentProg = (currentProg + 1) % 4;
        }
        sweepPhase = (sweepPhase + dt * 0.7) % 1.4;
      } else {
        currentProg = 0;
        sweepPhase = 0;
      }

      // Smoothly blend mode weights towards currentProg
      const blendSpeed = dt / 0.35;
      for (let m = 0; m < 4; m++) {
        const target = m === currentProg ? 1 : 0;
        const curWeight = modeWeights[m] ?? 0;
        const diff = target - curWeight;
        const newWeight =
          curWeight +
          (Math.abs(diff) <= blendSpeed
            ? diff
            : diff > 0
            ? blendSpeed
            : -blendSpeed);
        modeWeights[m] = newWeight;
      }

      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      const rotCos = Math.cos(rotation);
      const rotSin = Math.sin(rotation);
      const decay = Math.exp(-dt / 0.5);

      // Thinking mode 0 & 3 particle travel indices
      const idxTravelA = (time * 300) % POINT_COUNT;
      const idxTravelB = (time * 480) % POINT_COUNT;

      // Thinking mode 1 dual spotlight vectors
      const beamPhaseY = time * 0.8;
      const beamPitch = Math.sin(time * 0.5) * 0.9;
      const beam1X = Math.cos(beamPitch) * Math.cos(beamPhaseY);
      const beam1Y = Math.sin(beamPitch);
      const beam1Z = Math.cos(beamPitch) * Math.sin(beamPhaseY);

      const beam2Pitch = Math.cos(time * 0.42) * 0.9;
      const beamPhaseX = time * 0.55 + 2.1;
      const beam2X = Math.cos(beam2Pitch) * Math.cos(beamPhaseX);
      const beam2Y = Math.sin(beam2Pitch);
      const beam2Z = Math.cos(beam2Pitch) * Math.sin(beamPhaseX);

      // Thinking mode 2 latitude scanning wave
      const scanLatitude = Math.sin(time * 2.2);

      const gain = isThinking ? 1.2 : 0.6;
      const orbPop = isThinking ? 1.03 + Math.sin(time * 4) * 0.025 : 1.0;
      const sweepVal = isThinking ? sweepPhase : 0;

      const mw0 = modeWeights[0] ?? 0;
      const mw1 = modeWeights[1] ?? 0;
      const mw2 = modeWeights[2] ?? 0;
      const mw3 = modeWeights[3] ?? 0;

      // 1. Compute 3D physics, wave activation and coordinates
      for (let i = 0; i < POINT_COUNT; i++) {
        const px = POINT_X[i] ?? 0;
        const py = POINT_Y[i] ?? 0;
        const pz = POINT_Z[i] ?? 0;
        const pu = POINT_U[i] ?? 0;
        const pSeed = POINT_SEED[i] ?? 0;

        let modeActivation = 0;

        // Mode 0: Traveling impulse along spiral
        if (mw0 > 0.001) {
          let dist = Math.abs(i - idxTravelA);
          if (dist > POINT_COUNT - dist) dist = POINT_COUNT - dist;
          const w = Math.max(0, 1 - dist / 16);
          modeActivation = Math.max(modeActivation, w * w * mw0);
        }

        // Mode 1: Dual rotating 3D spotlight beams
        if (mw1 > 0.001) {
          const dot1 = Math.max(0, (px * beam1X + py * beam1Y + pz * beam1Z - 0.72) / 0.28);
          const dot2 = Math.max(0, (px * beam2X + py * beam2Y + pz * beam2Z - 0.72) / 0.28);
          const maxDot = Math.max(dot1, dot2);
          modeActivation = Math.max(modeActivation, maxDot * maxDot * mw1);
        }

        // Mode 2: Latitude scanning plane wave
        if (mw2 > 0.001) {
          const distLat = py - scanLatitude;
          const wLat = Math.max(0, 1 - (distLat * distLat) / 0.02);
          modeActivation = Math.max(modeActivation, wLat * wLat * mw2);
        }

        // Mode 3: Secondary particle surge
        if (mw3 > 0.001) {
          let distB = Math.abs(i - idxTravelB);
          if (distB > POINT_COUNT - distB) distB = POINT_COUNT - distB;
          const wB = Math.max(0, 1 - distB / 22);
          modeActivation = Math.max(modeActivation, wB * wB * mw3);
        }

        const prevWave = waveN[i] ?? 0;
        const waveStrength = Math.max(prevWave * decay, modeActivation * gain);
        waveN[i] = waveStrength;

        // Spherical rotation and 3D perspective projection
        const rx = px * rotCos + pz * rotSin;
        const rz = -px * rotSin + pz * rotCos;

        const projectedY = py * tiltCos - rz * tiltSin;
        const projectedZ = py * tiltSin + rz * tiltCos;

        const perspective = 2.8 / (2.8 - projectedZ);
        const depthNormalized = (projectedZ + 1) / 2;

        const projX = rx * BASE_RADIUS * orbPop * perspective;
        const projY = -projectedY * BASE_RADIUS * orbPop * perspective;

        // Sweep wave highlight
        const sweepProgress = CLAMP01((sweepVal * 1.4 - pu) / 0.4);

        // Particle brightness calculation
        let brightness =
          0.14 +
          0.04 * Math.sin(pSeed + time * 1.6) * (1 - sweepProgress) +
          0.34 * depthNormalized * depthNormalized +
          0.75 * waveStrength * (1 - sweepProgress) +
          sweepProgress * (0.6 + 0.4 * depthNormalized);

        brightness = Math.min(1, Math.max(0.12, brightness));

        screenX[i] = CENTER + projX;
        screenY[i] = CENTER + projY;
        depthZ[i] = depthNormalized;

        pointRadii[i] =
          (1.15 * (0.45 + 0.75 * depthNormalized) * perspective +
            0.9 * waveStrength +
            sweepProgress * 0.28) *
          0.92;

        const alphaIdx = Math.round(brightness * ALPHA_STEPS);
        const colorIdx = Math.round(sweepProgress * COLOR_STEPS_U);

        colorIndices[i] =
          alphaIdx <= 0 ? -1 : colorIdx * (ALPHA_STEPS + 1) + alphaIdx;
      }

      // 2. Dual-Pass Z-Sorting Draw (Back hemisphere first, then front hemisphere)
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < POINT_COUNT; i++) {
          const lutIdx = colorIndices[i] ?? -1;
          if (lutIdx < 0) continue;

          const isFront = (depthZ[i] ?? 0) >= 0.5;
          if (isFront === (pass === 1)) {
            const fillStyle = CIRRA_COLOR_LUT[lutIdx];
            if (fillStyle) {
              ctx.fillStyle = fillStyle;
              ctx.beginPath();
              const sx = screenX[i] ?? CENTER;
              const sy = screenY[i] ?? CENTER;
              const rad = Math.max(0.6, pointRadii[i] ?? 1);
              ctx.arc(sx, sy, rad, 0, PI2);
              ctx.fill();
            }
          }
        }
      }

      animFrame = requestAnimationFrame(render);
    };

    animFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [diameter, isThinking]);

  return (
    <div
      className={`relative isolate flex items-center justify-center select-none ${className}`}
      style={{
        width: 250,
        height: 250,
      }}
    >
      {/* ------------------------------------------------------------- */}
      {/* Subtle Animated Floating Background (Cloudy Blue Gradient)    */}
      {/* Light, airy and low-contrast as specified                     */}
      {/* ------------------------------------------------------------- */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-10%] rounded-full overflow-hidden"
        style={{
          filter: "blur(32px)",
          opacity: 0.22,
          animation: "cirra-cloud-bg-float 7s ease-in-out infinite alternate",
        }}
      >
        <img
          src="/ask-cirra-bg.jpg"
          alt=""
          className="w-full h-full object-cover scale-125"
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Subtle Light-Blue Ambient Glow                                */}
      {/* ------------------------------------------------------------- */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full"
        style={{
          width: diameter * 1.5,
          height: diameter * 1.5,
          background:
            "radial-gradient(circle, rgba(56, 189, 248, 0.24) 0%, rgba(186, 230, 253, 0.12) 48%, transparent 70%)",
          filter: "blur(22px)",
          animation: "cirra-glow-subtle 4.8s ease-in-out infinite",
        }}
      />

      {/* ------------------------------------------------------------- */}
      {/* Floating MorphOrb Canvas Container                            */}
      {/* ------------------------------------------------------------- */}
      <div
        role="img"
        aria-label="Cirra AI Thinking MorphOrb"
        className="relative flex items-center justify-center cursor-default"
        style={{
          width: 220,
          height: 220,
          animation: "cirra-morph-float 4.8s ease-in-out infinite",
          willChange: "transform",
        }}
      >
        <canvas
          ref={canvasRef}
          className="w-[220px] h-[220px] pointer-events-none"
        />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Lightweight Keyframe Animations for Floating & Breathing       */}
      {/* ------------------------------------------------------------- */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes cirra-morph-float {
              0%, 100% {
                transform: translateY(0px) scale(1);
              }
              50% {
                transform: translateY(-10px) scale(1.025);
              }
            }

            @keyframes cirra-cloud-bg-float {
              0% {
                transform: translate(0px, 0px) scale(1);
              }
              50% {
                transform: translate(6px, -8px) scale(1.05);
              }
              100% {
                transform: translate(-6px, 6px) scale(0.98);
              }
            }

            @keyframes cirra-glow-subtle {
              0%, 100% {
                opacity: 0.65;
                transform: scale(1);
              }
              50% {
                opacity: 0.95;
                transform: scale(1.08);
              }
            }
          `,
        }}
      />
    </div>
  );
}

export default MorphOrb;
