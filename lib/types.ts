export type Role = "learner" | "creator" | "both";

export type Profile = {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  role: Role;
  created_at: string;
  updated_at: string;
};

export type Topic = {
  id: string;
  name: string;
  slug: string;
};

export type Video = {
  id: string;
  creator_id: string;
  title: string;
  caption: string;
  topic_id: string | null;
  video_url: string;
  storage_path: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  visibility: "public" | "unlisted" | "private";
  created_at: string;
  updated_at: string;
};
