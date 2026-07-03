import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import VerticalVideoFeed from "@/components/VerticalVideoFeed";
import EmptyState from "@/components/EmptyState";
import { Clapperboard } from "lucide-react";
import { toFeedQuiz, type FeedItem } from "@/lib/feed";

export const dynamic = "force-dynamic";

export default async function VideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured) {
    return (
      <main className="h-full grid place-items-center">
        <EmptyState
          icon={Clapperboard}
          title="Supabase not connected"
          message="Add your keys to .env.local and restart the dev server."
        />
      </main>
    );
  }

  const supabase = await createClient();

  const [{ data: r }, userResult] = await Promise.all([
    supabase
      .from("videos")
      .select(
        `id, title, caption, video_url, created_at, visibility,
         profiles:creator_id ( id, username, display_name, avatar_url ),
         topics:topic_id ( name, slug ),
         video_hashtags ( hashtags ( name, slug ) ),
         likes ( count ),
         comments ( count ),
         quizzes ( id, question, answer_choices, correct_answer ),
         course_videos ( course_id )`
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);

  if (!r || !r.profiles) notFound();

  const user = userResult.data.user;
  const profiles = r.profiles as unknown as {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };

  let liked = false;
  let savedFlag = false;
  let following = false;

  if (user) {
    const [likeRes, saveRes, followRes] = await Promise.all([
      supabase
        .from("likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("video_id", id)
        .maybeSingle(),
      supabase
        .from("saved_videos")
        .select("id")
        .eq("user_id", user.id)
        .eq("video_id", id)
        .maybeSingle(),
      supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", profiles.id)
        .maybeSingle(),
    ]);
    liked = Boolean(likeRes.data);
    savedFlag = Boolean(saveRes.data);
    following = Boolean(followRes.data);
  }

  const item: FeedItem = {
    id: r.id,
    title: r.title,
    caption: r.caption,
    videoUrl: r.video_url,
    createdAt: r.created_at,
    creator: {
      id: profiles.id,
      username: profiles.username,
      displayName: profiles.display_name,
      avatarUrl: profiles.avatar_url,
    },
    topic: (r.topics as unknown as { name: string; slug: string } | null) ?? null,
    hashtags: (
      (r.video_hashtags as unknown as {
        hashtags: { name: string; slug: string } | null;
      }[]) ?? []
    )
      .map((vh) => vh.hashtags)
      .filter((h): h is { name: string; slug: string } => h !== null),
    likeCount:
      (r.likes as unknown as { count: number }[] | null)?.[0]?.count ?? 0,
    commentCount:
      (r.comments as unknown as { count: number }[] | null)?.[0]?.count ?? 0,
    quiz: toFeedQuiz(
      (r.quizzes as unknown as {
        id: string;
        question: string;
        answer_choices: unknown;
        correct_answer: number;
      }[] | null)?.[0] ?? null
    ),
    courseId:
      (r.course_videos as unknown as { course_id: string }[] | null)?.[0]
        ?.course_id ?? null,
  };

  return (
    <main className="h-full">
      <VerticalVideoFeed
        items={[item]}
        currentUserId={user?.id ?? null}
        likedIds={liked ? [item.id] : []}
        savedIds={savedFlag ? [item.id] : []}
        followingIds={following ? [item.creator.id] : []}
      />
    </main>
  );
}
