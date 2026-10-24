"use client";

import * as React from "react";
import FlowingMenu from "@/components/ui/FlowingMenu";
import { LineChart, Layers, ShieldCheck } from "lucide-react";

const items = [
  {
    keyword: "Compute",
    subtitle: "FOCUS 1.0 • Realized Delta",
    category: "Multi-Cloud Compute & DB Rightsizing",
    baseline: "Historical 90-Day p95",
    standard: "FOCUS 1.0",
    output: "Realized Spend Delta",
    marquee: "Multi-Cloud Compute & DB Rightsizing • Historical 90-Day p95 Baseline • Realized Spend Delta Proof",
  },
  {
    keyword: "Models",
    subtitle: "Open Cost • Margin Gain",
    category: "Foundation Model & Token Routing",
    baseline: "Semantic Tier Baseline",
    standard: "Open Cost Standard",
    output: "Net Margin Efficiency",
    marquee: "Foundation Model & Token Routing • Semantic Tier Baseline • Net Margin Efficiency Proof",
  },
  {
    keyword: "Sentinel",
    subtitle: "EWMA • Avoided Blast",
    category: "Sentinel Automated Circuit Breakers",
    baseline: "Pre-Incident Burn Velocity",
    standard: "Time-Series EWMA",
    output: "Avoided Blast Radius",
    marquee: "Sentinel Automated Circuit Breakers • Pre-Incident Burn Velocity • Avoided Blast Radius Proof",
  },
];

const capabilityCards = [
  {
    tag: "Telemetry Model",
    title: "Counterfactual Baselines",
    description:
      "Separates true optimization from organic traffic drops by contrasting actual invoices against dynamic pre-action forecasts.",
    alignmentClass: "self-start max-w-[350px] w-full",
    icon: LineChart,
  },
  {
    tag: "Accounting Schema",
    title: "FOCUS 1.0 Reconciliation",
    description:
      "Normalizes heterogeneous cloud invoices and AI token consumption into a single transparent accounting schema.",
    alignmentClass: "self-end ml-auto max-w-[350px] w-full",
    icon: Layers,
  },
  {
    tag: "Cryptographic Audit",
    title: "CFO & Audit Ready",
    description:
      "Tamper-evident verification logs certify exact realized ROI for finance leadership, auditors, and board decks.",
    alignmentClass: "self-start max-w-[350px] w-full",
    icon: ShieldCheck,
  },
];

