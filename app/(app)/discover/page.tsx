"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Topic } from "@/lib/types";
import VideoGrid, { type GridVideo } from "@/components/VideoGrid";
import EmptyState from "@/components/EmptyState";
import { Compass, Loader2, Search, SearchX } from "lucide-react";

export default function DiscoverPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GridVideo[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    supabase
      .from("topics")
      .select("id, name, slug")
      .order("name")
      .then(({ data }) => setTopics(data ?? []));
  }, []);

  // Debounced search: keyword over title/caption, or #hashtag
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(null);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      const supabase = createClient();

      if (q.startsWith("#")) {
        // Hashtag search
        const slug = q.slice(1).toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!slug) {
          setResults([]);
          setSearching(false);
          return;
        }
        const { data: tag } = await supabase
          .from("hashtags")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
        if (!tag) {
          setResults([]);
          setSearching(false);
          return;
        }
        const { data: links } = await supabase
          .from("video_hashtags")
          .select("videos ( id, title, video_url, visibility )")
          .eq("hashtag_id", tag.id)
          .limit(30);
        setResults(
          (links ?? [])
            .map((l) => l.videos as unknown as GridVideo & { visibility: string })
            .filter((v) => v && v.visibility === "public")
        );
      } else {
        // Keyword search over title + caption
        const escaped = q.replace(/[%_,]/g, " ");
        const { data } = await supabase
          .from("videos")
          .select("id, title, video_url")
          .eq("visibility", "public")
          .or(`title.ilike.%${escaped}%,caption.ilike.%${escaped}%`)
          .order("created_at", { ascending: false })
          .limit(30);
        setResults((data as GridVideo[]) ?? []);
      }
      setSearching(false);
    }, 350);

    return () => clearTimeout(handle);
  }, [query]);

  if (!isSupabaseConfigured) {
    return (
      <main className="h-full grid place-items-center">
        <EmptyState
          icon={Compass}
          title="Supabase not connected"
          message="Add your keys to .env.local and restart the dev server."
        />
      </main>
    );
  }

  return (
    <main className="h-full overflow-y-auto no-scrollbar">
      <div className="mx-auto max-w-lg px-4 pt-10 pb-8">
        <h1 className="text-2xl font-bold">Discover</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Search lessons or browse by topic</p>

        {/* Search bar */}
        <div className="mt-4 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lessons, or try #satprep"
            className="w-full h-11 pl-10 pr-4 rounded-full bg-ink-800 border border-white/10 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20 transition"
          />
        </div>

        {/* Results or topics */}
        {query.trim().length >= 2 ? (
          <div className="mt-6">
            {searching ? (
              <div className="grid place-items-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
              </div>
            ) : results && results.length > 0 ? (
              <>
                <p className="text-xs text-zinc-500 mb-3">
                  {results.length} result{results.length === 1 ? "" : "s"}
                </p>
                <VideoGrid videos={results} />
              </>
            ) : (
              <EmptyState
                icon={SearchX}
                title="No results"
                message={
                  query.startsWith("#")
                    ? "No videos with that hashtag yet."
                    : "Try a different keyword, or search a hashtag with #."
                }
              />
            )}
          </div>
        ) : (
          <div className="mt-6">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
              Browse by topic
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {topics.map((t, i) => {
                const TOPIC_META: Record<string, { emoji: string; from: string; to: string }> = {
                  "sat-prep":         { emoji: "📚", from: "from-violet-500/30", to: "to-brand/10" },
                  "math":             { emoji: "🔢", from: "from-blue-500/30",   to: "to-ink-900" },
                  "coding":           { emoji: "💻", from: "from-green-500/25",  to: "to-ink-900" },
                  "business":         { emoji: "💼", from: "from-amber-500/25",  to: "to-ink-900" },
                  "science":          { emoji: "🔬", from: "from-cyan-500/25",   to: "to-ink-900" },
                  "history":          { emoji: "🏛️", from: "from-orange-500/25", to: "to-ink-900" },
                  "college-tips":     { emoji: "🎓", from: "from-purple-500/25", to: "to-ink-900" },
                  "personal-finance": { emoji: "💰", from: "from-yellow-500/25", to: "to-ink-900" },
                  "language-learning":{ emoji: "🌍", from: "from-teal-500/25",   to: "to-ink-900" },
                  "fitness-education":{ emoji: "💪", from: "from-red-500/25",    to: "to-ink-900" },
                };
                const meta = TOPIC_META[t.slug] ?? { emoji: "⚡", from: "from-brand/25", to: "to-ink-900" };
                return (
                  <Link
                    key={t.id}
                    href={`/feed?topic=${t.slug}`}
                    className={`group p-4 rounded-2xl border border-white/8 bg-gradient-to-br ${meta.from} ${meta.to} hover:border-white/20 hover:scale-[1.02] transition-all duration-200`}
                  >
                    <span className="text-2xl mb-2 block">{meta.emoji}</span>
                    <p className="font-semibold text-sm text-white">{t.name}</p>
                    <p className="mt-0.5 text-[11px] text-zinc-400">
                      #{t.slug.replace(/-/g, "")}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
