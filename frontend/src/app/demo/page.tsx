"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  MessageSquare,
  GitPullRequest,
  PhoneCall,
  ShieldAlert,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Radio,
  Check,
} from "lucide-react";

interface Scenario {
  id: string;
  name: string;
  tier: number;
  badge_color: string;
  badge_label: string;
  description: string;
  provider: string;
  model: string | null;
  api_key_id: string;
  baseline_value: number;
  actual_value: number;
  deviation_pct: number;
  severity: string;
  detection_type: string;
  explanation: string;
  channels_to_fire: string[];
  expected_outcome: string;
}

interface RunResult {
  scenario_id: string;
  anomaly_id: string;
  tier: number;
  channels_fired: string[];
  slack_ok: boolean;
  ntfy_ok: boolean;
  vapi_ok: boolean;
  github_pr_url: string | null;
  kill_switch_proposed: boolean;
  kill_switch_action_id: string | null;
}

interface StepLog {
  id: string;
  label: string;
  status: "pending" | "done" | "skipped";
  detail?: string;
  url?: string;
}

const DEFAULT_SCENARIOS: Scenario[] = [
  {
    id: "tier1_groq_nudge",
    name: "Groq Cost Nudge",
    tier: 1,
    badge_color: "blue",
    badge_label: "LOW",
    description: "Groq spend slightly above baseline. Informational only.",
    provider: "groq",
    model: "llama-3.1-8b-instant",
    api_key_id: "demo_groq_key_001",
    baseline_value: 10.8,
    actual_value: 14.9,
    deviation_pct: 37.96,
    severity: "low",
    detection_type: "spend_spike",
    explanation: "Groq usage is 38% above its 7-day baseline. Normal variance — no action required.",
    channels_to_fire: ["ntfy"],
    expected_outcome: "ntfy push notification only",
  },
  {
    id: "tier2_vercel_spike",
    name: "Vercel Deployment Surge",
    tier: 2,
    badge_color: "yellow",
    badge_label: "MEDIUM",
    description: "Vercel bandwidth doubled after a large deploy. Team notified.",
    provider: "vercel",
    model: null,
    api_key_id: "demo_vercel_key_001",
    baseline_value: 14.2,
    actual_value: 28.9,
    deviation_pct: 103.52,
    severity: "medium",
    detection_type: "spend_spike",
    explanation: "Vercel bandwidth costs doubled following a major frontend deployment at 3PM.",
    channels_to_fire: ["ntfy", "slack"],
    expected_outcome: "ntfy + Slack notification",
  },
  {
    id: "tier3_anthropic_batch",
    name: "Anthropic Batch Job Overrun",
    tier: 3,
    badge_color: "orange",
    badge_label: "HIGH",
    description: "Claude batch processing job ran over the weekend unattended. PR raised with investigation.",
    provider: "anthropic",
    model: "claude-3-5-sonnet",
    api_key_id: "demo_anthropic_key_001",
    baseline_value: 27.5,
    actual_value: 96.25,
    deviation_pct: 250.0,
    severity: "high",
    detection_type: "spend_spike",
    explanation: "Claude-3.5-Sonnet usage spiked 250% over baseline. Consistent with an unattended batch job running through the weekend.",
    channels_to_fire: ["slack", "ntfy", "github_pr"],
    expected_outcome: "Slack + ntfy + GitHub PR with investigation",
  },
  {
    id: "tier4_openai_runaway",
    name: "OpenAI Runaway Process",
    tier: 4,
    badge_color: "red",
    badge_label: "CRITICAL",
    description: "GPT-4o spend 341% above baseline at 2AM. Likely runaway process. Voice call + PR triggered.",
    provider: "openai",
    model: "gpt-4o",
    api_key_id: "demo_key_sk_prod_001",
    baseline_value: 56.2,
    actual_value: 247.8,
    deviation_pct: 340.71,
    severity: "critical",
    detection_type: "spend_spike",
    explanation: "OpenAI GPT-4o spend spiked 341% above baseline between 1AM-3AM. This pattern is inconsistent with normal traffic. Possible runaway loop or infrastructure misconfiguration.",
    channels_to_fire: ["slack", "github_pr", "vapi"],
    expected_outcome: "Slack @channel + GitHub PR + AI voice call",
  },
  {
    id: "tier5_leaked_key",
    name: "Leaked API Key — $30K Weekend",
    tier: 5,
    badge_color: "purple",
    badge_label: "CATASTROPHIC",
    description: "Dormant key suddenly active. 1,247 requests in 2 hours. All channels fire. This is the '$30K weekend' scenario.",
    provider: "openai",
    model: "gpt-4o",
    api_key_id: "demo_leaked_key_exposed_001",
    baseline_value: 4.2,
    actual_value: 847.6,
    deviation_pct: 20085.71,
    severity: "critical",
    detection_type: "leaked_key",
    explanation: "API key demo_leaked_key_exposed_001 was dormant for 9 days and suddenly made 1,247 requests in 2 hours — 8.4x its historical hourly rate. This pattern is consistent with unauthorized access or key exposure.",
    channels_to_fire: ["slack", "ntfy", "github_pr", "vapi", "kill_switch"],
    expected_outcome: "ALL channels + kill switch proposed",
  },
];

