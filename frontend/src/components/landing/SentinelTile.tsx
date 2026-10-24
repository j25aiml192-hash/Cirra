"use client";

import * as React from "react";
import {
  Activity,
  Layers,
  Radio,
  ShieldAlert,
  Zap,
} from "lucide-react";
import GlyphSonar from "@/components/ui/GlyphSonar";

type StreamTab = "telemetry" | "baseline" | "breakers";

export function SentinelTile() {
  const [activeTab, setActiveTab] = React.useState<StreamTab>("telemetry");
  const [isSimulated, setIsSimulated] = React.useState(false);
  const [isThrottled, setIsThrottled] = React.useState(false);

  const handleSimulate = () => {
    if (!isSimulated) {
      setIsSimulated(true);
      setIsThrottled(false);
      // After 1.2s simulate the automated circuit breaker trip
      setTimeout(() => {
        setIsThrottled(true);
      }, 1200);
    } else {
      setIsSimulated(false);
      setIsThrottled(false);
    }
  };

  return (
    <section id="sentinel" className="w-full bg-[#34373bff] text-white pb-36 sm:pb-44 relative overflow-hidden scroll-mt-20">
      {/* Moving Animated Border Ribbon Divider with Cirra Logo & Text */}
      <div className="w-full relative z-20 overflow-hidden bg-[#0F1117]/90 backdrop-blur-md py-2.5 border-y border-slate-700/50 shadow-[0_4px_24px_rgba(0,0,0,0.35)] select-none">
        {/* Top Moving Laser Line (Silver/Grey) */}
        <div
          className="absolute top-0 left-0 right-0 h-[1.5px] animate-border-shimmer"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, #34373bff 25%, #94A3B8 50%, #CBD5E1 75%, transparent 100%)",
            backgroundSize: "200% 100%",
          }}
        />

        {/* Infinite Moving Marquee */}
        <div className="flex w-max animate-marquee-infinite items-center gap-7">
          {[...Array(2)].map((_, listIdx) => (
            <div key={listIdx} className="flex items-center gap-7">
              {[
                "AUTONOMOUS FINOPS",
                "15-MIN STREAM TELEMETRY",
                "SUB-50ms CIRCUIT BREAKERS",
                "AWS • GCP • AZURE • LLMS",
                "MULTI-CLOUD GOVERNANCE",
                "ZERO BUDGET OVERRUNS",
                "REAL-TIME DRIFT MODELING",
                "CONTINUOUS INGESTION",
              ].map((phrase, i) => (
                <React.Fragment key={i}>
                  <div className="flex items-center gap-2">
                    <img
                      src="/cirra-logo.png"
                      alt="Cirra"
                      className="w-4 h-4 rounded object-contain shadow-xs"
                    />
                    <span className="font-bold tracking-widest text-[12px] text-white whitespace-nowrap">
                      CIRRA
                    </span>
                  </div>
                  <span className="text-slate-500 text-[8px]">●</span>
                  <span className="text-slate-400 font-mono text-[11px] tracking-wider uppercase whitespace-nowrap">
                    {phrase}
                  </span>
                  <span className="text-slate-500 text-[8px]">●</span>
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom Moving Laser Line (Silver/Grey) */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[1.5px] animate-border-shimmer"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, #CBD5E1 25%, #94A3B8 50%, #475569 75%, transparent 100%)",
            backgroundSize: "200% 100%",
          }}
        />
      </div>

      {/* Animated Glyph Sonar Background in Dark Blue Theme */}
      <GlyphSonar />

      {/* Soft gradient ambient glow accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[480px] bg-gradient-to-tr from-[#0062E0]/15 via-[#38BDF8]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Horizon Dawn Light Glow at the bottom merging threshold */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-64 bg-gradient-to-t from-[#0062E0]/15 via-[#38BDF8]/12 to-transparent blur-3xl pointer-events-none z-[1]" />

      {/* Seamless Merging Transition: Dark Blue (#050B18) into Light (#F1F6FD) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-56 sm:h-72 pointer-events-none z-[2]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(5, 11, 24, 0) 0%, rgba(5, 11, 24, 0.3) 25%, rgba(18, 42, 82, 0.45) 50%, rgba(160, 196, 238, 0.65) 75%, rgba(241, 246, 253, 0.95) 94%, #F1F6FD 100%)",
        }}
      />

      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 pt-16 sm:pt-20 text-center relative z-10">
        {/* Apple Headline Hierarchy in Dark Theme */}
        <h2 className="text-[36px] sm:text-[40px] font-semibold tracking-[-0.022em] text-white leading-[1.10]">
          Sentinel.
        </h2>

        <p className="mt-2 text-[22px] sm:text-[28px] font-normal tracking-[0.007em] text-[#E2EDF8] leading-[1.14]">
          Autonomous anomaly detection.
        </p>

        <p className="mt-3 text-[17px] font-normal text-[#94A3B8] tracking-[-0.015em] max-w-xl mx-auto leading-[1.47]">
          Statistical drift detection across multi-cloud infrastructure and LLM token streams with 15-minute granularity. Circuit-breaker kill switches before rogue jobs drain budgets.
        </p>

        {/* Glassmorphic Apple macOS Window resting with blur on dark background */}
        <div className="mt-12 max-w-[1080px] mx-auto text-left">
          <div className="rounded-[22px] bg-white/[0.68] backdrop-blur-2xl border border-white/60 apple-product-shadow overflow-hidden shadow-[0_30px_90px_-20px_rgba(0,0,0,0.75)] text-[#0A192F]">
            {/* macOS Chrome Header Bar with Frosted Glass Blur */}
            <div className="h-11 bg-white/[0.45] backdrop-blur-md border-b border-black/[0.08] px-4 sm:px-6 flex items-center justify-between text-[12px] text-[#475569]">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
                <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
                <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
                <span className="ml-2 font-mono text-[11px] text-[#64748B] hidden sm:inline-block">
                  sentinel://engine/stream-telemetry/v2.4
                </span>
              </div>

              {/* Status Indicator / Interactive Simulation Trigger */}
              <button
                type="button"
                onClick={handleSimulate}
                title={isSimulated ? "Reset to nominal stream" : "Click to simulate anomaly burst"}
                className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity"
              >
                <span className="flex h-2 w-2 relative">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isSimulated && !isThrottled ? "bg-[#DC2626]" : "bg-[#0062E0]"
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isSimulated && !isThrottled ? "bg-[#DC2626]" : "bg-[#0062E0]"
                    }`}
                  />
                </span>
                <span
                  className={`text-[11px] font-mono font-medium ${
                    isSimulated && !isThrottled
                      ? "text-[#DC2626]"
                      : isThrottled
                      ? "text-[#0D824D]"
                      : "text-[#0062E0]"
                  }`}
                >
                  {isSimulated && !isThrottled
                    ? "Statistical Drift Triggered (+3.8σ)"
                    : isThrottled
                    ? "Breaker Engaged • Burst Suppressed"
                    : "Continuous Ingestion Nominal"}
                </span>
              </button>
            </div>

            {/* Architecture Navigation Tabs with Subtle Frosted Blur */}
            <div className="border-b border-black/[0.08] bg-white/[0.35] backdrop-blur-md px-4 sm:px-6 pt-2 flex items-center justify-between gap-4 overflow-x-auto">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("telemetry")}
                  className={`px-3.5 py-2 text-[13px] font-medium rounded-t-lg border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === "telemetry"
                      ? "border-[#0062E0] text-[#0062E0] bg-white/90 shadow-xs backdrop-blur-sm"
                      : "border-transparent text-[#64748B] hover:text-[#0A192F]"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  Live Telemetry Waveform
                </button>

                <button
                  onClick={() => setActiveTab("baseline")}
                  className={`px-3.5 py-2 text-[13px] font-medium rounded-t-lg border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === "baseline"
                      ? "border-[#0062E0] text-[#0062E0] bg-white/90 shadow-xs backdrop-blur-sm"
                      : "border-transparent text-[#64748B] hover:text-[#0A192F]"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Adaptive EWMA Baseline
                </button>

                <button
                  onClick={() => setActiveTab("breakers")}
                  className={`px-3.5 py-2 text-[13px] font-medium rounded-t-lg border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === "breakers"
                      ? "border-[#0062E0] text-[#0062E0] bg-white/90 shadow-xs backdrop-blur-sm"
                      : "border-transparent text-[#64748B] hover:text-[#0A192F]"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Automated Circuit Breakers
                </button>
              </div>

              <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono text-[#64748B] pb-2">
                <span>Sampling: 15-min windows</span>
                <span>•</span>
                <span>Granularity: Resource-level</span>
              </div>
            </div>

            {/* Interactive Stream Visualization Canvas (Bright Layout) */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Side-by-Side: Left Waveform Monitor & Right Tab Details Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* LEFT: Waveform Telemetry Visualizer */}
                <div className="lg:col-span-7 p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-white/60 flex flex-col justify-between overflow-hidden shadow-sm">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div>
                        <span className="text-[11px] font-mono text-[#0062E0] uppercase tracking-wider font-semibold">
                          {activeTab === "baseline"
                            ? "Statistical Corridor Modeling"
                            : activeTab === "breakers"
                            ? "Automated Circuit Breaker Tripwire"
                            : "Multi-Cloud Telemetry Channel"}
                        </span>
                        <h3 className="text-[16px] font-semibold text-[#0A192F] mt-0.5">
                          {isSimulated && !isThrottled
                            ? "Runaway Recursive Loop Detected in Stream Buffer"
                            : isThrottled
                            ? "Circuit Breaker Active: Stream Safely Contained"
                            : activeTab === "baseline"
                            ? "Adaptive Seasonal EWMA Confidence Corridor (±3.0σ)"
                            : activeTab === "breakers"
                            ? "Sub-50ms Rate Limiter & Runaway Loop Kill Switches"
                            : "Synchronous Multi-Stream Sampling (AWS, GCP, Azure, LLMs)"}
                        </h3>
                      </div>

                      {/* Channel Status Text */}
                      <div className="flex items-center gap-3 text-[11px] font-mono">
                        {activeTab === "baseline" ? (
                          <>
                            <span className="text-[#334155] flex items-center gap-1.5 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                              EWMA Active
                            </span>
                            <span className="text-[#0062E0] flex items-center gap-1.5 font-medium">
                              α = 0.15
                            </span>
                          </>
                        ) : activeTab === "breakers" ? (
                          <>
                            <span className="text-[#334155] flex items-center gap-1.5 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#0D824D]" />
                              Tripwires Armed
                            </span>
                            <span className="text-[#0062E0] flex items-center gap-1.5 font-medium">
                              &lt; 50ms Trip
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-[#334155] flex items-center gap-1.5 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                              Active
                            </span>
                            <span className="text-[#334155] flex items-center gap-1.5 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#0062E0]" />
                              12ms P99
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* SVG Visual Telemetry Stream Wave (Clean & Readable) */}
                    <div className="relative h-60 w-full bg-[#FAFBFD] rounded-xl border border-[#E2E8F0] p-3 flex flex-col justify-between overflow-hidden shadow-xs">
                      {/* Background Subtle Grid Lines */}
                      <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-30">
                        <div className="border-b border-dashed border-[#94A3B8]" />
                        <div className="border-b border-dashed border-[#94A3B8]" />
                        <div className="border-b border-dashed border-[#94A3B8]" />
                      </div>

                      {/* High-Resolution SVG Graph */}
                      <svg
                        viewBox="0 0 600 160"
                        className="w-full h-full relative z-10 transition-all duration-500"
                      >
                        <defs>
                          {/* Normal Blue Stream Gradient */}
                          <linearGradient id="normalGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0062E0" stopOpacity="0.22" />
                            <stop offset="100%" stopColor="#0062E0" stopOpacity="0.0" />
                          </linearGradient>

                          {/* Anomaly Red Spike Gradient */}
                          <linearGradient id="spikeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#DC2626" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#DC2626" stopOpacity="0.0" />
                          </linearGradient>

                          {/* Safe EWMA Corridor Fill */}
                          <linearGradient id="safeCorridor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0062E0" stopOpacity="0.10" />
                            <stop offset="100%" stopColor="#0062E0" stopOpacity="0.03" />
                          </linearGradient>

                          {/* Clamped Green Gradient */}
                          <linearGradient id="clampedGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0D824D" stopOpacity="0.20" />
                            <stop offset="100%" stopColor="#0D824D" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* ========================================================
                            TAB 1: Live Multi-Cloud Telemetry Waveform
                        ======================================================== */}
                        {activeTab === "telemetry" && (
                          <>
                            {/* Adaptive Safe Baseline Corridor Area */}
                            <path
                              d="M 0,65 Q 150,55 300,60 T 600,58 L 600,110 Q 450,118 300,110 T 0,110 Z"
                              fill="url(#safeCorridor)"
                            />

                            {/* Safe Corridor Center Target Line (Dashed) */}
                            <path
                              d="M 0,85 Q 150,78 300,82 T 600,80"
                              fill="none"
                              stroke="#94A3B8"
                              strokeWidth="1.2"
                              strokeDasharray="4 4"
                            />

                            {/* Top Left Baseline Pill Tag */}
                            <g transform="translate(14, 14)">
                              <rect width="130" height="20" rx="4" fill="#FFFFFF" stroke="#CBD5E1" />
                              <text x="10" y="14" fill="#64748B" fontSize="10" fontFamily="monospace" fontWeight="600">
                                NOMINAL BASELINE
                              </text>
                            </g>

                            {/* Top Right Live Sync Status */}
                            <g transform="translate(470, 14)">
                              <rect width="116" height="20" rx="4" fill="#EFF6FF" stroke="#BFDBFE" />
                              <circle cx="12" cy="10" r="3.5" fill="#0062E0" />
                              <text x="22" y="14" fill="#0062E0" fontSize="10" fontFamily="monospace" fontWeight="600">
                                LIVE SYNC
                              </text>
                            </g>

                            {isSimulated && !isThrottled ? (
                              /* Anomaly Spike Path */
                              <>
                                <path
                                  d="M 0,86 Q 100,80 200,84 T 320,80 Q 390,22 450,24 Q 500,48 540,84 T 600,82 L 600,160 L 0,160 Z"
                                  fill="url(#spikeGrad)"
                                />
                                <path
                                  d="M 0,86 Q 100,80 200,84 T 320,80 Q 390,22 450,24 Q 500,48 540,84 T 600,82"
                                  fill="none"
                                  stroke="#DC2626"
                                  strokeWidth="2.5"
                                />
                                <circle cx="450" cy="24" r="5" fill="#DC2626" />
                                <circle cx="450" cy="24" r="2.5" fill="#FFFFFF" />

                                {/* Anomaly Callout Badge */}
                                <g transform="translate(290, 50)">
                                  <rect width="240" height="26" rx="6" fill="#FFFFFF" stroke="#FECACA" filter="drop-shadow(0 2px 6px rgba(220,38,38,0.12))" />
                                  <text x="12" y="17" fill="#DC2626" fontSize="11" fontFamily="monospace" fontWeight="bold">
                                    ⚠ RECURSIVE BURST: +$2,480/hr
                                  </text>
                                </g>
                              </>
                            ) : isThrottled ? (
                              /* Circuit Breaker Throttled Path */
                              <>
                                <path
                                  d="M 0,86 Q 100,80 200,84 T 320,80 Q 380,55 420,55 L 510,55 Q 550,78 600,80 L 600,160 L 0,160 Z"
                                  fill="url(#clampedGrad)"
                                />
                                <path
                                  d="M 0,86 Q 100,80 200,84 T 320,80 Q 380,55 420,55 L 510,55 Q 550,78 600,80"
                                  fill="none"
                                  stroke="#0D824D"
                                  strokeWidth="2.5"
                                />
                                <circle cx="420" cy="55" r="4" fill="#0D824D" />

                                {/* Protection Callout Badge */}
                                <g transform="translate(300, 75)">
                                  <rect width="220" height="26" rx="6" fill="#FFFFFF" stroke="#BBF7D0" filter="drop-shadow(0 2px 6px rgba(13,130,77,0.12))" />
                                  <text x="12" y="17" fill="#0D824D" fontSize="11" fontFamily="monospace" fontWeight="bold">
                                    ✓ CLAMPED: 120 REQ/SEC SAFE
                                  </text>
                                </g>
                              </>
                            ) : (
                              /* Normal Smooth Nominal Path */
                              <>
                                <path
                                  d="M 0,86 Q 75,76 150,82 T 300,78 T 450,84 T 600,80 L 600,160 L 0,160 Z"
                                  fill="url(#normalGrad)"
                                />
                                <path
                                  d="M 0,86 Q 75,76 150,82 T 300,78 T 450,84 T 600,80"
                                  fill="none"
                                  stroke="#0062E0"
                                  strokeWidth="2.5"
                                />
                                <circle cx="585" cy="80" r="4" fill="#0062E0" />
                              </>
                            )}
                          </>
                        )}

                        {/* ========================================================
                            TAB 2: Adaptive EWMA Statistical Corridor (Clean & Separated)
                        ======================================================== */}
                        {activeTab === "baseline" && (
                          <>
                            {/* Shaded Statistical Corridor (±3.0σ Envelope) */}
                            <path
                              d="M 0,44 Q 150,38 300,42 T 600,40 L 600,122 Q 450,128 300,124 T 0,122 Z"
                              fill="url(#safeCorridor)"
                            />

                            {/* Upper Corridor Boundary (+3.0σ) */}
                            <path
                              d="M 0,44 Q 150,38 300,42 T 600,40"
                              fill="none"
                              stroke="#0062E0"
                              strokeWidth="1.5"
                              strokeDasharray="5 4"
                            />

                            {/* Upper Bound Pill Tag (Top Left - Never overlaps) */}
                            <g transform="translate(14, 14)">
                              <rect width="138" height="20" rx="4" fill="#EFF6FF" stroke="#BFDBFE" />
                              <text x="10" y="14" fill="#0062E0" fontSize="10" fontFamily="monospace" fontWeight="600">
                                +3.0σ UPPER CEILING
                              </text>
                            </g>

                            {/* Mean EWMA Baseline (μ) Center Line */}
                            <path
                              d="M 0,82 Q 150,76 300,80 T 600,78"
                              fill="none"
                              stroke="#94A3B8"
                              strokeWidth="1.3"
                              strokeDasharray="4 4"
                            />

                            {/* EWMA Mean Pill Tag (Top Right) */}
                            <g transform="translate(480, 14)">
                              <rect width="106" height="20" rx="4" fill="#F8FAFC" stroke="#E2E8F0" />
                              <text x="12" y="14" fill="#64748B" fontSize="10" fontFamily="monospace" fontWeight="500">
                                EWMA μ MEAN
                              </text>
                            </g>

                            {/* Lower Corridor Boundary (-3.0σ) */}
                            <path
                              d="M 0,122 Q 150,128 300,124 T 600,122"
                              fill="none"
                              stroke="#0062E0"
                              strokeWidth="1.5"
                              strokeDasharray="5 4"
                            />

                            {/* Lower Bound Pill Tag (Bottom Left) */}
                            <g transform="translate(14, 130)">
                              <rect width="138" height="20" rx="4" fill="#EFF6FF" stroke="#BFDBFE" />
                              <text x="10" y="14" fill="#0062E0" fontSize="10" fontFamily="monospace" fontWeight="600">
                                -3.0σ LOWER FLOOR
                              </text>
                            </g>

                            {/* Realized Stream Curve (Flows comfortably INSIDE the corridor) */}
                            <path
                              d="M 0,84 Q 80,68 160,74 T 320,92 T 460,64 T 600,80 L 600,160 L 0,160 Z"
                              fill="url(#normalGrad)"
                            />
                            <path
                              d="M 0,84 Q 80,68 160,74 T 320,92 T 460,64 T 600,80"
                              fill="none"
                              stroke="#0062E0"
                              strokeWidth="2.5"
                            />

                            {/* In-Corridor Confidence Verification Node */}
                            <circle cx="460" cy="64" r="4.5" fill="#0062E0" />
                            <line x1="460" y1="69" x2="460" y2="92" stroke="#0062E0" strokeWidth="1" strokeDasharray="2 2" />

                            <g transform="translate(370, 92)">
                              <rect width="180" height="24" rx="5" fill="#FFFFFF" stroke="#BFDBFE" filter="drop-shadow(0 2px 4px rgba(0,98,224,0.08))" />
                              <text x="10" y="16" fill="#0062E0" fontSize="10.5" fontFamily="monospace" fontWeight="bold">
                                ✓ 99.95% IN CORRIDOR
                              </text>
                            </g>
                          </>
                        )}

                        {/* ========================================================
                            TAB 3: Automated Circuit Breakers Mode (Clean & Separated)
                        ======================================================== */}
                        {activeTab === "breakers" && (
                          <>
                            {/* Safe Nominal Operating Zone Under Tripwire */}
                            <rect x="0" y="48" width="600" height="112" fill="#F0FDF4" opacity="0.45" />

                            {/* Horizontal Red Dashed Tripwire Line */}
                            <line
                              x1="0"
                              y1="48"
                              x2="600"
                              y2="48"
                              stroke="#DC2626"
                              strokeWidth="1.8"
                              strokeDasharray="6 4"
                            />

                            {/* Max Burst Ceiling Tag (Top Left - Never collides with curve) */}
                            <g transform="translate(14, 14)">
                              <rect width="210" height="22" rx="4" fill="#FEF2F2" stroke="#FECACA" />
                              <text x="12" y="15" fill="#DC2626" fontSize="10" fontFamily="monospace" fontWeight="bold">
                                MAX BURST CEILING (150% THRESHOLD)
                              </text>
                            </g>

                            {/* Top Right Zero Overrun Badge */}
                            <g transform="translate(472, 14)">
                              <rect width="114" height="22" rx="4" fill="#F0FDF4" stroke="#BBF7D0" />
                              <circle cx="12" cy="11" r="3.5" fill="#0D824D" />
                              <text x="22" y="15" fill="#0D824D" fontSize="10" fontFamily="monospace" fontWeight="600">
                                ZERO OVERRUN
                              </text>
                            </g>

                            {/* Stream curve rising from baseline and securely CLAMPED at ceiling */}
                            <path
                              d="M 0,115 Q 120,110 200,105 Q 260,60 310,48 L 470,48 Q 530,75 600,85 L 600,160 L 0,160 Z"
                              fill="url(#clampedGrad)"
                            />
                            <path
                              d="M 0,115 Q 120,110 200,105 Q 260,60 310,48 L 470,48 Q 530,75 600,85"
                              fill="none"
                              stroke="#0D824D"
                              strokeWidth="2.5"
                            />

                            {/* Tripwire Trigger Node (Fires at x=310, y=48) */}
                            <circle cx="310" cy="48" r="6" fill="#DC2626" />
                            <circle cx="310" cy="48" r="3" fill="#FFFFFF" />

                            {/* Containment Active Node at x=470 */}
                            <circle cx="470" cy="48" r="4" fill="#0D824D" />

                            {/* Connector Line from Tripwire Node to Callout Badge */}
                            <line x1="310" y1="54" x2="330" y2="76" stroke="#0D824D" strokeWidth="1.2" strokeDasharray="2 2" />

                            {/* Callout Badge (Cleanly placed below, zero overlap) */}
                            <g transform="translate(290, 76)">
                              <rect width="230" height="26" rx="6" fill="#FFFFFF" stroke="#86EFAC" filter="drop-shadow(0 2px 6px rgba(13,130,77,0.12))" />
                              <text x="12" y="17" fill="#0D824D" fontSize="11" fontFamily="monospace" fontWeight="bold">
                                ✓ CLAMPED IN 42ms (KILL SWITCH)
                              </text>
                            </g>
                          </>
                        )}
                      </svg>

                      {/* Horizontal Time Axis Markers (Clean & High Contrast) */}
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B] pt-2 px-1 border-t border-[#E2E8F0] bg-white">
                        <span>T - 60m</span>
                        <span>T - 45m</span>
                        <span>T - 30m</span>
                        <span className="text-[#0062E0] font-semibold">T - 15m (Window)</span>
                        <span className="font-semibold text-[#0A192F] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                          Live Feed
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#D6E4F5]/70 flex items-center justify-between text-[11px] font-mono text-[#64748B]">
                    <span>
                      {activeTab === "baseline"
                        ? "Statistical confidence envelope: 99.95%"
                        : activeTab === "breakers"
                        ? "Tripwire latency: Sub-50ms automated cutoff"
                        : "Continuous EWMA baseline: ±1.8%"}
                    </span>
                    <span className="text-[#0062E0] font-medium">
                      {activeTab === "baseline"
                        ? "90-Day Cyclic Seasonality Model"
                        : activeTab === "breakers"
                        ? "Zero Budget Overrun Guarantee"
                        : "15-min Sliding Window"}
                    </span>
                  </div>
                </div>

                {/* RIGHT: Dynamic Tab Details Panel (Cohesive Frosted Glass Theme) */}
                <div className="lg:col-span-5 flex flex-col justify-between">
                  {/* TAB 1: Multi-Cloud Telemetry */}
                  {activeTab === "telemetry" && (
                    <div className="h-full rounded-2xl bg-white/80 backdrop-blur-md p-5 border border-white/60 flex flex-col justify-between shadow-xs transition-all text-[#0A192F]">
                      <div>
                        <div className="flex items-center justify-between font-mono text-[11px] text-[#0062E0] font-semibold uppercase tracking-wider pb-2 border-b border-[#E2E8F0]">
                          <span className="flex items-center gap-1.5">
                            <Radio className="w-3.5 h-3.5 text-[#0062E0]" />
                            Multi-Stream Ingestion
                          </span>
                          <span className="text-[#0D824D] font-mono text-[11px] font-medium">
                            {isThrottled ? "Burst Clamped" : isSimulated ? "Drift Alert" : "Continuous Sync"}
                          </span>
                        </div>

                        <p className="text-[12px] text-[#475569] leading-relaxed mt-3">
                          {isSimulated && !isThrottled
                            ? "Sudden exponential token consumption identified across streaming endpoints. Automated circuit-breakers armed."
                            : isThrottled
                            ? "Circuit-breaker successfully engaged. Traffic rate safely normalized to baseline envelope without user drop-off."
                            : "Real-time telemetry ingestion across AWS, GCP, Azure, and frontier LLM APIs aggregated in 15-minute micro-batch sliding windows."}
                        </p>

                        <div className="grid grid-cols-2 gap-2.5 mt-3 font-mono text-[11px]">
                          <div className="p-2.5 rounded-xl bg-white/90 border border-[#D6E4F5]/80 shadow-xs">
                            <span className="text-[#64748B] block text-[10px]">Sampling Window</span>
                            <span className="font-semibold text-[#0A192F]">15-Min Sliding</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white/90 border border-[#D6E4F5]/80 shadow-xs">
                            <span className="text-[#64748B] block text-[10px]">Ingestion Velocity</span>
                            <span className="font-semibold text-[#0062E0]">48.2k events/s</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white/90 border border-[#D6E4F5]/80 shadow-xs">
                            <span className="text-[#64748B] block text-[10px]">P99 Ingest Latency</span>
                            <span className="font-semibold text-[#0D824D]">&lt; 12ms</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white/90 border border-[#D6E4F5]/80 shadow-xs">
                            <span className="text-[#64748B] block text-[10px]">Stream Health</span>
                            <span className="font-semibold text-[#0A192F]">99.8% Nominal</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 text-[11px] text-[#64748B] font-mono">
                        Eliminates surprise cost overruns before invoice finalization
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Adaptive EWMA Baseline */}
                  {activeTab === "baseline" && (
                    <div className="h-full rounded-2xl bg-white/80 backdrop-blur-md p-5 border border-white/60 flex flex-col justify-between shadow-xs transition-all text-[#0A192F]">
                      <div>
                        <div className="flex items-center justify-between font-mono text-[11px] text-[#0062E0] font-semibold uppercase tracking-wider pb-2 border-b border-[#E2E8F0]">
                          <span className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-[#0062E0]" />
                            Statistical Drift Engine
                          </span>
                          <span className="text-[#0D824D] font-mono text-[11px] font-medium">
                            99.95% Safe
                          </span>
                        </div>
                        <p className="text-[12px] text-[#475569] leading-relaxed mt-3">
                          Sentinel separates true anomalies from normal business peaks using exponentially weighted moving averages (EWMA) with day-of-week and hour-of-day harmonic decomposition.
                        </p>
                        <div className="grid grid-cols-2 gap-2.5 mt-3 font-mono text-[11px]">
                          <div className="p-2.5 rounded-xl bg-white/90 border border-[#D6E4F5]/80 shadow-xs">
                            <span className="text-[#64748B] block text-[10px]">Smoothing Factor</span>
                            <span className="font-semibold text-[#0A192F]">α = 0.15</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white/90 border border-[#D6E4F5]/80 shadow-xs">
                            <span className="text-[#64748B] block text-[10px]">Training Window</span>
                            <span className="font-semibold text-[#0A192F]">90-Day Sliding</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white/90 border border-[#D6E4F5]/80 shadow-xs">
                            <span className="text-[#64748B] block text-[10px]">Confidence Corridor</span>
                            <span className="font-semibold text-[#0062E0]">±3.0σ Envelope</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white/90 border border-[#D6E4F5]/80 shadow-xs">
                            <span className="text-[#64748B] block text-[10px]">False Alarm Target</span>
                            <span className="font-semibold text-[#0D824D]">&lt; 0.05% Target</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 text-[11px] text-[#64748B] font-mono">
                        Eliminates alert fatigue from cyclic batch spikes
                      </div>
                    </div>
                  )}

                  {/* TAB 3: Automated Circuit Breakers */}
                  {activeTab === "breakers" && (
                    <div className="h-full rounded-2xl bg-white/80 backdrop-blur-md p-5 border border-white/60 flex flex-col justify-between shadow-xs transition-all text-[#0A192F]">
                      <div>
                        <div className="flex items-center justify-between font-mono text-[11px] text-[#0062E0] font-semibold uppercase tracking-wider pb-2 border-b border-[#E2E8F0]">
                          <span className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-[#0062E0]" />
                            Automated Kill Switches
                          </span>
                          <span className="text-[#0D824D] font-mono text-[11px] font-medium">
                            Armed &amp; Ready
                          </span>
                        </div>
                        <p className="text-[12px] text-[#475569] leading-relaxed mt-2.5">
                          Pre-configured tripwires halt runaway recursive agent loops, infinite API retry cascades, and compromised keys within 50 milliseconds before budgets blowout.
                        </p>
                        <div className="space-y-2 mt-3 font-mono text-[11px]">
                          <div className="p-2.5 rounded-xl bg-white/90 border border-[#D6E4F5]/80 shadow-xs">
                            <div className="text-[#0062E0] font-semibold text-[11px]">Sub-50ms Rate Throttle</div>
                            <div className="text-[10px] text-[#64748B] mt-0.5">Automated rate limiter or API key revocation before billing overrun.</div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white/90 border border-[#D6E4F5]/80 shadow-xs">
                            <div className="text-[#0062E0] font-semibold text-[11px]">Non-Disruptive Failover</div>
                            <div className="text-[10px] text-[#64748B] mt-0.5">Gracefully routes traffic to backup model tiers without dropping user requests.</div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white/90 border border-[#D6E4F5]/80 shadow-xs">
                            <div className="text-[#0062E0] font-semibold text-[11px]">Slack &amp; PagerDuty Sync</div>
                            <div className="text-[10px] text-[#64748B] mt-0.5">Instant incident alerts with 1-click manual override approval.</div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 text-[11px] text-[#64748B] font-mono">
                        Safe fallback preserves user-facing API availability
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
