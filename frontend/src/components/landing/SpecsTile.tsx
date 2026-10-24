"use client";

import * as React from "react";
import Link from "next/link";

export function SpecsTile() {
  const specs = [
    {
      category: "Schema Standard",
      detail:
        "FinOps Open Cost and Usage Specification (FOCUS 1.0) normalized across AWS, GCP, Azure, and LLM foundations.",
    },
    {
      category: "Sentinel Engine",
      detail:
        "Statistical drift detection with 15-minute granularity, adaptive seasonal baselines, and automated emergency kill-switches.",
    },
    {
      category: "Tenant Isolation",
      detail:
        "PostgreSQL 15 Row-Level Security (RLS) strictly enforced via dedicated non-superuser application roles. Zero cross-tenant data leakage.",
    },
    {
      category: "Credential Security",
      detail:
        "Envelope encrypted at rest using AES-256-GCM with 32-byte master key derivation. Raw credentials are never exposed via API endpoints.",
    },
    {
      category: "Action Orchestration",
      detail:
        "Temporal-backed deterministic workflows with pre-execution dry-run simulations, Pull Request cost comments, and 1-click rollback.",
    },
    {
      category: "Query Performance",
      detail:
        "Sub-25ms deterministic aggregations across tens of millions of billing facts powered by ClickHouse columnar storage.",
    },
  ];

  return (
    <section id="specs" className="w-full bg-[#E8F1FC] text-[#0A192F] py-24 px-4 sm:px-6 scroll-mt-20">
      <div className="max-w-[860px] mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-[36px] sm:text-[40px] font-semibold tracking-[-0.022em] text-[#0A192F] leading-[1.10]">
            Enterprise-grade by design.
          </h2>
          <p className="mt-3 text-[17px] font-normal text-[#475569] tracking-[-0.015em] leading-[1.47]">
            Built from day one for platform engineering, security auditability, and finance rigor.
          </p>
        </div>

        {/* Apple Configurator Specs Table */}
        <div className="divide-y divide-[#D6E4F5] border-t border-b border-[#D6E4F5]">
          {specs.map((spec, i) => (
            <div key={i} className="py-6 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-8 items-start">
              <span className="md:col-span-4 text-[17px] font-semibold text-[#0A192F] tracking-[-0.015em]">
                {spec.category}
              </span>
              <span className="md:col-span-8 text-[17px] font-normal text-[#475569] leading-[1.47] tracking-[-0.015em]">
                {spec.detail}
              </span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="mt-12 text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center text-[17px] font-medium text-white bg-[#0062E0] hover:bg-[#0052C2] px-6 py-2.5 rounded-full apple-btn-active transition-all"
          >
            Launch Console Demo
          </Link>
        </div>
      </div>
    </section>
  );
}
