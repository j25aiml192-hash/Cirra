"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Cloud, Bot, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function OnboardingPage() {
  const router = useRouter();
  const [selectedProvider, setSelectedProvider] = React.useState<string | null>(null);

  const handleFinish = () => {
    router.push("/dashboard");
  };

  return (
    <div className="cirra-bg-canvas flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
        <img
          src="/cirra-logo.png"
          alt="Cirra"
          className="mx-auto mb-4 h-12 w-12 rounded-xl object-contain shadow-sm"
        />
        <h1 className="text-3xl font-bold tracking-tight text-[#0A192F]">
          Connect your first provider
        </h1>
          <p className="mt-2 text-sm text-[#475569]">
            Cirra uses read-only access to ingest billing metadata and telemetry.
          </p>
        </div>

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
              <p className="mt-1 text-xs text-[#475569]">Cost & Usage Reports via S3 + CUR 2.0</p>
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
              <h3 className="font-semibold text-[#0A192F]">OpenAI Organization</h3>
              <p className="mt-1 text-xs text-[#475569]">Usage API & Admin Key Telemetry</p>
              {selectedProvider === "openai" && (
                <CheckCircle2 className="mt-3 h-5 w-5 text-brand-600" />
              )}
            </div>
          </Card>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Button variant="ghost" onClick={handleFinish}>
            Skip for now
          </Button>
          <Button onClick={handleFinish} disabled={!selectedProvider} className="gap-2">
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
