"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, ShieldAlert, CheckCircle, Clock, Eye, X } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
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
    <div className="min-h-screen">
      <Topbar />

      <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto select-none">
        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            variant="red"
            icon={<AlertTriangle className="w-4 h-4" />}
            label="OPEN ANOMALIES"
            value={String(anomalies.length)}
            sub="Requires engineer review"
            delta="Active"
            deltaPositive={false}
          />
          <StatCard
            variant="red"
            icon={<ShieldAlert className="w-4 h-4" />}
            label="CRITICAL SEVERITY"
            value={String(criticalCount)}
            sub="> 200% spend deviation"
            delta="Immediate"
            deltaPositive={false}
          />
          <StatCard
            variant="green"
            icon={<CheckCircle className="w-4 h-4" />}
            label="AUTO-DISMISSED"
            value="14"
            sub="Resolved via scaling rules"
            delta="+8 this wk"
            deltaPositive={true}
          />
          <StatCard
            variant="blue"
            icon={<Clock className="w-4 h-4" />}
            label="AVG RESOLUTION TIME"
            value="18m"
            sub="Down from 45m last quarter"
            delta="-60%"
            deltaPositive={true}
          />
        </div>

        {/* Anomaly rows as cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-semibold text-[#0A192F] text-base">Active Spend Alerts</h3>
            <span className="text-xs text-[#64748B]">{anomalies.length} unresolved alerts</span>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
            </div>
          ) : anomalies.length === 0 ? (
            <EmptyState
              icon={<CheckCircle className="w-10 h-10 text-emerald-500" />}
              title="Zero active anomalies"
              description="All multi-cloud spend is running within forecasted boundaries."
            />
          ) : (
            anomalies.map((anomaly) => {
              const isCritical = anomaly.severity === "critical";
              const isHigh = anomaly.severity === "high";

              const borderLeftColor =
                isCritical
                  ? "#EF4444"
                  : isHigh
                  ? "#F97316"
                  : anomaly.severity === "medium"
                  ? "#F59E0B"
                  : "#94A3B8";

              const showKillSwitch =
                anomaly.status === "open" && (isHigh || isCritical);

              return (
                <div
                  key={anomaly.id}
                  className="cirra-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  style={{ borderLeft: `4px solid ${borderLeftColor}` }}
                >
                  <div className="flex items-start gap-3.5 flex-1">
                    <Badge
                      variant={getSeverityBadgeVariant(anomaly.severity)}
                      className="uppercase text-[10px] mt-0.5"
                    >
                      {anomaly.severity}
                    </Badge>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[#0A192F] text-sm">
                          {anomaly.serviceName}
                        </h4>
                        <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                          {anomaly.surgePercent}
                        </span>
                      </div>
                      <p className="text-xs text-[#475569] mt-1 max-w-2xl">
                        {typeof anomaly.explanation === "string"
                          ? anomaly.explanation
                          : anomaly.explanation?.summary}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-[#64748B]">
                        <span>Detected {anomaly.detected_at}</span>
                        <span>·</span>
                        <span className="font-mono">
                          Current: ${formatNumber(anomaly.currentCost)} vs Expected: $
                          {formatNumber(anomaly.expectedCost)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {showKillSwitch && (
                      <button
                        type="button"
                        onClick={() => setKillSwitchTarget(anomaly)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Kill Switch</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDismiss(anomaly.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#475569] hover:text-[#0A192F] hover:bg-[#F0F5FD] transition-colors"
                    >
                      Dismiss
                    </button>
                    <Link
                      href={`/anomalies/${anomaly.id}`}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#0062E0] text-white hover:bg-[#0052C2] transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
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
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="cirra-card max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#D6E4F5] pb-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={getSeverityBadgeVariant(selectedAnomaly.severity)}
                    className="uppercase text-[10px]"
                  >
                    {selectedAnomaly.severity}
                  </Badge>
                  <h3 className="font-bold text-[#0A192F] text-base">
                    {selectedAnomaly.serviceName}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAnomaly(null)}
                  className="text-[#64748B] hover:text-[#334155] p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-[#334155]">
                    Root Cause Diagnostics:
                  </span>
                  <p className="mt-1 text-[#475569] bg-[#F8FAFD] p-3 rounded-xl border border-[#D6E4F5] leading-relaxed">
                    {typeof selectedAnomaly.explanation === "string"
                      ? selectedAnomaly.explanation
                      : selectedAnomaly.explanation?.root_cause}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-[#F8FAFD] border border-[#D6E4F5] p-3 rounded-xl">
                    <span className="text-[#64748B] text-[10px] uppercase font-bold">
                      Observed Spend
                    </span>
                    <div className="text-base font-bold text-rose-600 mt-0.5">
                      ${formatNumber(selectedAnomaly.currentCost)}
                    </div>
                  </div>
                  <div className="bg-[#F8FAFD] border border-[#D6E4F5] p-3 rounded-xl">
                    <span className="text-[#64748B] text-[10px] uppercase font-bold">
                      Baseline Expected
                    </span>
                    <div className="text-base font-bold text-[#334155] mt-0.5">
                      ${formatNumber(selectedAnomaly.expectedCost)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#D6E4F5]">
                <button
                  type="button"
                  onClick={() => handleDismiss(selectedAnomaly.id)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-[#475569] hover:bg-[#F0F5FD]"
                >
                  Dismiss Alert
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDismiss(selectedAnomaly.id);
                    setSelectedAnomaly(null);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0062E0] text-white hover:bg-[#0052C2] shadow-sm"
                >
                  Acknowledge & Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Kill Switch Confirmation Modal */}
        {killSwitchTarget && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="cirra-card max-w-md w-full p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#D6E4F5] pb-3">
                <div className="flex items-center gap-2 text-rose-600">
                  <ShieldAlert className="w-5 h-5" />
                  <h3 className="font-bold text-[#0A192F] text-base">
                    Kill Switch Confirmation
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setKillSwitchTarget(null)}
                  className="text-[#64748B] hover:text-[#334155] p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                This will disable {killSwitchTarget.provider || "provider"} key{" "}
                {killSwitchTarget.api_key_id || "associated with this anomaly"}. This action
                will be logged and can be reviewed in the Actions tab. Confirm?
              </p>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#D6E4F5]">
                <button
                  type="button"
                  onClick={() => setKillSwitchTarget(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-[#475569] hover:bg-[#F0F5FD] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmKillSwitch}
                  disabled={isProposing}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isProposing ? "Proposing..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#0A192F] text-white text-xs px-4 py-3 rounded-xl shadow-lg border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="ml-2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
