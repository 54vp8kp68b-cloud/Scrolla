"use client";

import { useState } from "react";
import VideoCard from "@/components/VideoCard";
import type { FeedItem } from "@/lib/feed";

type Props = {
  items: FeedItem[];
  currentUserId: string | null;
  likedIds: string[];
  savedIds: string[];
  followingIds: string[];
};

export default function VerticalVideoFeed({
  items,
  currentUserId,
  likedIds,
  savedIds,
  followingIds,
}: Props) {
  // Start muted — browsers block unmuted autoplay
  const [muted, setMuted] = useState(true);

  const liked = new Set(likedIds);
  const saved = new Set(savedIds);
  const following = new Set(followingIds);

  return (
    <div className="h-full overflow-y-auto no-scrollbar feed-snap">
      {items.map((item) => (
        <div key={item.id} className="h-full w-full">
          <VideoCard
            item={item}
            currentUserId={currentUserId}
            initialLiked={liked.has(item.id)}
            initialSaved={saved.has(item.id)}
            initialFollowing={following.has(item.creator.id)}
            muted={muted}
            onToggleMute={() => setMuted((m) => !m)}
          />
        </div>
      ))}
    </div>
  );
}
