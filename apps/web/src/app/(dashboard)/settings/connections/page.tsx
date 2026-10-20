"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Badge,
  Button,
} from "@cirra/ui";
import { PlugZap, Plus, CheckCircle2, RefreshCw, AlertCircle } from "lucide-react";
import type { Connection } from "@cirra/types";

const mockConnections: Connection[] = [
  {
    id: "conn-aws-1",
    tenantId: "demo-tenant-1",
    name: "Production AWS (Role Delegation)",
    provider: "aws",
    status: "connected",
    lastSyncedAt: "2026-10-20T14:00:00Z",
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-10-20T14:00:00Z",
  },
  {
    id: "conn-openai-1",
    tenantId: "demo-tenant-1",
    name: "OpenAI Enterprise Org",
    provider: "openai",
    status: "connected",
    lastSyncedAt: "2026-10-20T14:30:00Z",
    createdAt: "2026-02-01T00:00:00Z",
    updatedAt: "2026-10-20T14:30:00Z",
  },
  {
    id: "conn-gcp-1",
    tenantId: "demo-tenant-1",
    name: "GCP BigQuery Export",
    provider: "gcp",
    status: "connected",
    lastSyncedAt: "2026-10-20T12:00:00Z",
    createdAt: "2026-03-10T00:00:00Z",
    updatedAt: "2026-10-20T12:00:00Z",
  },
];

export default function ConnectionsSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <PlugZap className="h-6 w-6 text-indigo-500" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Cloud & AI Ingestion Connectors
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Secure cross-account IAM role delegation and API keys with AES-256 envelope encryption
          </p>
        </div>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 gap-1.5">
          <Plus className="h-4 w-4" /> Add Connection
        </Button>
      </div>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base">Active Connectors</CardTitle>
          <CardDescription>
            Telemetry pulled on 4-hour Celery beat schedules into ClickHouse FOCUS tables
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockConnections.map((conn) => (
                <TableRow key={conn.id}>
                  <TableCell>
                    <Badge variant="outline" className="uppercase font-mono text-[10px]">
                      {conn.provider}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900 dark:text-white">
                    {conn.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="success" className="gap-1 text-xs">
                      <CheckCircle2 className="h-3 w-3" />
                      {conn.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {conn.lastSyncedAt ? new Date(conn.lastSyncedAt).toLocaleString() : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="text-xs gap-1.5">
                      <RefreshCw className="h-3 w-3" /> Test
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
