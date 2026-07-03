"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Comment = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
};

type Props = {
  videoId: string;
  currentUserId: string | null;
  onClose: () => void;
};

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export default function CommentsSheet({ videoId, currentUserId, onClose }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("comments")
      .select("*, profiles(username, display_name, avatar_url)")
      .eq("video_id", videoId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setComments((data as Comment[]) ?? []);
        setLoading(false);
      });
  }, [videoId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  async function postComment() {
    if (!body.trim() || !currentUserId || posting) return;
    setPosting(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("comments")
      .insert({ video_id: videoId, user_id: currentUserId, body: body.trim() })
      .select("*, profiles(username, display_name, avatar_url)")
      .single();
    setPosting(false);
    if (!error && data) {
      setComments((prev) => [...prev, data as Comment]);
      setBody("");
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      postComment();
    }
  }

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col justify-end"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Dim background */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sheet */}
      <div className="relative flex flex-col rounded-t-2xl bg-ink-900 border-t border-white/10 max-h-[70%]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
          <span className="font-semibold text-white text-sm">
            {loading ? "Comments" : `${comments.length} comment${comments.length !== 1 ? "s" : ""}`}
          </span>
          <button onClick={onClose} aria-label="Close" className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comment list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {loading && (
            <p className="text-center text-zinc-500 text-sm py-6">Loading…</p>
          )}
          {!loading && comments.length === 0 && (
            <p className="text-center text-zinc-500 text-sm py-6">
              No comments yet. Be the first!
            </p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              {c.profiles.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.profiles.avatar_url}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
              ) : (
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-brand to-accent grid place-items-center font-bold text-white text-xs shrink-0">
                  {c.profiles.display_name.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-white">
                    @{c.profiles.username}
                  </span>
                  <span className="text-[11px] text-zinc-500">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-sm text-zinc-200 mt-0.5 break-words">{c.body}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-white/10 shrink-0">
          {currentUserId ? (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Add a comment…"
                maxLength={500}
                className="flex-1 bg-ink-800 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-brand"
              />
              <button
                onClick={postComment}
                disabled={!body.trim() || posting}
                aria-label="Post comment"
                className="w-9 h-9 rounded-full bg-brand grid place-items-center text-white disabled:opacity-40 transition-opacity hover:opacity-90"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-center text-sm text-zinc-400">
              <a href="/auth/login" className="text-brand underline">Sign in</a> to comment
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
