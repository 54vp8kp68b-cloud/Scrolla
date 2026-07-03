-- ============================================================
-- Scrolla — Phase 2 schema
-- Run this in the Supabase SQL Editor (paste entire file, Run).
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE where possible.
-- ============================================================

-- ---------- PROFILES ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  username text not null unique check (username ~ '^[a-zA-Z0-9_.]{3,24}$'),
  display_name text not null default '',
  avatar_url text,
  bio text not null default '',
  role text not null default 'learner' check (role in ('learner', 'creator', 'both')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile when a user signs up.
-- Username/display_name/role come from auth metadata set by the sign-up form.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, username, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'username', 'New user'),
    coalesce(new.raw_user_meta_data ->> 'role', 'learner')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- TOPICS ----------
create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

insert into public.topics (name, slug) values
  ('SAT Prep', 'sat-prep'),
  ('Math', 'math'),
  ('Coding', 'coding'),
  ('Business', 'business'),
  ('Science', 'science'),
  ('History', 'history'),
  ('College Tips', 'college-tips'),
  ('Personal Finance', 'personal-finance'),
  ('Language Learning', 'language-learning'),
  ('Fitness Education', 'fitness-education')
on conflict (slug) do nothing;

create table if not exists public.user_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, topic_id)
);

-- ---------- VIDEOS ----------
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  caption text not null default '' check (char_length(caption) <= 500),
  topic_id uuid references public.topics (id) on delete set null,
  video_url text not null,
  storage_path text not null,
  thumbnail_url text,
  duration_seconds numeric,
  visibility text not null default 'public' check (visibility in ('public', 'unlisted', 'private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists videos_creator_idx on public.videos (creator_id);
create index if not exists videos_topic_idx on public.videos (topic_id);
create index if not exists videos_created_idx on public.videos (created_at desc);

-- ---------- HASHTAGS ----------
create table if not exists public.hashtags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.video_hashtags (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos (id) on delete cascade,
  hashtag_id uuid not null references public.hashtags (id) on delete cascade,
  unique (video_id, hashtag_id)
);

-- ---------- ENGAGEMENT ----------
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  video_id uuid not null references public.videos (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, video_id)
);

create table if not exists public.saved_videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  video_id uuid not null references public.videos (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, video_id)
);

create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists likes_video_idx on public.likes (video_id);
create index if not exists saved_videos_user_idx on public.saved_videos (user_id);
create index if not exists follows_following_idx on public.follows (following_id);

create table if not exists public.video_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  video_id uuid not null references public.videos (id) on delete cascade,
  watched_seconds numeric not null default 0,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists video_views_user_idx on public.video_views (user_id);

-- ---------- COURSES ----------
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '',
  topic_id uuid references public.topics (id) on delete set null,
  price numeric not null default 0 check (price >= 0),
  is_paid boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_videos (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  video_id uuid not null references public.videos (id) on delete cascade,
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (course_id, video_id)
);

create table if not exists public.course_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  progress_percentage numeric not null default 0 check (progress_percentage between 0 and 100),
  updated_at timestamptz not null default now(),
  unique (user_id, course_id)
);

-- ---------- QUIZZES ----------
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos (id) on delete cascade,
  question text not null,
  answer_choices jsonb not null, -- e.g. ["4", "8", "16", "32"]
  correct_answer int not null,   -- index into answer_choices
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  selected_answer int not null,
  is_correct boolean not null,
  created_at timestamptz not null default now()
);

-- ---------- MOCK PURCHASES (Stripe later) ----------
create table if not exists public.mock_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

-- ---------- COMMENTS (simple version, built out later) ----------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  video_id uuid not null references public.videos (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

-- ---------- REPORTS (required for App Store) ----------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  video_id uuid references public.videos (id) on delete cascade,
  reason text not null check (reason in ('spam', 'inappropriate', 'misinformation', 'harassment', 'other')),
  details text not null default '' check (char_length(details) <= 500),
  created_at timestamptz not null default now(),
  unique (reporter_id, video_id)
);

-- ---------- USER BLOCKS (required for App Store) ----------
create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.topics enable row level security;
alter table public.user_topics enable row level security;
alter table public.videos enable row level security;
alter table public.hashtags enable row level security;
alter table public.video_hashtags enable row level security;
alter table public.likes enable row level security;
alter table public.saved_videos enable row level security;
alter table public.follows enable row level security;
alter table public.video_views enable row level security;
alter table public.courses enable row level security;
alter table public.course_videos enable row level security;
alter table public.course_progress enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.mock_purchases enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;
alter table public.user_blocks enable row level security;

-- Profiles: public read, owner writes
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select using (true);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Topics & hashtags: public read; hashtags insertable by signed-in users
drop policy if exists "topics_select" on public.topics;
create policy "topics_select" on public.topics for select using (true);
drop policy if exists "hashtags_select" on public.hashtags;
create policy "hashtags_select" on public.hashtags for select using (true);
drop policy if exists "hashtags_insert" on public.hashtags;
create policy "hashtags_insert" on public.hashtags for insert with check (auth.uid() is not null);

-- User topics: private to the user
drop policy if exists "user_topics_all_own" on public.user_topics;
create policy "user_topics_all_own" on public.user_topics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Videos: public ones readable by all; owners see & manage their own
drop policy if exists "videos_select" on public.videos;
create policy "videos_select" on public.videos
  for select using (visibility = 'public' or auth.uid() = creator_id);