// Catmull-Rom spline interpolation through waypoints
function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (
    2 * p1 +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

// Mathematical 3D wireframe ribbon mesh weaving directly through each card
function MovingDarkRibbonMesh() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;

    // Anchor waypoints mapped directly through each card:
    // (0,0) of canvas is at left: -160px, top: -200px relative to cards column.
    // Card 1 center: (315, 275)
    // Card 2 center: (515, 475)
    // Card 3 center: (310, 675)
    const waypoints: Array<[number, number]> = [
      [20, 20],     // 0: Outside upper-left corner of the screen
      [110, 110],   // 1: Sweeping into screen from upper-left
      [210, 190],   // 2: Entering Card 1
      [315, 275],   // 3: Directly through center of Card 1 (Counterfactual Baselines)
      [430, 375],   // 4: Flowing diagonally across between Card 1 and Card 2
      [515, 475],   // 5: Directly through center of Card 2 (FOCUS 1.0 Reconciliation)
      [425, 575],   // 6: Flowing diagonally back between Card 2 and Card 3
      [310, 675],   // 7: Directly through center of Card 3 (CFO & Audit Ready)
      [190, 775],   // 8: Heading towards bottom-left corner
      [110, 860],   // 9: Reaching bottom-left edge of screen
      [20, 940],    // 10: Exiting outside the bottom-left corner of the screen
    ];

    const render = () => {
      time += 0.018;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const n = 56;
      const ribbonWidth = 52;
      const points: Array<[{ x: number; y: number }, { x: number; y: number }]> = [];
      const numSegments = waypoints.length - 1;

      for (let step = 0; step < n; step++) {
        const globalT = step / (n - 1);
        const scaled = globalT * (numSegments - 2);
        const i = Math.min(Math.floor(scaled), numSegments - 3);
        const localT = scaled - i;

        const p0 = waypoints[i] ?? waypoints[0]!;
        const p1 = waypoints[i + 1] ?? waypoints[1]!;
        const p2 = waypoints[i + 2] ?? waypoints[2]!;
        const p3 = waypoints[i + 3] ?? waypoints[3]!;

        // Base center point on spline
        let cx = catmullRom(p0[0], p1[0], p2[0], p3[0], localT);
        let cy = catmullRom(p0[1], p1[1], p2[1], p3[1], localT);

        // Approximate local tangent using forward step
        const nextLocalT = Math.min(localT + 0.02, 1);
        const ncx = catmullRom(p0[0], p1[0], p2[0], p3[0], nextLocalT);
        const ncy = catmullRom(p0[1], p1[1], p2[1], p3[1], nextLocalT);
        const dx = ncx - cx;
        const dy = ncy - cy;
        const angle = Math.atan2(dy, dx) + Math.PI / 2;

        // Fluid undulating wave ripple moving along ribbon
        const wave = 14 * Math.sin(globalT * 12 - time * 2.5);
        cx += wave * Math.cos(angle);
        cy += wave * Math.sin(angle);

        const w = ribbonWidth + 6 * Math.sin(globalT * 6 + time * 1.6);
        const nx = w * Math.cos(angle);
        const ny = w * Math.sin(angle);

        points.push([
          { x: cx - nx, y: cy - ny },
          { x: cx + nx, y: cy + ny },
        ]);
      }

      // Draw Dark Cross-Hatch Lines
      ctx.lineWidth = 1.0;
      for (let i = 0; i < n; i++) {
        const pt = points[i];
        if (!pt) continue;
        const [p1, p2] = pt;
        const alpha = 0.55 + 0.35 * Math.sin((i / n) * Math.PI);
        ctx.strokeStyle = `rgba(10, 25, 47, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // Draw Dark Longitudinal Strands
      const numStrands = 11;
      for (let sIdx = 0; sIdx < numStrands; sIdx++) {
        const frac = sIdx / (numStrands - 1);
        const isEdge = sIdx === 0 || sIdx === numStrands - 1;
        ctx.lineWidth = isEdge ? 1.8 : 0.9;
        ctx.strokeStyle = isEdge
          ? "rgba(10, 25, 47, 0.95)" // Dark bold navy/black edge
          : "rgba(15, 23, 42, 0.65)"; // Dark slate interior strands

        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const pt = points[i];
          if (!pt) continue;
          const [p1, p2] = pt;
          const px = p1.x + (p2.x - p1.x) * frac;
          const py = p1.y + (p2.y - p1.y) * frac;
          if (i === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute -left-40 sm:-left-48 -top-48 sm:-top-56 w-[640px] h-[980px] pointer-events-none select-none z-0"
      aria-hidden="true"
    />
  );
}

export function SavingsLedgerTile() {
  return (
    <section id="ledger" className="w-full bg-[#F0F8FF] text-[#0A192F] pt-28 sm:pt-36 lg:pt-44 pb-24 sm:pb-32 px-4 sm:px-6 lg:px-8 scroll-mt-20">
      <div className="max-w-[1360px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Woven Ribbon Mesh + Equal-Sized Borderless Capability Cards */}
          <div className="lg:col-span-5 relative flex flex-col justify-between gap-6 py-2 min-h-[520px]">
            {/* Moving Dark Wireframe Ribbon flowing through cards */}
            <MovingDarkRibbonMesh />

            {/* 3 Equal-Sized Capability Cards */}
            {capabilityCards.map((card, idx) => {
              const Icon = card.icon;

              return (
                <div
                  key={idx}
                  className={`group relative overflow-hidden rounded-[22px] p-6 sm:p-7 text-left transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] hover:-translate-y-1 ${
                    card.alignmentClass
                  } bg-gradient-to-br from-[#FFFFFF] via-[#F8FBFE] to-[#EFF6FD] border border-[#D6E4F5] hover:border-[#BCD9FC] shadow-[0_12px_36px_-8px_rgba(10,25,47,0.09),0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_18px_45px_-10px_rgba(10,25,47,0.14)] z-10`}
                >
                  {/* Subtle top-left ambient light sheen */}
                  <div className="absolute -top-10 -left-10 w-28 h-28 bg-gradient-to-br from-[#38BDF8]/20 via-[#0062E0]/10 to-transparent rounded-full blur-xl pointer-events-none" />

                  {/* Watermark Icon */}
                  <Icon className="absolute -bottom-2 -right-2 w-20 h-20 text-[#0062E0]/[0.06] group-hover:text-[#0062E0]/[0.10] transition-colors duration-300 pointer-events-none select-none" />

                  {/* Category Tag Pill */}
                  <span className="relative z-10 inline-block text-[10px] font-mono font-bold tracking-wider text-[#0062E0] uppercase bg-[#0062E0]/[0.08] px-2.5 py-0.5 rounded-full mb-2.5">
                    {card.tag}
                  </span>

                  <h3 className="relative z-10 font-bold tracking-tight text-[18px] sm:text-[19px] text-[#0A192F]">
                    {card.title}
                  </h3>
                  <p className="relative z-10 leading-relaxed mt-2 text-[13px] sm:text-[14px] text-[#334155]">
                    {card.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right Column: Headline Block + FlowingMenu Interactive Display */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            {/* Top Headline & Description */}
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-[36px] sm:text-[44px] font-bold tracking-[-0.03em] text-[#0A192F] leading-[1.08]">
                Savings Ledger.
              </h2>
              <p className="mt-2 text-[20px] sm:text-[26px] font-semibold tracking-[-0.015em] text-[#0A192F] leading-[1.2]">
                Audited proof. Down to the cent.
              </p>
              <p className="mt-4 text-[14px] sm:text-[15px] font-normal text-[#475569] leading-relaxed">
                Every dollar saved is proven with counterfactual telemetry comparing realized spend against baseline models. Cryptographically verified and exportable for CFO board reporting.
              </p>
            </div>

            {/* FlowingMenu Interactive Display */}
            <div
              className="mt-10 sm:mt-12 rounded-[22px] overflow-hidden shadow-2xl border border-[#C5D9F2]"
              style={{ height: '290px', position: 'relative' }}
            >
              <FlowingMenu
                items={items}
                textColor="#ffffff"
                bgColor="#0D111A"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SavingsLedgerTile;
