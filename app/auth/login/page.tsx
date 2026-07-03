"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthInput from "@/components/AuthInput";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/feed";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured) {
      setError(
        "Supabase isn't connected yet — add your keys to .env.local and restart the dev server."
      );
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "Wrong email or password."
          : signInError.message
      );
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  return (
    <>
      <h1 className="text-xl font-bold">Welcome back</h1>
      <p className="mt-1 text-sm text-zinc-500">Your streak missed you.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <AuthInput
          label="Email"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <AuthInput
          label="Password"
          type="password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-brand to-brand-hover font-semibold text-sm text-white hover:opacity-90 transition-opacity disabled:opacity-50 grid place-items-center"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log in"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-zinc-500">
        New here?{" "}
        <Link href="/auth/sign-up" className="text-brand-glow font-medium hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