drop policy if exists "videos_insert_own" on public.videos;
create policy "videos_insert_own" on public.videos
  for insert with check (auth.uid() = creator_id);
drop policy if exists "videos_update_own" on public.videos;
create policy "videos_update_own" on public.videos
  for update using (auth.uid() = creator_id);
drop policy if exists "videos_delete_own" on public.videos;
create policy "videos_delete_own" on public.videos
  for delete using (auth.uid() = creator_id);

-- Video hashtags: readable by all; managed by the video's creator
drop policy if exists "video_hashtags_select" on public.video_hashtags;
create policy "video_hashtags_select" on public.video_hashtags for select using (true);
drop policy if exists "video_hashtags_write" on public.video_hashtags;
create policy "video_hashtags_write" on public.video_hashtags
  for all using (
    auth.uid() in (select creator_id from public.videos where id = video_id)
  ) with check (
    auth.uid() in (select creator_id from public.videos where id = video_id)
  );

-- Likes / saves / follows: counts readable by all, rows managed by owner
drop policy if exists "likes_select" on public.likes;
create policy "likes_select" on public.likes for select using (true);
drop policy if exists "likes_write_own" on public.likes;
create policy "likes_write_own" on public.likes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "saved_select_own" on public.saved_videos;
create policy "saved_select_own" on public.saved_videos for select using (auth.uid() = user_id);
drop policy if exists "saved_write_own" on public.saved_videos;
create policy "saved_write_own" on public.saved_videos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "follows_select" on public.follows;
create policy "follows_select" on public.follows for select using (true);
drop policy if exists "follows_write_own" on public.follows;
create policy "follows_write_own" on public.follows
  for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

-- Views: user inserts own view rows, reads own history
drop policy if exists "views_select_own" on public.video_views;
create policy "views_select_own" on public.video_views for select using (auth.uid() = user_id);
drop policy if exists "views_insert_own" on public.video_views;
create policy "views_insert_own" on public.video_views
  for insert with check (auth.uid() = user_id);

-- Courses: readable by all; managed by creator
drop policy if exists "courses_select" on public.courses;
create policy "courses_select" on public.courses for select using (true);
drop policy if exists "courses_write_own" on public.courses;
create policy "courses_write_own" on public.courses
  for all using (auth.uid() = creator_id) with check (auth.uid() = creator_id);

drop policy if exists "course_videos_select" on public.course_videos;
create policy "course_videos_select" on public.course_videos for select using (true);
drop policy if exists "course_videos_write" on public.course_videos;
create policy "course_videos_write" on public.course_videos
  for all using (
    auth.uid() in (select creator_id from public.courses where id = course_id)
  ) with check (
    auth.uid() in (select creator_id from public.courses where id = course_id)
  );

-- Course progress: private to the learner
drop policy if exists "course_progress_own" on public.course_progress;
create policy "course_progress_own" on public.course_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Quizzes: readable by all; managed by the video's creator
drop policy if exists "quizzes_select" on public.quizzes;
create policy "quizzes_select" on public.quizzes for select using (true);
drop policy if exists "quizzes_write" on public.quizzes;
create policy "quizzes_write" on public.quizzes
  for all using (
    auth.uid() in (select creator_id from public.videos where id = video_id)
  ) with check (
    auth.uid() in (select creator_id from public.videos where id = video_id)
  );

-- Quiz attempts: private to the learner
drop policy if exists "quiz_attempts_own" on public.quiz_attempts;
create policy "quiz_attempts_own" on public.quiz_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Mock purchases: private to the buyer
drop policy if exists "mock_purchases_own" on public.mock_purchases;
create policy "mock_purchases_own" on public.mock_purchases
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Comments: readable by all; write own, delete own
drop policy if exists "comments_select" on public.comments;
create policy "comments_select" on public.comments for select using (true);
drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own" on public.comments
  for insert with check (auth.uid() = user_id);
drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own" on public.comments
  for delete using (auth.uid() = user_id);

-- ============================================================
-- STORAGE — buckets + policies
-- videos/  : public read, creators upload into their own folder
-- avatars/ : public read, users upload into their own folder
-- Path convention: <bucket>/<user_id>/<filename>
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('videos', 'videos', true, 209715200, array['video/mp4', 'video/quicktime', 'video/webm']),
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "videos_public_read" on storage.objects;
create policy "videos_public_read" on storage.objects
  for select using (bucket_id in ('videos', 'avatars'));

drop policy if exists "videos_upload_own_folder" on storage.objects;
create policy "videos_upload_own_folder" on storage.objects
  for insert with check (
    bucket_id in ('videos', 'avatars')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "videos_delete_own_folder" on storage.objects;
create policy "videos_delete_own_folder" on storage.objects
  for delete using (
    bucket_id in ('videos', 'avatars')
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Reports: reporters can insert (once per video); no one reads others' reports
drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
  for insert with check (auth.uid() = reporter_id);
drop policy if exists "reports_select_own" on public.reports;
create policy "reports_select_own" on public.reports
  for select using (auth.uid() = reporter_id);

-- User blocks: private to the blocker
drop policy if exists "user_blocks_all_own" on public.user_blocks;
create policy "user_blocks_all_own" on public.user_blocks
  for all using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);

-- Done. Verify: Table Editor should show 19 tables, Storage should show 2 buckets.
