import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import EmptyState from "@/components/EmptyState";
import FollowButton from "@/components/FollowButton";
import ProfileTabs from "@/components/ProfileTabs";
import { Settings, UserX } from "lucide-react";
import type { Profile, Video } from "@/lib/types";
import { formatCount } from "@/lib/feed";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  if (!isSupabaseConfigured) {
    return (
      <main className="h-full grid place-items-center">
        <EmptyState
          icon={UserX}
          title="Supabase not connected"
          message="Add your keys to .env.local and restart the dev server."
        />
      </main>
    );
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", username)
    .maybeSingle<Profile>();

  if (!profile) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwn = user?.id === profile.id;

  let isFollowing = false;
  if (user && !isOwn) {
    const { data: followRow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", profile.id)
      .maybeSingle();
    isFollowing = Boolean(followRow);
  }

  const [
    { count: followers },
    { count: following },
    { data: videos },
    { data: rawCourses },
  ] = await Promise.all([
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", profile.id),
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", profile.id),
    supabase
      .from("videos")
      .select("id, title, video_url")
      .eq("creator_id", profile.id)
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .returns<Video[]>(),
    supabase
      .from("courses")
      .select("id, title, description, price, is_paid, course_videos(count)")
      .eq("creator_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  const courses = (rawCourses ?? []).map((c: {
    id: string;
    title: string;
    description: string;
    price: number;
    is_paid: boolean;
    course_videos: { count: number }[];
  }) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    price: c.price,
    is_paid: c.is_paid,
    video_count: c.course_videos?.[0]?.count ?? 0,
    thumbnail_url: null,
  }));

  const initial = (profile.display_name || profile.username)
    .charAt(0)
    .toUpperCase();

  return (
    <main className="h-full overflow-y-auto no-scrollbar">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="font-bold text-base">@{profile.username}</h2>
        {isOwn && (
          <Link href="/settings" aria-label="Settings">
            <Settings className="w-5 h-5 text-zinc-400 hover:text-white transition-colors" />
          </Link>
        )}
      </div>

      {/* Avatar + stats row */}
      <div className="px-4 flex items-center gap-5 mt-1">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            className="w-20 h-20 rounded-full object-cover border-2 border-white/10 shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand to-accent grid place-items-center text-2xl font-bold text-white shrink-0">
            {initial}
          </div>
        )}

        <div className="flex-1 flex justify-around">
          <Stat label="Videos" value={videos?.length ?? 0} />
          <Stat label="Followers" value={followers ?? 0} />
          <Stat label="Following" value={following ?? 0} />
        </div>
      </div>

      {/* Name + bio */}
      <div className="px-4 mt-3">
        <p className="font-bold text-sm">{profile.display_name}</p>
        {profile.bio && (
          <p className="mt-1 text-sm text-zinc-400 leading-snug">{profile.bio}</p>
        )}
        <span className="mt-1.5 inline-block px-2 py-0.5 rounded-full bg-brand/15 text-brand-glow text-[10px] font-semibold uppercase tracking-wide">
          {profile.role}
        </span>
      </div>

      {/* Action button */}
      <div className="px-4 mt-3">
        {isOwn ? (
          <Link
            href="/settings"
            className="block w-full py-2 rounded-lg bg-ink-800 border border-white/10 text-sm font-semibold text-center hover:bg-ink-700 transition-colors"
          >
            Edit profile
          </Link>
        ) : (
          <FollowButton
            profileId={profile.id}
            currentUserId={user?.id ?? null}
            initialFollowing={isFollowing}
          />
        )}
      </div>

      {/* Tabs: Videos + Courses */}
      <ProfileTabs
        videos={videos ?? []}
        courses={courses}
        isOwnProfile={isOwn}
      />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-base font-bold">{formatCount(value)}</p>
      <p className="text-[11px] text-zinc-500 mt-0.5">{label}</p>
    </div>
  );
}
