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
  Trophy,
  Target,
  Play,
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

  const [viewsRes, quizRes, savedRes] = await Promise.all([
    supabase.from("video_views").select("video_id, completed").eq("user_id", user.id),
    supabase.from("quiz_attempts").select("is_correct").eq("user_id", user.id),
    supabase.from("saved_videos").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const completedCount = new Set(
    (viewsRes.data ?? []).filter((v) => v.completed).map((v) => v.video_id)
  ).size;
  const attempts = quizRes.data ?? [];
  const correctCount = attempts.filter((a) => a.is_correct).length;
  const accuracy = attempts.length > 0 ? Math.round((correctCount / attempts.length) * 100) : null;
  const savedCount = savedRes.count ?? 0;

  const initial = (profile.display_name || profile.username).charAt(0).toUpperCase();

  return (
    <main className="h-full overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="px-4 pt-5 pb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500 font-medium">Welcome back</p>
          <h1 className="text-xl font-bold mt-0.5">{profile.display_name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/profile/${profile.username}`}
            aria-label="Your profile"
          >
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                className="w-10 h-10 rounded-full object-cover border-2 border-brand/40"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-accent grid place-items-center font-bold text-white">
                {initial}
              </div>
            )}
          </Link>
          <Link
            href="/settings"
            aria-label="Settings"
            className="grid place-items-center w-10 h-10 rounded-full bg-ink-800 border border-white/8 text-zinc-400 hover:text-white transition-colors"
          >
            <Settings className="w-4.5 h-4.5" />
          </Link>
        </div>
      </div>

      <div className="px-4 pb-8 space-y-4">
        {/* Streak / motivation card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand/20 via-ink-800 to-accent/10 border border-brand/25 p-4">
          <div aria-hidden className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-brand/10 blur-2xl" />
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand to-accent grid place-items-center shrink-0">
              <Flame className="w-5 h-5 text-white" />
            </span>
            <div>
              <p className="font-semibold text-sm">
                {completedCount > 0 ? "You're on a roll — keep scrolling!" : "Start your first lesson today"}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Watch 90% of any video to mark it complete
              </p>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard
            icon={<Play className="w-4 h-4" />}
            value={String(completedCount)}
            label="Finished"
            color="text-brand-glow"
            bg="bg-brand/10"
          />
          <StatCard
            icon={<Target className="w-4 h-4" />}
            value={accuracy === null ? "—" : `${accuracy}%`}
            label="Quiz score"
            color="text-accent"
            bg="bg-accent/10"
          />
          <StatCard
            icon={<Trophy className="w-4 h-4" />}
            value={String(savedCount)}
            label="Saved"
            color="text-accent-pink"
            bg="bg-pink-500/10"
          />
        </div>

        {/* Quick actions */}
        <div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2.5">Library</p>
          <div className="space-y-2">
            <DashLink href="/saved" icon={<Bookmark className="w-4 h-4" />} label="Saved lessons" color="text-amber-400" bg="bg-amber-500/10" />
            <DashLink href="/liked" icon={<Heart className="w-4 h-4" />} label="Liked videos" color="text-red-400" bg="bg-red-500/10" />
            {profile.role !== "learner" && (
              <DashLink href="/creator" icon={<Clapperboard className="w-4 h-4" />} label="Creator studio" color="text-brand-glow" bg="bg-brand/10" />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  icon, value, label, color, bg,
}: {
  icon: React.ReactNode; value: string; label: string; color: string; bg: string;
}) {
  return (
    <div className="p-3.5 rounded-2xl bg-ink-900 border border-white/8 flex flex-col gap-2">
      <span className={`w-8 h-8 rounded-lg ${bg} ${color} grid place-items-center`}>
        {icon}
      </span>
      <div>
        <p className="text-xl font-bold leading-none">{value}</p>
        <p className="text-[10px] text-zinc-500 mt-1">{label}</p>
      </div>
    </div>
  );
}

function DashLink({
  href, icon, label, color, bg,
}: {
  href: string; icon: React.ReactNode; label: string; color: string; bg: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3.5 rounded-xl bg-ink-900 border border-white/8 hover:border-white/20 transition-colors group"
    >
      <span className={`grid place-items-center w-9 h-9 rounded-lg ${bg} ${color}`}>
        {icon}
      </span>
      <span className="text-sm font-medium flex-1">{label}</span>
      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
    </Link>
  );
}
