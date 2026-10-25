"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
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

import { ConnectorsCardStack } from "@/components/ui/ConnectorsCardStack";
import { RibbonType } from "@/components/ui/RibbonType";

const connectorGroups = [
  {
    title: "Cloud Infrastructure",
    gridCols: "grid-cols-4",
    providers: [
      { name: "AWS", Logo: AwsLogo },
      { name: "Google Cloud", Logo: GcpCloudLogo },
      { name: "Microsoft Azure", Logo: AzureBlockLogo },
      { name: "Kubernetes", Logo: KubernetesWheelLogo },
    ],
  },
  {
    title: "AI Providers + Compute",
    gridCols: "grid-cols-5",
    providers: [
      { name: "OpenAI", Logo: OpenAiRosetteLogo },
      { name: "Anthropic", Logo: AnthropicAiLogo },
      { name: "Vertex AI", Logo: VertexAiLogo },
      { name: "Bedrock", Logo: BedrockGlyphLogo },
      { name: "NVIDIA", Logo: NvidiaEyeLogo },
    ],
  },
];

export function ConnectorsGrid() {
  return (
    <section
      id="connectors"
      className="w-full bg-white text-[#0A192F] py-20 sm:py-24 px-4 sm:px-6 lg:px-8 scroll-mt-20"
    >
      <div className="max-w-[1240px] mx-auto">
        {/* Top Header & Provider Boxes: Side-by-Side Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-12 sm:mb-16">
          {/* Left Column: Title & Subtitle */}
          <div className="lg:col-span-5 text-left">
            <h2 className="text-[36px] sm:text-[42px] lg:text-[46px] font-semibold tracking-[-0.025em] text-[#0A192F] leading-[1.08]">
              Connect your infrastructure.
            </h2>
            <p className="mt-4 text-[16px] sm:text-[17px] font-normal text-[#475569] tracking-[-0.012em] leading-[1.5]">
              Read-only cross-account IAM. Zero agent overhead. Never accesses
              customer application data or prompt payloads.
            </p>
          </div>

          {/* Right Column: Two Provider Boxes */}
          <div className="lg:col-span-7 flex flex-col sm:flex-row items-center gap-4 sm:gap-5 w-full">
            {connectorGroups.map((group, index) => (
              <React.Fragment key={group.title}>
                {index > 0 && (
                  <div
                    className="hidden sm:flex items-center justify-center text-[#5F86A6] shrink-0"
                    aria-hidden="true"
                  >
                    <ArrowRight className="w-5 h-5 stroke-[2]" />
                  </div>
                )}
                <div className="w-full sm:w-1/2 rounded-[22px] border border-[#4D7392] bg-[#5F86A6] p-3.5 sm:p-4 shadow-[0_12px_36px_-8px_rgba(95,134,166,0.30)] text-white">
                  <div className={`grid ${group.gridCols} gap-2.5`}>
                    {group.providers.map(({ name, Logo }) => (
                      <div
                        key={name}
                        role="img"
                        aria-label={name}
                        title={name}
                        className="h-14 rounded-xl border border-white/20 bg-white shadow-xs flex items-center justify-center text-[#0A192F] hover:scale-105 hover:shadow-md transition-all"
                      >
                        <Logo className="w-7 h-7" />
                      </div>
                    ))}
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Interactive 3D Stacked / Swipeable Card Carousel with Flowing Ribbon behind */}
        <div className="relative mt-8 sm:mt-10 overflow-visible">
          {/* Flowing Ribbon behind the cards */}
          <div className="absolute -inset-x-12 -top-20 -bottom-16 pointer-events-none z-0 overflow-hidden">
            <RibbonType
              speed={0.85}
              width={76}
              amplitude={46}
              ribbonColor="rgba(10, 25, 47, 0.90)"
              accentColor="rgba(0, 98, 224, 0.75)"
              textColor="rgba(255, 255, 255, 0.80)"
            />
          </div>

          <div className="relative z-10">
            <ConnectorsCardStack />
          </div>
        </div>
      </div>
    </section>
  );
}
