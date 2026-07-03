import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for Client Components ("use client").
 * Uses the public anon key — safe for the browser; RLS enforces permissions.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
