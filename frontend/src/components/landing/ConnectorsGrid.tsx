"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";
import {
  AwsLogo,
  GcpCloudLogo,
  AzureBlockLogo,
  KubernetesWheelLogo,
  OpenAiRosetteLogo,
  AnthropicAiLogo,
  VertexAiLogo,
  BedrockGlyphLogo,
  NvidiaEyeLogo,
} from "@/components/ui/BrandLogos";

export function ConnectorsGrid() {
  return (
    <section id="connectors" className="w-full bg-[#ffffff] text-[#1d1d1f] py-24 px-4 sm:px-6">
      <div className="max-w-[1024px] mx-auto text-center">
        {/* Apple Section Header */}
        <div className="max-w-2xl mx-auto mb-14">
          <h2 className="text-[36px] sm:text-[40px] font-semibold tracking-[-0.022em] text-[#1d1d1f] leading-[1.10]">
            Connect your infrastructure.
          </h2>
          <p className="mt-3 text-[17px] font-normal text-[#7a7a7a] tracking-[-0.015em] leading-[1.47]">
            Read-only cross-account IAM. Zero agent overhead. Never accesses customer application data or prompt payloads.
          </p>
        </div>

        {/* Modular Connector Architecture Cards (Cloud + AI Providers) */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-6 max-w-[940px] mx-auto">
          {/* Card 1: Cloud Infrastructure */}
          <div
            className="w-full lg:w-1/2 rounded-[22px] border border-[#e0e0e0] bg-[#fafafc] p-6 sm:p-7 text-left apple-product-shadow"
            style={{ boxShadow: "rgba(0, 0, 0, 0.08) 0 4px 20px 0" }}
          >
            <div className="text-[12px] font-bold tracking-wider text-[#1d1d1f] uppercase mb-4">
              Cloud Infrastructure
            </div>

            <div className="grid grid-cols-4 gap-3 sm:gap-3.5">
              <div
                className="relative h-16 rounded-xl border border-[#e0e0e0] bg-[#ffffff] shadow-sm flex items-center justify-center text-[#1d1d1f] hover:border-[#0066cc] hover:shadow-md transition-all group cursor-pointer"
              >
                <AwsLogo className="w-9 h-9 group-hover:scale-105 transition-transform" />
                <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200 z-30 whitespace-nowrap bg-[#1d1d1f] text-[#ffffff] text-[10px] font-medium px-2 py-0.5 rounded-full shadow-lg border border-white/10">
                  AWS
                </span>
              </div>
              <div
                className="relative h-16 rounded-xl border border-[#e0e0e0] bg-[#ffffff] shadow-sm flex items-center justify-center text-[#1d1d1f] hover:border-[#0066cc] hover:shadow-md transition-all group cursor-pointer"
              >
                <GcpCloudLogo className="w-7 h-7 group-hover:scale-105 transition-transform" />
                <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200 z-30 whitespace-nowrap bg-[#1d1d1f] text-[#ffffff] text-[10px] font-medium px-2 py-0.5 rounded-full shadow-lg border border-white/10">
                  Google Cloud
                </span>
              </div>
              <div
                className="relative h-16 rounded-xl border border-[#e0e0e0] bg-[#ffffff] shadow-sm flex items-center justify-center text-[#1d1d1f] hover:border-[#0066cc] hover:shadow-md transition-all group cursor-pointer"
              >
                <AzureBlockLogo className="w-7 h-7 group-hover:scale-105 transition-transform" />
                <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200 z-30 whitespace-nowrap bg-[#1d1d1f] text-[#ffffff] text-[10px] font-medium px-2 py-0.5 rounded-full shadow-lg border border-white/10">
                  Microsoft Azure
                </span>
              </div>
              <div
                className="relative h-16 rounded-xl border border-[#e0e0e0] bg-[#ffffff] shadow-sm flex items-center justify-center text-[#1d1d1f] hover:border-[#0066cc] hover:shadow-md transition-all group cursor-pointer"
              >
                <KubernetesWheelLogo className="w-7 h-7 group-hover:scale-105 transition-transform" />
                <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200 z-30 whitespace-nowrap bg-[#1d1d1f] text-[#ffffff] text-[10px] font-medium px-2 py-0.5 rounded-full shadow-lg border border-white/10">
                  Kubernetes
                </span>
              </div>
            </div>

            <p className="mt-4 text-[12px] text-[#7a7a7a] tracking-tight text-center sm:text-left">
              AWS CUR 2.0 • Google Cloud • Microsoft Azure • Kubernetes
            </p>
          </div>

          {/* Pipeline Arrow Indicator */}
          <div className="hidden lg:flex items-center justify-center text-[#999999] px-1">
            <ArrowRight className="w-6 h-6 stroke-[1.75]" />
          </div>

          {/* Card 2: AI Providers + Compute */}
          <div
            className="w-full lg:w-1/2 rounded-[22px] border border-[#e0e0e0] bg-[#fafafc] p-6 sm:p-7 text-left apple-product-shadow"
            style={{ boxShadow: "rgba(0, 0, 0, 0.08) 0 4px 20px 0" }}
          >
            <div className="text-[12px] font-bold tracking-wider text-[#1d1d1f] uppercase mb-4">
              AI Providers + Compute
            </div>

            <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
              <div
                className="relative h-16 rounded-xl border border-[#e0e0e0] bg-[#ffffff] shadow-sm flex items-center justify-center text-[#1d1d1f] hover:border-[#0066cc] hover:shadow-md transition-all group cursor-pointer"
              >
                <OpenAiRosetteLogo className="w-6 h-6 group-hover:scale-105 transition-transform" />
                <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200 z-30 whitespace-nowrap bg-[#1d1d1f] text-[#ffffff] text-[10px] font-medium px-2 py-0.5 rounded-full shadow-lg border border-white/10">
                  OpenAI
                </span>
              </div>
              <div
                className="relative h-16 rounded-xl border border-[#e0e0e0] bg-[#ffffff] shadow-sm flex items-center justify-center text-[#1d1d1f] hover:border-[#0066cc] hover:shadow-md transition-all group cursor-pointer"
              >
                <AnthropicAiLogo className="w-7 h-7 group-hover:scale-105 transition-transform" />
                <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200 z-30 whitespace-nowrap bg-[#1d1d1f] text-[#ffffff] text-[10px] font-medium px-2 py-0.5 rounded-full shadow-lg border border-white/10">
                  Anthropic
                </span>
              </div>
              <div
                className="relative h-16 rounded-xl border border-[#e0e0e0] bg-[#ffffff] shadow-sm flex items-center justify-center text-[#1d1d1f] hover:border-[#0066cc] hover:shadow-md transition-all group cursor-pointer"
              >
                <VertexAiLogo className="w-6 h-6 group-hover:scale-105 transition-transform" />
                <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200 z-30 whitespace-nowrap bg-[#1d1d1f] text-[#ffffff] text-[10px] font-medium px-2 py-0.5 rounded-full shadow-lg border border-white/10">
                  Vertex AI
                </span>
              </div>
              <div
                className="relative h-16 rounded-xl border border-[#e0e0e0] bg-[#ffffff] shadow-sm flex items-center justify-center text-[#1d1d1f] hover:border-[#0066cc] hover:shadow-md transition-all group cursor-pointer"
              >
                <BedrockGlyphLogo className="w-6 h-6 group-hover:scale-105 transition-transform" />
                <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200 z-30 whitespace-nowrap bg-[#1d1d1f] text-[#ffffff] text-[10px] font-medium px-2 py-0.5 rounded-full shadow-lg border border-white/10">
                  Bedrock
                </span>
              </div>
              <div
                className="relative h-16 rounded-xl border border-[#e0e0e0] bg-[#ffffff] shadow-sm flex items-center justify-center text-[#1d1d1f] hover:border-[#0066cc] hover:shadow-md transition-all group cursor-pointer"
              >
                <NvidiaEyeLogo className="w-6 h-6 group-hover:scale-105 transition-transform" />
                <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-200 z-30 whitespace-nowrap bg-[#1d1d1f] text-[#ffffff] text-[10px] font-medium px-2 py-0.5 rounded-full shadow-lg border border-white/10">
                  NVIDIA
                </span>
              </div>
            </div>

            <p className="mt-4 text-[12px] text-[#7a7a7a] tracking-tight text-center sm:text-left">
              OpenAI • Anthropic • Vertex AI • Bedrock • GPUs
            </p>
          </div>
        </div>

        {/* Bottom Link */}
        <div className="mt-12 text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-[17px] font-normal text-[#0066cc] hover:underline"
          >
            <span>View all 18 supported multi-cloud &amp; AI integrations</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