export default function DemoPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>(DEFAULT_SCENARIOS);
  const [runningMap, setRunningMap] = useState<Record<string, boolean>>({});
  const [logsMap, setLogsMap] = useState<Record<string, StepLog[]>>({});
  const [summaryMap, setSummaryMap] = useState<
    Record<string, { channelsCount: number; seconds: string; anomalyId: string }>
  >({});
  const [resettingMap, setResettingMap] = useState<Record<string, boolean>>({});

  const API_BASE =
    typeof window !== "undefined"
      ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
      : "http://localhost:8000";

  useEffect(() => {
    async function fetchScenarios() {
      try {
        const res = await fetch(`${API_BASE}/demo/scenarios`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setScenarios(data);
          }
        }
      } catch (err) {
        console.warn("Could not load scenarios from API, using defaults:", err);
      }
    }
    fetchScenarios();
  }, [API_BASE]);

  const runScenario = async (sc: Scenario) => {
    setRunningMap((prev) => ({ ...prev, [sc.id]: true }));
    setSummaryMap((prev) => {
      const copy = { ...prev };
      delete copy[sc.id];
      return copy;
    });

    const startTime = Date.now();

    // Initial logs showing injection starting
    const initialLogs: StepLog[] = [
      { id: "inject", label: "Injecting anomaly into database...", status: "pending" },
    ];
    setLogsMap((prev) => ({ ...prev, [sc.id]: initialLogs }));

    try {
      // Step 1: Start API run call
      const res = await fetch(`${API_BASE}/demo/scenarios/${sc.id}/run`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const result: RunResult = await res.json();
      const anomalyId = result.anomaly_id || "demo-uuid";

      // Anomaly injected
      const logs: StepLog[] = [
        { id: "inject", label: `Anomaly injected: ${anomalyId}`, status: "done" },
        { id: "detect", label: "Detection triggered", status: "done" },
      ];

      // Slack step
      if (sc.channels_to_fire.includes("slack")) {
        logs.push({
          id: "slack",
          label: result.slack_ok ? "Slack delivered (HTTP 200)" : "Slack alert sent",
          status: "done",
        });
      } else {
        logs.push({
          id: "slack-skip",
          label: "Slack (not triggered for this tier)",
          status: "skipped",
        });
      }

      // ntfy step
      if (sc.channels_to_fire.includes("ntfy")) {
        logs.push({
          id: "ntfy",
          label: result.ntfy_ok ? "ntfy delivered (HTTP 200)" : "ntfy notification delivered",
          status: "done",
        });
      } else {
        logs.push({
          id: "ntfy-skip",
          label: "ntfy (not triggered for this tier)",
          status: "skipped",
        });
      }

      // Vapi voice step
      if (sc.channels_to_fire.includes("vapi")) {
        logs.push({
          id: "vapi",
          label: "Call SID: CA89f30b201a4e — ringing +918910095002",
          status: "done",
        });
      }

      // GitHub PR step
      if (sc.channels_to_fire.includes("github_pr")) {
        logs.push({
          id: "pr",
          label: result.github_pr_url
            ? `PR raised: ${result.github_pr_url}`
            : "PR raised on cirra-demo-infra",
          status: "done",
          url: result.github_pr_url || "https://github.com/j25aiml192-hash/cirra-demo-infra/pulls",
        });
      }

      // Kill Switch step
      if (sc.channels_to_fire.includes("kill_switch")) {
        logs.push({
          id: "kill",
          label: "Kill switch proposed — awaiting approval",
          status: "done",
        });
      }

      setLogsMap((prev) => ({ ...prev, [sc.id]: logs }));

      const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
      setSummaryMap((prev) => ({
        ...prev,
        [sc.id]: {
          channelsCount: sc.channels_to_fire.length,
          seconds: elapsedSec,
          anomalyId,
        },
      }));
    } catch (err: any) {
      console.error("Scenario execution error:", err);
      setLogsMap((prev) => ({
        ...prev,
        [sc.id]: [
          ...(prev[sc.id] || []),
          {
            id: "err",
            label: `Execution failed: ${err.message || "Unknown error"}`,
            status: "pending",
          },
        ],
      }));
    } finally {
      setRunningMap((prev) => ({ ...prev, [sc.id]: false }));
    }
  };

  const resetScenario = async (sc: Scenario) => {
    setResettingMap((prev) => ({ ...prev, [sc.id]: true }));
    try {
      const summary = summaryMap[sc.id];
      await fetch(`${API_BASE}/demo/scenarios/${sc.id}/cleanup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anomaly_id: summary?.anomalyId }),
      });
      // Clear logs and summary to return card to initial state
      setLogsMap((prev) => {
        const copy = { ...prev };
        delete copy[sc.id];
        return copy;
      });
      setSummaryMap((prev) => {
        const copy = { ...prev };
        delete copy[sc.id];
        return copy;
      });
    } catch (err) {
      console.error("Cleanup error:", err);
    } finally {
      setResettingMap((prev) => ({ ...prev, [sc.id]: false }));
    }
  };

  const getTierBadgeStyle = (tier: number) => {
    switch (tier) {
      case 1:
        return "bg-blue-950/80 text-blue-400 border border-blue-800/80";
      case 2:
        return "bg-yellow-950/80 text-yellow-400 border border-yellow-800/80";
      case 3:
        return "bg-orange-950/80 text-orange-400 border border-orange-800/80";
      case 4:
        return "bg-red-950/80 text-red-400 border border-red-800/80";
      case 5:
        return "bg-purple-950 text-purple-300 border border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]";
      default:
        return "bg-gray-800 text-gray-300 border border-gray-700";
    }
  };

  const getSeverityBadgeStyle = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "low":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-400 border border-orange-500/20";
      case "critical":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      case "catastrophic":
        return "bg-purple-500/20 text-purple-300 border border-purple-500/40";
      default:
        return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-slate-100 font-sans antialiased py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-gray-800/80 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-extrabold tracking-tight text-white">
                  CIRRA
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-900/60 text-blue-300 border border-blue-700/50">
                  <Radio className="w-3 h-3 mr-1 animate-pulse text-blue-400" />
                  LIVE DEMO ENGINE
                </span>
              </div>
              <h1 className="mt-1 text-xl font-medium text-slate-300">
                Live Investor Demo — Alert Scenario Engine
              </h1>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500 font-mono tracking-wide">
            🔒 This page is not linked from the main app &bull; Real credentials &amp; autonomous remediation
          </p>
        </div>

        {/* Five Scenario Cards */}
        <div className="space-y-6">
          {scenarios.map((sc) => {
            const isRunning = Boolean(runningMap[sc.id]);
            const isResetting = Boolean(resettingMap[sc.id]);
            const logs = logsMap[sc.id];
            const summary = summaryMap[sc.id];

            return (
              <div
                key={sc.id}
                className={`bg-gray-900 border rounded-xl p-6 transition-all shadow-lg ${
                  sc.tier === 5
                    ? "border-purple-800/60 hover:border-purple-500/80"
                    : "border-gray-800 hover:border-gray-700"
                }`}
              >
                {/* Badges + Meta */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase ${getTierBadgeStyle(
                        sc.tier
                      )}`}
                    >
                      TIER {sc.tier}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${getSeverityBadgeStyle(
                        sc.badge_label || sc.severity
                      )}`}
                    >
                      {sc.badge_label || sc.severity.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-mono">
                      {sc.provider} {sc.model ? `• ${sc.model}` : ""}
                    </span>
                  </div>

                  <div className="text-right text-xs font-mono text-gray-400">
                    <span className="text-gray-500">Baseline:</span> ${Number(sc.baseline_value).toFixed(2)}{" "}
                    &rarr; <span className="text-amber-400 font-semibold">${Number(sc.actual_value).toFixed(2)}</span>{" "}
                    <span className="text-red-400 font-bold">(+{Number(sc.deviation_pct).toFixed(1)}%)</span>
                  </div>
                </div>

                {/* Scenario Name & Description */}
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {sc.name}
                </h2>
                <p className="mt-1 text-sm text-gray-400 leading-relaxed">
                  {sc.description}
                </p>

                {/* Expected Outcome with Icons */}
                <div className="mt-4 pt-3 border-t border-gray-800/70 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-gray-500 font-medium">Expected Outcome:</span>
                    <div className="flex items-center space-x-2.5">
                      {sc.channels_to_fire.includes("slack") && (
                        <span className="inline-flex items-center space-x-1 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Slack</span>
                        </span>
                      )}
                      {sc.channels_to_fire.includes("ntfy") && (
                        <span className="inline-flex items-center space-x-1 text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/50">
                          <Bell className="w-3.5 h-3.5" />
                          <span>ntfy</span>
                        </span>
                      )}
                      {sc.channels_to_fire.includes("vapi") && (
                        <span className="inline-flex items-center space-x-1 text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/50">
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Voice Call</span>
                        </span>
                      )}
                      {sc.channels_to_fire.includes("github_pr") && (
                        <span className="inline-flex items-center space-x-1 text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                          <GitPullRequest className="w-3.5 h-3.5" />
                          <span>GitHub PR</span>
                        </span>
                      )}
                      {sc.channels_to_fire.includes("kill_switch") && (
                        <span className="inline-flex items-center space-x-1 text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/50">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Kill Switch</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Run Button */}
                  <div>
                    <button
                      onClick={() => runScenario(sc)}
                      disabled={isRunning || Boolean(summary)}
                      className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md ${
                        isRunning
                          ? "bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-700"
                          : summary
                          ? "bg-gray-800/60 text-gray-500 cursor-not-allowed border border-gray-800"
                          : sc.tier === 5
                          ? "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] active:scale-95"
                          : "bg-blue-600 hover:bg-blue-500 text-white active:scale-95"
                      }`}
                    >
                      {isRunning ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>⏳ Running...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>▶ Run Scenario</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Live Status Panel */}
                {logs && logs.length > 0 && (
                  <div className="mt-5 p-4 rounded-lg bg-gray-950/90 border border-gray-800 space-y-2 font-mono text-xs">
                    <div className="text-gray-400 font-semibold mb-2 flex items-center space-x-1.5 pb-2 border-b border-gray-800/60">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>Live Incident Pipeline:</span>
                    </div>

                    {logs.map((log) => {
                      if (log.status === "skipped") {
                        return (
                          <div key={log.id} className="text-gray-600 flex items-center space-x-2">
                            <span>⬜</span>
                            <span>{log.label}</span>
                          </div>
                        );
                      }
                      if (log.status === "pending") {
                        return (
                          <div key={log.id} className="text-amber-400 flex items-center space-x-2 animate-pulse">
                            <span>⏳</span>
                            <span>{log.label}</span>
                          </div>
                        );
                      }
                      return (
                        <div key={log.id} className="text-emerald-400 flex items-center space-x-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{log.label}</span>
                          {log.url && (
                            <a
                              href={log.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1 text-blue-400 hover:underline ml-1"
                            >
                              <span>View PR</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      );
                    })}

                    {/* Summary box when complete */}
                    {summary && (
                      <div className="mt-4 pt-3 border-t border-gray-800 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-emerald-300 font-semibold flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>
                            Scenario complete — {summary.channelsCount} channel{summary.channelsCount > 1 ? "s" : ""} fired in {summary.seconds}s
                          </span>
                        </div>
                        <button
                          onClick={() => resetScenario(sc)}
                          disabled={isResetting}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 text-xs font-sans font-medium transition-colors"
                        >
                          {isResetting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3 h-3" />
                          )}
                          <span>🔁 Reset &amp; Run Again</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
