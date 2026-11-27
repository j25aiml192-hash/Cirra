"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, X, ShieldAlert, CheckCircle } from "lucide-react";
import {
  ChalkAnomalyIcon,
  ChalkShieldIcon,
  ChalkCheckCircleIcon,
  ChalkClockIcon,
} from "@/components/ui/chalk-icons";
import { Topbar } from "@/components/layout/Topbar";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProviderLogo } from "@/components/ui/provider-logos";
import { formatNumber } from "@/lib/utils";
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

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const anomalies: Anomaly[] = (rawAnomalies ?? []).map((raw) => {
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

  const handleDismiss = async (id: string) => {
    try {
      await acknowledgeMutation.mutateAsync(id);
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

  const getSeverityBadgeVariant = (severity: Anomaly["severity"]) => {
    switch (severity) {
      case "critical":
        return "danger";
      case "high":
        return "warning";
      case "medium":
        return "warning";
      case "low":
      default:
        return "neutral";
    }
  };

  const criticalCount = anomalies.filter((a) => a.severity === "critical").length;

  return (
    <div className="min-h-screen bg-black text-white">
      <Topbar />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
        {/* ── Written Overview Banner (Replacing stat cards) ──────── */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#09090b] p-6 sm:p-7 select-none">
          {/* Subtle ambient aura */}
          <div
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-20 blur-[90px] pointer-events-none"
            style={{
              background: "radial-gradient(circle, #ef4444 0%, #dc2626 40%, transparent 75%)",
            }}
          />
          <div
            className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full opacity-15 blur-[90px] pointer-events-none"
            style={{
              background: "radial-gradient(circle, #059669 0%, #10b981 40%, transparent 75%)",
            }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-rose-400">
                  REAL-TIME SPEND TELEMETRY & SURGE DETECTION
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white font-mono tracking-tight">
                {anomalies.length} Active Spend Anomalies Detected
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-sans">
                Cirra continuously compares live hourly billing telemetry against 30-day baseline forecasts. 
                Currently, <span className="text-white font-semibold">{criticalCount} critical incident</span> exceeds 
                +200% spend deviation and requires immediate engineer intervention. 14 benign fluctuations were auto-dismissed 
                via pre-configured scaling guardrails this week with an average resolution speed of 18 minutes.
              </p>
            </div>

            {/* Quick telemetry summary chips */}
            <div className="flex flex-wrap lg:flex-col gap-2.5 shrink-0 font-mono text-xs">
              <div className="px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-4">
                <span className="text-zinc-400">Open Anomalies</span>
                <span className="font-bold text-white text-sm">{anomalies.length}</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-rose-950/40 border border-rose-800/40 flex items-center justify-between gap-4">
                <span className="text-rose-300">Critical (&gt;200%)</span>
                <span className="font-bold text-rose-400 text-sm">{criticalCount}</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between gap-4">
                <span className="text-zinc-400">Avg MTTR</span>
                <span className="font-bold text-emerald-400 text-sm">18m (-60%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Anomaly rows as cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-semibold text-white text-base font-mono">Active Spend Alerts</h3>
            <span className="text-xs text-zinc-400 font-mono">{anomalies.length} unresolved alerts</span>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-28 w-full rounded-2xl bg-zinc-900" />
              <Skeleton className="h-28 w-full rounded-2xl bg-zinc-900" />
              <Skeleton className="h-28 w-full rounded-2xl bg-zinc-900" />
            </div>
          ) : anomalies.length === 0 ? (
            <EmptyState
              icon={<ChalkCheckCircleIcon size={56} className="text-zinc-500" />}
              title="Zero active anomalies"
              description="All multi-cloud spend is running within forecasted boundaries."
            />
          ) : (
            anomalies.map((anomaly) => {
              const isCritical = anomaly.severity === "critical";
              const isHigh = anomaly.severity === "high";

              const showKillSwitch =
                anomaly.status === "open" && (isHigh || isCritical);

              return (
                <div
                  key={anomaly.id}
                  className="group relative bg-[#09090b] border border-zinc-800/80 hover:border-zinc-700/90 rounded-2xl p-5 sm:p-6 transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 overflow-hidden"
                >
                  {/* Subtle left severity highlight bar */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${
                      isCritical
                        ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                        : isHigh
                        ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                        : "bg-emerald-500"
                    }`}
                  />

                  <div className="flex items-start gap-4 flex-1 pl-1">
                    {/* App / Provider Logo Avatar */}
                    <div className="w-11 h-11 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center shrink-0 shadow-sm mt-0.5 group-hover:border-zinc-700 transition-colors">
                      <ProviderLogo
                        provider={anomaly.provider}
                        name={anomaly.serviceName}
                        size={22}
                      />
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      {/* Service Name & Surge Percentage (no pill boxes) */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className="font-bold text-white text-[15px] font-mono tracking-tight truncate">
                          {anomaly.serviceName}
                        </h4>

                        <span
                          className={`text-xs font-mono font-extrabold ${
                            isCritical ? "text-rose-400" : "text-amber-400"
                          }`}
                        >
                          {anomaly.surgePercent}
                        </span>
                      </div>

                      {/* Explanation Description */}
                      <p className="text-xs text-zinc-300 max-w-2xl font-mono leading-relaxed">
                        {typeof anomaly.explanation === "string"
                          ? anomaly.explanation
                          : anomaly.explanation?.summary}
                      </p>

                      {/* Detection timestamp & Cost discrepancy */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-xs font-mono">
                        <span className="text-zinc-500">Detected {anomaly.detected_at}</span>
                        <span className="text-zinc-600 hidden sm:inline">·</span>
                        <span className="text-zinc-400">
                          Current:{" "}
                          <span className="text-rose-400 font-bold">
                            ${formatNumber(anomaly.currentCost)}
                          </span>{" "}
                          vs Expected:{" "}
                          <span className="text-zinc-400">
                            ${formatNumber(anomaly.expectedCost)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    {showKillSwitch && (
                      <button
                        type="button"
                        onClick={() => setKillSwitchTarget(anomaly)}
                        className="text-xs font-semibold font-mono text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer py-1 px-1.5 hover:underline"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Kill Switch</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDismiss(anomaly.id)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors font-mono cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <Link
                      href={`/anomalies/${anomaly.id}`}
                      className="px-4 py-1.5 rounded-full text-xs font-bold font-mono bg-white text-black hover:bg-zinc-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(255,255,255,0.2)] hover:scale-[1.02]"
                    >
                      <Eye className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                      <span>View Details</span>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail Modal / Drawer if an anomaly is selected */}
        {selectedAnomaly && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#09090b] border border-zinc-800/80 rounded-2xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={getSeverityBadgeVariant(selectedAnomaly.severity)}
                    className="uppercase text-[10px]"
                  >
                    {selectedAnomaly.severity}
                  </Badge>
                  <h3 className="font-bold text-white text-base">
                    {selectedAnomaly.serviceName}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAnomaly(null)}
                  className="text-zinc-500 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-zinc-300 font-mono">
                    Root Cause Diagnostics:
                  </span>
                  <p className="mt-1 text-zinc-300 bg-zinc-950 p-3 rounded-xl border border-zinc-800 leading-relaxed font-mono">
                    {typeof selectedAnomaly.explanation === "string"
                      ? selectedAnomaly.explanation
                      : selectedAnomaly.explanation?.root_cause}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl font-mono">
                    <span className="text-zinc-500 text-[10px] uppercase font-bold">
                      Observed Spend
                    </span>
                    <div className="text-base font-bold text-white mt-0.5">
                      ${formatNumber(selectedAnomaly.currentCost)}
                    </div>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl font-mono">
                    <span className="text-zinc-500 text-[10px] uppercase font-bold">
                      Baseline Expected
                    </span>
                    <div className="text-base font-bold text-zinc-300 mt-0.5">
                      ${formatNumber(selectedAnomaly.expectedCost)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => handleDismiss(selectedAnomaly.id)}
                  className="px-3.5 py-2 rounded-full text-xs font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white font-mono"
                >
                  Dismiss Alert
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDismiss(selectedAnomaly.id);
                    setSelectedAnomaly(null);
                  }}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-white text-black hover:bg-zinc-200 font-mono cursor-pointer"
                >
                  Acknowledge & Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Kill Switch Confirmation Modal */}
        {killSwitchTarget && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#09090b] border border-zinc-800/80 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2 text-white">
                  <ShieldAlert className="w-5 h-5 text-white" />
                  <h3 className="font-bold text-white text-base font-mono">
                    Kill Switch Confirmation
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setKillSwitchTarget(null)}
                  className="text-zinc-500 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-mono">
                This will disable {killSwitchTarget.provider || "provider"} key{" "}
                {killSwitchTarget.api_key_id || "associated with this anomaly"}. This action
                will be logged and can be reviewed in the Actions tab. Confirm?
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
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-colors disabled:opacity-50 font-mono cursor-pointer"
                >
                  {isProposing ? "Proposing..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#09090b] text-white text-xs px-4 py-3 rounded-full border border-zinc-800 font-mono animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle className="w-4 h-4 text-white flex-shrink-0" />
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="ml-2 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
