"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Cloud, Bot, ArrowRight, CheckCircle2, Building2 } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { apiFetch } from "@/lib/api";

export const dynamic = 'force-dynamic';

export default function OnboardingPage() {
  const router = useRouter();
  const [orgName, setOrgName] = React.useState("");
  const [selectedProvider, setSelectedProvider] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleCompleteOnboarding = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Step 1 & 2 — Call API to create tenant and set tenant_id in app_metadata via service role
      await apiFetch("/api/onboarding", {
        method: "POST",
        body: JSON.stringify({
          orgName: orgName.trim() || undefined,
          provider: selectedProvider,
        }),
      });

      // Step 3 — Force session refresh so new JWT includes tenant_id
      await supabase.auth.refreshSession();

      // Step 4 — Redirect to /connections
      router.push("/connections");
    } catch (err: unknown) {
      console.error("Onboarding submission failed:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to set up workspace"
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="cirra-bg-canvas flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <img
            src="/cirra-logo.png"
            alt="Cirra"
            className="mx-auto mb-4 h-12 w-12 rounded-xl object-contain shadow-sm"
          />
          <h1 className="text-3xl font-bold tracking-tight text-[#0A192F]">
            Set up your organization
          </h1>
          <p className="mt-2 text-sm text-[#475569]">
            Configure your workspace and connect your primary cloud or AI telemetry.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            {errorMessage}
          </div>
        )}

        <div className="space-y-6">
          {/* Step 1: Organization Name */}
          <div className="cirra-card p-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0A192F]">
              <Building2 className="w-4 h-4 text-brand-600" />
              <span>Organization Name</span>
            </div>
            <Input
              placeholder="e.g. Acme Cloud Corp"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Step 2: Primary Provider */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-[#475569] uppercase tracking-wider">
              Select Primary Provider (Optional)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <Card
                onClick={() => setSelectedProvider("aws")}
                className={`cursor-pointer transition-all ${
                  selectedProvider === "aws"
                    ? "border-brand-600 bg-brand-50/20 ring-2 ring-brand-500"
                    : "hover:border-[#BCD4F0]"
                }`}
              >
                <div className="flex flex-col items-center text-center p-4">
                  <Cloud className="h-10 w-10 text-amber-500 mb-3" />
                  <h3 className="font-semibold text-[#0A192F]">Amazon Web Services</h3>
                  <p className="mt-1 text-xs text-[#475569]">
                    Cost & Usage telemetry via Cost Explorer API
                  </p>
                  {selectedProvider === "aws" && (
                    <CheckCircle2 className="mt-3 h-5 w-5 text-brand-600" />
                  )}
                </div>
              </Card>

              <Card
                onClick={() => setSelectedProvider("openai")}
                className={`cursor-pointer transition-all ${
                  selectedProvider === "openai"
                    ? "border-brand-600 bg-brand-50/20 ring-2 ring-brand-500"
                    : "hover:border-[#BCD4F0]"
                }`}
              >
                <div className="flex flex-col items-center text-center p-4">
                  <Bot className="h-10 w-10 text-emerald-500 mb-3" />
                  <h3 className="font-semibold text-[#0A192F]">OpenAI Platform</h3>
                  <p className="mt-1 text-xs text-[#475569]">
                    Usage API & model token telemetry
                  </p>
                  {selectedProvider === "openai" && (
                    <CheckCircle2 className="mt-3 h-5 w-5 text-brand-600" />
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={handleCompleteOnboarding}
            disabled={isLoading}
          >
            {isLoading ? "Setting up..." : "Skip for now"}
          </Button>
          <Button
            onClick={handleCompleteOnboarding}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? "Setting up..." : "Continue"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
