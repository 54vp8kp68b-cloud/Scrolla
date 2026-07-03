"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Topic } from "@/lib/types";
import AuthInput from "@/components/AuthInput";
import EmptyState from "@/components/EmptyState";
import { CloudUpload, Film, Loader2, X, PlusSquare } from "lucide-react";

const ACCEPTED_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_SIZE_MB = 200;

/** "#SAT prep, #math" -> ["satprep", "math"] (also accepts space/comma separated without #) */
function parseHashtags(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[\s,]+/)
        .map((t) => t.replace(/^#/, "").toLowerCase().replace(/[^a-z0-9]/g, ""))
        .filter((t) => t.length >= 2 && t.length <= 30)
    ),
  ].slice(0, 8);
}

export default function UploadPage() {
  return (
    <Suspense>
      <UploadContent />
    </Suspense>
  );
}

function UploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [topicId, setTopicId] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);

  const [uploading, setUploading] = useState(false);
  const [stage, setStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    supabase
      .from("topics")
      .select("id, name, slug")
      .order("name")
      .then(({ data }) => setTopics(data ?? []));
  }, []);

  // Clean up the object URL when the file changes / on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function selectFile(f: File) {
    setError(null);

    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError("That format isn't supported — use MP4, MOV, or WebM.");
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File is too big — max ${MAX_SIZE_MB}MB.`);
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setDuration(null);
  }

  function clearFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setDuration(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Pick a video first.");
      return;
    }

    setUploading(true);
    setError(null);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login?next=/upload");
        return;
      }

      // 1) Upload the file to storage: videos/<user_id>/<timestamp>.<ext>
      setStage("Uploading video…");
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const storagePath = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(storagePath, file, {
          contentType: file.type,
          cacheControl: "3600",
        });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("videos").getPublicUrl(storagePath);

      // 2) Insert video metadata
      setStage("Saving details…");
      const { data: video, error: insertError } = await supabase
        .from("videos")
        .insert({
          creator_id: user.id,
          title: title.trim(),
          caption: caption.trim(),
          topic_id: topicId || null,
          video_url: publicUrl,
          storage_path: storagePath,
          duration_seconds: duration,
          visibility: "public",
        })
        .select("id")
        .single();
      if (insertError) throw insertError;

      // 3) Hashtags (best-effort — a failure here shouldn't kill the post)
      const tags = parseHashtags(hashtags);
      if (tags.length > 0) {
        setStage("Adding hashtags…");
        for (const tag of tags) {
          let { data: existing } = await supabase
            .from("hashtags")
            .select("id")
            .eq("slug", tag)
            .maybeSingle();

          if (!existing) {
            const { data: created } = await supabase
              .from("hashtags")
              .insert({ name: tag, slug: tag })
              .select("id")
              .maybeSingle();
            existing = created;
          }
          if (existing) {
            await supabase
              .from("video_hashtags")
              .insert({ video_id: video.id, hashtag_id: existing.id });
          }
        }
      }

      // 4) If launched from course editor, add video to that course
      if (courseId) {
        const { data: lastPos } = await supabase
          .from("course_videos")
          .select("position")
          .eq("course_id", courseId)
          .order("position", { ascending: false })
          .limit(1)
          .maybeSingle();
        await supabase.from("course_videos").insert({
          course_id: courseId,
          video_id: video.id,
          position: (lastPos?.position ?? -1) + 1,
        });
        router.push("/creator/courses");
        router.refresh();
        return;
      }

      // 5) Otherwise go to profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      router.push(profile ? `/profile/${profile.username}` : "/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Try again.");
      setStage(null);
      setUploading(false);
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="h-full grid place-items-center">
        <EmptyState
          icon={PlusSquare}
          title="Supabase not connected"
          message="Add your keys to .env.local and restart the dev server."
        />
      </main>
    );
  }

  return (
    <main className="h-full overflow-y-auto no-scrollbar">
      <div className="mx-auto max-w-md px-4 pt-10 pb-8">
        <h1 className="text-xl font-bold">Post a lesson</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Vertical video, under {MAX_SIZE_MB}MB. MP4, MOV, or WebM.
        </p>
        {courseId && (
          <p className="mt-2 text-xs text-brand-glow bg-brand/10 border border-brand/20 rounded-lg px-3 py-2">
            This video will be added to your course automatically after upload.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* File picker / preview */}
          {!file ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[9/14] max-h-80 rounded-2xl border-2 border-dashed border-white/15 bg-ink-900 hover:border-brand/50 transition-colors flex flex-col items-center justify-center gap-3 text-zinc-500"
            >
              <CloudUpload className="w-8 h-8" />
              <span className="text-sm font-medium">Tap to choose a video</span>
              <span className="text-xs">9:16 vertical works best</span>
            </button>
          ) : (
            <div className="relative w-full max-h-80 aspect-[9/14] rounded-2xl overflow-hidden bg-black">
              <video
                ref={videoRef}
                src={previewUrl ?? undefined}
                controls
                playsInline
                className="w-full h-full object-contain"
                onLoadedMetadata={(e) =>
                  setDuration(
                    Math.round((e.target as HTMLVideoElement).duration)
                  )
                }
              />
              <button
                type="button"
                onClick={clearFile}
                aria-label="Remove video"
                className="absolute top-2 right-2 grid place-items-center w-8 h-8 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <span className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/70 text-[11px] text-zinc-300">
                <Film className="w-3 h-3" />
                {file.name}
                {duration != null && ` · ${duration}s`}
              </span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) selectFile(f);
            }}
          />

          <AuthInput
            label="Title"
            type="text"
            required
            maxLength={120}
            placeholder="The 30-second trick for SAT circle problems"
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
              required
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What will people learn?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-ink-800 border border-white/10 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20 transition resize-none"
            />
          </label>

          <label className="block">
            <span className="block text-xs font-medium text-zinc-400 mb-1.5">
              Topic
            </span>
            <select
              required
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-ink-800 border border-white/10 text-sm text-white outline-none focus:border-brand/60 transition"
            >
              <option value="" disabled>
                Choose a topic…
              </option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          <AuthInput
            label="Hashtags (optional, up to 8)"
            type="text"
            placeholder="#satprep #geometry #tricks"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
          />

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full h-12 rounded-full bg-gradient-to-r from-brand to-brand-hover font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-40 inline-flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {stage ?? "Uploading…"}
              </>
            ) : (
              "Post lesson"
            )}
          </button>
          {uploading && (
            <p className="text-center text-xs text-zinc-500">
              Keep this tab open — bigger files take a minute.
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
