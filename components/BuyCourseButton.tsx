"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Lock } from "lucide-react";

export default function BuyCourseButton({
  courseId,
  price,
  currentUserId,
}: {
  courseId: string;
  price: number;
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    if (!currentUserId) {
      router.push(`/auth/login?next=/courses/${courseId}`);
      return;
    }
    setBuying(true);
    setError(null);
    const supabase = createClient();
    const { error: buyError } = await supabase
      .from("mock_purchases")
      .insert({ user_id: currentUserId, course_id: courseId });
    setBuying(false);
    if (buyError && !buyError.message.includes("duplicate")) {
      setError(buyError.message);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={buy}
        disabled={buying}
        className="w-full h-12 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-ink-950 font-bold hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center justify-center gap-2"
      >
        {buying ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Buy course — ${price.toFixed(2)} (test mode, no real charge)
          </>
        )}
      </button>
      {error && <p className="mt-2 text-xs text-red-400 text-center">{error}</p>}
      <p className="mt-2 text-[11px] text-zinc-600 text-center">
        Real payments come later with Stripe — this unlocks instantly for testing.
      </p>
    </div>
  );
}
