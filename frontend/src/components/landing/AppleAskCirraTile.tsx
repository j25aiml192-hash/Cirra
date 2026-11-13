"use client";

import * as React from "react";
import Image from "next/image";
import {
  Plus,
  ChevronDown,
  Mic,
  ArrowUp,
  Check,
} from "lucide-react";
import { AwsLogo, GcpCloudLogo, AzureBlockLogo, KubernetesWheelLogo, OpenAiRosetteLogo } from "@/components/ui/BrandLogos";

const PROMPT_SUGGESTIONS = [
  {
    chip: "Top cost drivers?",
    query: "Show total multi-cloud and AI foundation spend broken down by team and normalized unit cost.",
  },
  {
    chip: "Show savings opportunities",
    query: "Identify active reserved instances nearing expiration and recommend immediate right-sizing savings.",
  },
  {
    chip: "Compare AWS vs GCP",
    query: "Compare our AWS EC2 vs GCP Cloud Run cluster unit economics across production workloads.",
  },
  {
    chip: "Explain this spike",
    query: "Explain the unexpected $14,280 inference spike in Anthropic Claude 3.5 Sonnet cluster on Oct 22.",
  },
];

export function AppleAskCirraTile() {
  const [selectedPrompt, setSelectedPrompt] = React.useState(
    PROMPT_SUGGESTIONS[0]?.query ?? "Show total multi-cloud and AI foundation spend broken down by team and normalized unit cost."
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submittedMessage, setSubmittedMessage] = React.useState<string | null>(null);

  const [currentMode, setCurrentMode] = React.useState("Build");
  const [modeDropdownOpen, setModeDropdownOpen] = React.useState(false);
  const [currentModel, setCurrentModel] = React.useState("Fable 5");
  const [currentTier, setCurrentTier] = React.useState("High");
  const [modelDropdownOpen, setModelDropdownOpen] = React.useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setSubmittedMessage("Query parsed: Executing deterministic SQL on ClickHouse perimeters...");
    setTimeout(() => {
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <section id="ask" className="w-full relative overflow-hidden bg-gradient-to-b from-white via-15% via-[#EDF6FE] via-70% via-[#E5EFFD] to-[#E8F1FC] text-[#0A192F] pt-20 pb-24 lg:pt-28 lg:pb-32 px-4 sm:px-6 lg:px-8">
      {/* Top seamless cloud & gradient merge effect from previous white section */}
      <div className="absolute top-0 inset-x-0 h-36 pointer-events-none overflow-hidden z-10">
        <div className="w-full h-full bg-gradient-to-b from-white via-white/85 to-transparent" />
        <svg
          className="absolute -top-1 w-full h-24 text-white fill-current opacity-95"
          viewBox="0 0 1440 90"
          preserveAspectRatio="none"
        >
          <path d="M0,0 L1440,0 L1440,32 C1310,65 1190,28 1060,48 C920,70 800,24 670,54 C530,85 410,32 270,58 C160,80 70,38 0,52 Z" />
        </svg>
      </div>

      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-tr from-[#0062E0]/10 via-[#60A5FA]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/4 w-[600px] h-[300px] bg-white/70 blur-2xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 right-10 w-[500px] h-[260px] bg-white/60 blur-2xl rounded-full pointer-events-none" />

      {/* Bottom seamless merge effect into Specs section (#E8F1FC) */}
      <div className="absolute bottom-0 inset-x-0 h-36 pointer-events-none overflow-hidden z-10">
        <div className="w-full h-full bg-gradient-to-b from-transparent via-[#E8F1FC]/70 to-[#E8F1FC]" />
      </div>

      <div className="max-w-[1240px] mx-auto relative z-10">
        {/* Top Hero Layout: Left Content & Prompt, Right Mascot & HUD */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Column: Heading, Subtitle, Description, Search Box */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left">
           

            {/* Main Headline with pure black font */}
            <h1 className="text-[44px] sm:text-[56px] lg:text-[62px] font-extrabold tracking-[-0.03em] text-black leading-[1.05]">
              Ask <span className="text-black">Cirra.</span>
            </h1>

            {/* Sub-headline with pure black font */}
            <h2 className="text-[24px] sm:text-[30px] lg:text-[32px] font-bold tracking-tight text-black mt-2.5 leading-[1.18]">
              Deterministic FinOps intelligence.
            </h2>

            {/* Body Copy with pure black font */}
            <p className="mt-4 text-[16px] sm:text-[17px] text-black font-medium leading-relaxed max-w-xl">
              Ask natural questions about cloud bills, token surges, or customer gross margins. Numbers come from your data, never from the LLM.
            </p>

            {/* Pure Black AI Prompt Box */}
            <div className="mt-8 bg-black text-white rounded-[22px] border border-neutral-800 p-4 sm:p-5 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl relative">
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Textarea Input with Image 1 placeholder */}
                <div className="min-h-[58px]">
                  <textarea
                    rows={2}
                    value={selectedPrompt}
                    onChange={(e) => setSelectedPrompt(e.target.value)}
                    placeholder="Plan, Build, Automate / @ for context"
                    className="w-full bg-transparent text-[15px] sm:text-[16px] text-white placeholder-neutral-400 resize-none border-none outline-none p-0 focus:ring-0 leading-relaxed font-normal selection:bg-[#0062E0] selection:text-white"
                  />
                </div>

                {/* Submitting Status Banner */}
                {submittedMessage && (
                  <div className="text-xs text-[#60A5FA] bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800 flex items-center gap-1.5 animate-fadeIn">
                    <span className="w-2 h-2 rounded-full bg-[#60A5FA] animate-pulse" />
                    {submittedMessage}
                  </div>
                )}

                {/* Bottom Toolbar Row */}
                <div className="flex items-center justify-between pt-1 border-t border-neutral-800">
                  {/* Left Controls */}
                  <div className="flex items-center gap-2">
                    {/* Plus Button */}
                    <button
                      type="button"
                      onClick={() => setAttachMenuOpen(!attachMenuOpen)}
                      className="w-8 h-8 rounded-full bg-[#1C1C1C] hover:bg-[#2C2C2C] text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-neutral-800/80"
                      title="Attach context or resource"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    {/* Mode Selector Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setModeDropdownOpen(!modeDropdownOpen);
                          setModelDropdownOpen(false);
                        }}
                        className="h-8 px-3.5 rounded-full bg-[#1C1C1C] hover:bg-[#2C2C2C] text-white flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer border border-neutral-800/80"
                      >
                        <span>{currentMode}</span>
                        <ChevronDown className="w-3 h-3 text-neutral-400" />
                      </button>

                      {/* Dropdown Menu */}
                      {modeDropdownOpen && (
                        <div className="absolute left-0 bottom-10 w-36 bg-[#181818] border border-neutral-700 rounded-xl shadow-2xl py-1 z-30 animate-fadeIn">
                          {["Build", "Analyze", "Audit", "Forecast"].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setCurrentMode(m);
                                setModeDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-neutral-800 transition-colors ${
                                currentMode === m ? "text-white font-semibold" : "text-neutral-400"
                              }`}
                            >
                              <span>{m}</span>
                              {currentMode === m && <Check className="w-3.5 h-3.5 text-[#60A5FA]" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Model Pill Button: Coral Starburst + Fable 5 High */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setModelDropdownOpen(!modelDropdownOpen);
                          setModeDropdownOpen(false);
                        }}
                        className="h-8 px-3 rounded-full bg-[#1C1C1C] hover:bg-[#2C2C2C] text-white flex items-center gap-1.5 text-xs transition-colors cursor-pointer border border-neutral-800/80"
                      >
                        {/* Coral Starburst Glyph */}
                        <svg className="w-3.5 h-3.5 text-[#F97316] shrink-0" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 1a.75.75 0 0 1 .75.75v3.44l2.432-2.433a.75.75 0 1 1 1.06 1.061L9.81 6.25h3.44a.75.75 0 0 1 0 1.5h-3.44l2.432 2.432a.75.75 0 1 1-1.06 1.06L8.75 8.81v3.44a.75.75 0 0 1-1.5 0V8.81L4.818 11.24a.75.75 0 1 1-1.06-1.06L6.19 7.75H2.75a.75.75 0 0 1 0-1.5h3.44L3.757 3.818a.75.75 0 0 1 1.06-1.06L7.25 5.19V1.75A.75.75 0 0 1 8 1z" />
                        </svg>
                        <span className="font-semibold text-white">{currentModel}</span>
                        <span className="text-neutral-400 font-normal">{currentTier}</span>
                        <ChevronDown className="w-3 h-3 text-neutral-400 ml-0.5" />
                      </button>

                      {/* Dropdown Menu */}
                      {modelDropdownOpen && (
                        <div className="absolute left-0 bottom-10 w-52 bg-[#181818] border border-neutral-700 rounded-xl shadow-2xl py-1 z-30 animate-fadeIn">
                          {[
                            { name: "Fable 5", tier: "High" },
                            { name: "Claude 3.5", tier: "Sonnet" },
                            { name: "GPT-4o", tier: "Omni" },
                            { name: "Cirra RLS", tier: "Deterministic" },
                          ].map((item) => (
                            <button
                              key={item.name}
                              type="button"
                              onClick={() => {
                                setCurrentModel(item.name);
                                setCurrentTier(item.tier);
                                setModelDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-neutral-800 transition-colors ${
                                currentModel === item.name ? "text-white font-semibold" : "text-neutral-400"
                              }`}
                            >
                              <span>{item.name} <span className="text-neutral-500">({item.tier})</span></span>
                              {currentModel === item.name && <Check className="w-3.5 h-3.5 text-[#60A5FA]" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Controls */}
                  <div className="flex items-center gap-2">
                    {/* Microphone Button */}
                    <button
                      type="button"
                      onClick={() => setIsListening(!isListening)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                        isListening
                          ? "bg-[#EF4444] text-white animate-pulse"
                          : "bg-[#1C1C1C] hover:bg-[#2C2C2C] text-neutral-300 hover:text-white border border-neutral-800/80"
                      }`}
                      title={isListening ? "Listening... click to stop" : "Voice input"}
                    >
                      <Mic className="w-4 h-4" />
                    </button>

                    {/* Up Arrow Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-8 h-8 rounded-full bg-[#1C1C1C] hover:bg-neutral-700 text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 group border border-neutral-800/80"
                      title="Run query"
                    >
                      <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Quick-suggest Prompt Chips with black font */}
            <div className="flex flex-wrap items-center gap-2 mt-3.5">
              {PROMPT_SUGGESTIONS.map((item, idx) => {
                const isActive = selectedPrompt === item.query;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedPrompt(item.query);
                      setSubmittedMessage(null);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-black text-white border border-black shadow-sm"
                        : "bg-white/95 text-black border border-neutral-300 hover:bg-neutral-100 shadow-xs"
                    }`}
                  >
                    {item.chip}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Multi-Cloud Engine Architecture & Floating HUD Cards */}
          <div className="lg:col-span-5 relative flex items-center justify-center min-h-[460px] sm:min-h-[520px]">
            {/* Center Architecture Visual with Ambient Light Halo */}
            <div className="relative w-full max-w-[460px] flex items-center justify-center">
              {/* Outer Glow Ring */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#60A5FA]/20 via-[#0062E0]/15 to-transparent rounded-full blur-2xl transform scale-95" />
              
              {/* Architecture Render Container with smooth border */}
              <div className="relative w-full aspect-[807/596] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,98,224,0.18)] border border-white/80 bg-white/70 backdrop-blur-sm">
                <Image
                  src="/images/ask_cirra_architecture.png"
                  alt="Cirra Multi-Cloud FinOps Engine Architecture"
                  fill
                  priority
                  className="object-cover object-center transform hover:scale-105 transition-transform duration-700"
                />
                {/* Subtle soft gradient overlay to merge naturally */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#E2EFFD]/30 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>

            {/* HUD Widget 1: Top-Left "Multi-Cloud Spend" Card */}
            <div className="absolute top-2 -left-2 sm:-left-6 bg-white/95 backdrop-blur-md rounded-xl p-3 sm:p-3.5 shadow-[0_8px_24px_rgba(10,25,47,0.08)] border border-[#DCE8F8] z-20 min-w-[145px] sm:min-w-[160px] transform hover:-translate-y-1 transition-transform">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#64748B]">
                <span className="w-2 h-2 rounded-full bg-black" />
                Multi-Cloud Spend
              </div>
              <div className="text-[19px] sm:text-[21px] font-bold text-[#0A192F] mt-1">
                $42,380
              </div>
              {/* Mini Sparkline Bar Chart */}
              <div className="flex items-end gap-1 h-7 mt-2 pt-1 border-t border-[#F1F5F9]">
                <span className="w-2.5 bg-[#484b4eff] rounded-t-sm h-[40%]" />
                <span className="w-2.5 bg-[#1a1d20ff] rounded-t-sm h-[65%]" />
                <span className="w-2.5 bg-[#303030ff] rounded-t-sm h-[50%]" />
                <span className="w-2.5 bg-[#0a0b0cff] rounded-t-sm h-[85%]" />
                <span className="w-2.5 bg-[#131314ff] rounded-t-sm h-[70%]" />
                <span className="w-2.5 bg-[#202122ff] rounded-t-sm h-[95%]" />
                <span className="w-2.5 bg-[#252627ff] rounded-t-sm h-[60%]" />
              </div>
            </div>

            {/* HUD Widget 2: Top-Right Speech Bubble */}
            <div className="absolute -top-6 right-0 sm:-right-4 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 shadow-[0_10px_28px_rgba(10,25,47,0.08)] border border-[#DCE8F8] z-20 max-w-[210px] text-left transform hover:-translate-y-1 transition-transform">
              <div className="text-[13px] font-bold text-[#0A192F]">
                Hi! I&apos;m Cirra
              </div>
              <div className="text-[11px] text-[#64748B] mt-1 leading-snug">
                I analyze your cloud &amp; AI spend with deterministic answers from your data.
              </div>
            </div>

            {/* HUD Widget 3: Far-Right Vertical Provider Rail */}
            <div className="absolute top-1/2 -translate-y-1/2 -right-3 sm:-right-8 bg-white/95 backdrop-blur-md rounded-2xl p-2 sm:p-2.5 shadow-[0_10px_30px_rgba(10,25,47,0.09)] border border-[#DCE8F8] z-20 flex flex-col items-center gap-3.5 transform hover:-translate-x-1 transition-transform">
              <div className="p-1.5 rounded-lg hover:bg-[#F1F6FD] transition-colors" title="AWS">
                <AwsLogo className="w-6 h-6" />
              </div>
              <div className="p-1.5 rounded-lg hover:bg-[#F1F6FD] transition-colors" title="Google Cloud">
                <GcpCloudLogo className="w-6 h-6" />
              </div>
              <div className="p-1.5 rounded-lg hover:bg-[#F1F6FD] transition-colors" title="Microsoft Azure">
                <AzureBlockLogo className="w-6 h-6" />
              </div>
              <div className="p-1.5 rounded-lg hover:bg-[#F1F6FD] transition-colors" title="Kubernetes">
                <KubernetesWheelLogo className="w-6 h-6" />
              </div>
              <div className="p-1.5 rounded-lg hover:bg-[#F1F6FD] transition-colors" title="OpenAI">
                <OpenAiRosetteLogo className="w-6 h-6" />
              </div>
            </div>

            {/* HUD Widget 4: Bottom-Right "Savings Opportunity" Card */}
            <div className="absolute -bottom-4 right-2 sm:right-6 bg-white/95 backdrop-blur-md rounded-xl p-3 sm:p-3.5 shadow-[0_10px_28px_rgba(10,25,47,0.08)] border border-[#DCE8F8] z-20 min-w-[170px] text-left transform hover:-translate-y-1 transition-transform">
              <div className="text-[11px] font-medium text-[#64748B]">
                Savings Opportunity
              </div>
              <div className="flex items-center justify-between gap-3 mt-1.5">
                {/* Sparkline curve */}
                <svg className="w-16 h-5 stroke-[#10B981] fill-none" viewBox="0 0 64 20">
                  <path d="M2 14 Q 16 4, 30 15 T 62 6" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <div className="flex items-center gap-0.5 text-xs font-bold text-[#10B981]">
                  <span>↓</span> 28%
                </div>
              </div>
              <div className="text-[12px] font-semibold text-[#0A192F] mt-1">
                -$12,450 / month
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
