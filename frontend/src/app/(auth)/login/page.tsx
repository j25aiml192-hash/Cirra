"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { GenerativeCornerGrid } from "@/components/ui/GenerativeCornerGrid";
import { Mail, Lock, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";

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
      // 1. Direct API attempt
      try {
        const sessionRes = await apiFetch<{
          access_token: string;
          token_type: string;
          tenant_id: string;
          user_id: string;
          role: string;
        }>("/api/v1/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        });

        if (sessionRes?.access_token) {
          if (typeof window !== "undefined") {
            localStorage.setItem("cirra_token", sessionRes.access_token);
          }
          useAuthStore.getState().setToken(sessionRes.access_token);
          useAuthStore.getState().setUser({
            id: sessionRes.user_id,
            email: email.trim(),
            role: sessionRes.role,
            tenantId: sessionRes.tenant_id,
          });

          router.push("/dashboard");
          return;
        }
      } catch (directErr: any) {
        const isOfflineSupabase =
          !process.env.NEXT_PUBLIC_SUPABASE_URL ||
          process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") ||
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "placeholder-anon-key";

        if (isOfflineSupabase) {
          throw new Error(directErr?.message || "Invalid credentials");
        }
      }

      // 2. Supabase fallback
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const accessToken = data.session?.access_token;
      if (accessToken) {
        if (typeof window !== "undefined") {
          localStorage.setItem("cirra_token", accessToken);
        }
        useAuthStore.getState().setToken(accessToken);
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
    <div className="relative min-h-screen bg-[#070709] text-white flex flex-col items-center justify-center p-4 overflow-hidden select-none font-sans">
      {/* ── HIGH VISIBILITY GENERATIVE CORNER GRIDS ── */}
      <GenerativeCornerGrid position="top-left" />
      <GenerativeCornerGrid position="bottom-right" />

      {/* ── SOLID CARD CONTAINER (OFF-WHITE / GREY PALETTE, NO BLUE) ── */}
      <div className="relative z-10 w-full max-w-[390px] mx-auto rounded-3xl bg-[#0d0e12]/95 border border-zinc-800/90 shadow-[0_24px_64px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.08)] p-6 sm:p-7 space-y-5 animate-in fade-in duration-300 backdrop-blur-xl">
        
        {/* Logo Squircle */}
        <div className="flex justify-center">
          <Link href="/" className="group focus:outline-none">
            <div className="w-12 h-12 rounded-[14px] bg-white flex items-center justify-center p-2 shadow-[0_4px_16px_rgba(255,255,255,0.2)] group-hover:scale-105 transition-transform overflow-hidden">
              <img
                src="/cirra-mark.png"
                alt="Cirra"
                className="w-full h-full object-contain"
              />
            </div>
          </Link>
        </div>

        {/* Header Titles */}
        <div className="text-center space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#faf8f5] font-display">
            Welcome back to Cirra
          </h1>
          <p className="text-xs text-zinc-400 font-sans">
            Enter your work email to access your cost control plane
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="rounded-xl bg-zinc-900 border border-zinc-700 p-2.5 text-xs text-zinc-300 font-mono">
            {error}
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
          {/* Work Email */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5 font-mono">
              <Mail className="w-3.5 h-3.5 text-zinc-400" />
              <span>Work Email</span>
            </label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-10 px-3.5 rounded-xl bg-white text-zinc-900 placeholder-zinc-400 text-xs font-sans border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-400 transition-all shadow-sm"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5 font-mono">
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Password</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-10 px-3.5 rounded-xl bg-white text-zinc-900 placeholder-zinc-400 text-xs font-sans border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-400 transition-all shadow-sm"
            />
          </div>

          {/* Sign In Button (Glass Morphism / Soft Off-White Gray Theme - NO BLUE) */}
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full h-10 rounded-xl overflow-hidden text-xs font-mono font-bold transition-all duration-300 flex items-center justify-center gap-2 text-white bg-zinc-800/95 hover:bg-zinc-700/90 border border-white/20 backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_4px_12px_rgba(0,0,0,0.3)] active:scale-[0.99] cursor-pointer disabled:opacity-50 mt-1"
          >
            <div className="absolute top-0 inset-x-2 h-[45%] rounded-t-full bg-gradient-to-b from-white/35 to-transparent pointer-events-none" />
            <span className="relative z-10 flex items-center gap-1.5">
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </span>
          </button>
        </form>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-300" />
          <span>FOCUS 1.0 & RLS Security Enforced</span>
        </div>

        {/* Divider: OR CONTINUE WITH */}
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
            <span className="bg-[#0d0e12] px-2.5 text-zinc-500">Or continue with</span>
          </div>
        </div>

        {/* Sign in with Google (Clean off-white / light button matching original) */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full h-10 px-4 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-semibold font-sans transition-all duration-200 cursor-pointer flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.99]"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
          <span>Sign in with Google</span>
        </button>

        {/* Footer Link */}
        <div className="text-center text-xs text-zinc-400 font-sans pt-1">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-zinc-200 hover:text-white underline underline-offset-4 font-medium">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
