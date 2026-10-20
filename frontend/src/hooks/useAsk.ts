"use client";

import { useState } from "react";
import type { AskResponse } from "@/types";

export function useAsk() {
  const [isLoading, setIsLoading] = useState(false);

  const ask = async (question: string): Promise<AskResponse> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsLoading(false);

    const lower = question.toLowerCase();
    if (lower.includes("openai") || lower.includes("spike")) {
      return {
        answer: "OpenAI spend increased by +14.5% ($2,350) between Oct 12 and Oct 16. This was driven by batch evaluation runs under the 'prod-copilot-svc' key using model gpt-4o, with prompt token volume doubling while output token ratio remained constant.",
        sql: "SELECT model, sum(cost_usd) as total_spend, sum(input_tokens) as tokens FROM focus_billing WHERE provider = 'OpenAI' AND billing_period_start >= '2026-10-01' AND tenant_id = 'current_tenant' GROUP BY model ORDER BY total_spend DESC;",
        rows: [
          { model: "gpt-4o", total_spend: 18500.0, tokens: 680000000 },
          { model: "text-embedding-3-small", total_spend: 4890.0, tokens: 410000000 },
          { model: "gpt-4o-mini", total_spend: 1800.0, tokens: 350000000 },
        ],
        confidence: 0.99,
      };
    }

    if (lower.includes("ec2") || lower.includes("team")) {
      return {
        answer: "Core Platform is the top consumer of EC2 compute at $34,200 (68.4% of total compute spend), primarily across m6i.4xlarge cluster nodes in us-east-1.",
        sql: "SELECT team, sum(effective_cost) as spend FROM focus_billing WHERE service_name LIKE '%Elastic Compute Cloud%' AND tenant_id = 'current_tenant' GROUP BY team ORDER BY spend DESC;",
        rows: [
          { team: "Core Platform", spend: 34200.0 },
          { team: "Search & Retrieval", spend: 9800.0 },
          { team: "Unallocated", spend: 6000.0 },
        ],
        confidence: 0.98,
      };
    }

    return {
      answer: "Total attributed spend across all tagged resources is $108,100 (84.2% coverage). Unallocated spend sits at $20,320, predominantly from untagged NAT Gateway egress and Shared Storage volumes.",
      sql: "SELECT if(tag_team IS NOT NULL, 'Attributed', 'Unallocated') as status, sum(billed_cost) as total FROM focus_billing WHERE tenant_id = 'current_tenant' GROUP BY status;",
      rows: [
        { status: "Attributed", total: 108100.0 },
        { status: "Unallocated", total: 20320.0 },
      ],
      confidence: 0.97,
    };
  };

  return {
    ask,
    isLoading,
  };
}
