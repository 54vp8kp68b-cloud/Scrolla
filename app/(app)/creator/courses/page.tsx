import Link from "next/link";
import CourseManager from "@/components/CourseManager";
import EmptyState from "@/components/EmptyState";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ArrowLeft, BookOpen } from "lucide-react";

export default function CreatorCoursesPage() {
  if (!isSupabaseConfigured) {
    return (
      <main className="h-full grid place-items-center">
        <EmptyState
          icon={BookOpen}
          title="Supabase not connected"
          message="Add your keys to .env.local and restart the dev server."
        />
      </main>
    );
  }

  return (
    <main className="h-full overflow-y-auto no-scrollbar">
      <div className="mx-auto max-w-md px-4 pt-10 pb-8">
        <Link
          href="/creator"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Creator studio
        </Link>
        <h1 className="mt-2 text-xl font-bold">Your courses</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Group lessons into ordered learning paths.
        </p>
        <div className="mt-6">
          <CourseManager />
        </div>
      </div>
    </main>
  );
}
