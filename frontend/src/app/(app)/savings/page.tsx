"use client";

import React, { useState } from "react";
import { TrendingDown, Sparkles, Check, ArrowRight, ShieldCheck } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import type { SavingsEntry } from "@/types";

const mockSavingsEntries: SavingsEntry[] = [
  {
    id: "sav-1",
    action_type: "EC2 Instance Downsizing (m6i.4xlarge → m6i.2xlarge)",
    method: "Right-sizing idle compute",
    baseline_cost: 8400,
    realized_cost: 4200,
    savings_amount: 4200,
    confidence_badge: "99% Confidence",
    status: "realized",
    date: "Oct 12, 2026",
  },
  {
    id: "sav-2",
    action_type: "OpenAI Prompt Cache Integration (Copilot v2)",
    method: "Prefix Caching Optimization",
    baseline_cost: 16500,
    realized_cost: 8100,
    savings_amount: 8400,
    confidence_badge: "95% Confidence",
    status: "realized",
    date: "Oct 15, 2026",
  },
  {
    id: "sav-3",
    action_type: "Idle RDS Multi-AZ Snapshot & Terminate",
    method: "Orphaned test database deletion",
    baseline_cost: 3800,
    realized_cost: 200,
    savings_amount: 3600,
    confidence_badge: "98% Confidence",
    status: "pending_approval",
    date: "Oct 19, 2026",
  },
  {
    id: "sav-4",
    action_type: "S3 Infrequent Access Lifecycle Policy",
    method: "Storage tiering automation",
    baseline_cost: 6500,
    realized_cost: 2300,
    savings_amount: 4200,
    confidence_badge: "92% Confidence",
    status: "approved",
    date: "Oct 20, 2026",
  },
  {
    id: "sav-5",
    action_type: "GKE Preemptible Node Pool Conversion",
    method: "Batch workload spot utilization",
    baseline_cost: 18000,
    realized_cost: 4200,
    savings_amount: 13800,
    confidence_badge: "90% Confidence",
    status: "identified",
    date: "Oct 20, 2026",
  },
];

export default function SavingsPage() {
  const [entries, setEntries] = useState<SavingsEntry[]>(mockSavingsEntries);

  const totalIdentified = entries.reduce((acc, curr) => acc + curr.savings_amount, 0);

  const handleApprove = (id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "approved" } : e))
    );
  };

  const columns: Column<SavingsEntry>[] = [
    {
      key: "action_type",
      header: "Action Type / Strategy",
      render: (val, row) => (
        <div>
          <div className="font-semibold text-[#0A192F]">{String(val)}</div>
          <div className="text-[11px] text-[#64748B]">{row.method}</div>
        </div>
      ),
    },
    {
      key: "baseline_cost",
      header: "Baseline Cost",
      render: (val) => (
        <span className="font-mono text-xs text-[#475569]">
          ${Number(val).toLocaleString()}
        </span>
      ),
    },
    {
      key: "realized_cost",
      header: "Realized Cost",
      render: (val) => (
        <span className="font-mono text-xs text-slate-700">
          ${Number(val).toLocaleString()}
        </span>
      ),
    },
    {
      key: "savings_amount",
      header: "Monthly Savings",
      render: (val) => (
        <span className="font-mono text-sm font-bold text-emerald-600">
          +${Number(val).toLocaleString()}/mo
        </span>
      ),
    },
    {
      key: "confidence_badge",
      header: "Confidence",
      render: (val) => (
        <Badge variant="indigo">{String(val)}</Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (val, row) => {
        if (row.status === "realized") {
          return <Badge variant="success">Realized</Badge>;
        }
        if (row.status === "approved") {
          return <Badge variant="info">Approved</Badge>;
        }
        if (row.status === "pending_approval") {
          return (
            <div className="flex items-center gap-2">
              <Badge variant="warning">Requires Gate</Badge>
              <button
                type="button"
                onClick={() => handleApprove(row.id)}
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                Approve
              </button>
            </div>
          );
        }
        return <Badge variant="neutral">Identified</Badge>;
      },
    },
    {
      key: "date",
      header: "Date",
      render: (val) => (
        <span className="text-xs text-[#64748B]">{String(val)}</span>
      ),
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <Topbar title="Guaranteed Savings & Autonomous Actions" subtitle="Audit-proven cloud optimizations and mandatory human-in-the-loop safety gates" />

      {/* Hero Stat: Total identified savings $34,200 in green gradient banner */}
      <div
        style={{
          borderRadius: 20,
          padding: "24px 32px",
          background: "linear-gradient(135deg, #065F46 0%, #059669 50%, #10B981 100%)",
          color: "white",
          boxShadow: "0 8px 32px rgba(16, 185, 129, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
              padding: "4px 12px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Deterministic ROI Guarantee</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em" }}>
            ${totalIdentified.toLocaleString()}
            <span style={{ fontSize: 16, fontWeight: 500, opacity: 0.85, marginLeft: 6 }}>/ month</span>
          </div>
          <p style={{ fontSize: 13, opacity: 0.9, marginTop: 4, maxWidth: 520 }}>
            Identified recurring savings verified through pre-action baseline diffs and dry-run telemetry.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "12px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>$12,600</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Already Realized</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "12px 18px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>$21,600</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Pipeline Opportunities</div>
          </div>
        </div>
      </div>

      {/* Savings Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-semibold text-[#0A192F] text-base">Savings Ledger & Remediation Log</h3>
          <span className="text-xs text-[#64748B]">{entries.length} actions registered</span>
        </div>
        <DataTable
          columns={columns}
          data={entries}
          emptyText="No savings opportunities recorded"
        />
      </div>
    </div>
  );
}
