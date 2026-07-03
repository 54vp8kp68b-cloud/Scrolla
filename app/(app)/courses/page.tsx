import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import EmptyState from "@/components/EmptyState";
import { BookOpen, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

type CourseRow = {
  id: string;
  title: string;
  description: string;
  price: number;
  is_paid: boolean;
  profiles: { username: string; display_name: string } | null;
  topics: { name: string } | null;
  course_videos: { count: number }[];
};

export default async function CoursesPage() {
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
  const { data: courses } = await supabase
    .from("courses")
    .select(
      `id, title, description, price, is_paid,
       profiles:creator_id ( username, display_name ),
       topics:topic_id ( name ),
       course_videos ( count )`
    )
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<CourseRow[]>();

  const list = (courses ?? []).filter(
    (c) => (c.course_videos?.[0]?.count ?? 0) > 0
  );

  return (
    <main className="h-full overflow-y-auto no-scrollbar">
      <div className="mx-auto max-w-lg px-4 pt-10 pb-8">
        <h1 className="text-xl font-bold">Courses</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Structured paths, built from short lessons.
        </p>

        <div className="mt-6 space-y-3">
          {list.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No courses yet"
              message="Creators can build one in the Creator studio — courses with videos show up here."
            />
          ) : (
            list.map((c) => (
              <Link
                key={c.id}
                href={`/courses/${c.id}`}
                className="block rounded-2xl bg-ink-900 border border-white/5 p-4 hover:border-brand/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="grid place-items-center w-10 h-10 rounded-xl bg-brand/15 text-brand-glow shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold truncate">{c.title}</h2>
                    <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                      {c.description || "No description."}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-500">
                      {c.profiles && <span>@{c.profiles.username}</span>}
                      {c.topics && (
                        <>
                          <span>·</span>
                          <span className="text-accent">{c.topics.name}</span>
                        </>
                      )}
                      <span>·</span>
                      <span>{c.course_videos?.[0]?.count ?? 0} lessons</span>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      c.is_paid
                        ? "bg-amber-400/15 text-amber-300"
                        : "bg-green-500/15 text-green-400"
                    }`}
                  >
                    {c.is_paid ? (
                      <span className="inline-flex items-center gap-1">
                        <Lock className="w-3 h-3" />$
                        {Number(c.price).toFixed(2)}
                      </span>
                    ) : (
                      "Free"
                    )}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
