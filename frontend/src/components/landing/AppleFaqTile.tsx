"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

export function AppleFaqTile() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  const faqs = [
    {
      q: "Do you need write access to my cloud?",
      a: "No. Cirra functions entirely on read-only cross-account IAM roles for AWS, read-only BigQuery Service Account keys for GCP, and read-only usage keys for AI providers. Write access is only requested if you explicitly opt-in to Action Center automated rightsizing, and even then, every action requires explicit human approval.",
    },
    {
      q: "Does Cirra see my prompts?",
      a: "No. Cirra's lightweight telemetry gateway and SDK wrappers only log metadata: token counts (prompt vs completion), model name, tenant ID, and latency. We never inspect, log, or store prompt text or completion payloads.",
    },
    {
      q: "How long until I see data?",
      a: "Within 5 to 10 minutes after connecting your cloud billing export or AI admin key. Cirra immediately begins ingesting your historical billing data, normalizes it into FOCUS 1.0 format, and surfaces immediate waste findings.",
    },
    {
      q: "Which providers are supported?",
      a: "Cirra currently supports AWS (CUR 2.0, CloudWatch), Google Cloud (BigQuery Billing, GKE), Microsoft Azure, Kubernetes (via OpenCost), OpenAI, Anthropic Claude, Amazon Bedrock, and Google Cloud Vertex AI.",
    },
    {
      q: "Can I self-host?",
      a: "Yes. For teams with strict data sovereignty or compliance needs, Cirra Private can be deployed directly inside your own AWS or GCP VPC using our official Helm charts or Terraform modules, with local LLM integration for Ask Cirra.",
    },
    {
      q: "How is this different from the AWS Cost Explorer?",
      a: "AWS Cost Explorer only covers AWS, arrives 24 to 48 hours late, doesn't know about your OpenAI or Anthropic API keys, cannot attribute token costs to customer tenants, and doesn't offer human-in-the-loop remediation dry-runs or PR cost diffs.",
    },
  ];

  return (
    <section id="faq" className="w-full bg-[#f5f5f7] text-[#1d1d1f] py-24 px-4 sm:px-6">
      <div className="max-w-[860px] mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-[36px] sm:text-[40px] font-semibold tracking-[-0.022em] text-[#1d1d1f] leading-[1.10]">
            Frequently Asked Questions.
          </h2>
          <p className="mt-3 text-[17px] font-normal text-[#7a7a7a] tracking-[-0.015em] leading-[1.47]">
            Architecture, zero-trust security, and integration answers.
          </p>
        </div>

        <div className="divide-y divide-[#e0e0e0] border-t border-b border-[#e0e0e0]">
          {faqs.map((item, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div key={idx} className="py-5">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left text-[17px] font-semibold text-[#1d1d1f] hover:text-[#0066cc] transition-colors"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#7a7a7a] transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-[#0066cc]" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-3 text-[15px] text-[#474749] leading-[1.47] pr-8">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
