"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Check, Plus } from "lucide-react";

type Props = {
  profileId: string;
  currentUserId: string | null;
  initialFollowing: boolean;
};

export default function FollowButton({
  profileId,
  currentUserId,
  initialFollowing,
}: Props) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);

  if (currentUserId === profileId) return null;

  async function toggle() {
    if (!currentUserId) {
      router.push("/auth/login");
      return;
    }
    const supabase = createClient();
    const next = !following;
    setFollowing(next);
    const result = next
      ? await supabase
          .from("follows")
          .insert({ follower_id: currentUserId, following_id: profileId })
      : await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", profileId);
    if (result.error) setFollowing(!next);
    else router.refresh();
  }

  return (
    <button
      onClick={toggle}
      className={`mt-4 inline-flex items-center gap-1.5 px-6 py-2 rounded-full text-sm font-semibold transition-colors ${
        following
          ? "border border-white/15 text-zinc-300 hover:bg-white/5"
          : "bg-gradient-to-r from-brand to-brand-hover text-white hover:opacity-90"
      }`}
    >
      {following ? (
        <>
          <Check className="w-4 h-4" /> Following
        </>
      ) : (
        <>
          <Plus className="w-4 h-4" /> Follow
        </>
      )}
    </button>
  );
}
