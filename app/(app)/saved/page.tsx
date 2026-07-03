import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import VideoGrid, { type GridVideo } from "@/components/VideoGrid";
import EmptyState from "@/components/EmptyState";
import { Bookmark } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  if (!isSupabaseConfigured) {
    return (
      <main className="h-full grid place-items-center">
        <EmptyState
          icon={Bookmark}
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
  if (!user) redirect("/auth/login?next=/saved");

  const { data } = await supabase
    .from("saved_videos")
    .select("videos ( id, title, video_url, visibility )")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const videos: GridVideo[] = (data ?? [])
    .map((r) => r.videos as unknown as GridVideo & { visibility: string })
    .filter((v) => v && v.visibility === "public");

  return (
    <main className="h-full overflow-y-auto no-scrollbar">
      <div className="mx-auto max-w-lg px-4 pt-10 pb-8">
        <h1 className="text-xl font-bold">Saved lessons</h1>
        <p className="mt-1 text-sm text-zinc-500">Only you can see these.</p>
        <div className="mt-6">
          {videos.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="Nothing saved yet"
              message="Tap the bookmark on any video in the feed to build your library."
            />
          ) : (
            <VideoGrid videos={videos} />
          )}
        </div>
      </div>
    </main>
  );
}
