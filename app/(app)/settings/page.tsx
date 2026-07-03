"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Role } from "@/lib/types";
import AuthInput from "@/components/AuthInput";
import { Loader2, LogOut } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login?next=/settings");
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single<Profile>();
      setProfile(data);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMessage(null);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url || null,
        role: profile.role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    setSaving(false);
    if (updateError) setError(updateError.message);
    else setMessage("Saved.");
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="h-full grid place-items-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </main>
    );
  }

  if (!profile) return null;

  return (
    <main className="h-full overflow-y-auto no-scrollbar">
      <div className="mx-auto max-w-md px-4 pt-10 pb-8">
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">@{profile.username}</p>

        <form onSubmit={handleSave} className="mt-8 space-y-4">
          <AuthInput
            label="Display name"
            type="text"
            required
            maxLength={50}
            value={profile.display_name}
            onChange={(e) =>
              setProfile({ ...profile, display_name: e.target.value })
            }
          />
          <label className="block">
            <span className="block text-xs font-medium text-zinc-400 mb-1.5">
              Bio
            </span>
            <textarea
              value={profile.bio}
              maxLength={160}
              rows={3}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-ink-800 border border-white/10 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20 transition resize-none"
              placeholder="Tell learners what you teach…"
            />
          </label>
          <AuthInput
            label="Avatar URL (image upload comes later)"
            type="url"
            placeholder="https://…"
            value={profile.avatar_url ?? ""}
            onChange={(e) =>
              setProfile({ ...profile, avatar_url: e.target.value })
            }
          />
          <label className="block">
            <span className="block text-xs font-medium text-zinc-400 mb-1.5">
              Role
            </span>
            <select
              value={profile.role}
              onChange={(e) =>
                setProfile({ ...profile, role: e.target.value as Role })
              }
              className="w-full h-11 px-3.5 rounded-xl bg-ink-800 border border-white/10 text-sm text-white outline-none focus:border-brand/60 transition"
            >
              <option value="learner">Learner</option>
              <option value="creator">Creator</option>
              <option value="both">Both</option>
            </select>
          </label>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
              {error}
            </p>
          )}
          {message && (
            <p className="text-xs text-accent bg-accent/10 border border-accent/20 rounded-lg px-3 py-2.5">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-brand to-brand-hover font-semibold text-sm text-white hover:opacity-90 transition-opacity disabled:opacity-50 grid place-items-center"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save changes"}
          </button>
        </form>

        <button
          onClick={handleLogout}
          className="mt-6 w-full h-11 rounded-xl border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-colors inline-flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>
    </main>
  );
}
