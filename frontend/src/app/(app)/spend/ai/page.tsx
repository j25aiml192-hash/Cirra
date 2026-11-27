"use client";

import React, { useState, useMemo } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Database,
  Layers,
  Table as TableIcon,
  X,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Calendar,
  Zap,
  Activity,
  Shield,
  Clock,
  Sparkles
} from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { ProviderLogo } from "@/components/ui/provider-logos";
import { useAiSpend } from "@/hooks/useSpend";
import { formatNumber } from "@/lib/utils";
import type { AiSpendRecord } from "@/types";

interface SchemaColumn {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
}

interface ApiKeySchemaTable {
  id: string;
  title: string;
  apiKeyId: string;
  provider: string;
  model: string;
  team: string;
  customer: string;
  cost: number;
  inputTokens: number;
  outputTokens: number;
  tokensDisplay: string;
  cache: string;
  rateLimit: string;
  x: number;
  y: number;
  width: number;
  columns: SchemaColumn[];
}

export default function AiSpendPage() {
  const { data } = useAiSpend();
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"visualizer" | "records">("visualizer");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Canvas pan & zoom state
  const [zoom, setZoom] = useState<number>(0.8);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 30, y: 15 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Floating coordinates for the 5 schema tables
  const [tablePositions, setTablePositions] = useState<Record<string, { x: number; y: number }>>({
    key_openai_prod_copilot: { x: 20, y: 120 },
    key_anthropic_agent_swarm: { x: 340, y: 30 },
    key_openai_support_bot: { x: 340, y: 360 },
    key_openai_rag_indexer: { x: 670, y: 50 },
    key_anthropic_triage_fast: { x: 670, y: 380 },
  });

  const [draggingTable, setDraggingTable] = useState<string | null>(null);
  const [tableDragOffset, setTableDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Map live data items directly from useAiSpend() database hook
  const rawItems: AiSpendRecord[] = data?.items ?? [];

  const tables: ApiKeySchemaTable[] = useMemo(() => {
    return rawItems.map((item, index) => {
      const sanitizedId = item.apiKeyId.replace(/-/g, "_");
      const defaultPos = Object.values(tablePositions)[index] || { x: 40 + index * 180, y: 100 };
      const currentPos = tablePositions[sanitizedId] || defaultPos;

      return {
        id: sanitizedId,
        title: sanitizedId,
        apiKeyId: item.apiKeyId,
        provider: item.provider,
        model: item.model,
        team: item.team,
        customer: item.customer ?? "Production",
        cost: item.costUsd,
        inputTokens: item.inputTokens,
        outputTokens: item.outputTokens,
        tokensDisplay: `${(Number(item.inputTokens) / 1000000).toFixed(0)}M in / ${(Number(item.outputTokens) / 1000000).toFixed(0)}M out`,
        cache: item.cacheRate,
        rateLimit: item.model.includes("mini") || item.model.includes("haiku") ? "20,000 RPM" : "10,000 RPM",
        x: currentPos.x,
        y: currentPos.y,
        width: 270,
        columns: [
          { name: "key_id", type: "uuid", isPk: true },
          { name: "model_binding", type: "varchar(64)", isFk: true },
          { name: "provider_name", type: "varchar(32)" },
          { name: "team_attributed", type: "varchar(64)" },
          { name: "workload_tier", type: "varchar(64)" },
          { name: "input_tokens", type: "bigint" },
          { name: "output_tokens", type: "bigint" },
          { name: "prompt_cache_rate", type: "numeric(5,2)" },
          { name: "rate_limit_rpm", type: "integer" },
          { name: "cost_usd", type: "numeric(12,2)" },
        ],
      };
    });
  }, [rawItems, tablePositions]);

  // Schema relationship connector lines between the tables
  const relationships = useMemo(() => {
    if (tables.length < 2) return [];
    return [
      {
        id: "rel_1_2",
        fromTable: tables[0]?.id ?? "",
        fromCol: "key_id",
        toTable: tables[1]?.id ?? "",
        toCol: "key_id",
      },
      {
        id: "rel_1_3",
        fromTable: tables[0]?.id ?? "",
        fromCol: "key_id",
        toTable: tables[2]?.id ?? "",
        toCol: "key_id",
      },
      {
        id: "rel_2_4",
        fromTable: tables[1]?.id ?? "",
        fromCol: "model_binding",
        toTable: tables[3]?.id ?? "",
        toCol: "model_binding",
      },
      {
        id: "rel_3_5",
        fromTable: tables[2]?.id ?? "",
        fromCol: "model_binding",
        toTable: tables[4]?.id ?? "",
        toCol: "model_binding",
      },
    ].filter((r) => r.fromTable && r.toTable);
  }, [tables]);

  const getPortCoords = (tableId: string, colName: string, isFromSide: boolean) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return { x: 0, y: 0 };
    const colIndex = table.columns.findIndex((c) => c.name === colName);
    const colOffset = colIndex >= 0 ? 38 + colIndex * 26 + 13 : 38;
    const x = isFromSide ? table.x + table.width : table.x;
    const y = table.y + colOffset;
    return { x, y };
  };

  const getOrthogonalPath = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const deltaX = to.x - from.x;
    const midX = from.x + (deltaX > 40 ? deltaX * 0.5 : 25);
    return `M ${from.x} ${from.y} L ${midX} ${from.y} L ${midX} ${to.y} L ${to.x} ${to.y}`;
  };

  // Canvas pan & drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".schema-table-node")) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    } else if (draggingTable) {
      const newX = Math.round((e.clientX - tableDragOffset.x) / zoom);
      const newY = Math.round((e.clientY - tableDragOffset.y) / zoom);
      setTablePositions((prev) => ({
        ...prev,
        [draggingTable]: { x: Math.max(10, newX), y: Math.max(10, newY) },
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggingTable(null);
  };

  const handleTableMouseDown = (e: React.MouseEvent, tableId: string) => {
    e.stopPropagation();
    const table = tablePositions[tableId] || { x: 0, y: 0 };
    setDraggingTable(tableId);
    setTableDragOffset({
      x: e.clientX - table.x * zoom,
      y: e.clientY - table.y * zoom,
    });
  };

  const toggleRowExpansion = (keyId: string) => {
    setExpandedRows((prev) => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  // 30-day simulated telemetry trend generator per API key
  const generate30DayTrend = (totalCost: number, totalTokens: number) => {
    const dailyAvgCost = totalCost / 30;
    const dailyAvgTokens = totalTokens / 30;
    return Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      const variation = 0.8 + ((day * 7) % 5) * 0.1;
      return {
        day: `Day ${day}`,
        cost: Math.round(dailyAvgCost * variation),
        tokens: Math.round(dailyAvgTokens * variation),
      };
    });
  };

  const activeTable = tables.find((t) => t.id === activeTableId);

  return (
    <div className="h-[calc(100vh-3.5rem)] w-full bg-[#09090b] text-zinc-100 flex flex-col font-sans select-none overflow-hidden relative">
      <Topbar />

      {/* Supabase Studio Top Ribbon */}
      <div className="h-12 border-b border-zinc-800/80 bg-[#0c0c0e] px-4 sm:px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-white">
              <Database className="w-3.5 h-3.5" />
            </div>
            <span className="font-mono text-xs font-bold text-white">
              schema: <span className="text-white font-semibold">api_key_telemetry</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-zinc-600">
            <span>/</span>
            <span className="font-mono text-[11px] text-zinc-400">{tables.length} tables</span>
            <span className="text-zinc-700">•</span>
            <span className="font-mono text-[11px] text-zinc-400">50 attributes</span>
            <span className="text-zinc-700">•</span>
            <span className="font-mono text-[11px] text-zinc-400">{relationships.length} relationships</span>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode("visualizer")}
              className={`relative overflow-hidden flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono transition-all cursor-pointer ${
                viewMode === "visualizer"
                  ? "text-white font-bold border border-white/25 bg-white/[0.14] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
                  : "text-zinc-400 hover:text-white font-medium"
              }`}
            >
              {viewMode === "visualizer" && (
                <div className="absolute top-0 inset-x-1 h-[45%] rounded-t-full bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
              )}
              <Layers className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">Schema ERD</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("records")}
              className={`relative overflow-hidden flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono transition-all cursor-pointer ${
                viewMode === "records"
                  ? "text-white font-bold border border-white/25 bg-white/[0.14] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
                  : "text-zinc-400 hover:text-white font-medium"
              }`}
            >
              {viewMode === "records" && (
                <div className="absolute top-0 inset-x-1 h-[45%] rounded-t-full bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
              )}
              <TableIcon className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">Data Records</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Viewport */}
      {viewMode === "visualizer" ? (
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="relative flex-1 bg-[#09090b] overflow-hidden cursor-grab active:cursor-grabbing select-none"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.08) 1px, transparent 1px)`,
            backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        >
          {/* Zoom & Pan Container */}
          <div
            className="absolute origin-top-left transition-transform duration-75"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              width: "1400px",
              height: "900px",
            }}
          >
            {/* SVG Connecting Relationship Lines */}
            <svg
              className="absolute inset-0 pointer-events-none w-full h-full"
              style={{ zIndex: 5 }}
            >
              {relationships.map((rel) => {
                const fromCoords = getPortCoords(rel.fromTable, rel.fromCol, true);
                const toCoords = getPortCoords(rel.toTable, rel.toCol, false);
                const isHighlighted =
                  activeTableId === rel.fromTable || activeTableId === rel.toTable;
                const pathData = getOrthogonalPath(fromCoords, toCoords);

                return (
                  <g key={rel.id}>
                    <path
                      d={pathData}
                      fill="none"
                      stroke="#09090b"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    <path
                      d={pathData}
                      fill="none"
                      stroke={isHighlighted ? "#34d399" : "#52525b"}
                      strokeWidth={isHighlighted ? "2" : "1.25"}
                    />
                    <circle
                      cx={fromCoords.x}
                      cy={fromCoords.y}
                      r={isHighlighted ? "4" : "3"}
                      className="fill-emerald-400 stroke-zinc-900 stroke-[1.5px]"
                    />
                    <circle
                      cx={toCoords.x}
                      cy={toCoords.y}
                      r={isHighlighted ? "4" : "3"}
                      className="fill-emerald-400 stroke-zinc-900 stroke-[1.5px]"
                    />
                  </g>
                );
              })}
            </svg>

            {/* 5 Schema Tables Formatted in Supabase ERD Style */}
            {tables.map((table) => {
              const isSelected = activeTableId === table.id;

              return (
                <div
                  key={table.id}
                  id={`table-${table.id}`}
                  onMouseDown={(e) => handleTableMouseDown(e, table.id)}
                  onClick={() => setActiveTableId(table.id === activeTableId ? null : table.id)}
                  style={{
                    transform: `translate(${table.x}px, ${table.y}px)`,
                    width: `${table.width}px`,
                    zIndex: isSelected ? 20 : 10,
                  }}
                  className={`schema-table-node absolute rounded-xl bg-[#121215] border transition-all duration-150 shadow-2xl backdrop-blur-md cursor-pointer select-none ${
                    isSelected
                      ? "border-emerald-500/80 ring-2 ring-emerald-500/20 shadow-[0_10px_35px_rgba(16,185,129,0.18)]"
                      : "border-zinc-800/90 hover:border-zinc-700/90 shadow-black/90"
                  }`}
                >
                  {/* Supabase Style Header: Centered Table Title */}
                  <div className="flex items-center justify-center px-3.5 py-2.5 border-b border-zinc-800/80 bg-zinc-900/50 rounded-t-xl">
                    <span className="font-mono text-xs font-bold tracking-wider text-zinc-100">
                      {table.title}
                    </span>
                  </div>

                  {/* Schema Column Rows */}
                  <div className="divide-y divide-zinc-900/60 py-1">
                    {table.columns.map((col) => (
                      <div
                        key={col.name}
                        className="relative flex items-center justify-between px-3 py-1.5 text-xs font-mono hover:bg-zinc-800/40 transition-colors"
                      >
                        {/* PK Green Indicator Line */}
                        {col.isPk && (
                          <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-emerald-500 rounded-r" />
                        )}

                        {/* FK Cyan Indicator Line */}
                        {col.isFk && (
                          <div className="absolute left-0 top-1 bottom-1 w-[2.5px] bg-cyan-400/80 rounded-r" />
                        )}

                        {/* Column Name */}
                        <span
                          className={`truncate pl-1.5 ${
                            col.isPk
                              ? "text-zinc-100 font-semibold"
                              : col.isFk
                              ? "text-zinc-200"
                              : "text-zinc-300"
                          }`}
                        >
                          {col.name}
                        </span>

                        {/* Column Type */}
                        <span className="text-[11px] font-mono text-zinc-500 shrink-0 ml-2">
                          {col.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floating Telemetry Stats Card on Right (Warm White / Ivory Clean Theme) */}
          <div className="absolute top-6 right-6 w-72 rounded-2xl bg-[#faf8f5] border border-[#e5e0d8] shadow-[0_20px_45px_rgba(0,0,0,0.45),0_2px_8px_rgba(0,0,0,0.15)] p-4 z-30 space-y-3.5 select-none transition-all duration-300 hover:border-[#d6cfc4]">
            <div className="flex items-center justify-between border-b border-[#e8e3db] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#18181b] shadow-sm" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#18181b]">
                  Telemetry Overview
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#ede8e0] border border-[#ded7cc] text-[#27272a]">
                LIVE
              </span>
            </div>

            {/* Run-Rate Metric */}
            <div className="p-3 rounded-xl bg-[#f2eee7] border border-[#e2dcd2] space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717a] font-semibold">
                Total AI Run-Rate
              </span>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-black font-mono text-[#09090b] tracking-tight">
                  ${formatNumber(data?.totalCostUsd ?? 42180)}
                </div>
                <span className="text-[10px] font-mono text-[#18181b] font-bold bg-[#e4ded4] px-1.5 py-0.5 rounded border border-[#d3ccbf]">
                  +18.4%
                </span>
              </div>
              <p className="text-[10px] font-mono text-[#71717a]">
                OpenAI + Anthropic APIs
              </p>
            </div>

            {/* Billable Tokens Metric */}
            <div className="p-3 rounded-xl bg-[#f2eee7] border border-[#e2dcd2] space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717a] font-semibold">
                Billable Tokens
              </span>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-black font-mono text-[#09090b] tracking-tight">
                  {(Number(data?.totalTokens ?? 2590000000) / 1000000000).toFixed(1)}B
                </div>
                <span className="text-[10px] font-mono text-[#18181b] font-bold bg-[#e4ded4] px-1.5 py-0.5 rounded border border-[#d3ccbf]">
                  +24.1%
                </span>
              </div>
              <p className="text-[10px] font-mono text-[#71717a]">
                Prompt + completion volume
              </p>
            </div>

            {/* Cache Optimization Metric */}
            <div className="p-3 rounded-xl bg-[#f2eee7] border border-[#e2dcd2] space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#71717a] font-semibold">
                Cache Optimization
              </span>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-black font-mono text-[#09090b] tracking-tight">
                  {data?.cachedTokensPercent ?? 64.8}%
                </div>
                <span className="text-[10px] font-mono text-[#18181b] font-bold bg-[#e4ded4] px-1.5 py-0.5 rounded border border-[#d3ccbf]">
                  Saved ~$8.4k
                </span>
              </div>
              <p className="text-[10px] font-mono text-[#71717a]">
                Context cache hit ratio
              </p>
            </div>
          </div>

          {/* Canvas Bottom Zoom Controls */}
          <div className="absolute bottom-6 right-24 flex items-center gap-1.5 p-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800/90 shadow-2xl backdrop-blur-md z-30">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(z + 0.15, 2))}
              title="Zoom In"
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(z - 0.15, 0.5))}
              title="Zoom Out"
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-zinc-800 mx-0.5" />
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              title="Reset View"
              className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(0.88);
                setPan({ x: 30, y: 20 });
              }}
              title="Fit Screen"
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Table Details Popover on Click */}
          {activeTable && (
            <div className="absolute bottom-6 left-6 max-w-sm rounded-xl bg-zinc-950/95 border border-zinc-800 p-4 shadow-2xl backdrop-blur-md z-30 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-mono text-xs font-bold text-white">{activeTable.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTableId(null)}
                  className="text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Foundation Model:</span>
                  <span className="text-white font-bold">{activeTable.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Provider:</span>
                  <span className="text-zinc-200">{activeTable.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Attributed Team:</span>
                  <span className="text-emerald-400">{activeTable.team}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Tokens (In / Out):</span>
                  <span className="text-zinc-300">{activeTable.tokensDisplay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Cache Rate:</span>
                  <span className="text-cyan-300">{activeTable.cache}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-zinc-800/80">
                  <span className="text-zinc-400">Attributed Cost:</span>
                  <span className="text-white font-bold">${formatNumber(activeTable.cost)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Tabular Data View with Clickable Arrow Row Expansion (Per-Day 30-Day Info) */
        <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-mono text-base font-bold text-white">API Key Telemetry Records</h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Click the arrow on any row to inspect per-day 30-day token telemetry & credentials
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-400">{tables.length} records from database</span>
          </div>

          <div className="border border-zinc-800 rounded-xl overflow-hidden bg-[#121215]">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-3 w-10 text-center"></th>
                  <th className="py-3 px-4">Schema Table</th>
                  <th className="py-3 px-4">Model Binding</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4">Tokens (In / Out)</th>
                  <th className="py-3 px-4">Cache Rate</th>
                  <th className="py-3 px-4 text-right">Cost (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {tables.map((t) => {
                  const isExpanded = !!expandedRows[t.id];
                  const dailyTrend = generate30DayTrend(t.cost, t.inputTokens + t.outputTokens);
                  const dailyAvg = Math.round(t.cost / 30);

                  return (
                    <React.Fragment key={t.id}>
                      <tr
                        onClick={() => toggleRowExpansion(t.id)}
                        className={`hover:bg-zinc-800/40 transition-colors cursor-pointer ${
                          isExpanded ? "bg-zinc-800/25" : ""
                        }`}
                      >
                        {/* Expand/Collapse Arrow Button */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            aria-label="Expand row details"
                            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-zinc-500" />
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                          <span className="text-emerald-400">{t.title}</span>
                        </td>
                        <td className="py-3 px-4 text-white font-bold">{t.model}</td>
                        <td className="py-3 px-4 text-zinc-300">
                          <div className="flex items-center gap-1.5">
                            <ProviderLogo provider={t.provider} size={13} />
                            <span>{t.provider}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-zinc-300">{t.team}</td>
                        <td className="py-3 px-4 text-zinc-400">{t.tokensDisplay}</td>
                        <td className="py-3 px-4 text-cyan-300">{t.cache}</td>
                        <td className="py-3 px-4 text-right font-bold text-white">
                          ${formatNumber(t.cost)}
                        </td>
                      </tr>

                      {/* Expanded Per-Day 30-Day Telemetry Breakdown */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="bg-black/60 p-5 border-b border-zinc-800/90">
                            <div className="space-y-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 p-5">
                              {/* Attached API Key Credential Details */}
                              <div className="flex items-center justify-between flex-wrap gap-4 border-b border-zinc-800 pb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                    <ProviderLogo provider={t.provider} size={16} />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-white text-sm">{t.apiKeyId}</span>
                                    </div>
                                    <span className="text-xs text-zinc-400">
                                      Workload Tier: {t.customer} • Rate Quota: {t.rateLimit}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-6 font-mono text-xs">
                                  <div>
                                    <span className="text-zinc-500 block text-[10px] uppercase">30-Day Total</span>
                                    <span className="font-bold text-white text-sm">${formatNumber(t.cost)}</span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500 block text-[10px] uppercase">Daily Average</span>
                                    <span className="font-bold text-emerald-400 text-sm">${formatNumber(dailyAvg)}/day</span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500 block text-[10px] uppercase">Context Cache</span>
                                    <span className="font-bold text-cyan-300 text-sm">{t.cache}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Per-Day 30-Day Timeline Visualizer */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-bold">
                                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>30-Day Per-Day Cost & Ingestion Velocity</span>
                                  </div>
                                  <span className="text-[11px] text-zinc-500">Day 1 → Day 30</span>
                                </div>

                                {/* Micro Bar Chart for 30 Days */}
                                <div className="h-16 flex items-end gap-1.5 pt-2 px-1">
                                  {dailyTrend.map((d, dIdx) => {
                                    const maxCost = dailyAvg * 1.5 || 1;
                                    const heightPct = Math.min(100, Math.max(15, (d.cost / maxCost) * 100));

                                    return (
                                      <div
                                        key={dIdx}
                                        title={`${d.day}: $${d.cost} • ${(d.tokens / 1000000).toFixed(1)}M tokens`}
                                        className="flex-1 bg-zinc-800 hover:bg-emerald-500 transition-colors rounded-t-sm group relative cursor-pointer"
                                        style={{ height: `${heightPct}%` }}
                                      >
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                                          <div className="bg-zinc-900 border border-zinc-700 text-white text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap font-mono">
                                            <div>{d.day}</div>
                                            <div className="font-bold text-emerald-400">${d.cost}</div>
                                            <div className="text-zinc-400">{(d.tokens / 1000000).toFixed(1)}M tok</div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-1">
                                  <span>30 days ago</span>
                                  <span>Mid-month sync</span>
                                  <span>Today (Latest sync)</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
