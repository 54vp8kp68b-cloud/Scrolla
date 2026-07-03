"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthInput from "@/components/AuthInput";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Role } from "@/lib/types";
import { GraduationCap, Video, Sparkles, Loader2 } from "lucide-react";

const ROLES: { value: Role; label: string; icon: typeof Video; desc: string }[] = [
  { value: "learner", label: "Learner", icon: GraduationCap, desc: "Scroll and learn" },
  { value: "creator", label: "Creator", icon: Video, desc: "Post lessons" },
  { value: "both", label: "Both", icon: Sparkles, desc: "Do it all" },
];

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole: Role =
    searchParams.get("role") === "creator" ? "creator" : "learner";

  const [role, setRole] = useState<Role>(initialRole);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!isSupabaseConfigured) {
      setError(
        "Supabase isn't connected yet — add your keys to .env.local and restart the dev server."
      );
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      // 1) Username availability (case-insensitive)
      const { data: taken, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", username)
        .maybeSingle();

      if (checkError) throw checkError;
      if (taken) {
        setError("That username is taken — try another.");
        return;
      }

      // 2) Create the account; the DB trigger creates the profile row.
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, display_name: username, role },
        },
      });

      if (signUpError) throw signUpError;

      if (data.session) {
        // Email confirmation is off — user is signed in.
        router.push("/onboarding");
        router.refresh();
      } else {
        // Email confirmation is on.
        setNotice(
          "Almost there — check your email for a confirmation link, then log in."
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="text-xl font-bold">Create your account</h1>
      <p className="mt-1 text-sm text-zinc-500">Free forever for learners.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <span className="block text-xs font-medium text-zinc-400 mb-1.5">
            I'm joining as
          </span>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition ${
                  role === r.value
                    ? "border-brand bg-brand/10 text-white"
                    : "border-white/10 bg-ink-800 text-zinc-400 hover:border-white/25"
                }`}
              >
                <r.icon className="w-4 h-4" />
                <span className="text-xs font-semibold">{r.label}</span>
                <span className="text-[10px] text-zinc-500">{r.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <AuthInput
          label="Email"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <AuthInput
          label="Username"
          type="text"
          required
          minLength={3}
          maxLength={24}
          pattern="[a-zA-Z0-9_.]+"
          title="Letters, numbers, underscores, and periods only"
          placeholder="satmath.daily"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <AuthInput
          label="Password"
          type="password"
          required
          minLength={8}
          placeholder="8+ characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
            {error}
          </p>
        )}
        {notice && (
          <p className="text-xs text-accent bg-accent/10 border border-accent/20 rounded-lg px-3 py-2.5">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-brand to-brand-hover font-semibold text-sm text-white hover:opacity-90 transition-opacity disabled:opacity-50 grid place-items-center"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign up"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-brand-glow font-medium hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
