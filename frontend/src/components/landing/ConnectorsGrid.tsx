"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import {
  AnthropicAiLogo,
  AwsLogo,
  AzureBlockLogo,
  BedrockGlyphLogo,
  GcpCloudLogo,
  KubernetesWheelLogo,
  NvidiaEyeLogo,
  OpenAiRosetteLogo,
  VertexAiLogo,
} from "@/components/ui/BrandLogos";

const connectorGroups = [
  {
    title: "Cloud Infrastructure",
    summary: "AWS CUR 2.0 • Google Cloud • Microsoft Azure • Kubernetes",
    providers: [
      { name: "AWS", Logo: AwsLogo },
      { name: "Google Cloud", Logo: GcpCloudLogo },
      { name: "Microsoft Azure", Logo: AzureBlockLogo },
      { name: "Kubernetes", Logo: KubernetesWheelLogo },
    ],
  },
  {
    title: "AI Providers + Compute",
    summary: "OpenAI • Anthropic • Vertex AI • Bedrock • GPUs",
    providers: [
      { name: "OpenAI", Logo: OpenAiRosetteLogo },
      { name: "Anthropic", Logo: AnthropicAiLogo },
      { name: "Vertex AI", Logo: VertexAiLogo },
      { name: "Bedrock", Logo: BedrockGlyphLogo },
      { name: "NVIDIA", Logo: NvidiaEyeLogo },
    ],
  },
];

const connectors = [
  {
    name: "AWS CUR 2.0 & CloudWatch",
    category: "Cloud Infrastructure",
    desc: "Hourly S3 billing export ingestion normalized to FOCUS 1.0 schema with resource-level attribution.",
    badge: "5-min IAM role",
    linkText: "Configure AWS",
  },
  {
    name: "Google Cloud & GKE",
    category: "Kubernetes & BigQuery",
    desc: "Automated BigQuery export streaming with namespace-level container cost attribution via OpenCost.",
    badge: "Service Account",
    linkText: "Configure GCP",
  },
  {
    name: "OpenAI Foundation Models",
    category: "LLM Telemetry",
    desc: "Token-level telemetry for GPT-4o, o1, and embeddings attributed down to customer tenant and team.",
    badge: "Admin API Key",
    linkText: "Configure OpenAI",
  },
  {
    name: "Anthropic Claude Admin",
    category: "LLM Telemetry",
    desc: "Organization token telemetry, prompt caching rates, and model cost allocation for Claude 3.5 Sonnet.",
    badge: "Admin Usage Key",
    linkText: "Configure Anthropic",
  },
];

export function ConnectorsGrid() {
  return (
    <section
      id="connectors"
      className="w-full bg-white text-[#0A192F] py-24 px-4 sm:px-6"
    >
      <div className="max-w-[1024px] mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-[36px] sm:text-[40px] font-semibold tracking-[-0.022em] text-[#0A192F] leading-[1.10]">
            Connect your infrastructure.
          </h2>
          <p className="mt-3 text-[17px] font-normal text-[#475569] tracking-[-0.015em] leading-[1.47]">
            Read-only cross-account IAM. Zero agent overhead. Never accesses
            customer application data or prompt payloads.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-6 max-w-[940px] mx-auto">
          {connectorGroups.map((group, index) => (
            <React.Fragment key={group.title}>
              {index > 0 && (
                <div
                  className="hidden lg:flex items-center justify-center text-[#64748B] px-1"
                  aria-hidden="true"
                >
                  <ArrowRight className="w-6 h-6 stroke-[1.75]" />
                </div>
              )}
              <div className="w-full lg:w-1/2 rounded-[22px] border border-[#D6E4F5] bg-[#F8FAFD] p-6 sm:p-7 shadow-[0_4px_24px_-4px_rgba(12,48,96,0.06)]">
                <h3 className="text-[12px] font-bold tracking-wider text-[#334155] uppercase mb-4">
                  {group.title}
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {group.providers.map(({ name, Logo }) => (
                    <div
                      key={name}
                      role="img"
                      aria-label={name}
                      title={name}
                      className="h-16 rounded-xl border border-[#D6E4F5] bg-white shadow-sm flex items-center justify-center text-[#0A192F] hover:border-[#0062E0] hover:shadow-md transition-all"
                    >
                      <Logo className="w-8 h-8" />
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[12px] text-[#475569] tracking-tight">
                  {group.summary}
                </p>
              </div>
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
          {connectors.map((item) => (
            <div
              key={item.name}
              className="rounded-[18px] border border-[#D6E4F5] bg-white p-6 flex flex-col justify-between hover:border-[#BCD4F0] transition-colors shadow-[0_4px_24px_-4px_rgba(12,48,96,0.05)]"
            >
              <div>
                <span className="text-[12px] font-medium text-[#64748B] block mb-1">
                  {item.category}
                </span>
                <h3 className="text-[17px] font-semibold text-[#0A192F] leading-[1.24]">
                  {item.name}
                </h3>
                <p className="mt-3 text-[14px] text-[#475569] leading-[1.43] tracking-[-0.015em]">
                  {item.desc}
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#EBF2FA] flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-[#334155] bg-[#F0F5FD] px-2.5 py-1 rounded-full">
                  {item.badge}
                </span>
                <Link
                  href="/dashboard"
                  className="text-[14px] font-medium text-[#0062E0] hover:underline flex items-center gap-0.5"
                >
                  <span>{item.linkText}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-[17px] font-medium text-[#0062E0] hover:underline"
          >
            <span>View all 18 supported multi-cloud &amp; AI integrations</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
