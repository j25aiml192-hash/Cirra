"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { Anomaly } from "@/types/api";

const mockAnomalies: Anomaly[] = [
  {
    id: "a1",
    series_key: "aws.ec2.nat_gateway_bytes",
    detected_at: "2024-10-19T14:00:00Z",
    severity: "critical",
    status: "open",
    explanation: {
      summary: "Sudden 420% surge in NAT Gateway transfer in us-east-1",
      root_cause: "Misconfigured internal container pulling Docker image loops without VPC endpoint",
    },
  },
  {
    id: "a2",
    series_key: "openai.gpt-4o.tokens",
    detected_at: "2024-10-20T08:15:00Z",
    severity: "warning",
    status: "open",
    explanation: {
      summary: "Token consumption spike on key_prod_app",
      root_cause: "Batch eval script triggered concurrently by team copilot-eng",
    },
  },
];

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = React.useState(mockAnomalies);

  const handleDismiss = (id: string) => {
    setAnomalies(anomalies.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Sentinel Anomaly Detection
        </h1>
        <p className="text-sm text-zinc-500">
          Statistical ARIMA & Median Absolute Deviation (MAD) detection engine with LLM root-cause synthesis.
        </p>
      </div>

      <div className="space-y-4">
        {anomalies.map((anomaly) => (
          <Card key={anomaly.id} className="border-l-4 border-l-rose-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-500" />
                <CardTitle className="text-base">{anomaly.series_key}</CardTitle>
                <Badge variant={anomaly.severity === "critical" ? "destructive" : "secondary"}>
                  {anomaly.severity}
                </Badge>
              </div>
              <span className="text-xs text-zinc-400">
                {new Date(anomaly.detected_at).toLocaleString()}
              </span>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {anomaly.explanation?.summary}
                </p>
                <div className="rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">Root Cause Analysis: </span>
                  {anomaly.explanation?.root_cause}
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleDismiss(anomaly.id)}>
                    Dismiss
                  </Button>
                  <Button size="sm">Create Remediation Action</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {anomalies.length === 0 && (
          <div className="py-16 text-center text-zinc-500">
            <CheckCircle className="mx-auto h-12 w-12 text-emerald-500 mb-2" />
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">All clear</h3>
            <p className="text-sm">No abnormal spend surges detected across your infrastructure.</p>
          </div>
        )}
      </div>
    </div>
  );
}
