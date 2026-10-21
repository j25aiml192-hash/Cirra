"use client";

import React, { useState } from "react";
import { AlertTriangle, ShieldAlert, CheckCircle, Clock, Eye, X } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import type { Anomaly } from "@/types";

const mockAnomaliesList: Anomaly[] = [
  {
    id: "anom-1",
    series_key: "aws.ec2.nat_gateway_bytes",
    serviceName: "AWS NAT Gateway Egress (us-east-1)",
    detected_at: "Today, 14:15 UTC",
    severity: "critical",
    status: "open",
    surgePercent: "+420%",
    currentCost: 7530,
    expectedCost: 1450,
    explanation: {
      summary: "Sudden 420% surge in NAT Gateway transfer in us-east-1 VPC",
      root_cause: "Misconfigured deployment script pulling container layers in a tight loop without local VPC endpoint caching.",
    },
  },
  {
    id: "anom-2",
    series_key: "openai.tokens.gpt4o_spike",
    serviceName: "OpenAI GPT-4o Generation API",
    detected_at: "Yesterday, 22:30 UTC",
    severity: "high",
    status: "open",
    surgePercent: "+185%",
    currentCost: 18500,
    expectedCost: 9900,
    explanation: {
      summary: "High concurrency prompt completion spike on key 'prod-copilot-svc'",
      root_cause: "Batch evaluation suite triggered without rate limiting or prompt deduplication.",
    },
  },
  {
    id: "anom-3",
    series_key: "gcp.bigquery.query_bytes_scanned",
    serviceName: "Google Cloud BigQuery",
    detected_at: "Oct 18, 09:12 UTC",
    severity: "medium",
    status: "open",
    surgePercent: "+78%",
    currentCost: 3200,
    expectedCost: 1800,
    explanation: {
      summary: "Unpartitioned full-table scan on analytics event dataset",
      root_cause: "Ad-hoc dashboard query running without date partition filter.",
    },
  },
];

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>(mockAnomaliesList);
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);

  const handleDismiss = (id: string) => {
    setAnomalies((prev) => prev.filter((a) => a.id !== id));
    if (selectedAnomaly?.id === id) {
      setSelectedAnomaly(null);
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

  return (
    <div className="p-8 space-y-6">
      <Topbar title="Sentinel Anomaly Detection" subtitle="Statistical ARIMA + MAD anomaly detection engine with root-cause insights" />

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
          value="1"
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

        {anomalies.map((anomaly) => {
          const isCritical = anomaly.severity === "critical";
          const isHigh = anomaly.severity === "high";

          const borderLeftColor =
            isCritical ? "#EF4444" : isHigh ? "#F97316" : anomaly.severity === "medium" ? "#F59E0B" : "#94A3B8";

          return (
            <div
              key={anomaly.id}
              className="cirra-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              style={{ borderLeft: `4px solid ${borderLeftColor}` }}
            >
              <div className="flex items-start gap-3.5 flex-1">
                <Badge variant={getSeverityBadgeVariant(anomaly.severity)} className="uppercase text-[10px] mt-0.5">
                  {anomaly.severity}
                </Badge>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-[#0A192F] text-sm">{anomaly.serviceName}</h4>
                    <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                      {anomaly.surgePercent}
                    </span>
                  </div>
                  <p className="text-xs text-[#475569] mt-1 max-w-2xl">
                    {anomaly.explanation?.summary}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-[#64748B]">
                    <span>Detected {anomaly.detected_at}</span>
                    <span>·</span>
                    <span className="font-mono">Current: ${anomaly.currentCost?.toLocaleString()} vs Expected: ${anomaly.expectedCost?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleDismiss(anomaly.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#475569] hover:text-[#0A192F] hover:bg-[#F0F5FD] transition-colors"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAnomaly(anomaly)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#0062E0] text-white hover:bg-[#0052C2] transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>
              </div>
            </div>
          );
        })}

        {anomalies.length === 0 && (
          <div className="cirra-card p-12 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="font-semibold text-[#0A192F]">Zero active anomalies</h4>
            <p className="text-xs text-[#64748B] mt-1">All multi-cloud spend is running within forecasted boundaries.</p>
          </div>
        )}
      </div>

      {/* Detail Modal / Drawer if an anomaly is selected */}
      {selectedAnomaly && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="cirra-card max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#D6E4F5] pb-3">
              <div className="flex items-center gap-2">
                <Badge variant={getSeverityBadgeVariant(selectedAnomaly.severity)} className="uppercase text-[10px]">
                  {selectedAnomaly.severity}
                </Badge>
                <h3 className="font-bold text-[#0A192F] text-base">{selectedAnomaly.serviceName}</h3>
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
                <span className="font-semibold text-[#334155]">Root Cause Diagnostics:</span>
                <p className="mt-1 text-[#475569] bg-[#F8FAFD] p-3 rounded-xl border border-[#D6E4F5] leading-relaxed">
                  {selectedAnomaly.explanation?.root_cause}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-[#F8FAFD] border border-[#D6E4F5] p-3 rounded-xl">
                  <span className="text-[#64748B] text-[10px] uppercase font-bold">Observed Spend</span>
                  <div className="text-base font-bold text-rose-600 mt-0.5">
                    ${selectedAnomaly.currentCost?.toLocaleString()}
                  </div>
                </div>
                <div className="bg-[#F8FAFD] border border-[#D6E4F5] p-3 rounded-xl">
                  <span className="text-[#64748B] text-[10px] uppercase font-bold">Baseline Expected</span>
                  <div className="text-base font-bold text-[#334155] mt-0.5">
                    ${selectedAnomaly.expectedCost?.toLocaleString()}
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
                onClick={() => setSelectedAnomaly(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0062E0] text-white hover:bg-[#0052C2] shadow-sm"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
