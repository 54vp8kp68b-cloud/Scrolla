import Link from "next/link";
import CreatorVideoList from "@/components/CreatorVideoList";
import EmptyState from "@/components/EmptyState";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Clapperboard, PlusSquare } from "lucide-react";

export default function CreatorPage() {
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

  return (
    <main className="h-full overflow-y-auto no-scrollbar">
      <div className="mx-auto max-w-md px-4 pt-10 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Creator studio</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Manage your lessons —{" "}
              <Link
                href="/creator/courses"
                className="text-brand-glow hover:underline"
              >
                or build a course
              </Link>
              .
            </p>
          </div>
          <Link
            href="/upload"
            aria-label="Post a lesson"
            className="grid place-items-center w-10 h-10 rounded-full bg-gradient-to-r from-brand to-accent text-white"
          >
            <PlusSquare className="w-5 h-5" />
          </Link>
        </div>

        <div className="mt-6">
          <CreatorVideoList />
        </div>
      </div>
    </main>
  );
}
