import Link from "next/link";
import { ArrowRight, Bot, Cloud, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function MarketingHomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-brand-500 selection:text-white">
      {/* Top Navbar */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 font-bold text-white shadow-lg shadow-brand-500/30">
            C
          </div>
          <span className="text-xl font-bold tracking-tight">Cirra</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-zinc-300 hover:text-white">
            Sign in
          </Link>
          <Link href="/signup">
            <Button size="sm">Get Started Free</Button>
          </Link>
        </div>
      </header>

      {/* Hero section */}
      <main className="mx-auto max-w-5xl px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-950/40 px-3 py-1 text-xs font-medium text-brand-300 mb-8 backdrop-blur-sm">
          <Zap className="h-3.5 w-3.5 text-brand-400" />
          <span>Next-Gen FinOps & LLM Governance</span>
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
          Cloud and AI cost control plane.
          <br />
          <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            See it. Guard it. Act on it.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
          Unify multi-cloud billing and token-level LLM costs into a single FOCUS-aligned control center. Autonomous anomaly detection with human-in-the-loop remediation.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="gap-2">
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              Live Demo
            </Button>
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="mt-24 grid grid-cols-1 gap-6 text-left sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <Cloud className="h-8 w-8 text-brand-400 mb-4" />
            <h3 className="text-base font-semibold text-white">Multi-Cloud Ingest</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Normalized into FOCUS 1.0 schema from AWS, GCP, and Azure with millisecond query speeds.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <Bot className="h-8 w-8 text-purple-400 mb-4" />
            <h3 className="text-base font-semibold text-white">LLM Token Telemetry</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Track prompt/completion token spend attributed down to features, customer tiers, and models.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <ShieldCheck className="h-8 w-8 text-emerald-400 mb-4" />
            <h3 className="text-base font-semibold text-white">Guaranteed Guardrails</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Tenant-isolated RLS security and strict human approvals on any destructive write action.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
