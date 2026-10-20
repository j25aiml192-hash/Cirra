"use client";

import React, { useState } from "react";
import { Plus, Check, RefreshCw, Trash2, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Badge } from "@/components/ui/Badge";
import { useConnections } from "@/hooks/useConnections";
import type { Connection } from "@/types";

type ProviderKey = "aws" | "gcp" | "azure" | "kubernetes" | "openai" | "anthropic" | "bedrock" | "vertex";

interface ProviderOption {
  key: ProviderKey;
  name: string;
  category: "Cloud" | "AI" | "Infra";
  letter: string;
  color: string;
}

const providerOptions: ProviderOption[] = [
  { key: "aws", name: "Amazon Web Services", category: "Cloud", letter: "A", color: "#F59E0B" },
  { key: "gcp", name: "Google Cloud Platform", category: "Cloud", letter: "G", color: "#3B82F6" },
  { key: "azure", name: "Microsoft Azure", category: "Cloud", letter: "M", color: "#0284C7" },
  { key: "kubernetes", name: "Kubernetes Cluster", category: "Infra", letter: "K", color: "#326CE5" },
  { key: "openai", name: "OpenAI Platform", category: "AI", letter: "O", color: "#10B981" },
  { key: "anthropic", name: "Anthropic Claude", category: "AI", letter: "C", color: "#7C3AED" },
  { key: "bedrock", name: "AWS Bedrock", category: "AI", letter: "B", color: "#F97316" },
  { key: "vertex", name: "Google Vertex AI", category: "AI", letter: "V", color: "#6366F1" },
];

export default function ConnectionsSettingsPage() {
  const { data: connections, createConnection } = useConnections();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderKey | null>(null);
  const [connName, setConnName] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "failed">("idle");
  const [localConnections, setLocalConnections] = useState<Connection[]>(connections ?? []);

  // Update when hook data arrives
  React.useEffect(() => {
    if (connections) setLocalConnections(connections);
  }, [connections]);

  const handleTestConnection = () => {
    setTestStatus("testing");
    setTimeout(() => {
      setTestStatus("success");
    }, 1000);
  };

  const handleSaveConnection = async () => {
    if (!selectedProvider || testStatus !== "success") return;
    const prov = providerOptions.find((p) => p.key === selectedProvider);
    const newConn: Connection = {
      id: `conn-${Date.now()}`,
      tenant_id: "tenant-acme",
      name: connName || `${prov?.name} Integration`,
      provider: selectedProvider,
      status: "connected",
      last_synced_at: "Just now",
    };
    setLocalConnections((prev) => [newConn, ...prev]);
    setSheetOpen(false);
    setSelectedProvider(null);
    setConnName("");
    setTestStatus("idle");
  };

  const handleRemove = (id: string) => {
    setLocalConnections((prev) => prev.filter((c) => c.id !== id));
  };

  const getProviderInfo = (providerStr: string) => {
    return (
      providerOptions.find((p) => p.key === providerStr) ?? {
        key: providerStr as ProviderKey,
        name: providerStr.toUpperCase(),
        category: "Cloud",
        letter: providerStr.charAt(0).toUpperCase(),
        color: "#6366F1",
      }
    );
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <Topbar title="Connections & Integrations" subtitle="Connect multi-cloud accounts and AI API providers with read-only scoped credentials" />
        <button
          type="button"
          onClick={() => {
            setSheetOpen(true);
            setSelectedProvider("aws");
            setTestStatus("idle");
          }}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium text-xs flex items-center gap-2 hover:bg-indigo-700 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Add Connection
        </button>
      </div>

      {/* Connection rows as white cards (grid-cols-2 gap-4) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {localConnections.map((conn) => {
          const prov = getProviderInfo(conn.provider);
          const isError = conn.status === "error";

          return (
            <div
              key={conn.id}
              className={`rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between ${
                isError
                  ? "bg-red-50/70 border border-red-200"
                  : "bg-white border border-black/5 hover:shadow-md"
              }`}
              style={{
                borderLeft: isError ? "4px solid #EF4444" : undefined,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0"
                    style={{ background: prov.color }}
                  >
                    {prov.letter}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm leading-tight">{conn.name}</h4>
                    <span className="text-xs text-slate-400">{prov.name}</span>
                  </div>
                </div>

                <Badge
                  variant={
                    conn.status === "connected"
                      ? "success"
                      : conn.status === "error"
                      ? "danger"
                      : "neutral"
                  }
                  className="capitalize text-[10px]"
                >
                  {conn.status}
                </Badge>
              </div>

              {isError && conn.errorMessage && (
                <div className="mt-3 text-xs text-red-700 bg-red-100/60 p-2.5 rounded-lg border border-red-200/50 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>{conn.errorMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100/80">
                <span className="text-xs text-slate-400">
                  Last synced {conn.last_synced_at ?? "never"}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100/60 rounded-md transition-colors"
                  >
                    Test
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(conn.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SideSheet for Add Connection */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
            onClick={() => setSheetOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Connect New Provider</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Telemetry ingested with read-only least-privilege credentials</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Provider grid (2x4) */}
              <div className="mt-5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2.5">
                  Select Provider
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {providerOptions.map((prov) => {
                    const isSelected = selectedProvider === prov.key;
                    return (
                      <button
                        key={prov.key}
                        type="button"
                        onClick={() => {
                          setSelectedProvider(prov.key);
                          setTestStatus("idle");
                        }}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[11px] font-bold"
                            style={{ background: prov.color }}
                          >
                            {prov.letter}
                          </div>
                          <span className="text-xs font-semibold text-slate-800">{prov.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Credential Fields */}
              {selectedProvider && (
                <div className="mt-6 space-y-3.5 pt-4 border-t border-slate-100">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Connection Nickname
                    </label>
                    <input
                      value={connName}
                      onChange={(e) => setConnName(e.target.value)}
                      placeholder="e.g. Production Billing"
                      className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {["aws", "bedrock"].includes(selectedProvider) && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Role ARN (Read-Only)
                        </label>
                        <input
                          placeholder="arn:aws:iam::123456789012:role/CirraCostReader"
                          className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          External ID
                        </label>
                        <input
                          defaultValue="cirra-tenant-token-98f2b"
                          readOnly
                          className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-500"
                        />
                      </div>
                    </>
                  )}

                  {["openai", "anthropic"].includes(selectedProvider) && (
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Admin Usage Read-Only API Key
                      </label>
                      <input
                        type="password"
                        placeholder="sk-admin-..."
                        className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  )}

                  {["gcp", "vertex"].includes(selectedProvider) && (
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Service Account JSON Key
                      </label>
                      <textarea
                        rows={3}
                        placeholder='{"type": "service_account", ...}'
                        className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  )}

                  {selectedProvider === "kubernetes" && (
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Prometheus / OpenCost Endpoint
                      </label>
                      <input
                        placeholder="https://opencost.internal.cluster:9003"
                        className="w-full h-9 px-3 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}

                  {/* Inline Test Connection button & status */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testStatus === "testing"}
                      className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-100 transition-colors"
                    >
                      {testStatus === "testing" ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Testing handshake...</span>
                        </>
                      ) : (
                        <span>Test Connection Handshake</span>
                      )}
                    </button>

                    {testStatus === "success" && (
                      <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Connection test successful! Ready to save.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveConnection}
                disabled={testStatus !== "success"}
                className="px-5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors shadow-sm"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
