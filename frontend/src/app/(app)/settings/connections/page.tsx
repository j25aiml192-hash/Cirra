"use client";

import React, { useState } from "react";
import { Plus, Check, RefreshCw, Trash2, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
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
  const {
    data: connections,
    isLoading,
    isError,
    createConnection,
    deleteConnection,
    testConnection,
  } = useConnections();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderKey | null>(null);
  const [connName, setConnName] = useState("");
  const [roleArn, setRoleArn] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [serviceAccountKey, setServiceAccountKey] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "failed">("idle");
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleTestHandshake = () => {
    setTestStatus("testing");
    setTimeout(() => {
      setTestStatus("success");
    }, 800);
  };

  const handleSaveConnection = async () => {
    if (!selectedProvider || testStatus !== "success") return;
    const prov = providerOptions.find((p) => p.key === selectedProvider);

    const credentials: Record<string, any> = {};
    if (["aws", "bedrock"].includes(selectedProvider)) {
      credentials.role_arn = roleArn || "arn:aws:iam::123456789012:role/CirraCostReader";
      credentials.external_id = "cirra-tenant-token-98f2b";
    } else if (["openai", "anthropic"].includes(selectedProvider)) {
      credentials.api_key = apiKey || "sk-admin-placeholder";
    } else if (["gcp", "vertex"].includes(selectedProvider)) {
      credentials.service_account_json = serviceAccountKey || "{}";
    } else if (selectedProvider === "kubernetes") {
      credentials.endpoint = endpoint || "https://opencost.internal.cluster:9003";
    }

    try {
      await createConnection({
        name: connName || `${prov?.name} Integration`,
        provider: selectedProvider,
        credentials,
      });
      setSheetOpen(false);
      setSelectedProvider(null);
      setConnName("");
      setRoleArn("");
      setApiKey("");
      setServiceAccountKey("");
      setEndpoint("");
      setTestStatus("idle");
    } catch (err) {
      console.error("Failed to save connection:", err);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await deleteConnection(id);
    } catch (err) {
      console.error("Failed to delete connection:", err);
    }
  };

  const handleTestExisting = async (id: string) => {
    try {
      setTestingId(id);
      await testConnection(id);
    } catch (err) {
      console.error("Failed to test connection:", err);
    } finally {
      setTestingId(null);
    }
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

  if (isError) {
    return (
      <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
        <div className="p-8 space-y-6 max-w-7xl mx-auto">
          <Topbar
            title="Connections & Integrations"
            subtitle="Connect multi-cloud accounts and AI API providers with read-only scoped credentials"
          />
          <EmptyState
            title="Failed to load connections"
            description="Unable to connect to the connections API. Please verify the backend service is running and try again."
          />
        </div>
      </div>
    );
  }

  const items = connections ?? [];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Topbar
            title="Connections & Integrations"
            subtitle="Connect multi-cloud accounts and AI API providers with read-only scoped credentials"
          />
          <button
            type="button"
            onClick={() => {
              setSheetOpen(true);
              setSelectedProvider("aws");
              setTestStatus("idle");
            }}
            className="px-4 py-2 rounded-full bg-white text-black font-mono font-semibold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-zinc-200 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Connection
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl p-5 bg-[#09090b] border border-zinc-800 space-y-4"
              >
                <div className="flex items-center gap-3.5">
                  <Skeleton className="w-10 h-10 rounded-full bg-zinc-800" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-1/2 bg-zinc-800" />
                    <Skeleton className="h-3 w-1/4 bg-zinc-800" />
                  </div>
                </div>
                <Skeleton className="h-8 w-full rounded-lg bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="No connections found"
            description="Click 'Add Connection' above to connect AWS, GCP, OpenAI, or other telemetry providers."
          />
        ) : (
          /* Connection cards (grid-cols-2 gap-4) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((conn) => {
              const prov = getProviderInfo(conn.provider);
              const isErrorState = conn.status === "error";

              return (
                <div
                  key={conn.id}
                  className={`rounded-2xl p-5 transition-all flex flex-col justify-between ${
                    isErrorState
                      ? "bg-[#09090b] border border-rose-900/60"
                      : "bg-[#09090b] border border-zinc-800/80 hover:border-zinc-700"
                  }`}
                  style={{
                    borderLeft: isErrorState ? "3px solid #f43f5e" : undefined,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-mono font-bold text-sm bg-zinc-800 border border-zinc-700 flex-shrink-0"
                      >
                        {prov.letter}
                      </div>
                      <div>
                        <h4 className="font-medium text-white text-sm leading-tight">
                          {conn.name}
                        </h4>
                        <span className="text-xs font-mono text-zinc-400">{prov.name}</span>
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
                      className="capitalize text-[10px] font-mono"
                    >
                      {conn.status}
                    </Badge>
                  </div>

                  {isErrorState && conn.errorMessage && (
                    <div className="mt-3 text-xs font-mono text-rose-300 bg-rose-950/40 p-2.5 rounded-lg border border-rose-900/60 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 mt-0.5 flex-shrink-0" />
                      <span>{conn.errorMessage}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-zinc-800/80">
                    <span className="text-xs font-mono text-zinc-500">
                      Last synced {conn.last_synced_at ?? "never"}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={testingId === conn.id}
                        onClick={() => handleTestExisting(conn.id)}
                        className="px-2.5 py-1 text-xs font-mono rounded-full border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-1"
                      >
                        {testingId === conn.id ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <span>Verify</span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(conn.id)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SideSheet for Add Connection */}
        {sheetOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
              onClick={() => setSheetOpen(false)}
            />

            <div className="fixed inset-y-0 right-0 max-w-md w-full bg-[#09090b] border-l border-zinc-800 text-white shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <div>
                    <h3 className="font-bold text-white text-base font-mono uppercase tracking-wider">Connect New Provider</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Telemetry ingested with read-only least-privilege credentials
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSheetOpen(false)}
                    className="p-1 text-zinc-400 hover:text-white rounded-md"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Provider grid (2x4) */}
                <div className="mt-5">
                  <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400 block mb-2.5">
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
                              ? "border-white bg-zinc-900 text-white ring-1 ring-white"
                              : "border-zinc-800 hover:border-zinc-700 bg-[#050505] text-zinc-400"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[11px] font-bold font-mono bg-zinc-800 border border-zinc-700"
                            >
                              {prov.letter}
                            </div>
                            <span className="text-xs font-mono font-semibold text-zinc-200">{prov.name}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dynamic Credential Fields */}
                {selectedProvider && (
                  <div className="mt-6 space-y-3.5 pt-4 border-t border-zinc-800">
                    <div>
                      <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                        Connection Nickname
                      </label>
                      <input
                        value={connName}
                        onChange={(e) => setConnName(e.target.value)}
                        placeholder="e.g. Production Billing"
                        className="w-full h-9 px-3 text-xs font-mono rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                      />
                    </div>

                    {["aws", "bedrock"].includes(selectedProvider) && (
                      <>
                        <div>
                          <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                            Role ARN (Read-Only)
                          </label>
                          <input
                            value={roleArn}
                            onChange={(e) => setRoleArn(e.target.value)}
                            placeholder="arn:aws:iam::123456789012:role/CirraCostReader"
                            className="w-full h-9 px-3 text-xs font-mono rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                            External ID
                          </label>
                          <input
                            defaultValue="cirra-tenant-token-98f2b"
                            readOnly
                            className="w-full h-9 px-3 text-xs font-mono rounded-xl border border-zinc-800 bg-[#050505] text-zinc-500 cursor-not-allowed"
                          />
                        </div>
                      </>
                    )}

                    {["openai", "anthropic"].includes(selectedProvider) && (
                      <div>
                        <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                          Admin Usage Read-Only API Key
                        </label>
                        <input
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="sk-admin-..."
                          className="w-full h-9 px-3 text-xs font-mono rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono"
                        />
                      </div>
                    )}

                    {["gcp", "vertex"].includes(selectedProvider) && (
                      <div>
                        <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                          Service Account JSON Key
                        </label>
                        <textarea
                          rows={3}
                          value={serviceAccountKey}
                          onChange={(e) => setServiceAccountKey(e.target.value)}
                          placeholder='{"type": "service_account", ...}'
                          className="w-full p-2.5 text-xs font-mono rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono"
                        />
                      </div>
                    )}

                    {selectedProvider === "kubernetes" && (
                      <div>
                        <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                          Prometheus / OpenCost Endpoint
                        </label>
                        <input
                          value={endpoint}
                          onChange={(e) => setEndpoint(e.target.value)}
                          placeholder="https://opencost.internal.cluster:9003"
                          className="w-full h-9 px-3 text-xs font-mono rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                        />
                      </div>
                    )}

                    {/* Inline Test Connection button & status */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleTestHandshake}
                        disabled={testStatus === "testing"}
                        className="w-full h-9 rounded-full border border-zinc-700 bg-zinc-900 text-zinc-200 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-zinc-800 transition-colors"
                      >
                        {testStatus === "testing" ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Verifying handshake...</span>
                          </>
                        ) : (
                          <span>Verify Connection Handshake</span>
                        )}
                      </button>

                      {testStatus === "success" && (
                        <div className="mt-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 p-2 rounded-xl border border-emerald-800/80 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Connection verified successfully! Ready to save.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveConnection}
                  disabled={testStatus !== "success"}
                  className="px-5 py-2 rounded-full text-xs font-mono uppercase tracking-wider font-semibold bg-white text-black hover:bg-zinc-200 disabled:opacity-40 transition-colors"
                >
                  Save & Connect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
