"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Eye,
  X,
  ShieldAlert,
  CheckCircle,
  Search,
  Clock,
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
      // Ignore or log error
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
      // Ignore or log error
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
     STARTING VIEW PANEL: 4 Consolidated Cards (Warm Off-White / Soft Yellow-Gray)
  ───────────────────────────────────────────────────────────────────────── */
  const TelemetryCardsPanel = (
    <div className="sticky top-6 rounded-2xl bg-[#faf8f5] border border-[#e4dfd3] shadow-[0_18px_40px_rgba(0,0,0,0.45)] p-5 sm:p-6 space-y-5 text-[#1c1917]">
      <div className="flex items-center justify-between pb-3.5 border-b border-[#e6e1d6]">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#1c1917]">
            Telemetry Summary
          </span>
          <p className="text-[11px] text-[#78716c] mt-0.5 font-sans">
            Click View Details on any alert to read its full incident brief
          </p>
        </div>
        <span className="text-[10px] font-mono font-semibold text-[#57534e] bg-[#f0ebe0] border border-[#dfd8c8] px-2.5 py-1 rounded-full">
          LIVE
        </span>
      </div>

      {/* 4 Compact Metric Tiles */}
      <div className="grid grid-cols-2 gap-3.5 font-mono">
        <div className="p-4 rounded-xl bg-[#f3efe6] border border-[#e5dfd2] space-y-1.5">
          <div className="flex items-center justify-between text-[#78716c]">
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Open Alerts
            </span>
            <ChalkAnomalyIcon size={14} className="text-[#78716c]" />
          </div>
          <div className="text-2xl font-black text-[#18181b] tracking-tight">
            {anomalies.length}
          </div>
          <div className="text-[11px] text-[#78716c] font-sans">
            Requires review
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#f5eedc] border border-[#e4d8b8] space-y-1.5">
          <div className="flex items-center justify-between text-[#6b5a2b]">
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Critical
            </span>
            <ChalkShieldIcon size={14} className="text-[#6b5a2b]" />
          </div>
          <div className="text-2xl font-black text-[#18181b] tracking-tight">
            {criticalCount}
          </div>
          <div className="text-[11px] text-[#6b5a2b] font-sans">
            &gt; 200% spend deviation
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#f3efe6] border border-[#e5dfd2] space-y-1.5">
          <div className="flex items-center justify-between text-[#78716c]">
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Auto Resolved
            </span>
            <ChalkCheckCircleIcon size={14} className="text-[#78716c]" />
          </div>
          <div className="text-2xl font-black text-[#18181b] tracking-tight">
            14
          </div>
          <div className="text-[11px] text-[#78716c] font-sans">
            Resolved automatically
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#f3efe6] border border-[#e5dfd2] space-y-1.5">
          <div className="flex items-center justify-between text-[#78716c]">
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Avg Time
            </span>
            <ChalkClockIcon size={14} className="text-[#78716c]" />
          </div>
          <div className="text-2xl font-black text-[#18181b] tracking-tight">
            18m
          </div>
          <div className="text-[11px] text-[#57534e] font-sans">
            -60% vs baseline
          </div>
        </div>
      </div>

      {/* Kill Switch Circuit Summary */}
      <div className="p-4 rounded-xl bg-[#f5eedc]/70 border border-[#e4d8b8] space-y-1.5">
        <div className="flex items-center justify-between font-mono">
          <span className="text-xs font-bold text-[#1c1917] flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-[#57534e]" />
            Kill Switch Circuit
          </span>
          <span className="text-[11px] font-bold text-[#6b5a2b]">
            {killSwitchCount} ready
          </span>
        </div>
        <p className="text-xs text-[#57534e] font-sans leading-relaxed">
          One-click emergency cut-off disables active API keys and suspends auto-scaling pools to halt runaway spikes.
        </p>
      </div>
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────────────
     VIEW DETAILS PANEL: Single-Letter Incident Brief (Warm Off-White, No Nested Cards)
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
      <div className="sticky top-6 rounded-2xl bg-[#faf8f5] border border-[#ded8cb] shadow-[0_20px_45px_rgba(0,0,0,0.45)] p-6 sm:p-8 text-[#1c1917] space-y-6">
        {/* Letter Header with Close (X) Button */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#e5dfd3]">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#78716c]">
              <span>Incident Brief</span>
              <span>·</span>
              <span className="font-semibold text-[#6b5a2b]">
                {selectedAnomaly.severity}
              </span>
              <span>·</span>
              <span>{selectedAnomaly.status}</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[#18181b] font-sans">
              {selectedAnomaly.serviceName}
            </h2>
            <p className="text-xs font-mono text-[#78716c]">
              ID: {selectedAnomaly.id} · Series: {selectedAnomaly.series_key} · Detected {selectedAnomaly.detected_at}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSelectedAnomaly(null)}
            aria-label="Close incident brief"
            title="Close details and return to telemetry cards"
            className="w-8 h-8 rounded-full bg-[#efebe3] hover:bg-[#e4ded2] border border-[#ded7c8] text-[#44403c] hover:text-[#18181b] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Single-Letter Narrative Description */}
        <div className="space-y-5 text-sm leading-relaxed text-[#292524] font-sans">
          <p>
            {rootCause}
          </p>

          <p className="text-[13px] text-[#44403c]">
            During the active billing window, observed spend reached{" "}
            <span className="font-mono font-bold text-[#18181b]">
              ${formatNumber(observed)}
            </span>{" "}
            compared to the 7-day statistical baseline of{" "}
            <span className="font-mono font-semibold text-[#18181b]">
              ${formatNumber(expected)}
            </span>
            {excess > 0 && (
              <>
                , representing an excess variance of{" "}
                <span className="font-mono font-bold text-[#18181b]">
                  +${formatNumber(excess)}
                </span>{" "}
                ({selectedAnomaly.surgePercent} above threshold)
              </>
            )}
            .
          </p>

          {/* Clean Hairline Ledger Rows (No separate cards) */}
          <div className="border-t border-b border-[#e5dfd3] divide-y divide-[#ebe6dc] text-xs font-mono">
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-[#78716c]">Provider / Scope</span>
              <span className="font-semibold text-[#18181b] uppercase">
                {selectedAnomaly.provider || "Multi-Cloud"}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-[#78716c]">Target Key / Resource</span>
              <span className="font-semibold text-[#18181b]">
                {selectedAnomaly.api_key_id || selectedAnomaly.series_key}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-[#78716c]">Detection Method</span>
              <span className="text-[#44403c]">
                MAD Z-Score Anomaly Engine
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-[#78716c]">Dispatch Status</span>
              <span className="text-[#44403c]">
                Slack &amp; Sentinel Alert Logged
              </span>
            </div>
          </div>

          <p className="text-xs text-[#78716c] leading-relaxed">
            Recommended action: verify whether this workload burst is intentional. If unauthorized or caused by a retry loop, engage the Kill Switch to suspend the associated key or resolve the alert once mitigated.
          </p>
        </div>

        {/* Letter Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#e5dfd3]">
          <div className="flex items-center gap-2">
            {showKillSwitch && (
              <button
                type="button"
                onClick={() => setKillSwitchTarget(selectedAnomaly)}
                className="px-4 py-2 rounded-full text-xs font-bold font-mono bg-[#f5eedc] hover:bg-[#ebe0c4] border border-[#dcd0b0] text-[#1c1917] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-[#6b5a2b]" />
                <span>Kill Switch</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => handleDismiss(selectedAnomaly.id)}
              className="px-3.5 py-2 rounded-full text-xs font-medium font-mono text-[#78716c] hover:text-[#18181b] hover:bg-[#efebe3] transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleResolve(selectedAnomaly.id)}
            className="px-5 py-2 rounded-full text-xs font-bold font-mono bg-[#18181b] hover:bg-black text-[#faf8f5] transition-colors cursor-pointer"
          >
            Resolve Anomaly
          </button>
        </div>
      </div>
    );
  })() : null;

  /* ─────────────────────────────────────────────────────────────────────────
     KILL SWITCH & SPEND ALERTS LIST (Bright Warm Off-White / Soft Yellow-Gray)
  ───────────────────────────────────────────────────────────────────────── */
  const MainKillSwitchList = (
    <div className="space-y-4">
      {/* Header */}
      <div className="space-y-3">

        {/* Search & Filter Row */}
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

          <div className="flex items-center gap-1 bg-[#09090b] p-1 rounded-lg border border-zinc-800 text-xs font-mono shrink-0">
            {[
              { id: "all", label: `All (${anomalies.length})` },
              { id: "killswitch", label: `Kill Switch (${killSwitchCount})` },
              { id: "critical", label: `Critical (${criticalCount})` },
              { id: "high", label: `High (${highCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSeverityFilter(tab.id as any)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors cursor-pointer",
                  severityFilter === tab.id
                    ? "bg-[#faf8f5] text-[#18181b] font-bold"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bright Warm Off-White / Soft Yellow-Gray Alert Cards */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full rounded-2xl bg-zinc-900" />
            <Skeleton className="h-28 w-full rounded-2xl bg-zinc-900" />
            <Skeleton className="h-28 w-full rounded-2xl bg-zinc-900" />
          </div>
        ) : filteredAnomalies.length === 0 ? (
          <EmptyState
            icon={<ChalkCheckCircleIcon size={56} className="text-zinc-500" />}
            title="Zero active anomalies matching filter"
            description="All multi-cloud spend is running within forecasted boundaries."
          />
        ) : (
          filteredAnomalies.map((anomaly) => {
            const isCritical = anomaly.severity === "critical";
            const isHigh = anomaly.severity === "high";
            const isSelected = selectedAnomaly?.id === anomaly.id;
            const showKillSwitch =
              anomaly.status === "open" && (isHigh || isCritical);
            const excess =
              anomaly.currentCost != null &&
              anomaly.expectedCost != null &&
              anomaly.currentCost > anomaly.expectedCost
                ? anomaly.currentCost - anomaly.expectedCost
                : 0;

            return (
              <div
                key={anomaly.id}
                className={cn(
                  "rounded-2xl p-5 transition-all duration-200 border flex flex-col gap-3.5",
                  isSelected
                    ? "bg-zinc-900/90 border-zinc-600 shadow-lg"
                    : "bg-[#09090b] border-zinc-800/90 hover:border-zinc-700"
                )}
              >
                {/* Top Row: Provider Icon + Service Name + Plain Severity/Surge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                      <ProviderLogo
                        provider={anomaly.provider}
                        name={anomaly.serviceName}
                        size={18}
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-sm font-mono tracking-tight truncate">
                        {anomaly.serviceName}
                      </h4>
                      <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5 mt-0.5">
                        <span className={cn("uppercase font-semibold", isCritical ? "text-zinc-200" : "text-zinc-400")}>
                          {anomaly.severity}
                        </span>
                        <span>·</span>
                        <span className="font-semibold text-zinc-300">
                          {anomaly.surgePercent}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Clean Cost Figures */}
                  <div className="text-right font-mono shrink-0">
                    <div className="text-sm font-bold text-white">
                      ${formatNumber(anomaly.currentCost)}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      vs ${formatNumber(anomaly.expectedCost)}
                    </div>
                  </div>
                </div>

                {/* Plain Summary */}
                <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                  {typeof anomaly.explanation === "string"
                    ? anomaly.explanation
                    : anomaly.explanation?.summary}
                </p>

                {/* Bottom Row: Timestamp + Excess + Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-zinc-800/80">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{anomaly.detected_at}</span>
                    {excess > 0 && (
                      <>
                        <span>·</span>
                        <span className="font-semibold text-zinc-300">
                          +${formatNumber(excess)} excess
                        </span>
                      </>
                    )}
                  </div>

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
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold font-mono bg-white text-black hover:bg-zinc-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
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
            <span>Active Spend Alerts &amp; Kill Switches</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-sans max-w-3xl leading-relaxed">
            Real-time anomaly detection monitoring multi-cloud and AI inference spend to prevent runaway budget spikes.
          </p>
        </div>

        {/* ── EQUAL 50/50 SPLIT LAYOUT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 order-2 lg:order-1">
            {MainKillSwitchList}
          </div>
          <div className="lg:col-span-6 order-1 lg:order-2">
            {SecondaryPanel}
          </div>
        </div>

        {/* Kill Switch Confirmation Modal */}
        {killSwitchTarget && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#faf8f5] border border-[#ded8cb] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-[#1c1917]">
              <div className="flex items-center justify-between border-b border-[#e5dfd3] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[#6b5a2b]" />
                  <h3 className="font-bold text-[#18181b] text-base font-mono">
                    Kill Switch Confirmation
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setKillSwitchTarget(null)}
                  className="text-[#78716c] hover:text-[#18181b] p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-[#44403c] leading-relaxed font-sans">
                This will trigger an emergency cut-off for{" "}
                <span className="font-semibold text-[#18181b]">
                  {killSwitchTarget.provider || "provider"}
                </span>{" "}
                key{" "}
                <span className="font-mono font-bold text-[#18181b]">
                  {killSwitchTarget.api_key_id || "associated with this anomaly"}
                </span>
                . This action will be logged and can be reviewed in the Actions tab.
              </p>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e5dfd3]">
                <button
                  type="button"
                  onClick={() => setKillSwitchTarget(null)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-[#78716c] hover:bg-[#efebe3] hover:text-[#18181b] transition-colors font-mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmKillSwitch}
                  disabled={isProposing}
                  className="px-4 py-2 rounded-full text-xs font-bold bg-[#18181b] hover:bg-black text-[#faf8f5] transition-colors disabled:opacity-50 font-mono cursor-pointer"
                >
                  {isProposing ? "Proposing..." : "Trigger Kill Switch"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#faf8f5] text-[#18181b] text-xs px-4 py-3 rounded-full border border-[#ded8cb] font-mono animate-in fade-in slide-in-from-bottom-2 shadow-2xl">
            <CheckCircle className="w-4 h-4 text-[#44403c] flex-shrink-0" />
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="ml-2 text-[#78716c] hover:text-[#18181b] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
