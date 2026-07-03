import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import BuyCourseButton from "@/components/BuyCourseButton";
import EmptyState from "@/components/EmptyState";
import { BookOpen, CheckCircle2, Lock, PlayCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured) {
    return (
      <main className="h-full grid place-items-center">
        <EmptyState
          icon={BookOpen}
          title="Supabase not connected"
          message="Add your keys to .env.local and restart the dev server."
        />
      </main>
    );
  }

  const supabase = await createClient();

  const [{ data: course }, userResult] = await Promise.all([
    supabase
      .from("courses")
      .select(
        `id, title, description, price, is_paid, creator_id,
         profiles:creator_id ( username, display_name ),
         topics:topic_id ( name )`
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);

  if (!course) notFound();
  const user = userResult.data.user;

  const { data: courseVideos } = await supabase
    .from("course_videos")
    .select("position, videos ( id, title, caption, duration_seconds )")
    .eq("course_id", id)
    .order("position");

  const lessons = (courseVideos ?? [])
    .map(
      (cv) =>
        cv.videos as unknown as {
          id: string;
          title: string;
          caption: string;
          duration_seconds: number | null;
        } | null
    )
    .filter((v): v is NonNullable<typeof v> => v !== null);

  // Access: free, own course, or purchased
  let unlocked = !course.is_paid;
  let completedIds = new Set<string>();

  if (user) {
    if (user.id === course.creator_id) unlocked = true;
    if (!unlocked) {
      const { data: purchase } = await supabase
        .from("mock_purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", id)
        .maybeSingle();
      unlocked = Boolean(purchase);
    }
    if (lessons.length > 0) {
      const { data: views } = await supabase
        .from("video_views")
        .select("video_id")
        .eq("user_id", user.id)
        .eq("completed", true)
        .in(
          "video_id",
          lessons.map((l) => l.id)
        );
      completedIds = new Set((views ?? []).map((v) => v.video_id));
    }
  }

  const progress =
    lessons.length > 0
      ? Math.round((completedIds.size / lessons.length) * 100)
      : 0;
  const nextLesson =
    lessons.find((l) => !completedIds.has(l.id)) ?? lessons[0] ?? null;

  const creator = course.profiles as unknown as {
    username: string;
    display_name: string;
  } | null;
  const topic = course.topics as unknown as { name: string } | null;

  return (
    <main className="h-full overflow-y-auto no-scrollbar">
      <div className="mx-auto max-w-lg px-4 pt-10 pb-8">
        <Link
          href="/courses"
          className="text-xs text-zinc-500 hover:text-white transition-colors"
        >
          ← All courses
        </Link>

        <div className="mt-3">
          <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>
          <div className="mt-1.5 flex items-center gap-2 text-sm text-zinc-500">
            {creator && (
              <Link
                href={`/profile/${creator.username}`}
                className="text-brand-glow hover:underline"
              >
                @{creator.username}
              </Link>
            )}
            {topic && (
              <>
                <span>·</span>
                <span className="text-accent">{topic.name}</span>
              </>
            )}
            <span>·</span>
            <span>{lessons.length} lessons</span>
          </div>
          {course.description && (
            <p className="mt-3 text-sm text-zinc-400">{course.description}</p>
          )}
        </div>

        {/* Progress */}
        {user && unlocked && lessons.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-zinc-400 font-medium">
                {completedIds.size}/{lessons.length} finished
              </span>
              <span className="text-brand-glow font-bold">{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-ink-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-5">
          {!unlocked ? (
            <BuyCourseButton
              courseId={course.id}
              price={Number(course.price)}
              currentUserId={user?.id ?? null}
            />
          ) : nextLesson ? (
            <Link
              href={`/video/${nextLesson.id}`}
              className="w-full h-12 rounded-full bg-gradient-to-r from-brand to-brand-hover text-white font-semibold hover:opacity-90 transition-opacity inline-flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-5 h-5" />
              {completedIds.size === 0
                ? "Start course"
                : progress === 100
                  ? "Rewatch from lesson 1"
                  : "Continue"}
            </Link>
          ) : null}
        </div>

        {/* Lesson list */}
        <div className="mt-6 space-y-2">
          {lessons.map((lesson, i) => {
            const done = completedIds.has(lesson.id);
            const row = (
              <div
                className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors ${
                  unlocked
                    ? "bg-ink-900 border-white/5 hover:border-brand/30"
                    : "bg-ink-900/50 border-white/5 opacity-60"
                }`}
              >
                <span className="text-xs font-bold text-zinc-500 w-5 text-center">
                  {i + 1}
                </span>
                {done ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                ) : unlocked ? (
                  <PlayCircle className="w-5 h-5 text-zinc-500 shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 text-zinc-600 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium truncate ${
                      done ? "text-zinc-400" : ""
                    }`}
                  >
                    {lesson.title}
                  </p>
                  {lesson.duration_seconds != null && (
                    <p className="text-[11px] text-zinc-600">
                      {lesson.duration_seconds}s
                    </p>
                  )}
                </div>
              </div>
            );
            return unlocked ? (
              <Link key={lesson.id} href={`/video/${lesson.id}`} className="block">
                {row}
              </Link>
            ) : (
              <div key={lesson.id}>{row}</div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
