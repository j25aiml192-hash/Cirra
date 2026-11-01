"use client";

import * as React from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

export const dynamic = 'force-dynamic';

export default function SignupPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      setSuccessMessage("Check your email to confirm your account.");
      setIsLoading(false);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to sign up");
      setIsLoading(false);
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
          <CardTitle>Create your Cirra workspace</CardTitle>
          <CardDescription>Start cutting wasted cloud & AI spend in under 5 minutes</CardDescription>
        </CardHeader>
        <CardContent>
          {successMessage ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 border border-green-200 text-center">
                {successMessage}
              </div>
              <div className="text-center">
                <Link href="/login" className="text-xs font-semibold text-brand-600 hover:underline">
                  Back to Sign in
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                  {errorMessage}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#334155]">Work Email</label>
                <Input
                  type="email"
                  placeholder="alex@acme.com"
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
                {isLoading ? "Creating account..." : "Sign Up"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-[#64748B]">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-600 hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
