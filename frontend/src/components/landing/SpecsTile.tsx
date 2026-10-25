"use client";

import * as React from "react";
import { Accordion05, Accordion05Item } from "@/components/ui/accordion-05";

const specItems: Accordion05Item[] = [
  {
    id: "01",
    title: "Schema Standard",
    content:
      "FinOps Open Cost and Usage Specification (FOCUS 1.0) normalized across AWS, GCP, Azure, and LLM foundations.",
  },
  {
    id: "02",
    title: "Sentinel Engine",
    content:
      "Statistical drift detection with 15-minute granularity, adaptive seasonal baselines, and automated emergency kill-switches.",
  },
  {
    id: "03",
    title: "Tenant Isolation",
    content:
      "PostgreSQL 15 Row-Level Security (RLS) strictly enforced via dedicated non-superuser application roles. Zero cross-tenant data leakage.",
  },
  {
    id: "04",
    title: "Credential Security",
    content:
      "Envelope encrypted at rest using AES-256-GCM with 32-byte master key derivation. Raw credentials are never exposed via API endpoints.",
  },
  {
    id: "05",
    title: "Action Orchestration",
    content:
      "Temporal-backed deterministic workflows with pre-execution dry-run simulations, Pull Request cost comments, and 1-click rollback.",
  },
  {
    id: "06",
    title: "Query Performance",
    content:
      "Sub-25ms deterministic aggregations across tens of millions of billing facts powered by ClickHouse columnar storage.",
  },
];

export function SpecsTile() {
  return (
    <section id="specs" className="w-full bg-[#E8F1FC] text-[#0A192F] py-20 px-4 sm:px-6 scroll-mt-20">
      <div className="max-w-[840px] mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-[32px] sm:text-[46px] font-extrabold tracking-tight text-[#0A192F] leading-[1.10]">
            Enterprise-grade by design.
          </h2>
          <p className="mt-3 text-[16px] sm:text-[17px] font-normal text-[#475569] tracking-[-0.015em] leading-[1.47] max-w-xl mx-auto">
            Built from day one for platform engineering, security auditability, and finance rigor.
          </p>
        </div>
        <br />
        {/* Interactive Accordion05 Component */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#D6E4F5] p-5 sm:p-8 shadow-[0_4px_24px_-4px_rgba(12,48,96,0.06)]">
          <Accordion05 items={specItems} defaultValue="01" />
        </div>
      </div>
    </section>
  );
}
