import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import VerticalVideoFeed from "@/components/VerticalVideoFeed";
import EmptyState from "@/components/EmptyState";
import { Clapperboard, X } from "lucide-react";
import { toFeedQuiz, type FeedItem } from "@/lib/feed";

export const dynamic = "force-dynamic";

type VideoRow = {
  id: string;
  title: string;
  caption: string;
  video_url: string;
  created_at: string;
  topic_id: string | null;
  profiles: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  topics: { name: string; slug: string } | null;
  video_hashtags: { hashtags: { name: string; slug: string } | null }[];
  likes: { count: number }[];
  quizzes: {
    id: string;
    question: string;
    answer_choices: unknown;
    correct_answer: number;
  }[];
  course_videos: { course_id: string }[];
};

const FEED_SELECT = `id, title, caption, video_url, created_at, topic_id,
  profiles:creator_id ( id, username, display_name, avatar_url ),
  topics:topic_id ( name, slug ),
  video_hashtags ( hashtags ( name, slug ) ),
  likes ( count ),
  quizzes ( id, question, answer_choices, correct_answer ),
  course_videos ( course_id )`;

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic: topicSlug } = await searchParams;

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

  // Resolve topic filter (if any)
  let topicFilter: { id: string; name: string } | null = null;
  if (topicSlug) {
    const { data: t } = await supabase
      .from("topics")
      .select("id, name")
      .eq("slug", topicSlug)
      .maybeSingle();
    if (t) topicFilter = t;
  }

  let query = supabase
    .from("videos")
    .select(FEED_SELECT)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(50);
  if (topicFilter) query = query.eq("topic_id", topicFilter.id);

  const [{ data: rows }, userResult] = await Promise.all([
    query.returns<VideoRow[]>(),
    supabase.auth.getUser(),
  ]);

  const user = userResult.data.user;

  let likedIds: string[] = [];
  let savedIds: string[] = [];
  let followingIds: string[] = [];
  let userTopicIds: string[] = [];

  if (user) {
    const [likesRes, savesRes, followsRes, topicsRes] = await Promise.all([
      supabase.from("likes").select("video_id").eq("user_id", user.id),
      supabase.from("saved_videos").select("video_id").eq("user_id", user.id),
      supabase.from("follows").select("following_id").eq("follower_id", user.id),
      supabase.from("user_topics").select("topic_id").eq("user_id", user.id),
    ]);
    likedIds = likesRes.data?.map((r) => r.video_id) ?? [];
    savedIds = savesRes.data?.map((r) => r.video_id) ?? [];
    followingIds = followsRes.data?.map((r) => r.following_id) ?? [];
    userTopicIds = topicsRes.data?.map((r) => r.topic_id) ?? [];
  }

  const followingSet = new Set(followingIds);
  const topicSet = new Set(userTopicIds);

  /**
   * Simple ranking, structured to be swappable later:
   * followed creator +2, followed topic +1, likes add a little,
   * newest breaks ties. Discovery mix comes free since it's additive.
   */
  const scored = (rows ?? [])
    .filter((r) => r.profiles)
    .map((r) => {
      let score = 0;
      if (followingSet.has(r.profiles!.id)) score += 2;
      if (r.topic_id && topicSet.has(r.topic_id)) score += 1;
      score += Math.min((r.likes?.[0]?.count ?? 0) / 10, 1);
      return { r, score };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        +new Date(b.r.created_at) - +new Date(a.r.created_at)
    );

  const items: FeedItem[] = scored.map(({ r }) => ({
    id: r.id,
    title: r.title,
    caption: r.caption,
    videoUrl: r.video_url,
    createdAt: r.created_at,
    creator: {
      id: r.profiles!.id,
      username: r.profiles!.username,
      displayName: r.profiles!.display_name,
      avatarUrl: r.profiles!.avatar_url,
    },
    topic: r.topics,
    hashtags: r.video_hashtags
      .map((vh) => vh.hashtags)
      .filter((h): h is { name: string; slug: string } => h !== null),
    likeCount: r.likes?.[0]?.count ?? 0,
    quiz: toFeedQuiz(r.quizzes?.[0] ?? null),
    courseId: r.course_videos?.[0]?.course_id ?? null,
  }));

  if (items.length === 0) {
    return (
      <main className="h-full grid place-items-center">
        <EmptyState
          icon={Clapperboard}
          title={topicFilter ? `Nothing in ${topicFilter.name} yet` : "Nothing here yet"}
          message={
            topicFilter
              ? "Be the first to post a lesson in this topic."
              : "Be the first — post a lesson and it shows up in the feed."
          }
        />
        <Link
          href={topicFilter ? "/feed" : "/upload"}
          className="-mt-10 px-6 py-3 rounded-full bg-gradient-to-r from-brand to-brand-hover text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {topicFilter ? "Back to full feed" : "Post the first lesson"}
        </Link>
      </main>
    );
  }

  return (
    <main className="relative h-full">
      {topicFilter && (
        <Link
          href="/feed"
          className="absolute top-3 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur text-xs font-semibold text-white hover:bg-white/25 transition-colors"
        >
          {topicFilter.name}
          <X className="w-3.5 h-3.5" />
        </Link>
      )}
      <VerticalVideoFeed
        items={items}
        currentUserId={user?.id ?? null}
        likedIds={likedIds}
        savedIds={savedIds}
        followingIds={followingIds}
      />
    </main>
  );
}
