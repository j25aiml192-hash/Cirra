"use client";

import * as React from "react";
import { PlugZap, Plus, CheckCircle2, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useConnections } from "@/hooks/useConnections";
import type { Connection } from "@/types/api";

const mockConnections: Connection[] = [
  {
    id: "c1",
    tenant_id: "t1",
    name: "AWS Production Account",
    provider: "aws",
    status: "connected",
    last_synced_at: "2024-10-20T10:00:00Z",
  },
  {
    id: "c2",
    tenant_id: "t1",
    name: "OpenAI Organization",
    provider: "openai",
    status: "connected",
    last_synced_at: "2024-10-20T11:30:00Z",
  },
];

export default function ConnectionsPage() {
  const { data } = useConnections();
  const connections = data || mockConnections;

  const columns = [
    {
      key: "name",
      header: "Connection Name",
      render: (row: Connection) => (
        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{row.name}</div>
      ),
    },
    {
      key: "provider",
      header: "Provider",
      render: (row: Connection) => (
        <Badge variant="outline" className="uppercase font-mono text-[10px]">
          {row.provider}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row: Connection) => (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Active</span>
        </div>
      ),
    },
    {
      key: "last_synced_at",
      header: "Last Synchronized",
      render: (row: Connection) => (
        <span className="text-xs text-zinc-400">
          {row.last_synced_at ? new Date(row.last_synced_at).toLocaleString() : "Never"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Cloud & LLM Provider Connections
          </h1>
          <p className="text-sm text-zinc-500">
            Encrypted credentials stored via AES-256 with tenant isolation.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Connect Provider
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Connectors</CardTitle>
          <CardDescription>Scheduled ingest pipelines polling billing reports every 6 hours</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={connections}
            keyExtractor={(row) => row.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
