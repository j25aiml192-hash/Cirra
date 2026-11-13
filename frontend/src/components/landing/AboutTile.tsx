"use client";

import * as React from "react";
import {
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  Zap,
  Lock,
  Compass,
  ArrowRight,
  TrendingUp,
  Server,
  Network,
  CheckCircle2,
} from "lucide-react";
import GlyphSonar from "@/components/ui/GlyphSonar";

type AboutTab = "mission" | "architecture" | "security";

export function AboutTile() {
  const [activeTab, setActiveTab] = React.useState<AboutTab>("mission");

  return (
    <section
      id="about"
      className="w-full bg-[#050B18] text-white pb-36 sm:pb-48 lg:pb-56 relative overflow-hidden scroll-mt-20"
    >
      <div id="sentinel" className="absolute -top-20" />

      {/* Clean Animated Flashing Line between Hero and About */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#38BDF8] via-[#60A5FA] to-transparent animate-flash-line pointer-events-none z-30" />

      {/* Moving Text Stream Divider (Seamless, No Borders, No Boxes) */}
      <div className="w-full relative z-20 overflow-hidden bg-[#050B18]/60 backdrop-blur-sm py-3 select-none">
        <div className="flex w-max animate-marquee-infinite items-center gap-7">
          {[...Array(2)].map((_, listIdx) => (
            <div key={listIdx} className="flex items-center gap-7">
              {[
                "ABOUT CIRRA",
                "AUTONOMOUS FINOPS",
                "MULTI-CLOUD & AI NATIVE",
                "CLICKHOUSE POWERED",
                "SUB-50ms CIRCUIT BREAKERS",
                "ENTERPRISE RLS SECURITY",
                "PREDICTIVE DRIFT TELEMETRY",
                "ZERO BUDGET SURPRISES",
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
      </div>

      {/* Animated Glyph Sonar Background in Dark Blue Theme */}
      <GlyphSonar />

      {/* Soft gradient ambient glow accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[480px] bg-gradient-to-tr from-[#0062E0]/15 via-[#38BDF8]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Horizon Dawn Light Glow at the bottom merging threshold */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-28 bg-gradient-to-t from-[#0062E0]/15 via-[#38BDF8]/10 to-transparent blur-3xl pointer-events-none z-[1]" />

      {/* Seamless Merging Transition */}
      <div
        className="absolute bottom-0 left-0 right-0 h-28 sm:h-36 pointer-events-none z-[2]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(5, 11, 24, 0) 0%, rgba(5, 11, 24, 0.3) 25%, rgba(14, 34, 68, 0.55) 50%, rgba(160, 205, 242, 0.75) 75%, rgba(240, 248, 255, 0.95) 92%, #F0F8FF 100%)",
        }}
      />

      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 pt-16 sm:pt-20 text-center relative z-10">
        {/* Apple Headline Hierarchy in Dark Theme */}
        <h2 className="text-[36px] sm:text-[40px] font-semibold tracking-[-0.022em] text-white leading-[1.10]">
          About Cirra.
        </h2>

        <p className="mt-2 text-[22px] sm:text-[28px] font-normal tracking-[0.007em] text-[#E2EDF8] leading-[1.14]">
          The autonomous financial control plane for Cloud and AI.
        </p>

        <p className="mt-3 text-[17px] font-normal text-[#94A3B8] tracking-[-0.015em] max-w-2xl mx-auto leading-[1.47]">
          Built for high-growth engineering and finance teams navigating distributed multi-cloud sprawl, GPU clusters, and frontier generative AI consumption.
        </p>

        {/* Glassmorphic Apple macOS Window resting on dark background */}
        <div className="mt-12 max-w-[1080px] mx-auto text-left">
          <div className="rounded-[22px] bg-white/[0.85] backdrop-blur-2xl border border-white/60 apple-product-shadow overflow-hidden shadow-[0_30px_90px_-20px_rgba(0,0,0,0.75)] text-[#0A192F]">
            {/* macOS Chrome Header Bar */}
            <div className="h-11 bg-white/[0.60] backdrop-blur-md border-b border-black/[0.08] px-4 sm:px-6 flex items-center justify-between text-[12px] text-[#475569]">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
                <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
                <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
                <span className="ml-2 font-mono text-[11px] text-[#64748B] hidden sm:inline-block">
                  cirra://system/about/overview/v2.4
                </span>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-medium text-[#64748B]">
                <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Autonomous Control Plane Active
                </span>
              </div>
            </div>

            {/* Navigation Switcher Tabs */}
            <div className="border-b border-slate-200/80 bg-slate-50/80 px-4 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("mission")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === "mission"
                    ? "bg-[#0A192F] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                The Mission
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("architecture")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === "architecture"
                    ? "bg-[#0A192F] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                Architecture & Ingestion
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("security")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === "security"
                    ? "bg-[#0A192F] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Security & Isolation
              </button>
            </div>

            {/* Window Content */}
            <div className="p-6 sm:p-8">
              {activeTab === "mission" && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                  <div className="md:col-span-7 flex flex-col justify-between bg-gradient-to-br from-white to-slate-50 p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                    <div>
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-[11px] font-bold tracking-wide uppercase mb-3">
                        <Sparkles className="w-3 h-3" /> Autonomous By Design
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        Ending the Era of Reactive Monthly Surprise Bills
                      </h3>
                      <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                        Modern engineering organizations no longer provision static servers. Today, autonomous agents, GPU batch clusters, and multi-cloud serverless workloads spin up dynamically in milliseconds. A single unconstrained while-loop or runaway indexing job can burn $20,000 before morning standup.
                      </p>
                      <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                        Cirra replaces legacy lagging dashboards with real-time continuous ingestion, predictive statistical anomaly detection, and automated circuit breakers that intervene safely before budgets are breached.
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-6 mt-6 border-t border-slate-200">
                      <div>
                        <div className="text-2xl font-extrabold text-blue-600">15 min</div>
                        <div className="text-xs text-slate-500 font-medium">Sampling Sliding Window</div>
                      </div>
                      <div>
                        <div className="text-2xl font-extrabold text-slate-900">&lt;50 ms</div>
                        <div className="text-xs text-slate-500 font-medium">Breaker Response Time</div>
                      </div>
                      <div>
                        <div className="text-2xl font-extrabold text-emerald-600">100%</div>
                        <div className="text-xs text-slate-500 font-medium">Multi-Cloud Parity</div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-5 flex flex-col justify-between space-y-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-3">
                        <Layers className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">Unified Attribution</h4>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        Correlate raw AWS EC2, GCP BigQuery, Azure, and Kubernetes costs alongside OpenAI & Anthropic API tokens into a normalized FinOps schema.
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3">
                        <Zap className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">Zero-Friction Action Engine</h4>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        Every recommended optimization generates dry-run impact analyses and GitHub pull requests with instant one-click rollback guardrails.
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-3">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">Deterministic ROI Tracking</h4>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        Continuous audit ledger that cryptographically verifies realized savings against baseline costs, proving exact engineering return on investment.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "architecture" && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-slate-900 to-[#0A192F] p-6 rounded-2xl text-white">
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">
                      <Server className="w-3.5 h-3.5" /> High-Throughput Analytics Engine
                    </div>
                    <h3 className="text-xl font-bold tracking-tight">
                      Columnar ClickHouse + Event Stream Architecture
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                      Cirra aggregates multi-cloud billing CURs, CloudWatch metrics, Google Cloud exports, and token inference telemetry directly into a distributed ClickHouse columnar datastore capable of sub-second aggregations across hundreds of millions of events.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                      <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                        Phase 01: Ingest
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">Multi-Stream Connectors</h4>
                      <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                        Lightweight native connectors poll AWS CUR 2.0, GCP Billing BigQuery tables, Azure Cost Management, and frontier LLM endpoints on 15-minute micro-batch cadences.
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                      <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
                        Phase 02: Model
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">Adaptive EWMA Baselines</h4>
                      <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                        Exponentially Weighted Moving Averages (EWMA) maintain rolling dynamic baselines that automatically adapt to seasonality, diurnal trends, and planned growth.
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
                      <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
                        Phase 03: Intervene
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">Circuit Breakers & Voice</h4>
                      <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                        Outbound Twilio & Vapi AI voice telephony escalations call on-call engineers, while circuit breakers apply dynamic rate ceilings and kill switches to contain runaway jobs.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-3">
                        <Lock className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                        Zero-Trust Cryptographic Isolation
                      </h3>
                      <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                        All provider credentials and API keys are encrypted at rest using AES-256 Fernet symmetric cryptography. Keys are decrypted strictly in ephemeral memory during synchronous provider validation and never returned over API endpoints.
                      </p>
                    </div>

                    <ul className="mt-5 space-y-2 text-xs text-slate-700">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        AES-256 Fernet encryption with rotating keys
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        Postgres Row-Level Security (RLS) on non-superuser roles
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ClickHouse reader strictly isolated with tenant UUID filtering
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                        SOC 2 Type II & Enterprise Compliance
                      </h3>
                      <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                        Deterministic append-only audit logging captures every policy update, rule creation, voice escalation, and action execution. Built for stringent enterprise SOC 2 and ISO 27001 readiness.
                      </p>
                    </div>

                    <ul className="mt-5 space-y-2 text-xs text-slate-700">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        Deterministic tamper-evident audit logs
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        Granular RBAC (Admin, Member, Viewer tiers)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        Quiet hours enforcement with timezone awareness
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

