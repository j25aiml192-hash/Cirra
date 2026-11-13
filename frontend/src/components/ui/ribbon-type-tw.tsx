"use client";

import React, { useEffect, useRef } from "react";

export interface RibbonTypeProps {
  className?: string;
  text?: string;
  ribbonColor?: string;
  accentColor?: string;
  textColor?: string;
  speed?: number;
  width?: number;
  amplitude?: number;
  frequency?: number;
  numRibbons?: number;
}

export function RibbonType({
  className = "",
  text = "",
  ribbonColor = "rgba(10, 25, 47, 0.85)",
  accentColor = "rgba(0, 98, 224, 0.7)",
  textColor = "rgba(255, 255, 255, 0.75)",
  speed = 1.0,
  width = 72,
  amplitude = 45,
  frequency = 0.0035,
  numRibbons = 2,
}: RibbonTypeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent?.clientWidth || window.innerWidth;
      const h = parent?.clientHeight || 600;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      time += 0.015 * speed;
      const parent = canvas.parentElement;
      const w = parent?.clientWidth || window.innerWidth;
      const h = parent?.clientHeight || 600;

      ctx.clearRect(0, 0, w, h);

      // Render multiple undulating 3D satin ribbons flowing across space
      for (let r = 0; r < numRibbons; r++) {
        const ribbonOffset = (r * Math.PI) / numRibbons;
        const ribbonY = h * 0.45 + r * 35;
        const currentWidth = width * (1 - r * 0.15);

        const steps = 140;
        const pointsTop: { x: number; y: number }[] = [];
        const pointsBottom: { x: number; y: number }[] = [];
        const centerPoints: { x: number; y: number; angle: number }[] = [];

        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const x = -100 + t * (w + 200);

          // 3D waving harmonics
          const wave1 = Math.sin(x * frequency + time + ribbonOffset) * amplitude;
          const wave2 = Math.cos(x * frequency * 1.8 - time * 0.7) * (amplitude * 0.45);
          const y = ribbonY + wave1 + wave2;

          // Compute normal angle to ribbon trajectory
          const dx = 1;
          const dy =
            frequency * Math.cos(x * frequency + time + ribbonOffset) * amplitude -
            frequency * 1.8 * Math.sin(x * frequency * 1.8 - time * 0.7) * (amplitude * 0.45);
          const angle = Math.atan2(dy, dx) + Math.PI / 2;

          // Twisting depth modulation
          const twist = Math.sin(t * 8 + time * 1.2 + ribbonOffset);
          const halfW = (currentWidth / 2) * Math.max(0.25, Math.abs(twist));

          const nx = halfW * Math.cos(angle);
          const ny = halfW * Math.sin(angle);

          pointsTop.push({ x: x - nx, y: y - ny });
          pointsBottom.push({ x: x + nx, y: y + ny });
          centerPoints.push({ x, y, angle });
        }

        // Draw Ribbon Satin Body
        ctx.save();
        ctx.beginPath();
        const firstTop = pointsTop[0];
        if (firstTop) {
          ctx.moveTo(firstTop.x, firstTop.y);
          for (let i = 1; i < pointsTop.length; i++) {
            const pt = pointsTop[i];
            if (pt) ctx.lineTo(pt.x, pt.y);
          }
          for (let i = pointsBottom.length - 1; i >= 0; i--) {
            const pt = pointsBottom[i];
            if (pt) ctx.lineTo(pt.x, pt.y);
          }
          ctx.closePath();

          // Gradient satin lighting
          const grad = ctx.createLinearGradient(0, ribbonY - amplitude, w, ribbonY + amplitude);
          if (r === 0) {
            grad.addColorStop(0, "rgba(10, 25, 47, 0.88)");
            grad.addColorStop(0.35, "rgba(0, 98, 224, 0.75)");
            grad.addColorStop(0.7, "rgba(15, 23, 42, 0.92)");
            grad.addColorStop(1, "rgba(56, 189, 248, 0.65)");
          } else {
            grad.addColorStop(0, "rgba(15, 23, 42, 0.75)");
            grad.addColorStop(0.5, "rgba(0, 98, 224, 0.55)");
            grad.addColorStop(1, "rgba(10, 25, 47, 0.80)");
          }
          ctx.fillStyle = grad;
          ctx.shadowColor = "rgba(0, 98, 224, 0.25)";
          ctx.shadowBlur = 18;
          ctx.fill();

          // Draw ribbon edge lines
          ctx.shadowBlur = 0;
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = r === 0 ? "rgba(56, 189, 248, 0.7)" : "rgba(255, 255, 255, 0.25)";
          ctx.beginPath();
          for (let i = 0; i < pointsTop.length; i++) {
            const pt = pointsTop[i];
            if (!pt) continue;
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
          ctx.stroke();

          ctx.beginPath();
          for (let i = 0; i < pointsBottom.length; i++) {
            const pt = pointsBottom[i];
            if (!pt) continue;
            if (i === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
          ctx.stroke();
        }

        // Draw Ribbon Type: Repeated text printed along the ribbon center
        if (text && r === 0) {
          ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
          ctx.fillStyle = textColor;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          const totalLen = centerPoints.length;
          const textInterval = 12; // draw text stamp every interval
          const fullText = (text || "CIRRA ").repeat(8);
          let charIndex = 0;

          for (let i = 8; i < totalLen - 8; i += textInterval) {
            const pt = centerPoints[i];
            if (!pt) continue;

            const word = fullText.slice(charIndex, charIndex + 8).trim();
            charIndex = (charIndex + 8) % fullText.length;

            ctx.save();
            ctx.translate(pt.x, pt.y);
            ctx.rotate(pt.angle - Math.PI / 2);
            ctx.fillText(word, 0, 0);
            ctx.restore();
          }
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [text, ribbonColor, accentColor, textColor, speed, width, amplitude, frequency, numRibbons]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none select-none ${className}`}
      aria-hidden="true"
    />
  );
}

export default RibbonType;
