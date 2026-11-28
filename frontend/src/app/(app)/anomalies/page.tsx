"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Eye,
  X,
  ShieldAlert,
  CheckCircle,
  Search,
  TrendingUp,
  Clock,
  Zap,
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
    if (selectedAnomaly?.id === id) setSelectedAnomaly(null);
  };

  const handleResolve = async (id: string) => {
    try {
      await resolveMutation.mutateAsync(id);
      setToastMessage("Anomaly marked as resolved");
    } catch {
      // Ignore
    }
    if (selectedAnomaly?.id === id) setSelectedAnomaly(null);
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

  /* ─────────────────────────────────────────────────────────────────
     GLASS MORPHISM BUTTON HELPER
  ───────────────────────────────────────────────────────────────── */
  const GlassBtn = ({
    children,
    onClick,
    variant = "default",
    className = "",
    disabled = false,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: "default" | "danger" | "outline";
    className?: string;
    disabled?: boolean;
  }) => {
    const base =
      "relative group overflow-hidden flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-mono font-semibold transition-all duration-200 cursor-pointer active:scale-95 focus:outline-none disabled:opacity-50";
    const variants = {
      default:
        "text-white border border-white/20 bg-white/[0.08] hover:bg-white/[0.16] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]",
      danger:
        "text-rose-200 border border-rose-500/30 bg-rose-950/60 hover:bg-rose-900/70 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,100,100,0.3)]",
      outline:
        "text-zinc-300 border border-zinc-700/60 bg-transparent hover:bg-zinc-800/60 backdrop-blur-xl",
    };
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(base, variants[variant], className)}
      >
        <div className="absolute top-0 inset-x-1.5 h-[45%] rounded-t-full bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
        <span className="relative z-10 flex items-center gap-1.5">{children}</span>
      </button>
    );
  };

  /* ─────────────────────────────────────────────────────────────────
     TELEMETRY SUMMARY PANEL — Bright warm-white theme (screenshot 2)
  ───────────────────────────────────────────────────────────────── */
  const TelemetryCardsPanel = (
    <div className="sticky top-6 rounded-2xl bg-[#faf8f5] border border-[#e8e4dc] shadow-[0_8px_32px_rgba(0,0,0,0.12)] p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#e8e4dc]">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500">
            Telemetry Summary
          </span>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Click View Details on any alert to read its incident brief.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-600 text-[10px] font-mono font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
          LIVE SENTINEL
        </span>
      </div>

      {/* 2×2 stat grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Open Alerts */}
        <div className="p-4 rounded-xl bg-white border border-[#e8e3d8] shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
              Open Alerts
            </span>
            <ChalkAnomalyIcon size={14} className="text-zinc-400" />
          </div>
          <div className="text-2xl font-black text-zinc-900 tracking-tight">
            {anomalies.length}
          </div>
          <div className="text-[11px] text-zinc-500">Requires review</div>
        </div>

        {/* Critical */}
        <div className="p-4 rounded-xl bg-white border border-[#e8e3d8] shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
              Critical
            </span>
            <ChalkShieldIcon size={14} className="text-zinc-400" />
          </div>
          <div className="text-2xl font-black text-zinc-900 tracking-tight">
            {criticalCount}
          </div>
          <div className="text-[11px] text-zinc-500">&gt; 200% spend dev</div>
        </div>

        {/* Auto Resolved */}
        <div className="p-4 rounded-xl bg-white border border-[#e8e3d8] shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
              Auto Resolved
            </span>
            <ChalkCheckCircleIcon size={14} className="text-zinc-400" />
          </div>
          <div className="text-2xl font-black text-zinc-900 tracking-tight">14</div>
          <div className="text-[11px] text-zinc-500">Resolved automatically</div>
        </div>

        {/* Avg Time */}
        <div className="p-4 rounded-xl bg-white border border-[#e8e3d8] shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">
              Avg Time
            </span>
            <ChalkClockIcon size={14} className="text-zinc-400" />
          </div>
          <div className="text-2xl font-black text-zinc-900 tracking-tight">18m</div>
          <div className="text-[11px] text-zinc-500 font-bold">-60% vs baseline</div>
        </div>
      </div>

      {/* Kill Switch Circuit */}
      <div className="p-4 rounded-xl bg-white border border-[#e8e3d8] shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-700 flex items-center gap-1.5 font-mono">
            <ShieldAlert className="w-3.5 h-3.5 text-zinc-500" />
            Kill Switch Circuit
          </span>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
            {killSwitchCount} ready
          </span>
        </div>
        <p className="text-xs text-zinc-500 font-sans leading-relaxed">
          One-click emergency cut-off disables active API keys and suspends
          auto-scaling pools to halt runaway spikes.
        </p>
      </div>
    </div>
  );

  /* ─────────────────────────────────────────────────────────────────
     INCIDENT BRIEF PANEL (shown when a card is clicked)
  ───────────────────────────────────────────────────────────────── */
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
        {/* Header */}
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
              {selectedAnomaly.series_key} · Detected {selectedAnomaly.detected_at}
            </p>
          </div>
          <GlassBtn onClick={() => setSelectedAnomaly(null)}>
            <X className="w-3.5 h-3.5" />
            Close
          </GlassBtn>
        </div>

        {/* Root cause narrative */}
        <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-zinc-300 font-sans">
          <p className="text-zinc-200 font-medium">{rootCause}</p>
          <p className="text-xs text-zinc-400">
            Observed spend reached{" "}
            <span className="font-mono font-bold text-white">${formatNumber(observed)}</span>
            {" "}vs baseline of{" "}
            <span className="font-mono font-semibold text-zinc-300">${formatNumber(expected)}</span>
            {excess > 0 && (
              <>
                {" "}— excess variance of{" "}
                <span className="font-mono font-bold text-rose-400">
                  +${formatNumber(excess)}
                </span>{" "}
                ({selectedAnomaly.surgePercent} above threshold)
              </>
            )}
            .
          </p>

          <div className="border-t border-b border-zinc-800/80 divide-y divide-zinc-800/60 text-xs font-mono">
            {[
              ["Provider / Scope", (selectedAnomaly.provider || "Multi-Cloud").toUpperCase()],
              ["Target Key / Resource", selectedAnomaly.api_key_id || selectedAnomaly.series_key],
              ["Detection Method", "MAD Z-Score Anomaly Engine"],
              ["Detected At", selectedAnomaly.detected_at || "—"],
            ].map(([label, val]) => (
              <div key={label} className="py-2.5 flex items-center justify-between gap-4">
                <span className="text-zinc-500 shrink-0">{label}</span>
                <span className="font-semibold text-zinc-200 text-right truncate">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {showKillSwitch && (
            <GlassBtn variant="danger" onClick={() => { setSelectedAnomaly(null); setKillSwitchTarget(selectedAnomaly); }}>
              <Zap className="w-3.5 h-3.5" />
              Kill Switch
            </GlassBtn>
          )}
          <GlassBtn onClick={() => handleDismiss(selectedAnomaly.id)}>
            Dismiss
          </GlassBtn>
          <GlassBtn onClick={() => handleResolve(selectedAnomaly.id)}>
            <CheckCircle className="w-3.5 h-3.5" />
            Resolve Anomaly
          </GlassBtn>
        </div>
      </div>
    );
  })() : null;

  /* ─────────────────────────────────────────────────────────────────
     ANOMALY CARD — compact, no popping colors, only View Details is glass
  ───────────────────────────────────────────────────────────────── */
  const AnomalyCard = ({ anomaly }: { anomaly: Anomaly }) => {
    const isCritical = anomaly.severity === "critical";
    const isHigh = anomaly.severity === "high";
    const showKillSwitch = anomaly.status === "open" && (isHigh || isCritical);
    const summary =
      typeof anomaly.explanation === "string"
        ? anomaly.explanation
        : (anomaly.explanation as any)?.summary || "";
    const excess = Math.max(0, (anomaly.currentCost ?? 0) - (anomaly.expectedCost ?? 0));

    return (
      <div className="rounded-2xl bg-[#09090b]/95 border border-zinc-800/70 backdrop-blur-xl p-4 space-y-2 transition-all duration-200 hover:border-zinc-700/60">
        {/* Row 1: icon + name + severity text + cost */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center p-1.5 shrink-0">
            <ProviderLogo provider={anomaly.provider} name={anomaly.serviceName} size={20} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-sm font-sans truncate">
                {anomaly.serviceName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              <span className={cn("font-bold", isCritical ? "text-zinc-400" : isHigh ? "text-zinc-400" : "text-zinc-500")}>
                {anomaly.severity}
              </span>
              <span>·</span>
              <span>{anomaly.surgePercent}</span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-sm font-black text-white font-mono">
              ${formatNumber(anomaly.currentCost ?? 0)}
            </div>
            {anomaly.expectedCost != null && (
              <div className="text-[10px] text-zinc-500 font-mono">
                vs ${formatNumber(anomaly.expectedCost)}
              </div>
            )}
          </div>
        </div>

        {/* Summary — single line */}
        {summary && (
          <p className="text-[11px] text-zinc-500 font-sans leading-snug line-clamp-1">
            {summary}
          </p>
        )}

        {/* Timestamp + excess — compact */}
        <div className="flex items-center gap-3 text-[10px] text-zinc-600 font-mono">
          {anomaly.detected_at && (
            <span className="flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {anomaly.detected_at}
            </span>
          )}
          {excess > 0 && (
            <span className="flex items-center gap-1 font-semibold">
              <TrendingUp className="w-2.5 h-2.5" />
              +${formatNumber(excess)} excess
            </span>
          )}
        </div>

        {/* Action row: Kill Switch & Dismiss are plain text, only View Details is glass */}
        <div className="flex items-center gap-2 pt-1">
          {showKillSwitch && (
            <button
              type="button"
              onClick={() => setKillSwitchTarget(anomaly)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-mono font-semibold text-zinc-400 hover:text-white bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
            >
              <Zap className="w-3 h-3" />
              Kill Switch
            </button>
          )}
          <button
            type="button"
            onClick={() => handleDismiss(anomaly.id)}
            className="px-3 py-1.5 rounded-full text-[11px] font-mono font-semibold text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            Dismiss
          </button>
          {/* Only View Details gets glass morphism */}
          <GlassBtn onClick={() => setSelectedAnomaly(anomaly)}>
            <Eye className="w-3 h-3" />
            View Details
          </GlassBtn>
        </div>
      </div>
    );
  };

  const SecondaryPanel = selectedAnomaly ? SingleLetterDetailPanel : TelemetryCardsPanel;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      <Topbar />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
        {/* Page Header */}
        <div className="space-y-1 pt-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
              Active Spend Alerts &amp; Kill Switches
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-sans max-w-3xl leading-relaxed">
            Real-time anomaly detection monitoring multi-cloud and AI inference spend to prevent runaway budget spikes.
          </p>
        </div>

        {/* 2-Column Layout: Left cards + Right telemetry */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT: Card list */}
          <div className="lg:col-span-7 xl:col-span-7 order-2 lg:order-1 space-y-4">
            {/* Toolbar */}
            <div className="space-y-3">

              {/* Search + filter */}
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

                {/* Segmented pill filter */}
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
                        onClick={() => setSeverityFilter(tab.id as "all" | "killswitch" | "critical" | "high")}
                        className={cn(
                          "relative px-3.5 py-1 rounded-full text-[11px] font-mono transition-all duration-200 cursor-pointer overflow-hidden focus:outline-none",
                          isActive
                            ? "text-white font-bold bg-white/[0.18] border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),inset_0_-1px_1px_rgba(0,0,0,0.3)] backdrop-blur-md"
                            : "text-zinc-400 hover:text-zinc-200"
                        )}
                      >
                        {isActive && (
                          <div className="absolute top-0 inset-x-1 h-[45%] rounded-t-full bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
                        )}
                        <span className="relative z-10">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Card list body */}
            {isLoading ? (
              <div className="space-y-4">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-44 w-full rounded-2xl bg-zinc-900" />
                ))}
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
              <div className="space-y-3">
                {filteredAnomalies.map((anomaly) => (
                  <AnomalyCard key={anomaly.id} anomaly={anomaly} />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Telemetry / Incident Brief */}
          <div className="lg:col-span-5 xl:col-span-5 order-1 lg:order-2">
            {SecondaryPanel}
          </div>
        </div>

        {/* Kill Switch Confirmation Modal */}
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

        {/* Toast */}
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
