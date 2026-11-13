"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (
          authError.message?.toLowerCase().includes("email not confirmed") ||
          authError.message?.toLowerCase().includes("not confirmed")
        ) {
          throw new Error(
            "Your email address has not been confirmed yet. Please check your inbox (and spam folder) for the Supabase confirmation link and click it before logging in."
          );
        }
        throw authError;
      }

      const accessToken = data.session?.access_token;
      if (!accessToken) {
        throw new Error(
          "No active session found. Please verify your email via the confirmation link sent to your inbox."
        );
      }

      const sessionRes = await apiFetch<{
        access_token: string;
        token_type: string;
        tenant_id: string;
        user_id: string;
        role: string;
      }>("/api/v1/auth/session", {
        method: "POST",
        body: JSON.stringify({ supabase_token: accessToken }),
      });

      if (sessionRes?.access_token) {
        if (typeof window !== "undefined") {
          localStorage.setItem("cirra_token", sessionRes.access_token);
        }
        useAuthStore.getState().setToken(sessionRes.access_token);
        useAuthStore.getState().setUser({
          id: sessionRes.user_id,
          email,
          role: sessionRes.role,
          tenantId: sessionRes.tenant_id,
        });
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      await supabase.auth.signInWithOAuth({ provider: "google" });
    } catch (err: any) {
      setError(err?.message || "Failed to initialize Google Sign In");
    }
  };

  return (
    <div className="cirra-bg-canvas flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img
            src="/cirra-logo.png"
            alt="Cirra"
            className="mx-auto mb-3 h-12 w-12 rounded-xl object-contain shadow-sm"
          />
          <CardTitle>Welcome back to Cirra</CardTitle>
          <CardDescription>Enter your work email to access your cost control plane</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#334155]">Work Email</label>
              <Input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#334155]">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#D6E4F5]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-[#64748B]">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2 border-[#D6E4F5] hover:bg-[#F0F5FD]"
            onClick={handleGoogleSignIn}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign in with Google
          </Button>

          <div className="mt-6 text-center text-xs text-[#64748B]">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-brand-600 hover:underline">
              Create an account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
