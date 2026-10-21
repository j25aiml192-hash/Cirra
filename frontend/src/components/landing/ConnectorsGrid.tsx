"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function ConnectorsGrid() {
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

  return (
    <section id="connectors" className="w-full bg-white text-[#0A192F] py-24 px-4 sm:px-6">
      <div className="max-w-[1024px] mx-auto">
        {/* Apple Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-[36px] sm:text-[40px] font-semibold tracking-[-0.022em] text-[#0A192F] leading-[1.10]">
            Connect your infrastructure.
          </h2>
          <p className="mt-3 text-[17px] font-normal text-[#475569] tracking-[-0.015em] leading-[1.47]">
            Read-only cross-account IAM. Zero agent overhead. Never accesses customer application data or prompt payloads.
          </p>
        </div>

        {/* 4-Column Apple Utility Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {connectors.map((item, i) => (
            <div
              key={i}
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

              <div className="mt-8 pt-4 border-t border-[#EBF2FA] flex items-center justify-between">
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

        {/* Bottom Link */}
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
