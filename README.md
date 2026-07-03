# Scrolla — scroll to learn

Short-form vertical video education platform. TikTok-style feed, but the videos teach you things. (Working name — rename anytime.)

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- Supabase (auth, Postgres, Storage) — wired up in Phase 2
- Vercel for deployment
- Stripe later for creator monetization

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Environment variables

Copy `.env.example` to `.env.local` and fill in Supabase values (needed from Phase 2 on). Never commit `.env.local`. `SUPABASE_SERVICE_ROLE_KEY` is server-only — never prefix it with `NEXT_PUBLIC_`.

## Project structure

```
app/
  page.tsx              # Landing page
  layout.tsx            # Root layout (font, theme)
  globals.css           # Tailwind + feed snap-scroll utilities
  auth/
    layout.tsx          # Centered auth card shell
    sign-up/page.tsx    # Sign up (role picker: learner/creator/both)
    login/page.tsx      # Log in
  (app)/                # Signed-in app shell (bottom tab nav)
    layout.tsx
    feed/               # Main vertical feed (Phase 5)
    discover/           # Search & topics (Phase 10)
    upload/             # Upload/record (Phase 4)
    courses/            # Courses (Phase 8)
    dashboard/          # Learner dashboard (Phase 9/11)
components/
  BottomTabNav.tsx      # TikTok-style bottom tabs
  AuthInput.tsx
  EmptyState.tsx
```

## Build phases

1. ✅ Setup, landing, nav, auth shells
2. Supabase project, SQL schema, RLS, storage bucket
3. Real auth + profiles
4. ✅ Video upload (Supabase Storage)
5. ✅ TikTok-style feed (snap scroll, autoplay, action rail)
6. ✅ Likes / saves / follows + libraries
7. ✅ Creator studio (edit/delete videos, quiz editor)
8. ✅ Courses (create, browse, progress, mock purchase)
9. ✅ Quizzes + view tracking + learner stats
10. ✅ Discover (search, hashtags, topics) + simple feed ranking
11. Polish & deploy to Vercel — next up

Not yet built: comments (placeholder), browser recording, real Stripe
payments, moderation/reporting (required before App Store submission).
