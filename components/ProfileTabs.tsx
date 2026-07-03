"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Play, Lock } from "lucide-react";
import type { GridVideo } from "@/components/VideoGrid";

type Course = {
  id: string;
  title: string;
  description: string;
  price: number;
  is_paid: boolean;
  video_count: number;
  thumbnail_url: string | null;
};

type Props = {
  videos: GridVideo[];
  courses: Course[];
  isOwnProfile: boolean;
};

export default function ProfileTabs({ videos, courses, isOwnProfile }: Props) {
  const [tab, setTab] = useState<"videos" | "courses">("videos");

  return (
    <div className="mt-4">
      {/* Tab bar */}
      <div className="flex border-b border-white/10">
        <TabButton active={tab === "videos"} onClick={() => setTab("videos")}>
          <Play className="w-4 h-4" />
          Videos
          <span className="ml-1 text-zinc-500 text-xs">{videos.length}</span>
        </TabButton>
        <TabButton active={tab === "courses"} onClick={() => setTab("courses")}>
          <BookOpen className="w-4 h-4" />
          Courses
          <span className="ml-1 text-zinc-500 text-xs">{courses.length}</span>
        </TabButton>
      </div>

      {/* Videos grid */}
      {tab === "videos" && (
        <div className="mt-1">
          {videos.length === 0 ? (
            <EmptyTab
              message={isOwnProfile ? "You haven't posted any videos yet." : "No videos yet."}
              action={isOwnProfile ? { label: "Upload a video", href: "/upload" } : null}
            />
          ) : (
            <div className="grid grid-cols-3 gap-0.5">
              {videos.map((v) => (
                <Link
                  key={v.id}
                  href={`/video/${v.id}`}
                  className="relative aspect-[9/16] bg-ink-800 overflow-hidden group"
                >
                  <video
                    src={`${v.video_url}#t=0.1`}
                    preload="metadata"
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                    <p className="text-[11px] text-zinc-200 line-clamp-2 leading-tight">{v.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Courses grid */}
      {tab === "courses" && (
        <div className="mt-3 px-4 space-y-3">
          {courses.length === 0 ? (
            <EmptyTab
              message={isOwnProfile ? "You haven't created any courses yet." : "No courses yet."}
              action={isOwnProfile ? { label: "Create a course", href: "/creator/courses" } : null}
            />
          ) : (
            courses.map((c) => (
              <Link
                key={c.id}
                href={`/courses/${c.id}`}
                className="flex gap-3 p-3 rounded-xl bg-ink-800 border border-white/8 hover:border-white/20 transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-brand/30 to-accent/30 border border-white/10 shrink-0 grid place-items-center overflow-hidden">
                  {c.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-7 h-7 text-brand-glow opacity-60" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <p className="font-semibold text-sm text-white line-clamp-2 leading-snug">
                      {c.title}
                    </p>
                    {c.description && (
                      <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">{c.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-zinc-400">
                      {c.video_count} lesson{c.video_count !== 1 ? "s" : ""}
                    </span>
                    {c.is_paid ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-amber-400">
                        <Lock className="w-3 h-3" />
                        ${c.price}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-green-400">Free</span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
        active
          ? "border-white text-white"
          : "border-transparent text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyTab({
  message,
  action,
}: {
  message: string;
  action: { label: string; href: string } | null;
}) {
  return (
    <div className="py-12 flex flex-col items-center gap-3 text-center px-8">
      <p className="text-sm text-zinc-500">{message}</p>
      {action && (
        <Link
          href={action.href}
          className="px-5 py-2 rounded-full bg-gradient-to-r from-brand to-brand-hover text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
