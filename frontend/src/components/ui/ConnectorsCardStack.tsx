"use client";

import * as React from "react";
import { Lock } from "lucide-react";
import {
  AwsLogo,
  GcpCloudLogo,
  AzureBlockLogo,
  KubernetesWheelLogo,
  OpenAiRosetteLogo,
  AnthropicAiLogo,
} from "@/components/ui/BrandLogos";

export interface ConnectorItem {
  id: string;
  name: string;
  shortName: string;
  category: string;
  desc: string;
  badge: string;
  telemetryType: string;
  coverage: string;
  linkText: string;
  logo: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeColor: string;
}

export const defaultConnectors: ConnectorItem[] = [
  {
    id: "aws",
    name: "AWS CUR 2.0 & CloudWatch",
    shortName: "AWS",
    category: "Cloud Infrastructure",
    desc: "Hourly S3 billing export ingestion normalized to the standard FOCUS 1.0 schema with granular resource-level attribution across EC2, RDS, and EKS clusters.",
    badge: "5-min IAM role",
    telemetryType: "Hourly S3 Export",
    coverage: "Multi-Region EC2, RDS, EKS",
    linkText: "Configure AWS",
    logo: AwsLogo,
    accentColor: "#FF9900",
    badgeColor: "bg-[#FFF8EE] text-[#D97706] border-[#FDE68A]",
  },
  {
    id: "gcp",
    name: "Google Cloud & GKE",
    shortName: "Google Cloud",
    category: "Kubernetes & BigQuery",
    desc: "Automated BigQuery export streaming with namespace-level container cost attribution via OpenCost and continuous workload rightsizing.",
    badge: "Service Account",
    telemetryType: "BigQuery Live Stream",
    coverage: "GKE, Compute Engine, TPU Pods",
    linkText: "Configure GCP",
    logo: GcpCloudLogo,
    accentColor: "#4285F4",
    badgeColor: "bg-[#EEF5FF] text-[#2563EB] border-[#BFDBFE]",
  },
  {
    id: "openai",
    name: "OpenAI Foundation Models",
    shortName: "OpenAI",
    category: "LLM Telemetry",
    desc: "Token-level telemetry for GPT-4o, o1, and embeddings attributed down to customer tenant, engineering team, and prompt caching hit ratios.",
    badge: "Admin API Key",
    telemetryType: "Token Telemetry Stream",
    coverage: "GPT-4o, o1, Text Embeddings",
    linkText: "Configure OpenAI",
    logo: OpenAiRosetteLogo,
    accentColor: "#10A37F",
    badgeColor: "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]",
  },
  {
    id: "anthropic",
    name: "Anthropic Claude Admin",
    shortName: "Anthropic",
    category: "LLM Telemetry",
    desc: "Organization token telemetry, prompt caching rates, and model cost allocation for Claude 3.5 Sonnet, Haiku, and Opus workspaces.",
    badge: "Admin Usage Key",
    telemetryType: "Prompt Cache Telemetry",
    coverage: "Claude 3.5 Sonnet & Haiku",
    linkText: "Configure Anthropic",
    logo: AnthropicAiLogo,
    accentColor: "#D97706",
    badgeColor: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
  },
  {
    id: "azure",
    name: "Microsoft Azure & MCA",
    shortName: "Azure",
    category: "Enterprise Cloud",
    desc: "Enterprise Agreement (EA) and Microsoft Customer Agreement (MCA) daily exports ingestion with automated reservation and savings plan allocation.",
    badge: "App Registration",
    telemetryType: "MCA / EA Daily Exports",
    coverage: "Azure VMs, AKS, Cosmos DB",
    linkText: "Configure Azure",
    logo: AzureBlockLogo,
    accentColor: "#0078D4",
    badgeColor: "bg-[#F0F7FF] text-[#0284C7] border-[#BAE6FD]",
  },
  {
    id: "k8s",
    name: "Kubernetes Multi-Cluster",
    shortName: "Kubernetes",
    category: "Container Infrastructure",
    desc: "Daemonless container pod telemetry attributing CPU/RAM requests vs actual utilization directly to microservices and tenants.",
    badge: "Read-Only Helm",
    telemetryType: "OpenCost Metrics Engine",
    coverage: "EKS, GKE, AKS, On-Prem K8s",
    linkText: "Configure Kubernetes",
    logo: KubernetesWheelLogo,
    accentColor: "#326CE5",
    badgeColor: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
  },
];

