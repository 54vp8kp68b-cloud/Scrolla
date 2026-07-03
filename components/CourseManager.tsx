"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Topic, Video } from "@/lib/types";
import AuthInput from "@/components/AuthInput";
import EmptyState from "@/components/EmptyState";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";

type Course = {
  id: string;
  title: string;
  description: string;
  topic_id: string | null;
  price: number;
  is_paid: boolean;
};

type CourseVideo = {
  id: string; // course_videos row id
  video_id: string;
  position: number;
  videos: { id: string; title: string } | null;
};

export default function CourseManager() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [myVideos, setMyVideos] = useState<Pick<Video, "id" | "title">[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topicId, setTopicId] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState("4.99");
  const [creating, setCreating] = useState(false);

  // Expanded course
  const [openCourseId, setOpenCourseId] = useState<string | null>(null);
  const [courseVideos, setCourseVideos] = useState<CourseVideo[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login?next=/creator/courses");
        return;
      }
      setUserId(user.id);
      const [coursesRes, videosRes, topicsRes] = await Promise.all([
        supabase
          .from("courses")
          .select("id, title, description, topic_id, price, is_paid")
          .eq("creator_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("videos")
          .select("id, title")
          .eq("creator_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("topics").select("id, name, slug").order("name"),
      ]);
      setCourses((coursesRes.data as Course[]) ?? []);
      setMyVideos(videosRes.data ?? []);
      setTopics(topicsRes.data ?? []);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setCreating(true);
    setError(null);
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("courses")
      .insert({
        creator_id: userId,
        title: title.trim(),
        description: description.trim(),
        topic_id: topicId || null,
        is_paid: isPaid,
        price: isPaid ? Math.max(0, parseFloat(price) || 0) : 0,
      })
      .select("id, title, description, topic_id, price, is_paid")
      .single();
    setCreating(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setCourses((cs) => [data as Course, ...cs]);
    setShowCreate(false);
    setTitle("");
    setDescription("");
    setTopicId("");
    setIsPaid(false);
  }

  async function openCourse(courseId: string) {
    if (openCourseId === courseId) {
      setOpenCourseId(null);
      return;
    }
    setOpenCourseId(courseId);
    const supabase = createClient();
    const { data } = await supabase
      .from("course_videos")
      .select("id, video_id, position, videos ( id, title )")
      .eq("course_id", courseId)
      .order("position");
    setCourseVideos((data as unknown as CourseVideo[]) ?? []);
  }

  async function addVideo(courseId: string, videoId: string) {
    if (!videoId) return;
    setBusy(true);
    const supabase = createClient();
    const nextPos =
      courseVideos.length > 0
        ? Math.max(...courseVideos.map((cv) => cv.position)) + 1
        : 0;
    const { data, error: addError } = await supabase
      .from("course_videos")
      .insert({ course_id: courseId, video_id: videoId, position: nextPos })
      .select("id, video_id, position, videos ( id, title )")
      .single();
    setBusy(false);
    if (addError) {
      setError(
        addError.message.includes("duplicate")
          ? "That video is already in this course."
          : addError.message
      );
      return;
    }
    setCourseVideos((cvs) => [...cvs, data as unknown as CourseVideo]);
  }

  async function removeVideo(rowId: string) {
    setBusy(true);
    const supabase = createClient();
    await supabase.from("course_videos").delete().eq("id", rowId);
    setCourseVideos((cvs) => cvs.filter((cv) => cv.id !== rowId));
    setBusy(false);
  }

  async function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= courseVideos.length) return;
    const a = courseVideos[index];
    const b = courseVideos[j];
    setBusy(true);
    const supabase = createClient();
    await Promise.all([
      supabase
        .from("course_videos")
        .update({ position: b.position })
        .eq("id", a.id),
      supabase
        .from("course_videos")
        .update({ position: a.position })
        .eq("id", b.id),
    ]);
    setCourseVideos((cvs) => {
      const next = [...cvs];
      next[index] = { ...b, position: a.position };
      next[j] = { ...a, position: b.position };
      return next;
    });
    setBusy(false);
  }

  async function deleteCourse(course: Course) {
    if (!window.confirm(`Delete course "${course.title}"? Videos stay — only the course is removed.`))
      return;
    const supabase = createClient();
    await supabase.from("courses").delete().eq("id", course.id);
    setCourses((cs) => cs.filter((c) => c.id !== course.id));
    if (openCourseId === course.id) setOpenCourseId(null);
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
          {error}
        </p>
      )}

      {/* Create course */}
      {showCreate ? (
        <form
          onSubmit={createCourse}
          className="rounded-xl bg-ink-900 border border-brand/30 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">New course</p>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="text-zinc-500 hover:text-white"
              aria-label="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <AuthInput
            label="Title"
            type="text"
            required
            maxLength={120}
            placeholder="SAT Geometry in 10 shorts"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <label className="block">
            <span className="block text-xs font-medium text-zinc-400 mb-1.5">
              Description
            </span>
            <textarea
              value={description}
              rows={2}
              maxLength={500}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-ink-800 border border-white/10 text-sm text-white outline-none focus:border-brand/60 transition resize-none"
              placeholder="What does this course cover?"
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
                Pricing (mock for now)
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={isPaid ? "paid" : "free"}
                  onChange={(e) => setIsPaid(e.target.value === "paid")}
                  className="h-10 px-3 rounded-xl bg-ink-800 border border-white/10 text-sm text-white outline-none focus:border-brand/60 transition"
                >
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
                {isPaid && (
                  <input
                    type="number"
                    min="0.99"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-ink-800 border border-white/10 text-sm text-white outline-none focus:border-brand/60 transition"
                  />
                )}
              </div>
            </label>
          </div>
          <button
            type="submit"
            disabled={creating || !title.trim()}
            className="w-full h-10 rounded-xl bg-gradient-to-r from-brand to-brand-hover text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 grid place-items-center"
          >
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Create course"
            )}
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full h-11 rounded-xl border border-dashed border-white/15 text-sm font-medium text-zinc-400 hover:border-brand/50 hover:text-white transition-colors inline-flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> New course
        </button>
      )}

      {/* Course list */}
      {courses.length === 0 && !showCreate ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          message="Group your videos into a structured learning path — free or (mock) paid."
        />
      ) : (
        courses.map((c) => (
          <div
            key={c.id}
            className="rounded-xl bg-ink-900 border border-white/5"
          >
            <div className="flex items-center gap-3 p-4">
              <button
                onClick={() => openCourse(c.id)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
              >
                <span className="grid place-items-center w-9 h-9 rounded-lg bg-brand/15 text-brand-glow shrink-0">
                  <BookOpen className="w-4 h-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold truncate">
                    {c.title}
                  </span>
                  <span className="block text-[11px] text-zinc-500">
                    {c.is_paid ? `$${Number(c.price).toFixed(2)} (mock)` : "Free"}
                  </span>
                </span>
                {openCourseId === c.id ? (
                  <ChevronUp className="w-4 h-4 text-zinc-500 ml-auto shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-500 ml-auto shrink-0" />
                )}
              </button>
              <button
                onClick={() => deleteCourse(c)}
                aria-label="Delete course"
                className="grid place-items-center w-8 h-8 rounded-lg bg-ink-800 text-red-400/70 hover:text-red-400 transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {openCourseId === c.id && (
              <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
                {courseVideos.length === 0 ? (
                  <p className="text-xs text-zinc-500">
                    No videos yet — add your first below.
                  </p>
                ) : (
                  courseVideos.map((cv, i) => (
                    <div
                      key={cv.id}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-ink-800"
                    >
                      <span className="text-[11px] font-bold text-zinc-500 w-5">
                        {i + 1}
                      </span>
                      <span className="text-xs font-medium truncate flex-1">
                        {cv.videos?.title ?? "(deleted video)"}
                      </span>
                      <button
                        onClick={() => move(i, -1)}
                        disabled={busy || i === 0}
                        aria-label="Move up"
                        className="text-zinc-500 hover:text-white disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => move(i, 1)}
                        disabled={busy || i === courseVideos.length - 1}
                        aria-label="Move down"
                        className="text-zinc-500 hover:text-white disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeVideo(cv.id)}
                        disabled={busy}
                        aria-label="Remove from course"
                        className="text-red-400/70 hover:text-red-400 disabled:opacity-30"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}

                <select
                  value=""
                  disabled={busy}
                  onChange={(e) => addVideo(c.id, e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-ink-800 border border-dashed border-white/15 text-sm text-zinc-400 outline-none focus:border-brand/60 transition"
                >
                  <option value="" disabled>
                    + Add a video to this course…
                  </option>
                  {myVideos
                    .filter(
                      (v) => !courseVideos.some((cv) => cv.video_id === v.id)
                    )
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.title}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
