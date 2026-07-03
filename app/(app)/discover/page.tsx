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
        <h1 className="text-xl font-bold">Discover</h1>

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
            <h2 className="text-sm font-semibold text-zinc-400 mb-3">
              Browse by topic
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {topics.map((t, i) => (
                <Link
                  key={t.id}
                  href={`/feed?topic=${t.slug}`}
                  className={`p-4 rounded-2xl border border-white/5 font-semibold text-sm hover:border-brand/40 transition-colors ${
                    i % 3 === 0
                      ? "bg-gradient-to-br from-brand/25 to-ink-900"
                      : i % 3 === 1
                        ? "bg-gradient-to-br from-accent/20 to-ink-900"
                        : "bg-gradient-to-br from-accent-pink/20 to-ink-900"
                  }`}
                >
                  {t.name}
                  <span className="block mt-1 text-[11px] font-normal text-zinc-500">
                    #{t.slug.replace(/-/g, "")}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
