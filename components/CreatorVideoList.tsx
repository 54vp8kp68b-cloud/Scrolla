"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Topic, Video } from "@/lib/types";
import AuthInput from "@/components/AuthInput";
import EmptyState from "@/components/EmptyState";
import {
  Clapperboard,
  Loader2,
  Pencil,
  Trash2,
  X,
  Eye,
  EyeOff,
} from "lucide-react";

export default function CreatorVideoList() {
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Edit form state
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [topicId, setTopicId] = useState("");
  const [visibility, setVisibility] = useState<Video["visibility"]>("public");

  // Quiz form state (one optional quiz per video)
  const [quizId, setQuizId] = useState<string | null>(null);
  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizChoices, setQuizChoices] = useState<string[]>(["", "", "", ""]);
  const [quizCorrect, setQuizCorrect] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login?next=/creator");
        return;
      }
      const [videosRes, topicsRes] = await Promise.all([
        supabase
          .from("videos")
          .select("*")
          .eq("creator_id", user.id)
          .order("created_at", { ascending: false })
          .returns<Video[]>(),
        supabase.from("topics").select("id, name, slug").order("name"),
      ]);
      setVideos(videosRes.data ?? []);
      setTopics(topicsRes.data ?? []);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startEdit(v: Video) {
    setEditingId(v.id);
    setTitle(v.title);
    setCaption(v.caption);
    setTopicId(v.topic_id ?? "");
    setVisibility(v.visibility);
    setError(null);

    // Load existing quiz (if any)
    setQuizId(null);
    setQuizQuestion("");
    setQuizChoices(["", "", "", ""]);
    setQuizCorrect(0);
    const supabase = createClient();
    const { data: quiz } = await supabase
      .from("quizzes")
      .select("id, question, answer_choices, correct_answer")
      .eq("video_id", v.id)
      .maybeSingle();
    if (quiz) {
      const choices = Array.isArray(quiz.answer_choices)
        ? (quiz.answer_choices as string[])
        : [];
      setQuizId(quiz.id);
      setQuizQuestion(quiz.question);
      setQuizChoices([...choices, "", "", "", ""].slice(0, 4));
      setQuizCorrect(quiz.correct_answer);
    }
  }

  async function saveQuiz(videoId: string): Promise<string | null> {
    const supabase = createClient();
    const choices = quizChoices.map((c) => c.trim()).filter(Boolean);
    const question = quizQuestion.trim();

    // No question -> remove quiz if one existed
    if (!question) {
      if (quizId) await supabase.from("quizzes").delete().eq("id", quizId);
      return null;
    }
    if (choices.length < 2) return "A quiz needs at least 2 answer choices.";
    const correct = Math.min(quizCorrect, choices.length - 1);

    const payload = {
      video_id: videoId,
      question,
      answer_choices: choices,
      correct_answer: correct,
    };
    const { error: quizError } = quizId
      ? await supabase.from("quizzes").update(payload).eq("id", quizId)
      : await supabase.from("quizzes").insert(payload);
    return quizError ? quizError.message : null;
  }

  async function saveEdit(id: string) {
    setBusyId(id);
    setError(null);
    const supabase = createClient();
    const updates = {
      title: title.trim(),
      caption: caption.trim(),
      topic_id: topicId || null,
      visibility,
      updated_at: new Date().toISOString(),
    };
    const { error: updateError } = await supabase
      .from("videos")
      .update(updates)
      .eq("id", id);
    if (updateError) {
      setError(updateError.message);
      setBusyId(null);
      return;
    }
    const quizError = await saveQuiz(id);
    setBusyId(null);
    if (quizError) {
      setError(quizError);
      return;
    }
    setVideos((vs) => vs.map((v) => (v.id === id ? { ...v, ...updates } : v)));
    setEditingId(null);
  }

  async function deleteVideo(v: Video) {
    if (
      !window.confirm(
        `Delete "${v.title}"? This can't be undone — the video file is removed too.`
      )
    )
      return;

    setBusyId(v.id);
    setError(null);
    const supabase = createClient();

    // Remove DB row first (RLS guarantees ownership), then the file.
    const { error: dbError } = await supabase
      .from("videos")
      .delete()
      .eq("id", v.id);
    if (dbError) {
      setError(dbError.message);
      setBusyId(null);
      return;
    }
    await supabase.storage.from("videos").remove([v.storage_path]);

    setVideos((vs) => vs.filter((x) => x.id !== v.id));
    setBusyId(null);
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <EmptyState
        icon={Clapperboard}
        title="No videos yet"
        message="Post your first lesson from the Create tab and manage it here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
          {error}
        </p>
      )}

      {videos.map((v) => (
        <div
          key={v.id}
          className="rounded-xl bg-ink-900 border border-white/5 p-3"
        >
          <div className="flex gap-3">
            {/* Thumb */}
            <div className="relative w-16 shrink-0 aspect-[9/16] rounded-lg overflow-hidden bg-black">
              <video
                src={`${v.video_url}#t=0.1`}
                preload="metadata"
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{v.title}</p>
              <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                {v.caption}
              </p>
              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-zinc-500">
                <span className="inline-flex items-center gap-1">
                  {v.visibility === "public" ? (
                    <Eye className="w-3 h-3" />
                  ) : (
                    <EyeOff className="w-3 h-3" />
                  )}
                  {v.visibility}
                </span>
                <span>·</span>
                <span>{new Date(v.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() =>
                  editingId === v.id ? setEditingId(null) : startEdit(v)
                }
                aria-label="Edit"
                className="grid place-items-center w-8 h-8 rounded-lg bg-ink-800 text-zinc-400 hover:text-white transition-colors"
              >
                {editingId === v.id ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Pencil className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => deleteVideo(v)}
                disabled={busyId === v.id}
                aria-label="Delete"
                className="grid place-items-center w-8 h-8 rounded-lg bg-ink-800 text-red-400/70 hover:text-red-400 transition-colors disabled:opacity-50"
              >
                {busyId === v.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Inline edit form */}
          {editingId === v.id && (
            <div className="mt-3 pt-3 border-t border-white/5 space-y-3">
              <AuthInput
                label="Title"
                type="text"
                required
                maxLength={120}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <label className="block">
                <span className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Caption
                </span>
                <textarea
                  value={caption}
                  maxLength={500}
                  rows={2}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-ink-800 border border-white/10 text-sm text-white outline-none focus:border-brand/60 transition resize-none"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Topic
                  </span>
                  <select
                    value={topicId}
                    onChange={(e) => setTopicId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-ink-800 border border-white/10 text-sm text-white outline-none focus:border-brand/60 transition"
                  >
                    <option value="">None</option>
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-zinc-400 mb-1.5">
                    Visibility
                  </span>
                  <select
                    value={visibility}
                    onChange={(e) =>
                      setVisibility(e.target.value as Video["visibility"])
                    }
                    className="w-full h-10 px-3 rounded-xl bg-ink-800 border border-white/10 text-sm text-white outline-none focus:border-brand/60 transition"
                  >
                    <option value="public">Public</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="private">Private</option>
                  </select>
                </label>
              </div>
              {/* Quiz editor */}
              <div className="pt-3 border-t border-white/5">
                <p className="text-xs font-semibold text-accent mb-2">
                  ⚡ Quiz (optional — clear the question to remove)
                </p>
                <AuthInput
                  label="Question"
                  type="text"
                  maxLength={200}
                  placeholder="What's the area of a circle with radius 3?"
                  value={quizQuestion}
                  onChange={(e) => setQuizQuestion(e.target.value)}
                />
                <div className="mt-3 space-y-2">
                  {quizChoices.map((choice, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${v.id}`}
                        checked={quizCorrect === i}
                        onChange={() => setQuizCorrect(i)}
                        title="Mark as correct answer"
                        className="accent-[#7c5cff] shrink-0"
                      />
                      <input
                        type="text"
                        value={choice}
                        maxLength={120}
                        placeholder={`Choice ${i + 1}${i < 2 ? "" : " (optional)"}`}
                        onChange={(e) =>
                          setQuizChoices((cs) =>
                            cs.map((c, j) => (j === i ? e.target.value : c))
                          )
                        }
                        className="flex-1 h-10 px-3 rounded-xl bg-ink-800 border border-white/10 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-brand/60 transition"
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-zinc-600">
                  Select the radio button next to the correct answer.
                </p>
              </div>

              <button
                onClick={() => saveEdit(v.id)}
                disabled={busyId === v.id || !title.trim()}
                className="w-full h-10 rounded-xl bg-gradient-to-r from-brand to-brand-hover text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 grid place-items-center"
              >
                {busyId === v.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Save changes"
                )}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
