import type { Provider } from "@cirra/types";

export const PROVIDERS: readonly Provider[] = [
  "aws",
  "gcp",
  "azure",
  "kubernetes",
  "openai",
  "anthropic",
  "bedrock",
  "vertex",
  "stripe",
] as const;

export interface DateRangeOption {
  label: string;
  value: string;
  days: number;
}

export const DATE_RANGES: readonly DateRangeOption[] = [
  { label: "Last 7 Days", value: "7d", days: 7 },
  { label: "Last 30 Days", value: "30d", days: 30 },
  { label: "Month to Date", value: "mtd", days: 30 },
  { label: "Last 90 Days", value: "90d", days: 90 },
  { label: "Year to Date", value: "ytd", days: 365 },
] as const;

export const POLL_INTERVAL_MS = 5000;

export const FOCUS_VERSION = "1.0";
