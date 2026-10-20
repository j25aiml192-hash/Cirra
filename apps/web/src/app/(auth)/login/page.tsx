"use client";

import * as React from "react";
import Link from "next/link";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@cirra/ui";
import { Sparkles, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-indigo-600 items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-500/30">
            C
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome back to Cirra
          </h1>
          <p className="text-sm text-slate-400">
            Sign in to access your cloud & AI cost control plane
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-xl text-white shadow-2xl">
          <CardHeader>
            <CardTitle className="text-lg text-white">Sign In</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your credentials or use Single Sign-On
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Work Email</label>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">Password</label>
                  <a href="#" className="text-xs text-indigo-400 hover:underline">
                    Forgot password?
                  </a>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-800/60 border-slate-700 text-white"
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 gap-2 font-semibold">
                Sign In
                <ArrowRight className="h-4 w-4" />
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-2 text-slate-500 font-medium">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full border-slate-700 hover:bg-slate-800 text-white gap-2"
                onClick={() => {
                  window.location.href = "/dashboard";
                }}
              >
                <Sparkles className="h-4 w-4 text-indigo-400" />
                Sign in with Google Workspace
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400">
          Don't have an account?{" "}
          <Link href="/signup" className="text-indigo-400 hover:underline font-medium">
            Create tenant account
          </Link>
        </p>
      </div>
    </div>
  );
}
