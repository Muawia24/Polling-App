"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const isEmailValid = useMemo(() => {
    if (!email) return false;
    // Simple RFC5322-like pattern; good enough for client-side UX
    const emailPattern = /^(?:[a-zA-Z0-9_'^&+%`{}~|-]+(?:\.[a-zA-Z0-9_'^&+%`{}~|-]+)*|"(?:[^"]|\\")+")@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  }, [email]);

  const isPasswordValid = password.length >= 6;

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    if (!email) next.email = "Email is required";
    else if (!isEmailValid) next.email = "Enter a valid email";
    if (!password) next.password = "Password is required";
    else if (!isPasswordValid) next.password = "At least 6 characters";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setError("Supabase is not configured. Add env vars and reload.");
        return;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.push("/polls");
    } catch (err: unknown) {
        console.log(err);
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Use your account credentials to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((fe) => ({ ...fe, email: undefined }));
              }}
              onBlur={() => {
                if (!email) setFieldErrors((fe) => ({ ...fe, email: "Email is required" }));
                else if (!isEmailValid) setFieldErrors((fe) => ({ ...fe, email: "Enter a valid email" }));
              }}
              required
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              placeholder="you@example.com"
            />
            {fieldErrors.email ? (
              <p id="email-error" className="text-xs text-red-600">{fieldErrors.email}</p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((fe) => ({ ...fe, password: undefined }));
              }}
              onBlur={() => {
                if (!password) setFieldErrors((fe) => ({ ...fe, password: "Password is required" }));
                else if (!isPasswordValid) setFieldErrors((fe) => ({ ...fe, password: "At least 6 characters" }));
              }}
              required
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
              placeholder="••••••••"
            />
            {fieldErrors.password ? (
              <p id="password-error" className="text-xs text-red-600">{fieldErrors.password}</p>
            ) : null}
          </div>
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={submitting || !email || !password || !!fieldErrors.email || !!fieldErrors.password}
            className="w-full"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <a href="/auth/register" className="underline underline-offset-4">Create account</a>
            <a href="#" className="underline underline-offset-4">Forgot password?</a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 