export function ConnectorsCardStack({
  connectors = defaultConnectors,
}: {
  connectors?: ConnectorItem[];
}) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [touchStartX, setTouchStartX] = React.useState<number | null>(null);
  const [touchEndX, setTouchEndX] = React.useState<number | null>(null);
  const [isAnimating, setIsAnimating] = React.useState(false);

  const total = connectors.length;

  const handleNext = React.useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % total);
    setTimeout(() => setIsAnimating(false), 300);
  }, [isAnimating, total]);

  const handlePrev = React.useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + total) % total);
    setTimeout(() => setIsAnimating(false), 300);
  }, [isAnimating, total]);

  const handleSelect = React.useCallback((idx: number) => {
    if (idx === currentIndex) return;
    setCurrentIndex(idx);
  }, [currentIndex]);

  // Touch Swipe Handlers for mobile & tablet
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0]?.clientX ?? null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0]?.clientX ?? null);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    if (distance > 50) {
      handleNext(); // Swiped left -> next card
    } else if (distance < -50) {
      handlePrev(); // Swiped right -> prev card
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  return (
    <div className="w-full flex flex-col items-center select-none pt-4 pb-2">
      {/* Top Provider Quick-Jump Tabs */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap mb-7 max-w-[820px]">
        {connectors.map((item, idx) => {
          const isActive = idx === currentIndex;
          const Logo = item.logo;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(idx)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12px] sm:text-[13px] font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-[#0A192F] text-white shadow-[0_4px_16px_rgba(10,25,47,0.22)] scale-105 border border-[#0A192F]"
                  : "bg-white hover:bg-[#F0F6FD] text-[#334155] hover:text-[#0A192F] border border-[#D6E4F5] shadow-xs hover:border-[#BCD9FC]"
              }`}
            >
              <Logo className="w-3.5 h-3.5 shrink-0" />
              <span>{item.shortName}</span>
            </button>
          );
        })}
      </div>

      {/* 3D Stack Carousel Container */}
      <div
        className="relative w-full max-w-[720px] h-[430px] sm:h-[370px] flex items-center justify-center px-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Soft Dark Ambient Glow Beneath Deck */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[88%] h-20 bg-gradient-to-t from-[#0A192F]/30 via-[#0062E0]/15 to-transparent rounded-[100%] blur-3xl pointer-events-none" />

        {connectors.map((connector, idx) => {
          // Calculate offset relative to currentIndex in cyclic deck
          let offset = (idx - currentIndex + total) % total;
          if (offset > total / 2) {
            offset -= total;
          }

          const isFront = offset === 0;
          const isNext = offset === 1;
          const isPrev = offset === -1;
          const isVisible = Math.abs(offset) <= 2;

          if (!isVisible) return null;

          // Compute 3D stacked placement: front card is central, background cards stack behind with offset & scale
          const translateY = isFront ? 0 : Math.abs(offset) * 14;
          const translateX = offset * 22; // subtle side-peek
          const scale = isFront ? 1 : 1 - Math.abs(offset) * 0.05;
          const zIndex = 20 - Math.abs(offset) * 5;
          const opacity = isFront ? 1 : Math.max(0.4, 1 - Math.abs(offset) * 0.28);
          const rotate = offset * 1.5;

          const Logo = connector.logo;

          return (
            <div
              key={connector.id}
              onClick={() => {
                if (!isFront) {
                  handleSelect(idx);
                } else {
                  handleNext();
                }
              }}
              className="absolute w-full max-w-[660px] cursor-pointer transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-transform"
              style={{
                transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale}) rotate(${rotate}deg)`,
                zIndex,
                opacity,
              }}
            >
              <div
                className={`rounded-[22px] p-6 sm:p-8 text-left transition-all duration-300 ${
                  isFront
                    ? "bg-gradient-to-br from-[#0F172A] via-[#0C1424] to-[#070D18] border border-[#1E2E48] shadow-[0_24px_65px_-12px_rgba(10,25,47,0.45),0_0_36px_-8px_rgba(0,98,224,0.18)] ring-1 ring-white/10"
                    : "bg-[#080E1C]/95 border border-[#18263E] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.40)] hover:border-[#223658]"
                }`}
              >
                {/* Card Top Row: Logo + Badges */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white border border-white/20 shadow-md flex items-center justify-center p-2 shrink-0">
                      <Logo className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="text-[11px] font-mono font-bold text-[#38BDF8] uppercase tracking-wider block">
                        {connector.category}
                      </span>
                      <h3 className="text-[18px] sm:text-[20px] font-bold text-white tracking-tight leading-snug">
                        {connector.name}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[14px] sm:text-[15px] text-[#94A3B8] leading-relaxed tracking-[-0.01em]">
                  {connector.desc}
                </p>

                {/* 3 Telemetry Feature Specs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-5">
                  <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[12px] shadow-xs backdrop-blur-sm">
                    <span className="text-[10px] font-mono text-[#64748B] uppercase block">
                      Auth Method
                    </span>
                    <span className="font-semibold text-white mt-0.5 block truncate">
                      {connector.badge}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[12px] shadow-xs backdrop-blur-sm">
                    <span className="text-[10px] font-mono text-[#64748B] uppercase block">
                      Telemetry Sync
                    </span>
                    <span className="font-semibold text-white mt-0.5 block truncate">
                      {connector.telemetryType}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[12px] shadow-xs backdrop-blur-sm">
                    <span className="text-[10px] font-mono text-[#64748B] uppercase block">
                      Coverage
                    </span>
                    <span className="font-semibold text-white mt-0.5 block truncate">
                      {connector.coverage}
                    </span>
                  </div>
                </div>

                {/* Card Security Footer */}
                <div className="pt-3 border-t border-white/[0.08] flex items-center justify-start text-[11px] text-[#94A3B8] font-medium">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>Read-only IAM · Zero agent code overhead</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ConnectorsCardStack;
