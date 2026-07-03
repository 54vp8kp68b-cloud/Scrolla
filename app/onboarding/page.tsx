"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Topic } from "@/lib/types";
import { Loader2, Check } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("topics")
      .select("id, name, slug")
      .order("name")
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setTopics(data ?? []);
        setLoading(false);
      });
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleContinue() {
    setSaving(true);
    setError(null);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login?next=/onboarding");
      return;
    }

    // Replace any existing picks with the new set
    await supabase.from("user_topics").delete().eq("user_id", user.id);

    if (selected.size > 0) {
      const rows = [...selected].map((topic_id) => ({
        user_id: user.id,
        topic_id,
      }));
      const { error: insertError } = await supabase
        .from("user_topics")
        .insert(rows);
      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    router.push("/feed");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-ink-950 px-4 py-12 flex flex-col items-center">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold tracking-tight">
          What do you want to learn?
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Pick at least 3 — your feed starts with these.
        </p>

        {loading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
          </div>
        ) : (
          <div className="mt-8 flex flex-wrap gap-2.5">
            {topics.map((t) => {
              const active = selected.has(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggle(t.id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-sm font-medium transition ${
                    active
                      ? "border-brand bg-brand/15 text-white"
                      : "border-white/10 bg-ink-800 text-zinc-400 hover:border-white/25"
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5 text-brand-glow" />}
                  {t.name}
                </button>
              );
            })}
          </div>
        )}

        {error && (
          <p className="mt-6 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
            {error}
          </p>
        )}

        <button
          onClick={handleContinue}
          disabled={saving || selected.size < 3}
          className="mt-10 w-full h-12 rounded-full bg-gradient-to-r from-brand to-brand-hover font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-40 grid place-items-center"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : selected.size < 3 ? (
            `Pick ${3 - selected.size} more`
          ) : (
            "Start scrolling"
          )}
        </button>
      </div>
    </main>
  );
}
