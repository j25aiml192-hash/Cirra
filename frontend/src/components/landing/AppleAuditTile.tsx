"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function AppleAuditTile() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = email ? `?email=${encodeURIComponent(email)}` : "";
    router.push(`/signup${query}`);
  };

  return (
    <section className="w-full bg-[#ffffff] text-[#1d1d1f] py-24 px-4 sm:px-6">
      <div className="max-w-[860px] mx-auto text-center">
        <h2 className="text-[36px] sm:text-[40px] font-semibold tracking-[-0.022em] text-[#1d1d1f] leading-[1.10]">
          Run your free 5-minute cost audit.
        </h2>

        <p className="mt-2 text-[22px] sm:text-[28px] font-normal tracking-[0.007em] text-[#1d1d1f] leading-[1.14]">
          Top 10 waste items. Zero agent overhead.
        </p>

        <p className="mt-3 text-[17px] font-normal text-[#7a7a7a] tracking-[-0.015em] max-w-xl mx-auto leading-[1.47]">
          Connect read-only credentials to uncover runaway batch jobs, idle disks, and unallocated LLM tokens before your next invoice.
        </p>

        {/* Deliverables */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[14px] text-[#1d1d1f]">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0066cc]" />
            Top 10 highest-impact idle waste items
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0066cc]" />
            AI spend by key and foundation model
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0066cc]" />
            Untagged &amp; unallocated spend percentage
          </span>
        </div>

        {/* Search-input grammar (Pill-shaped input with blue pill button) */}
        <form
          onSubmit={handleSubmit}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto"
        >
          <input
            type="email"
            required
            placeholder="Enter work email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full sm:flex-1 h-[44px] px-5 rounded-full border border-black/10 bg-[#ffffff] text-[15px] text-[#1d1d1f] placeholder-[#7a7a7a] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
          />
          <button
            type="submit"
            className="w-full sm:w-auto h-[44px] px-6 rounded-full text-[15px] font-normal text-[#ffffff] bg-[#0066cc] hover:bg-[#0071e3] apple-btn-active transition-all flex items-center justify-center gap-1.5"
          >
            <span>Run free audit</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="mt-4 text-[12px] text-[#7a7a7a]">
          100% read-only access • Zero credit card required • Connect in under 5 minutes
        </p>
      </div>
    </section>
  );
}
