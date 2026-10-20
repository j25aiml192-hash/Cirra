"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Badge,
} from "@cirra/ui";
import { Check, ArrowRight, ShieldCheck, Cloud, Cpu } from "lucide-react";

export default function OnboardingPage() {
  const [step, setStep] = React.useState(1);
  const [selectedProvider, setSelectedProvider] = React.useState<"aws" | "openai">("aws");

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-between px-4">
          {[
            { num: 1, label: "Select Source" },
            { num: 2, label: "IAM & Credentials" },
            { num: 3, label: "FOCUS Verification" },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step >= s.num
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {step > s.num ? <Check className="h-4 w-4" /> : s.num}
              </div>
              <span className="text-xs font-medium text-slate-300 hidden sm:inline">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Select Provider */}
        {step === 1 && (
          <Card className="border-slate-800 bg-slate-900/90 text-white">
            <CardHeader>
              <CardTitle className="text-xl">Connect Primary Cost Source</CardTitle>
              <CardDescription className="text-slate-400">
                Choose the first infrastructure or AI platform you want Cirra to control
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => setSelectedProvider("aws")}
                className={`p-5 rounded-xl border cursor-pointer transition-all ${
                  selectedProvider === "aws"
                    ? "border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500"
                    : "border-slate-800 hover:border-slate-700 bg-slate-800/40"
                }`}
              >
                <Cloud className="h-8 w-8 text-amber-400 mb-2" />
                <h3 className="font-semibold text-base">AWS Cloud</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Cross-account IAM role delegation. Cost Explorer and CUR telemetry.
                </p>
              </div>

              <div
                onClick={() => setSelectedProvider("openai")}
                className={`p-5 rounded-xl border cursor-pointer transition-all ${
                  selectedProvider === "openai"
                    ? "border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500"
                    : "border-slate-800 hover:border-slate-700 bg-slate-800/40"
                }`}
              >
                <Cpu className="h-8 w-8 text-emerald-400 mb-2" />
                <h3 className="font-semibold text-base">OpenAI Enterprise</h3>
                <p className="text-xs text-slate-400 mt-1">
                  API Key & Admin token for real-time model usage and token tracking.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                className="bg-indigo-600 hover:bg-indigo-500 gap-2"
              >
                Next Step <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 2: Credentials */}
        {step === 2 && (
          <Card className="border-slate-800 bg-slate-900/90 text-white">
            <CardHeader>
              <CardTitle className="text-xl">
                Configure {selectedProvider === "aws" ? "AWS IAM Role" : "OpenAI Admin Key"}
              </CardTitle>
              <CardDescription className="text-slate-400">
                Credentials are encrypted using AES-256 before storage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedProvider === "aws" ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-300">
                      Target Role ARN
                    </label>
                    <Input
                      placeholder="arn:aws:iam::123456789012:role/CirraCostDelegationRole"
                      className="bg-slate-800 border-slate-700 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-300">
                      External ID
                    </label>
                    <Input
                      readOnly
                      value="cirra-tenant-external-id-prod"
                      className="bg-slate-800 border-slate-700 text-slate-400 font-mono text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-300">
                      OpenAI Admin API Key
                    </label>
                    <Input
                      type="password"
                      placeholder="sk-admin-..."
                      className="bg-slate-800 border-slate-700 text-white font-mono text-xs"
                    />
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="bg-indigo-600 hover:bg-indigo-500 gap-2"
              >
                Test & Ingest <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 3: Complete */}
        {step === 3 && (
          <Card className="border-slate-800 bg-slate-900/90 text-white text-center p-6">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold">Connector Verified & Initialized</h2>
            <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
              Initial FOCUS schema normalization completed. Your control plane is ready.
            </p>
            <Button
              className="mt-6 bg-indigo-600 hover:bg-indigo-500"
              onClick={() => {
                window.location.href = "/dashboard";
              }}
            >
              Go to Dashboard
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
