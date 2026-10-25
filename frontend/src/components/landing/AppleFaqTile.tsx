"use client";

import * as React from "react";
import { ShieldCheck, Lock, Zap, Globe, Server, BarChart3 } from "lucide-react";
import { FaqAccordion, FAQItem } from "@/components/ui/faq-chat-accordion";

const cirraFaqData: FAQItem[] = [
  {
    id: 1,
    question: "Do you need write access to my cloud?",
    answer:
      "No. Cirra functions entirely on read-only cross-account IAM roles for AWS, read-only BigQuery Service Account keys for GCP, and read-only usage keys for AI providers. Write access is only requested if you explicitly opt-in to Action Center automated rightsizing, and even then, every action requires explicit human approval.",
    icon: <ShieldCheck className="w-4 h-4" />,
  },
  {
    id: 2,
    question: "Does Cirra see my prompt payloads?",
    answer:
      "No. Cirra's lightweight telemetry gateway and SDK wrappers only log metadata: token counts (prompt vs completion), model name, tenant ID, and latency. We never inspect, log, or store prompt text or completion payloads.",
    icon: <Lock className="w-4 h-4" />,
  },
  {
    id: 3,
    question: "How long until I see live cost data?",
    answer:
      "Within 5 to 10 minutes after connecting your cloud billing export or AI admin key. Cirra immediately begins ingesting your historical billing data, normalizes it into FOCUS 1.0 format, and surfaces immediate waste findings.",
    icon: <Zap className="w-4 h-4" />,
  },
  {
    id: 4,
    question: "Which cloud & AI providers are supported?",
    answer:
      "Cirra currently supports AWS (CUR 2.0, CloudWatch), Google Cloud (BigQuery Billing, GKE), Microsoft Azure, Kubernetes (via OpenCost), OpenAI, Anthropic Claude, Amazon Bedrock, and Google Cloud Vertex AI.",
    icon: <Globe className="w-4 h-4" />,
  },
  {
    id: 5,
    question: "Can Cirra be self-hosted in our VPC?",
    answer:
      "Yes. For teams with strict data sovereignty or compliance needs, Cirra Private can be deployed directly inside your own AWS or GCP VPC using our official Helm charts or Terraform modules, with local LLM integration for Ask Cirra.",
    icon: <Server className="w-4 h-4" />,
  },
  {
    id: 6,
    question: "How is Cirra different from AWS Cost Explorer?",
    answer:
      "AWS Cost Explorer only covers AWS, arrives 24 to 48 hours late, doesn't know about your OpenAI or Anthropic API keys, cannot attribute token costs to customer tenants, and doesn't offer human-in-the-loop remediation dry-runs or PR cost diffs.",
    icon: <BarChart3 className="w-4 h-4" />,
  },
];

export function AppleFaqTile() {
  return (
    <section id="faq" className="w-full bg-[#F1F6FD] text-[#0A192F] py-24 px-4 sm:px-6 scroll-mt-20">
      <div className="max-w-[840px] mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-[36px] sm:text-[46px] font-extrabold tracking-tight text-[#0A192F] leading-[1.08]">
            Frequently Asked Questions.
          </h2>
          <p className="mt-3 text-[17px] font-normal text-[#475569] tracking-[-0.015em] leading-[1.47] max-w-xl mx-auto">
            Architecture, zero-trust security, and integration answers.
          </p>
        </div>

        {/* FaqAccordion Component with Chat Bubble Layout */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-[#D6E4F5] p-5 sm:p-10 shadow-[0_4px_24px_-4px_rgba(12,48,96,0.06)]">
          <FaqAccordion data={cirraFaqData} />
        </div>
      </div>
    </section>
  );
}
