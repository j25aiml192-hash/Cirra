"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import GlyphSonar from "@/components/ui/GlyphSonar";

export function AppleAuditTile() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = email ? `?email=${encodeURIComponent(email)}` : "";
    router.push(`/signup${query}`);
  };

  return (
    <section className="w-full relative overflow-hidden bg-[#050B18] text-white py-24 sm:py-32 px-4 sm:px-6">
      {/* Animated Glyph Sonar Background matching Sentinel Section */}
      <GlyphSonar
        theme="dark-blue"
        backgroundColor="#050B18"
        glyphCount={75}
        showRings={true}
        showSweep={true}
      />

      {/* Soft gradient ambient glow accents matching Sentinel */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[450px] bg-gradient-to-tr from-[#0062E0]/15 via-[#38BDF8]/10 to-transparent rounded-full blur-3xl pointer-events-none z-0" />

      <div className="max-w-[880px] mx-auto text-center relative z-10">
        <h2 className="text-[36px] sm:text-[46px] font-extrabold tracking-tight text-white leading-[1.08]">
          Run your free 5-minute cost audit.
        </h2>

        <p className="mt-3 text-[22px] sm:text-[28px] font-medium tracking-tight text-[#E2EDF8] leading-[1.15]">
          Top 10 waste items. Zero agent overhead.
        </p>

        <p className="mt-4 text-[16px] sm:text-[17px] font-normal text-[#94A3B8] tracking-[-0.015em] max-w-xl mx-auto leading-relaxed">
          Connect read-only credentials to uncover runaway batch jobs, idle disks, and unallocated LLM tokens before your next invoice.
        </p>

        {/* Deliverables */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[14px] text-[#CBD5E1]">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#38BDF8]" />
            Top 10 highest-impact idle waste items
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#38BDF8]" />
            AI spend by key and foundation model
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#38BDF8]" />
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
            className="w-full sm:flex-1 h-[46px] px-5 rounded-full border border-[#1E2E4A] bg-[#0A162B]/90 backdrop-blur-md text-[15px] text-white placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0062E0]/40 focus:border-[#0062E0] transition-all shadow-inner"
          />
          <button
            type="submit"
            className="w-full sm:w-auto h-[46px] px-7 rounded-full text-[15px] font-semibold text-white bg-[#0062E0] hover:bg-[#0052C2] hover:scale-105 active:scale-95 shadow-[0_0_24px_rgba(0,98,224,0.45)] hover:shadow-[0_0_32px_rgba(0,98,224,0.65)] transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Run free audit</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </form>

        <p className="mt-4 text-[12px] text-[#64748B]">
          100% read-only access • Zero credit card required • Connect in under 5 minutes
        </p>
      </div>
    </section>
  );
}
