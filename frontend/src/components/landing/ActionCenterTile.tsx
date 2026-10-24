"use client";

import * as React from "react";
import {
  ShieldCheck,
  Cpu,
  CheckCircle2,
  Database,
  CalendarClock,
  HardDrive,
  Sun,
  Moon,
  Zap,
  SlidersHorizontal,
} from "lucide-react";
import { ClickStack } from "@/components/ui/click-stack-tw";
import { ConcaveCarousel } from "@/components/ui/concave-carousel-tw";

interface FloatingCloudProps {
  title: string;
  subtitle: string;
  className?: string;
  animationClass?: string;
}

function FloatingCloud({ title, subtitle, className = "", animationClass = "" }: FloatingCloudProps) {
  return (
    <div className={`relative group select-none ${animationClass} ${className}`}>
      {/* Soft Ground Shadow underneath the cloud */}
      <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-[72%] h-4 bg-[#0A192F]/15 blur-md rounded-full pointer-events-none transition-all duration-300 group-hover:w-[82%] group-hover:bg-[#0A192F]/22" />

      <div className="relative w-[236px] h-[92px] sm:w-[252px] sm:h-[98px]">
        <svg
          viewBox="0 0 268 96"
          className="w-full h-full drop-shadow-[0_18px_32px_rgba(10,25,47,0.18)] drop-shadow-[0_6px_14px_rgba(0,98,224,0.14)] drop-shadow-[0_2px_4px_rgba(10,25,47,0.06)] transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_24px_44px_rgba(10,25,47,0.25)]"
        >
          <defs>
            <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="65%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F4F8FD" />
            </linearGradient>
          </defs>
          <path
            d="M 48 84 C 28 84 12 72 12 56 C 12 42 22 30 38 28 C 48 14 68 6 92 6 C 110 6 126 13 135 24 C 145 12 165 4 188 4 C 216 4 238 20 242 42 C 254 46 264 58 264 70 C 264 82 250 84 232 84 Z"
            fill="url(#cloudGrad)"
            stroke="#D6E4F5"
            strokeWidth="1.5"
          />
        </svg>

        {/* Text inside Cloud */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-3 px-6 text-center pointer-events-none">
          <div className="text-[13px] sm:text-[13.5px] font-bold text-[#0A192F] tracking-tight leading-snug">
            {title}
          </div>
          <div className="text-[11px] font-medium text-[#64748B] mt-0.5 tracking-tight leading-tight">
            {subtitle}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ActionCenterTile() {
  const [activeProposalIndex, setActiveProposalIndex] = React.useState<number>(0);
  const deckRef = React.useRef<HTMLDivElement>(null);

  const handleSelectRule = (ruleIdx: number) => {
    // Map governance rule to corresponding proposal card:
    // Rule 01 (Flag Unattached Volumes)  -> Proposal 2 (Purge Zombie Assets)
    // Rule 02 (Idle Model Clusters)      -> Proposal 1 (Rightsize Compute)
    // Rule 03 (Off-Hours Sleep Schedule) -> Proposal 3 (Scheduled Dev Sleep)
    const mapping: Record<number, number> = {
      0: 1,
      1: 0,
      2: 2,
    };
    const targetProposal = mapping[ruleIdx] ?? 0;
    setActiveProposalIndex(targetProposal);

    // Smoothly scroll down to the ClickStack card deck below
    if (deckRef.current) {
      deckRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // 3 distinct scenario card contents for ClickStack (memoized for high-performance zero-lag switching)
  const cards = React.useMemo(() => [
    // =========================================================
    // CARD 1: RIGHTSIZE COMPUTE (Before vs After Hardware Sizing)
    // =========================================================
    <div key="card-1" className="overflow-hidden">
      {/* Header Bar */}
      <div className="h-10 bg-[#507695] border-b border-[#436480] px-4 sm:px-6 flex items-center justify-between text-[11px] text-blue-100">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]/80 border border-[#E0443E]/30" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]/80 border border-[#DEA123]/30" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]/80 border border-[#1AAB29]/30" />
          <span className="ml-1.5 font-mono text-[10px] text-blue-100/90">
            fix://rightsize-ec2
          </span>
        </div>
      </div>

      <div className="p-6 sm:p-7 space-y-4 text-left">
        {/* Title & Badge */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white">
            <Cpu className="w-4 h-4 text-white" />
            Rightsize Compute
          </span>
          <span className="text-[11px] font-medium text-blue-100 bg-[#496C8A] px-2.5 py-0.5 rounded-full border border-white/20 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-100" />
            Human Review Required
          </span>
        </div>

        <div>
          <h3 className="text-[19px] sm:text-[21px] font-bold text-white leading-snug">
            Resize 6 over-provisioned analytics nodes
          </h3>
          <div className="text-[11px] text-blue-100/85 mt-1 font-mono">
            analytics-prod · Target: Terraform PR #214 · Owner: Data Platform
          </div>
        </div>

        {/* Net Savings Highlight */}
        <div className="pt-2 pb-3 border-b border-[#4D7190]">
          <div className="text-[10px] font-mono text-blue-200 uppercase tracking-wider font-semibold">
            Net Monthly Reduction
          </div>
          <div className="text-[28px] font-bold text-white tracking-tight mt-0.5">
            -$1,240/mo <span className="text-[15px] font-semibold text-white/95">(-32%)</span>
          </div>
          <div className="text-[11px] text-blue-100 font-medium flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            Pricing catalog verified · 6 instances affected
          </div>
        </div>

        {/* VISUAL WIDGET: Before vs After Hardware Comparison */}
        <div className="p-4 rounded-xl bg-white/50 backdrop-blur-md border border-white/60 space-y-2.5 text-[#0A192F] shadow-sm">
          <div className="text-[11px] font-mono text-[#0062E0] uppercase tracking-wider font-bold flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Instance Sizing Comparison
          </div>

          {/* Dual Comparison Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
            {/* Before */}
            <div className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-white/70 space-y-1 shadow-sm">
              <div className="text-[10px] font-mono text-red-600 font-bold uppercase">Current (Overprovisioned)</div>
              <div className="font-semibold text-[#0A192F] text-[13px]">m5.4xlarge</div>
              <div className="text-[11px] text-[#475569]">16 vCPU · 64 GB RAM</div>
              <div className="mt-2 pt-1.5 border-t border-white/50">
                <div className="flex justify-between text-[11px] text-[#475569]">
                  <span>Avg CPU</span>
                  <span className="font-bold text-red-600">18%</span>
                </div>
                <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-red-500 h-full rounded-full" style={{ width: "18%" }} />
                </div>
              </div>
            </div>

            {/* After */}
            <div className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-white/70 space-y-1 shadow-sm">
              <div className="text-[10px] font-mono text-[#0062E0] font-bold uppercase">Proposed (Right-Sized)</div>
              <div className="font-semibold text-[#0A192F] text-[13px]">m5.2xlarge</div>
              <div className="text-[11px] text-[#475569]">8 vCPU · 32 GB RAM</div>
              <div className="mt-2 pt-1.5 border-t border-white/50">
                <div className="flex justify-between text-[11px] text-[#475569]">
                  <span>Optimized CPU</span>
                  <span className="font-bold text-[#0062E0]">36%</span>
                </div>
                <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-[#0062E0] h-full rounded-full" style={{ width: "36%" }} />
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-[#1E293B] leading-snug pt-1 font-medium">
            90 days of metrics show zero utilization spikes above 28%. Downsizing cuts idle cost safely.
          </p>
        </div>

        {/* Safety Guarantee */}
        <div className="p-3 rounded-xl bg-white/50 backdrop-blur-md border border-white/60 text-[11px] space-y-1 text-[#0A192F] shadow-sm">
          <div className="font-semibold text-[#0A192F] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0062E0]" />
            Blast Radius & Rollback Protocol
          </div>
          <div className="text-[#334155] text-[11px] leading-tight">
            Dry run verified 0 resources destroyed. Automatic 1-click rollback dispatched if p99 latency rises &gt; 5%.
          </div>
        </div>
      </div>
    </div>,

    // =========================================================
    // CARD 2: ZOMBIE CLEANUP (Unattached Disks & Idle ALBs)
    // =========================================================
    <div key="card-2" className="overflow-hidden">
      {/* Header Bar */}
      <div className="h-10 bg-[#507695] border-b border-[#436480] px-4 sm:px-6 flex items-center justify-between text-[11px] text-blue-100">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]/80 border border-[#E0443E]/30" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]/80 border border-[#DEA123]/30" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]/80 border border-[#1AAB29]/30" />
          <span className="ml-1.5 font-mono text-[10px] text-blue-100/90">
            fix://idle-cleanup
          </span>
        </div>
      </div>

      <div className="p-6 sm:p-7 space-y-4 text-left">
        {/* Title & Badge */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white">
            <Database className="w-4 h-4 text-white" />
            Purge Zombie Assets
          </span>
          <span className="text-[11px] font-medium text-blue-100 bg-[#496C8A] px-2.5 py-0.5 rounded-full border border-white/20 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-100" />
            Snapshot First Guaranteed
          </span>
        </div>

        <div>
          <h3 className="text-[19px] sm:text-[21px] font-bold text-white leading-snug">
            Release 14 unattached disks & 3 idle balancers
          </h3>
          <div className="text-[11px] text-blue-100/85 mt-1 font-mono">
            core-infrastructure · Plan #109 · Owner: Core Infra
          </div>
        </div>

        {/* Net Savings Highlight */}
        <div className="pt-2 pb-3 border-b border-[#4D7190]">
          <div className="text-[10px] font-mono text-blue-200 uppercase tracking-wider font-semibold">
            Net Monthly Reduction
          </div>
          <div className="text-[28px] font-bold text-white tracking-tight mt-0.5">
            -$860/mo <span className="text-[15px] font-semibold text-white/95">(-100% waste)</span>
          </div>
          <div className="text-[11px] text-blue-100 font-medium flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            Reclaims 4.8 TB of orphaned volume storage permanently
          </div>
        </div>

        {/* VISUAL WIDGET: Zombie Resource Inventory Breakdown */}
        <div className="p-4 rounded-xl bg-white/50 backdrop-blur-md border border-white/60 space-y-2.5 text-[#0A192F] shadow-sm">
          <div className="text-[11px] font-mono text-[#0062E0] uppercase tracking-wider font-bold flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5" />
            Identified Orphan Inventory
          </div>

          <div className="space-y-2 text-[11px]">
            <div className="p-2.5 rounded-lg bg-white/60 backdrop-blur-sm border border-white/70 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-[#0062E0]/10 text-[#0062E0] flex items-center justify-center font-bold text-[12px] border border-[#0062E0]/15">
                  14
                </div>
                <div>
                  <div className="font-semibold text-[#0A192F] text-[12px]">Unattached EBS Disks</div>
                  <div className="text-[10px] text-[#475569]">4.8 TB · 0 IOPS for 30+ days</div>
                </div>
              </div>
              <span className="font-mono text-[#0062E0] font-semibold text-[12px]">-$620/mo</span>
            </div>

            <div className="p-2.5 rounded-lg bg-white/60 backdrop-blur-sm border border-white/70 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-[#0062E0]/10 text-[#0062E0] flex items-center justify-center font-bold text-[12px] border border-[#0062E0]/15">
                  3
                </div>
                <div>
                  <div className="font-semibold text-[#0A192F] text-[12px]">Empty Load Balancers</div>
                  <div className="text-[10px] text-[#475569]">0 active target groups · 0 traffic</div>
                </div>
              </div>
              <span className="font-mono text-[#0062E0] font-semibold text-[12px]">-$240/mo</span>
            </div>
          </div>

          <p className="text-[11px] text-[#1E293B] leading-snug pt-1 font-medium">
            Left behind after past migrations. Neither compute instances nor DNS routes connect to these assets.
          </p>
        </div>

        {/* Safety Guarantee */}
        <div className="p-3 rounded-xl bg-white/50 backdrop-blur-md border border-white/60 text-[11px] space-y-1 text-[#0A192F] shadow-sm">
          <div className="font-semibold text-[#0A192F] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0062E0]" />
            Snapshot First Protocol
          </div>
          <div className="text-[#334155] text-[11px] leading-tight">
            Full encrypted backup snapshot created prior to deletion. Instant volume restore available.
          </div>
        </div>
      </div>
    </div>,

    // =========================================================
    // CARD 3: SCHEDULED DEV SLEEP (Off-Hours Night/Weekend)
    // =========================================================
    <div key="card-3" className="overflow-hidden">
      {/* Header Bar */}
      <div className="h-10 bg-[#507695] border-b border-[#436480] px-4 sm:px-6 flex items-center justify-between text-[11px] text-blue-100">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]/80 border border-[#E0443E]/30" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]/80 border border-[#DEA123]/30" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]/80 border border-[#1AAB29]/30" />
          <span className="ml-1.5 font-mono text-[10px] text-blue-100/90">
            fix://scheduled-sleep
          </span>
        </div>
      </div>

      <div className="p-6 sm:p-7 space-y-4 text-left">
        {/* Title & Badge */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white">
            <CalendarClock className="w-4 h-4 text-white" />
            Scheduled Sleep
          </span>
          <span className="text-[11px] font-medium text-blue-100 bg-[#496C8A] px-2.5 py-0.5 rounded-full border border-white/20 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-100" />
            1-Click Slack Override
          </span>
        </div>

        <div>
          <h3 className="text-[19px] sm:text-[21px] font-bold text-white leading-snug">
            Auto-sleep dev & staging environments off-hours
          </h3>
          <div className="text-[11px] text-blue-100/85 mt-1 font-mono">
            eng-operations · Policy #402 · Owner: Eng Ops
          </div>
        </div>

        {/* Net Savings Highlight */}
        <div className="pt-2 pb-3 border-b border-[#4D7190]">
          <div className="text-[10px] font-mono text-blue-200 uppercase tracking-wider font-semibold">
            Net Monthly Reduction
          </div>
          <div className="text-[28px] font-bold text-white tracking-tight mt-0.5">
            -$2,100/mo <span className="text-[15px] font-semibold text-white/95">(-68% runtime)</span>
          </div>
          <div className="text-[11px] text-blue-100 font-medium flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            28 EC2 instances + 4 RDS dev databases
          </div>
        </div>

        {/* VISUAL WIDGET: Day/Night Power Schedule Timeline */}
        <div className="p-4 rounded-xl bg-white/50 backdrop-blur-md border border-white/60 space-y-2.5 text-[#0A192F] shadow-sm">
          <div className="text-[11px] font-mono text-[#0062E0] uppercase tracking-wider font-bold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            24h Non-Prod Schedule Cycle
          </div>

          {/* Visual Day / Night Bars */}
          <div className="space-y-2 text-[11px]">
            <div className="p-2.5 rounded-lg bg-white/60 backdrop-blur-sm border border-white/70 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <div className="font-semibold text-[#0A192F]">8:00 AM – 8:00 PM (Mon–Fri)</div>
                  <div className="text-[10px] text-[#475569]">Active for development & CI runs</div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-[#0062E0]">
                Running 🔵
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#0F172A]/70 backdrop-blur-sm text-white border border-white/20 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">8:00 PM – 8:00 AM & Weekends</div>
                  <div className="text-[10px] text-slate-200">Auto-stopped (state kept on disk)</div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-sky-300">
                Sleeping 🌙
              </span>
            </div>
          </div>

          <p className="text-[11px] text-[#1E293B] leading-snug pt-1 font-medium">
            Saves 108 idle hours out of 168 weekly hours without touching production infrastructure.
          </p>
        </div>

        {/* Safety Guarantee */}
        <div className="p-3 rounded-xl bg-white/50 backdrop-blur-md border border-white/60 text-[11px] space-y-1 text-[#0A192F] shadow-sm">
          <div className="font-semibold text-[#0A192F] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0062E0]" />
            1-Click Engineer Override
          </div>
          <div className="text-[#334155] text-[11px] leading-tight">
            Working late? Type <code className="bg-white/60 border border-white/60 px-1.5 py-0.5 rounded text-[10px] font-mono text-[#0062E0]">/cirra wake dev</code> in Slack to wake the cluster in &lt; 60 seconds.
          </div>
        </div>
      </div>
    </div>,
  ], []);

  return (
    <section id="actions" className="w-full bg-[#F0F8FF] text-[#0A192F] pt-8 sm:pt-12 lg:pt-14 pb-32 sm:pb-44 px-4 sm:px-6 lg:px-8 scroll-mt-20 relative overflow-hidden">
      {/* Soft atmospheric ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-20 bg-gradient-to-b from-[#38BDF8]/15 via-[#0062E0]/5 to-transparent blur-2xl pointer-events-none" />

      <div className="max-w-[1360px] mx-auto text-center relative z-10">
        {/* Apple Headline Hierarchy */}
        <h2 className="text-[36px] sm:text-[44px] font-bold tracking-[-0.03em] text-[#0A192F] leading-[1.08]">
          Action Center.
        </h2>

        <p className="mt-2.5 text-[20px] sm:text-[26px] font-semibold tracking-[-0.015em] text-[#0A192F] leading-[1.2]">
          Every fix, proposed by Cirra. Approved by you.
        </p>

        <p className="mt-3 text-[15px] sm:text-[16px] font-medium text-[#0A192F]/80 tracking-[-0.01em] max-w-2xl mx-auto leading-[1.5]">
          Cirra finds the waste and drafts the fix as a pull request, a scheduled shutdown, or a policy. You review a dry run, approve, and we verify and can roll it back.
        </p>

        {/* Concave Carousel: 3 Inward-Curved Static Cards with Condensed Content */}
        <div className="mt-7 w-full">
          <ConcaveCarousel
            curvature={24}
            perspective={850}
            selectedIndex={activeProposalIndex === 0 ? 1 : activeProposalIndex === 1 ? 0 : 2}
            onSelect={handleSelectRule}
            items={[
              // Card 1: Zombie Storage
              <div key="rule-1" className="p-6 sm:p-7 text-left">
                <h3 className="text-[18px] sm:text-[19px] font-bold text-[#0A192F] tracking-tight">
                  Flag Unattached Volumes
                </h3>

                <div className="mt-2 text-[12px] font-mono font-semibold text-[#5F86A6]">
                  Trigger: Detached EBS &gt; 30d
                </div>

                <p className="text-[13px] text-[#475569] leading-relaxed mt-2.5">
                  Identifies orphaned disks from stopped instances and takes safety snapshots before staging cleanup.
                </p>
              </div>,

              // Card 2: Idle Compute & AI
              <div key="rule-2" className="p-6 sm:p-7 text-left">
                <h3 className="text-[18px] sm:text-[19px] font-bold text-[#0A192F] tracking-tight">
                  Idle Model Clusters
                </h3>

                <div className="mt-2 text-[12px] font-mono font-semibold text-[#5F86A6]">
                  Trigger: GPU util &lt; 5% (4h)
                </div>

                <p className="text-[13px] text-[#475569] leading-relaxed mt-2.5">
                  Flags underutilized LLM endpoints and GPUs, pinging owners in Slack with rightsizing fixes.
                </p>
              </div>,

              // Card 3: Off-Hours Sleep Schedule
              <div key="rule-3" className="p-6 sm:p-7 text-left">
                <h3 className="text-[18px] sm:text-[19px] font-bold text-[#0A192F] tracking-tight">
                  Off-Hours Sleep Schedule
                </h3>

                <div className="mt-2 text-[12px] font-mono font-semibold text-[#5F86A6]">
                  Trigger: Non-prod off-hours
                </div>

                <p className="text-[13px] text-[#475569] leading-relaxed mt-2.5">
                  Schedules automated dev shutdowns over nights and weekends with instant Slack cluster wake.
                </p>
              </div>,
            ]}
          />
        </div>

        {/* ClickStack 3-Card Interactive Deck with Floating Clouds */}
        <div
          ref={deckRef}
          className="mt-12 sm:mt-14 relative max-w-[1320px] mx-auto flex justify-center items-center scroll-mt-28"
        >
          {/* FLOATING CLOUD 1: Left Top */}
          <div className="hidden xl:block absolute -left-2 2xl:-left-8 top-16 z-20">
            <FloatingCloud
              title="Dry-run first"
              subtitle="Sandboxed blast radius"
              animationClass="animate-float-cloud-left-1"
            />
          </div>

          {/* FLOATING CLOUD 2: Left Bottom */}
          <div className="hidden xl:block absolute -left-2 2xl:-left-8 bottom-20 z-20">
            <FloatingCloud
              title="Human approval required"
              subtitle="You hold the key"
              animationClass="animate-float-cloud-left-2"
            />
          </div>

          {/* Main 3-Card Proposal Stack */}
          <ClickStack
            items={cards}
            cardWidth="max-w-[780px]"
            spreadY={18}
            showControls={true}
            activeIndex={activeProposalIndex}
            onCardChange={(newIdx) => setActiveProposalIndex(newIdx)}
          />

          {/* FLOATING CLOUD 3: Right Top */}
          <div className="hidden xl:block absolute -right-2 2xl:-right-8 top-16 z-20">
            <FloatingCloud
              title="Full audit log"
              subtitle="Immutable compliance"
              animationClass="animate-float-cloud-right-1"
            />
          </div>

          {/* FLOATING CLOUD 4: Right Bottom */}
          <div className="hidden xl:block absolute -right-2 2xl:-right-8 bottom-20 z-20">
            <FloatingCloud
              title="Auto-rollback on fail"
              subtitle="Health check verified"
              animationClass="animate-float-cloud-right-2"
            />
          </div>
        </div>

        {/* Mobile & Tablet Floating Cloud Grid (< xl screens) */}
        <div className="mt-10 max-w-[620px] mx-auto xl:hidden flex flex-wrap justify-center gap-4">
          <FloatingCloud
            title="Dry-run first"
            subtitle="Sandboxed blast radius"
            animationClass="animate-float-cloud-left-1"
          />
          <FloatingCloud
            title="Human approval required"
            subtitle="You hold the key"
            animationClass="animate-float-cloud-left-2"
          />
          <FloatingCloud
            title="Full audit log"
            subtitle="Immutable compliance"
            animationClass="animate-float-cloud-right-1"
          />
          <FloatingCloud
            title="Auto-rollback on fail"
            subtitle="Health check verified"
            animationClass="animate-float-cloud-right-2"
          />
        </div>


      </div>
    </section>
  );
}

export default ActionCenterTile;
