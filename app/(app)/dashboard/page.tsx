import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import EmptyState from "@/components/EmptyState";
import {
  User,
  Settings,
  Bookmark,
  Heart,
  Flame,
  ChevronRight,
  Clapperboard,
} from "lucide-react";
import type { Profile } from "@/lib/types";

export default async function DashboardPage() {
  if (!isSupabaseConfigured) {
    return (
      <main className="h-full grid place-items-center">
        <EmptyState
          icon={User}
          title="Supabase not connected"
          message="Add your keys to .env.local and restart the dev server."
        />
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) redirect("/auth/login");

  // Learning stats
  const [viewsRes, quizRes, savedRes] = await Promise.all([
    supabase
      .from("video_views")
      .select("video_id, completed")
      .eq("user_id", user.id),
    supabase.from("quiz_attempts").select("is_correct").eq("user_id", user.id),
    supabase
      .from("saved_videos")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const completedCount = new Set(
    (viewsRes.data ?? []).filter((v) => v.completed).map((v) => v.video_id)
  ).size;
  const attempts = quizRes.data ?? [];
  const correctCount = attempts.filter((a) => a.is_correct).length;
  const accuracy =
    attempts.length > 0
      ? Math.round((correctCount / attempts.length) * 100)
      : null;
  const savedCount = savedRes.count ?? 0;

  const initial = (profile.display_name || profile.username)
    .charAt(0)
    .toUpperCase();

  return (
    <main className="h-full overflow-y-auto no-scrollbar">
      <div className="mx-auto max-w-md px-4 pt-10 pb-8">
        {/* Profile summary */}
        <div className="flex items-center gap-4">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="w-14 h-14 rounded-full object-cover border-2 border-white/10"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand to-accent grid place-items-center text-xl font-bold text-white">
              {initial}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-bold truncate">{profile.display_name}</h1>
            <Link
              href={`/profile/${profile.username}`}
              className="text-sm text-brand-glow hover:underline"
            >
              @{profile.username}
            </Link>
          </div>
          <Link
            href="/settings"
            aria-label="Settings"
            className="ml-auto grid place-items-center w-10 h-10 rounded-full bg-ink-800 border border-white/5 text-zinc-400 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-3 gap-2">
          <StatCard value={String(completedCount)} label="Lessons finished" />
          <StatCard
            value={accuracy === null ? "—" : `${accuracy}%`}
            label={`Quiz accuracy${attempts.length ? ` (${attempts.length})` : ""}`}
          />
          <StatCard value={String(savedCount)} label="Saved" />
        </div>

        <div className="mt-3 p-4 rounded-2xl bg-gradient-to-r from-brand/15 to-accent/10 border border-brand/20 flex items-center gap-3">
          <Flame className="w-6 h-6 text-accent-pink" />
          <div>
            <p className="text-sm font-semibold">
              {completedCount > 0
                ? "You're on a roll — keep scrolling."
                : "Finish your first lesson to start your streak."}
            </p>
            <p className="text-xs text-zinc-400">
              Watch 90% of a video and it counts as finished.
            </p>
          </div>
        </div>

        {/* Library links */}
        <div className="mt-6 space-y-2">
          <DashLink
            href="/saved"
            icon={<Bookmark className="w-4 h-4" />}
            label="Saved lessons"
          />
          <DashLink
            href="/liked"
            icon={<Heart className="w-4 h-4" />}
            label="Liked videos"
          />
          {profile.role !== "learner" && (
            <DashLink
              href="/creator"
              icon={<Clapperboard className="w-4 h-4" />}
              label="Creator studio"
            />
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="p-3 rounded-xl bg-ink-900 border border-white/5 text-center">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">{label}</p>
    </div>
  );
}

function DashLink({
  href,
  icon,
  label,
  note,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  note?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-4 rounded-xl bg-ink-900 border border-white/5 hover:border-white/15 transition-colors"
    >
      <span className="grid place-items-center w-9 h-9 rounded-lg bg-ink-800 text-zinc-400">
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
      {note && <span className="text-[11px] text-zinc-600">{note}</span>}
      <ChevronRight className="w-4 h-4 text-zinc-600 ml-auto" />
    </Link>
  );
}
