"use client";

import React, { useEffect, useRef } from "react";

export interface AnimatedWaveRibbonProps {
  position?: "top-left" | "top-right" | "bottom-left";
  className?: string;
  lineCount?: number;
  speed?: number;
}

export function AnimatedWaveRibbon({
  position = "bottom-left",
  className = "",
  lineCount = 28,
  speed = 1,
}: AnimatedWaveRibbonProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let startTime = performance.now();

    const render = (now: number) => {
      const elapsed = (now - startTime) * 0.001 * speed;

      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = rect.width;
      const height = rect.height;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Fine hairline width for ultra-sharp, elegant lines
      ctx.lineWidth = 0.95;

      if (position === "top-left") {
        const virtualW = 820;
        const virtualH = 340;
        const scaleX = width / virtualW;
        const scaleY = height / virtualH;
        ctx.scale(scaleX, scaleY);

        // Linear gradient for top-left ribbon: soft navy to vibrant Cirra blue
        const gradient = ctx.createLinearGradient(-40, 240, 720, -30);
        gradient.addColorStop(0, "#000000ff");
        gradient.addColorStop(0.45, "#1b1b1cff");
        gradient.addColorStop(0.85, "#292a2cff");
        gradient.addColorStop(1, "#5e6164ff");
        ctx.strokeStyle = gradient;

        for (let i = 0; i < lineCount; i++) {
          const t = i / (lineCount - 1);

          const wave1 = Math.sin(elapsed * 0.75 + t * 2.6) * 12;
          const wave2 = Math.cos(elapsed * 0.6 + t * 2.0) * 15;
          const wave3 = Math.sin(elapsed * 0.9 + t * 2.9) * 10;
          const wave4 = Math.cos(elapsed * 0.7 + t * 2.2) * 8;

          // Starts completely off-screen on the far left edge
          const startX = -50;
          const startY = 230 + t * 55 + wave4;

          const cp1x = 140 + t * 50;
          const cp1y = 240 - t * 110 + wave1;
          const cp2x = 300 - t * 35;
          const cp2y = 45 + t * 160 + wave2;
          const midX = 400 + t * 25;
          const midY = 150 + t * 40 + wave1 * 0.5;

          const cp3x = 520 + t * 40;
          const cp3y = 240 - t * 90 + wave3;
          const endX = 720 + t * 70;
          const endY = -40 + t * 30 + wave2 * 0.5; // Extends seamlessly up into header

          // Bell-curve opacity falloff for soft edges
          const bell = Math.sin(t * Math.PI);
          const opacity = 0.08 + bell * 0.46;
          ctx.globalAlpha = Math.max(0.04, Math.min(0.55, opacity));

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, midX, midY);
          ctx.bezierCurveTo(cp3x, cp3y, endX - 60, endY + 40, endX, endY);
          ctx.stroke();
        }
      } else if (position === "top-right") {
        const virtualW = 720;
        const virtualH = 320;
        const scaleX = width / virtualW;
        const scaleY = height / virtualH;
        ctx.scale(scaleX, scaleY);

        const gradient = ctx.createLinearGradient(virtualW + 40, 180, 0, -20);
        gradient.addColorStop(0, "#0e2549ff");
        gradient.addColorStop(0.5, "#4c76a0ff");
        gradient.addColorStop(1, "#abaeafff");
        ctx.strokeStyle = gradient;

        for (let i = 0; i < lineCount; i++) {
          const t = i / (lineCount - 1);

          const wave1 = Math.sin(elapsed * 0.7 + t * 2.4) * 12;
          const wave2 = Math.cos(elapsed * 0.55 + t * 1.9) * 14;
          const wave3 = Math.sin(elapsed * 0.85 + t * 2.7) * 10;

          const startX = virtualW + 40;
          const startY = 190 + t * 60;
          const cp1x = virtualW - (120 + t * 45);
          const cp1y = 230 - t * 110 + wave1;
          const cp2x = virtualW - (270 - t * 35);
          const cp2y = 35 + t * 155 + wave2;
          const midX = virtualW - (360 + t * 25);
          const midY = 145 + t * 35;
          const cp3x = virtualW - (480 + t * 35);
          const cp3y = 235 - t * 85 + wave3;
          const endX = virtualW - (660 + t * 50);
          const endY = -30 + t * 25;

          const bell = Math.sin(t * Math.PI);
          const opacity = 0.06 + bell * 0.38;
          ctx.globalAlpha = Math.max(0.03, Math.min(0.45, opacity));

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, midX, midY);
          ctx.bezierCurveTo(cp3x, cp3y, endX + 50, endY + 40, endX, endY);
          ctx.stroke();
        }
      } else {
        // bottom-left: 560 x 300
        const virtualW = 560;
        const virtualH = 300;
        const scaleX = width / virtualW;
        const scaleY = height / virtualH;
        ctx.scale(scaleX, scaleY);

        const gradient = ctx.createLinearGradient(0, 240, 440, 240);
        gradient.addColorStop(0, "#000000ff");
        gradient.addColorStop(0.6, "#252525ff");
        gradient.addColorStop(1, "#545556ff");
        ctx.strokeStyle = gradient;

        for (let i = 0; i < lineCount; i++) {
          const t = i / (lineCount - 1);

          const wave1 = Math.sin(elapsed * 0.8 + t * 2.6) * 12;
          const wave2 = Math.cos(elapsed * 0.65 + t * 2.0) * 15;
          const wave3 = Math.sin(elapsed * 0.95 + t * 2.8) * 10;
          const wave4 = Math.cos(elapsed * 0.75 + t * 2.3) * 8;

          const startY = 175 + t * 80 + wave4;
          const cp1x = 75 + t * 55;
          const cp1y = 250 - t * 125 + wave1;
          const cp2x = 185 - t * 40;
          const cp2y = 35 + t * 175 + wave2;
          const midX = 230;
          const midY = 175 + t * 35 + wave1 * 0.5;
          const cp3x = 310 + t * 35;
          const cp3y = 295 - t * 100 + wave3;
          const endX = 440 + t * 70;
          const endY = 235 + t * 25 + wave2 * 0.5;

          const bell = Math.sin(t * Math.PI);
          const opacity = 0.08 + bell * 0.44;
          ctx.globalAlpha = Math.max(0.04, Math.min(0.52, opacity));

          ctx.beginPath();
          ctx.moveTo(0, startY);
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, midX, midY);
          ctx.bezierCurveTo(cp3x, cp3y, endX - 50, endY - 60, endX, endY);
          ctx.stroke();
        }
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [position, lineCount, speed]);

  let positionClasses = "";

  if (position === "top-left") {
    positionClasses = "top-0 left-0 w-[620px] sm:w-[780px] lg:w-[960px] h-[270px] sm:h-[330px] lg:h-[370px]";
  } else if (position === "top-right") {
    positionClasses = "top-0 right-0 w-[440px] sm:w-[580px] lg:w-[720px] h-[240px] sm:h-[300px] lg:h-[340px]";
  } else {
    positionClasses = "-bottom-8 -left-10 w-[380px] sm:w-[500px] lg:w-[620px] h-[240px] sm:h-[300px]";
  }

  return (
    <div className={`absolute pointer-events-none select-none z-0 ${positionClasses} ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

export default AnimatedWaveRibbon;
