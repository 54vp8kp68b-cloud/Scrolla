import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import EmptyState from "@/components/EmptyState";
import FollowButton from "@/components/FollowButton";
import VideoGrid from "@/components/VideoGrid";
import { Clapperboard, UserX } from "lucide-react";
import type { Profile, Video } from "@/lib/types";

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

  let isFollowing = false;
  if (user && user.id !== profile.id) {
    const { data: followRow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", profile.id)
      .maybeSingle();
    isFollowing = Boolean(followRow);
  }

  const [{ count: followers }, { count: following }, { data: videos }] =
    await Promise.all([
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
        .select("*")
        .eq("creator_id", profile.id)
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .returns<Video[]>(),
    ]);

  const initial = (profile.display_name || profile.username)
    .charAt(0)
    .toUpperCase();

  return (
    <main className="h-full overflow-y-auto no-scrollbar">
      <div className="mx-auto max-w-lg px-4 pt-10 pb-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="w-20 h-20 rounded-full object-cover border-2 border-white/10"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand to-accent grid place-items-center text-2xl font-bold text-white">
              {initial}
            </div>
          )}
          <h1 className="mt-3 text-lg font-bold">{profile.display_name}</h1>
          <p className="text-sm text-zinc-500">@{profile.username}</p>
          {profile.bio && (
            <p className="mt-2 text-sm text-zinc-400 max-w-xs">{profile.bio}</p>
          )}
          <span className="mt-2 px-2.5 py-0.5 rounded-full bg-brand/15 text-brand-glow text-[11px] font-semibold uppercase tracking-wide">
            {profile.role}
          </span>

          <FollowButton
            profileId={profile.id}
            currentUserId={user?.id ?? null}
            initialFollowing={isFollowing}
          />

          {/* Stats */}
          <div className="mt-5 flex items-center gap-8">
            <Stat label="Followers" value={followers ?? 0} />
            <Stat label="Following" value={following ?? 0} />
            <Stat label="Videos" value={videos?.length ?? 0} />
          </div>
        </div>

        {/* Videos grid */}
        <div className="mt-8">
          {!videos || videos.length === 0 ? (
            <EmptyState
              icon={Clapperboard}
              title="No videos yet"
              message="Uploads land here once Phase 4 (video upload) ships."
            />
          ) : (
            <VideoGrid videos={videos} />
          )}
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[11px] text-zinc-500">{label}</p>
    </div>
  );
}
