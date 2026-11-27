"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Eye,
  X,
  ShieldAlert,
  CheckCircle,
  Search,
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import {
  ChalkAnomalyIcon,
  ChalkShieldIcon,
  ChalkCheckCircleIcon,
  ChalkClockIcon,
} from "@/components/ui/chalk-icons";
import { Topbar } from "@/components/layout/Topbar";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProviderLogo } from "@/components/ui/provider-logos";
import { formatNumber, cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useAnomalies, useAcknowledgeAnomaly, useResolveAnomaly } from "@/hooks/useAnomalies";
import type { Anomaly } from "@/types";

export default function AnomaliesPage() {
  const { data: rawAnomalies, isLoading } = useAnomalies("open");
  const acknowledgeMutation = useAcknowledgeAnomaly();
  const resolveMutation = useResolveAnomaly();

  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [killSwitchTarget, setKillSwitchTarget] = useState<Anomaly | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isProposing, setIsProposing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<"all" | "killswitch" | "critical" | "high">("all");

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const anomalies: Anomaly[] = useMemo(() => {
    return (rawAnomalies ?? []).map((raw) => {
      const summary =
        typeof raw.explanation === "string"
          ? raw.explanation
          : raw.explanation?.summary ??
          `Spend deviation detected on ${raw.series_key}`;
      const root_cause =
        typeof raw.explanation === "string"
          ? raw.explanation
          : raw.explanation?.root_cause ?? summary;

      const formattedDate = raw.detected_at?.includes("T")
        ? new Date(raw.detected_at).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        })
        : raw.detected_at;

      return {
        ...raw,
        serviceName:
          raw.serviceName ||
          (raw.provider
            ? `${raw.provider.toUpperCase()} · ${raw.series_key}`
            : raw.series_key),
        surgePercent:
          raw.surgePercent ||
          (raw.deviation_pct != null
            ? `+${Math.round(Number(raw.deviation_pct))}%`
            : "+0%"),
        currentCost:
          raw.currentCost ??
          (raw.actual_value != null ? Number(raw.actual_value) : 0),
        expectedCost:
          raw.expectedCost ??
          (raw.baseline_value != null ? Number(raw.baseline_value) : 0),
        detected_at: formattedDate,
        explanation: { summary, root_cause },
      };
    });
  }, [rawAnomalies]);

  const filteredAnomalies = useMemo(() => {
    return anomalies.filter((a) => {
      const isCritical = a.severity === "critical";
      const isHigh = a.severity === "high";
      const hasKillSwitch = a.status === "open" && (isHigh || isCritical);

      if (severityFilter === "killswitch" && !hasKillSwitch) return false;
      if (severityFilter === "critical" && a.severity?.toLowerCase() !== "critical") return false;
      if (severityFilter === "high" && a.severity?.toLowerCase() !== "high") return false;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (a.serviceName || "").toLowerCase().includes(q) ||
        (a.provider || "").toLowerCase().includes(q) ||
        (a.series_key || "").toLowerCase().includes(q) ||
        (typeof a.explanation === "string"
          ? a.explanation.toLowerCase().includes(q)
          : (a.explanation?.summary || "").toLowerCase().includes(q));

      return matchesSearch;
    });
  }, [anomalies, severityFilter, searchQuery]);

  const handleDismiss = async (id: string) => {
    try {
      await acknowledgeMutation.mutateAsync(id);
      setToastMessage("Alert dismissed");
    } catch {
      // Ignore
    }
    if (selectedAnomaly?.id === id) {
      setSelectedAnomaly(null);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await resolveMutation.mutateAsync(id);
      setToastMessage("Anomaly marked as resolved");
    } catch {
      // Ignore
    }
    if (selectedAnomaly?.id === id) {
      setSelectedAnomaly(null);
    }
  };

  const handleConfirmKillSwitch = async () => {
    if (!killSwitchTarget) return;
    setIsProposing(true);
    try {
      await apiFetch("/api/v1/actions/propose", {
        method: "POST",
        body: JSON.stringify({
          anomaly_id: killSwitchTarget.id,
          action_type: "kill_switch",
          provider: killSwitchTarget.provider,
          target_key_id: killSwitchTarget.api_key_id,
        }),
      });
    } catch (err) {
      console.warn("Kill switch propose request:", err);
    } finally {
      setIsProposing(false);
      setKillSwitchTarget(null);
      setToastMessage("Kill switch proposed — awaiting your approval in Savings tab");
    }
  };

  const criticalCount = anomalies.filter((a) => a.severity === "critical").length;
  const highCount = anomalies.filter((a) => a.severity === "high").length;
  const killSwitchCount = anomalies.filter(
    (a) => a.status === "open" && (a.severity === "critical" || a.severity === "high")
  ).length;

  /* ─────────────────────────────────────────────────────────────────────────
     TELEMETRY SUMMARY PANEL (CLASSY DARK THEME)
  ───────────────────────────────────────────────────────────────────────── */
  const TelemetryCardsPanel = (
    <div className="sticky top-6 rounded-2xl bg-[#09090b]/95 border border-zinc-800/90 shadow-2xl p-5 sm:p-6 space-y-5 text-white backdrop-blur-xl">
      <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
            Telemetry Overview
          </span>
          <p className="text-[11px] text-zinc-400 mt-0.5 font-sans">
            Click any row or View Details to inspect its incident brief
          </p>
        </div>
        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          LIVE SENTINEL
        </span>
      </div>

      {/* 4 Sleek Dark Metric Tiles */}
      <div className="grid grid-cols-2 gap-3.5 font-mono">
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5 hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Open Alerts
            </span>
            <ChalkAnomalyIcon size={14} className="text-zinc-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {anomalies.length}
          </div>
          <div className="text-[11px] text-zinc-400 font-sans">
            Requires review
          </div>
        </div>

        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-1.5 hover:border-rose-700/60 transition-colors">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Critical
            </span>
            <ChalkShieldIcon size={14} className="text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 tracking-tight">
            {criticalCount}
          </div>
          <div className="text-[11px] text-rose-300/80 font-sans">
            &gt; 200% spend dev
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5 hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Auto Resolved
            </span>
            <ChalkCheckCircleIcon size={14} className="text-zinc-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            14
          </div>
          <div className="text-[11px] text-zinc-400 font-sans">
            Resolved automatically
          </div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1.5 hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Avg Time
            </span>
            <ChalkClockIcon size={14} className="text-zinc-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            18m
          </div>
          <div className="text-[11px] text-emerald-400 font-bold font-sans">
            -60% vs baseline
          </div>
        </div>
      </div>

      {/* Kill Switch Safeguard Circuit Summary */}
      <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2 font-mono">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            Kill Switch Circuit
          </span>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
            {killSwitchCount} READY
          </span>
        </div>
        <p className="text-xs text-zinc-400 font-sans leading-relaxed">
          One-click emergency cut-off disables active API keys and suspends auto-scaling pools to halt runaway spikes.
        </p>
      </div>
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────────────
     SINGLE-LETTER INCIDENT BRIEF PANEL (CLASSY DARK THEME)
  ───────────────────────────────────────────────────────────────────────── */
  const SingleLetterDetailPanel = selectedAnomaly ? (() => {
    const observed = selectedAnomaly.currentCost ?? 0;
    const expected = selectedAnomaly.expectedCost ?? 0;
    const excess = Math.max(0, observed - expected);
    const rootCause =
      typeof selectedAnomaly.explanation === "string"
        ? selectedAnomaly.explanation
        : selectedAnomaly.explanation?.root_cause ||
        selectedAnomaly.explanation?.summary ||
        "Abnormal spend velocity detected against historical baseline.";
    const showKillSwitch =
      selectedAnomaly.status === "open" &&
      (selectedAnomaly.severity === "critical" || selectedAnomaly.severity === "high");

    return (
      <div className="sticky top-6 rounded-2xl bg-[#09090b]/95 border border-zinc-800/90 shadow-2xl p-6 sm:p-7 text-white backdrop-blur-xl space-y-6">
        {/* Letter Header with Close (X) Button */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-800/80">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              <span>Incident Brief</span>
              <span>·</span>
              <span
                className={cn(
                  "font-semibold",
                  selectedAnomaly.severity === "critical" ? "text-rose-400" : "text-amber-400"
                )}
              >
                {selectedAnomaly.severity}
              </span>
              <span>·</span>
              <span className="text-zinc-500">{selectedAnomaly.status}</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white font-sans">
              {selectedAnomaly.serviceName}
            </h2>
            <p className="text-xs font-mono text-zinc-500">
              ID: {selectedAnomaly.id} · Series: {selectedAnomaly.series_key} · Detected {selectedAnomaly.detected_at}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSelectedAnomaly(null)}
            aria-label="Close incident brief"
            title="Close details and return to telemetry cards"
            className="group relative px-3 py-1.5 rounded-full overflow-hidden text-xs font-mono font-medium transition-all duration-300 flex items-center gap-1.5 text-white border border-white/20 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-[0.98] cursor-pointer"
          >
            <div className="absolute top-0 inset-x-1 h-[50%] rounded-t-full bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
            <X className="w-3.5 h-3.5 relative z-10 text-zinc-300" />
            <span className="relative z-10">Close</span>
          </button>
        </div>

        {/* Narrative Description (Direct, Classy Typography — NO text box) */}
        <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-zinc-300 font-sans">
          <p className="text-zinc-200 font-medium">
            {rootCause}
          </p>

          <p className="text-xs text-zinc-400">
            During the active billing window, observed spend reached{" "}
            <span className="font-mono font-bold text-white">
              ${formatNumber(observed)}
            </span>{" "}
            compared to the 7-day statistical baseline of{" "}
            <span className="font-mono font-semibold text-zinc-300">
              ${formatNumber(expected)}
            </span>
            {excess > 0 && (
              <>
                , representing an excess variance of{" "}
                <span className="font-mono font-bold text-rose-400">
                  +${formatNumber(excess)}
                </span>{" "}
                ({selectedAnomaly.surgePercent} above threshold)
              </>
            )}
            .
          </p>

          {/* Clean Hairline Ledger Rows */}
          <div className="border-t border-b border-zinc-800/80 divide-y divide-zinc-800/60 text-xs font-mono">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-500">Provider / Scope</span>
              <span className="font-semibold text-zinc-200 uppercase">
                {selectedAnomaly.provider || "Multi-Cloud"}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-500">Target Key / Resource</span>
              <span className="font-semibold text-white">
                {selectedAnomaly.api_key_id || selectedAnomaly.series_key}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-500">Detection Method</span>
              <span className="text-zinc-300">
                MAD Z-Score Anomaly Engine
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-zinc-500">Dispatch Status</span>
              <span className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                Slack &amp; Sentinel Alert Logged
              </span>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-mono">Full Incident Dossier</span>
            <a
              href={`/anomalies/${selectedAnomaly.id}`}
              className="inline-flex items-center gap-1 text-xs font-mono text-zinc-300 hover:text-white underline underline-offset-4 decoration-zinc-700 hover:decoration-white transition-colors"
            >
              <span>Open incident page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-800/80">
          <div className="flex items-center gap-2">
            {showKillSwitch && (
              <button
                type="button"
                onClick={() => setKillSwitchTarget(selectedAnomaly)}
                className="px-4 py-2 rounded-full text-xs font-bold font-mono bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(244,63,94,0.25)]"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Kill Switch</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => handleDismiss(selectedAnomaly.id)}
              className="px-3.5 py-2 rounded-full text-xs font-medium font-mono text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleResolve(selectedAnomaly.id)}
            className="group relative px-5 py-2 rounded-full overflow-hidden text-xs font-mono font-medium transition-all duration-300 flex items-center gap-1.5 text-white border border-white/20 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-[0.98] cursor-pointer"
          >
            <div className="absolute top-0 inset-x-2 h-[50%] rounded-t-full bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
            <span className="relative z-10">Resolve Anomaly</span>
          </button>
        </div>
      </div>
    );
  })() : null;

  /* ─────────────────────────────────────────────────────────────────────────
     MAIN LIST: SLEEK CLASSY DARK THEME DATA TABLE (NO TEXT BOXES)
  ───────────────────────────────────────────────────────────────────────── */
  const MainKillSwitchList = (
    <div className="space-y-4">
      {/* Header Toolbar */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-white font-mono tracking-tight flex items-center gap-2">
            <span>Active Spend Alerts &amp; Kill Switches</span>
            <span className="text-xs font-mono text-zinc-400">
              ({filteredAnomalies.length})
            </span>
          </h2>
          <p className="text-xs text-zinc-400 font-sans mt-0.5">
            Review anomalous spend surges and execute immediate emergency actions.
          </p>
        </div>

        {/* Search & Segmented Filter Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by service or root cause..."
              className="w-full h-9 pl-9 pr-4 text-xs font-mono bg-[#09090b] border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
            />
          </div>

          <div className="inline-flex items-center gap-1 bg-black/40 backdrop-blur-xl p-1 rounded-full border border-white/10 text-xs font-mono shadow-inner shrink-0">
            {[
              { id: "all", label: `All (${anomalies.length})` },
              { id: "killswitch", label: `Kill Switch (${killSwitchCount})` },
              { id: "critical", label: `Critical (${criticalCount})` },
              { id: "high", label: `High (${highCount})` },
            ].map((tab) => {
              const isActive = severityFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSeverityFilter(tab.id as any)}
                  className={cn(
                    "relative px-3.5 py-1 rounded-full text-[11px] font-mono transition-all duration-200 cursor-pointer overflow-hidden focus:outline-none",
                    isActive
                      ? "text-white font-bold bg-white/[0.18] border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),inset_0_-1px_1px_rgba(0,0,0,0.3)] backdrop-blur-md"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                  )}
                >
                  {isActive && (
                    <div className="absolute top-0 inset-x-1 h-[50%] rounded-t-full bg-gradient-to-b from-white/50 to-transparent pointer-events-none" />
                  )}
                  <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Classy Dark Theme Data Table (Image 1 Reference) */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#09090b]/95 shadow-2xl backdrop-blur-xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-12 w-full rounded-xl bg-zinc-900" />
            <Skeleton className="h-12 w-full rounded-xl bg-zinc-900" />
            <Skeleton className="h-12 w-full rounded-xl bg-zinc-900" />
            <Skeleton className="h-12 w-full rounded-xl bg-zinc-900" />
          </div>
        ) : filteredAnomalies.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<ChalkCheckCircleIcon size={56} className="text-zinc-500" />}
              title="Zero active anomalies matching filter"
              description="All multi-cloud spend is running within forecasted boundaries."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-zinc-900/60 border-b border-zinc-800/80 text-[11px] uppercase tracking-wider text-zinc-400 select-none">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Service</th>
                  <th className="py-3.5 px-3 font-semibold">Provider</th>
                  <th className="py-3.5 px-3 font-semibold">Severity</th>
                  <th className="py-3.5 px-3 font-semibold">Observed</th>
                  <th className="py-3.5 px-3 font-semibold">Baseline</th>
                  <th className="py-3.5 px-3 font-semibold">Surge</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredAnomalies.map((anomaly) => {
                  const isCritical = anomaly.severity === "critical";
                  const isHigh = anomaly.severity === "high";
                  const isSelected = selectedAnomaly?.id === anomaly.id;
                  const showKillSwitch =
                    anomaly.status === "open" && (isHigh || isCritical);

                  return (
                    <tr
                      key={anomaly.id}
                      onClick={() => setSelectedAnomaly(anomaly)}
                      className={cn(
                        "group transition-colors cursor-pointer",
                        isSelected
                          ? "bg-zinc-800/60 ring-1 ring-inset ring-zinc-700"
                          : "hover:bg-zinc-900/70"
                      )}
                    >
                      {/* SERVICE */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center p-1.5 shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                            <ProviderLogo
                              provider={anomaly.provider}
                              name={anomaly.serviceName}
                              size={18}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-white text-xs font-mono tracking-tight truncate max-w-[200px]">
                              {anomaly.serviceName}
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono truncate max-w-[180px]">
                              {anomaly.series_key}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* PROVIDER */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-[10px] text-zinc-300 font-mono">
                          {anomaly.provider}
                        </span>
                      </td>

                      {/* SEVERITY */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider",
                            isCritical
                              ? "border border-rose-500/30 bg-rose-950/50 text-rose-400"
                              : isHigh
                                ? "border border-amber-500/30 bg-amber-950/50 text-amber-400"
                                : "border border-zinc-700/50 bg-zinc-800/50 text-zinc-300"
                          )}
                        >
                          {anomaly.severity}
                        </span>
                      </td>

                      {/* OBSERVED */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-white text-xs">
                          ${formatNumber(anomaly.currentCost)}
                        </span>
                      </td>

                      {/* BASELINE */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-mono text-zinc-400 text-xs">
                          ${formatNumber(anomaly.expectedCost)}
                        </span>
                      </td>

                      {/* SURGE */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-bold text-[11px]",
                            isCritical
                              ? "bg-rose-500/10 border border-rose-500/25 text-rose-400"
                              : isHigh
                                ? "bg-amber-500/10 border border-amber-500/25 text-amber-400"
                                : "bg-zinc-800 border border-zinc-700 text-zinc-300"
                          )}
                        >
                          <TrendingUp className="w-3 h-3" />
                          <span>{anomaly.surgePercent}</span>
                        </span>
                      </td>

                  <div className="flex items-center gap-2">
                    {showKillSwitch && (
                      <button
                        type="button"
                        onClick={() => setKillSwitchTarget(anomaly)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold font-mono bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-zinc-300" />
                        <span>Kill Switch</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDismiss(anomaly.id)}
                      className="px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors font-mono cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedAnomaly(anomaly)}
                      className="group relative px-4 py-1.5 rounded-full overflow-hidden text-xs font-mono font-medium transition-all duration-300 flex items-center gap-1.5 text-white border border-white/20 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] active:scale-[0.98] cursor-pointer"
                    >
                      <div className="absolute top-0 inset-x-1.5 h-[50%] rounded-t-full bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
                      <Eye className="w-3.5 h-3.5 relative z-10 text-zinc-200" />
                      <span className="relative z-10">View Details</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const SecondaryPanel = selectedAnomaly ? SingleLetterDetailPanel : TelemetryCardsPanel;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      <Topbar />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
        {/* Page Hero Header */}
        <div className="space-y-1 pt-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
            Spend Anomalies &amp; Alert Center
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-sans max-w-3xl leading-relaxed">
            Real-time anomaly detection monitoring multi-cloud and AI inference spend to prevent runaway budget spikes.
          </p>
        </div>

        {/* ── 2-COLUMN SPLIT: LEFT TABLE + RIGHT TELEMETRY/BRIEF ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 xl:col-span-7 order-2 lg:order-1">
            {MainKillSwitchList}
          </div>
          <div className="lg:col-span-5 xl:col-span-5 order-1 lg:order-2">
            {SecondaryPanel}
          </div>
        </div>

        {/* Kill Switch Confirmation Modal (Classy Dark Theme) */}
        {killSwitchTarget && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#09090b] border border-zinc-800/90 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-white">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  <h3 className="font-bold text-white text-base font-mono">
                    Kill Switch Confirmation
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setKillSwitchTarget(null)}
                  className="text-zinc-400 hover:text-white p-1 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                This will trigger an emergency cut-off for{" "}
                <span className="font-semibold text-white">
                  {killSwitchTarget.provider || "provider"}
                </span>{" "}
                key{" "}
                <span className="font-mono font-bold text-white">
                  {killSwitchTarget.api_key_id || "associated with this anomaly"}
                </span>
                . This action will be logged and can be reviewed in the Actions tab.
              </p>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setKillSwitchTarget(null)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors font-mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmKillSwitch}
                  disabled={isProposing}
                  className="px-4 py-2 rounded-full text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors disabled:opacity-50 font-mono cursor-pointer shadow-[0_0_14px_rgba(244,63,94,0.35)]"
                >
                  {isProposing ? "Proposing..." : "Trigger Kill Switch"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#09090b] text-white text-xs px-4 py-3 rounded-full border border-zinc-800 font-mono animate-in fade-in slide-in-from-bottom-2 shadow-2xl">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="ml-2 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
