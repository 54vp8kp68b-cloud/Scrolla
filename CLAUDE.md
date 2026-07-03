# Scrolla — project context for Claude Code

## What this is
TikTok-style short-form video education app ("scroll to learn"). Working name
Scrolla. Owner: Achilles (beginner developer — explain things simply, avoid
jargon, give copy-paste terminal commands, never assume git/deploy knowledge).

## Stack
Next.js 15 (App Router) + TypeScript + Tailwind v3 (custom `ink`/`brand`/`accent`
palette in tailwind.config.ts). Supabase: auth, Postgres, Storage (`videos` and
`avatars` buckets). Full schema + RLS in `supabase/schema.sql` (already run in
production Supabase project). Env in `.env.local` (never commit). Deploy target:
Vercel (NOT YET DEPLOYED). Stripe: not integrated — purchases are mock
(`mock_purchases` table).

## Status: Phases 1–10 of 11 COMPLETE and manually tested by owner
- Auth (email/password, confirm-email disabled), profiles, onboarding topic picker
- Video upload to Supabase Storage (200MB cap; free tier realistically ~50MB)
- Vertical snap-scroll feed: autoplay via IntersectionObserver, mute toggle,
  like/save/follow (optimistic writes), quiz overlay, share links to /video/[id]
- Saved/liked libraries, public profiles with follow, creator studio
  (edit/delete videos + quiz editor), courses (ordered videos, progress bar,
  mock buy unlocks), discover (keyword/#hashtag/topic search)
- View tracking: watching ≥90% inserts video_views(completed=true); drives
  course progress + dashboard stats
- Feed ranking: simple additive score in app/(app)/feed/page.tsx (followed
  creator +2, user topic +1, likes up to +1), designed to be swapped later

## Remaining (Phase 11+)
1. Polish: loading/error states audit, `npm run build` has NEVER been run —
   run it and fix whatever surfaces
2. Deploy to Vercel (owner needs GitHub + Vercel accounts; repo not yet created)
3. Later roadmap: comments (placeholder button exists), MediaRecorder browser
   recording, Stripe, moderation/reporting (REQUIRED before App Store),
   Capacitor iOS wrap. Owner's long-term goal: App Store + marketing push.

## Conventions
- Server components fetch data; small "use client" components for interactivity
- Supabase clients: lib/supabase/client.ts (browser), server.ts (RSC, async
  cookies), middleware.ts refreshes sessions + guards routes; all three skip
  gracefully when env vars missing (isSupabaseConfigured in lib/supabase/config.ts)
- Feed item shape: lib/feed.ts. Shared UI: components/ (AuthInput, EmptyState,
  VideoGrid, etc.)
- RLS is the security boundary — never use the service role key client-side
