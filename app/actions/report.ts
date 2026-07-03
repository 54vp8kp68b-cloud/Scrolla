"use server";

import { createClient } from "@/lib/supabase/server";

export type ReportReason =
  | "spam"
  | "inappropriate"
  | "misinformation"
  | "harassment"
  | "other";

export async function submitReport(
  videoId: string,
  reason: ReportReason,
  details: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in to report a video." };

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    video_id: videoId,
    reason,
    details: details.trim().slice(0, 500),
  });

  if (error) {
    if (error.code === "23505") return { error: "You already reported this video." };
    return { error: "Something went wrong. Please try again." };
  }

  return { error: null };
}

export async function blockUser(
  blockedId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be signed in to block someone." };
  if (user.id === blockedId) return { error: "You cannot block yourself." };

  const { error } = await supabase.from("user_blocks").insert({
    blocker_id: user.id,
    blocked_id: blockedId,
  });

  if (error) {
    if (error.code === "23505") return { error: null }; // already blocked — treat as success
    return { error: "Something went wrong. Please try again." };
  }

  return { error: null };
}
