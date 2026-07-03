"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatCount, type FeedItem } from "@/lib/feed";
import {
  Heart,
  Bookmark,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Plus,
  Check,
  Zap,
  BookOpen,
  X,
  Flag,
} from "lucide-react";
import ReportModal from "@/components/ReportModal";
import CommentsSheet from "@/components/CommentsSheet";

type Props = {
  item: FeedItem;
  currentUserId: string | null;
  initialLiked: boolean;
  initialSaved: boolean;
  initialFollowing: boolean;
  muted: boolean;
  onToggleMute: () => void;
};

export default function VideoCard({
  item,
  currentUserId,
  initialLiked,
  initialSaved,
  initialFollowing,
  muted,
  onToggleMute,
}: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewRecorded = useRef(false);

  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(item.likeCount);
  const [saved, setSaved] = useState(initialSaved);
  const [following, setFollowing] = useState(initialFollowing);
  const [paused, setPaused] = useState(false);
  const [shareNote, setShareNote] = useState(false);

  // Quiz state
  const [quizOpen, setQuizOpen] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(item.commentCount ?? 0);

  const isOwn = currentUserId === item.creator.id;

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
          setPaused(false);
        } else {
          video.pause();
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  function requireAuth(): boolean {
    if (!currentUserId) {
      router.push("/auth/login?next=/feed");
      return false;
    }
    return true;
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  }

  /** Record a completed view once the user has watched ≥90% */
  function handleTimeUpdate() {
    const video = videoRef.current;
    if (
      viewRecorded.current ||
      !currentUserId ||
      !video ||
      !video.duration ||
      video.currentTime / video.duration < 0.9
    )
      return;
    viewRecorded.current = true;
    const supabase = createClient();
    supabase
      .from("video_views")
      .insert({
        user_id: currentUserId,
        video_id: item.id,
        watched_seconds: Math.round(video.currentTime),
        completed: true,
      })
      .then(() => {});
  }

  async function toggleLike() {
    if (!requireAuth()) return;
    const supabase = createClient();
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    const result = next
      ? await supabase
          .from("likes")
          .insert({ user_id: currentUserId, video_id: item.id })
      : await supabase
          .from("likes")
          .delete()
          .eq("user_id", currentUserId!)
          .eq("video_id", item.id);
    if (result.error) {
      setLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
    }
  }

  async function toggleSave() {
    if (!requireAuth()) return;
    const supabase = createClient();
    const next = !saved;
    setSaved(next);
    const result = next
      ? await supabase
          .from("saved_videos")
          .insert({ user_id: currentUserId, video_id: item.id })
      : await supabase
          .from("saved_videos")
          .delete()
          .eq("user_id", currentUserId!)
          .eq("video_id", item.id);
    if (result.error) setSaved(!next);
  }

  async function toggleFollow() {
    if (!requireAuth()) return;
    const supabase = createClient();
    const next = !following;
    setFollowing(next);
    const result = next
      ? await supabase
          .from("follows")
          .insert({ follower_id: currentUserId, following_id: item.creator.id })
      : await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId!)
          .eq("following_id", item.creator.id);
    if (result.error) setFollowing(!next);
  }

  async function handleShare() {
    const url = `${window.location.origin}/video/${item.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareNote(true);
        setTimeout(() => setShareNote(false), 1500);
      }
    } catch {
      /* user cancelled */
    }
  }

  async function submitQuizAnswer() {
    if (!item.quiz || selectedAnswer === null) return;
    if (!requireAuth()) return;
    setSubmitted(true);
    const supabase = createClient();
    await supabase.from("quiz_attempts").insert({
      user_id: currentUserId,
      quiz_id: item.quiz.id,
      selected_answer: selectedAnswer,
      is_correct: selectedAnswer === item.quiz.correctAnswer,
    });
  }

  function openQuiz() {
    videoRef.current?.pause();
    setPaused(true);
    setQuizOpen(true);
    setSelectedAnswer(null);
    setSubmitted(false);
  }

  return (
    <section
      ref={containerRef}
      className="relative h-full w-full bg-black overflow-hidden"
    >
      <video
        ref={videoRef}
        src={item.videoUrl}
        loop
        muted={muted}
        playsInline
        preload="metadata"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        className="absolute inset-0 w-full h-full object-contain cursor-pointer"
      />

      {paused && !quizOpen && (
        <button
          onClick={togglePlay}
          aria-label="Play"
          className="absolute inset-0 grid place-items-center bg-black/20"
        >
          <Play
            className="w-16 h-16 text-white/80 drop-shadow-lg"
            fill="currentColor"
          />
        </button>
      )}

      {/* Bottom-left: creator + caption */}
      <div className="absolute bottom-4 left-4 right-20 text-white">
        <Link
          href={`/profile/${item.creator.username}`}
          className="flex items-center gap-2.5 mb-2.5 w-fit"
        >
          {item.creator.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.creator.avatarUrl}
              alt=""
              className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
            />
          ) : (
            <span className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-accent grid place-items-center font-bold">
              {item.creator.displayName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="font-semibold text-sm drop-shadow">
            @{item.creator.username}
          </span>
        </Link>

        <p className="font-semibold text-sm drop-shadow leading-snug">
          {item.title}
        </p>
        {item.caption && (
          <p className="mt-1 text-sm text-zinc-200 drop-shadow line-clamp-2">
            {item.caption}
          </p>
        )}
        <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[13px]">
          {item.topic && (
            <span className="font-semibold text-accent drop-shadow">
              {item.topic.name}
            </span>
          )}
          {item.hashtags.map((h) => (
            <span key={h.slug} className="text-brand-glow drop-shadow">
              #{h.slug}
            </span>
          ))}
        </div>
        {item.courseId && (
          <Link
            href={`/courses/${item.courseId}`}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-xs font-semibold text-white hover:bg-white/25 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Part of a course
          </Link>
        )}
      </div>

      {/* Right rail */}
      <div className="absolute right-3 bottom-6 flex flex-col items-center gap-5">
        {!isOwn && (
          <div className="relative mb-1">
            <Link href={`/profile/${item.creator.username}`}>
              {item.creator.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.creator.avatarUrl}
                  alt=""
                  className="w-11 h-11 rounded-full object-cover border-2 border-white/40"
                />
              ) : (
                <span className="w-11 h-11 rounded-full bg-gradient-to-br from-brand to-accent grid place-items-center font-bold text-white">
                  {item.creator.displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </Link>
            <button
              onClick={toggleFollow}
              aria-label={following ? "Unfollow" : "Follow"}
              className={`absolute -bottom-2 left-1/2 -translate-x-1/2 grid place-items-center w-5 h-5 rounded-full text-white transition-colors ${
                following ? "bg-ink-600" : "bg-brand"
              }`}
            >
              {following ? (
                <Check className="w-3 h-3" />
              ) : (
                <Plus className="w-3 h-3" />
              )}
            </button>
          </div>
        )}

        <RailButton
          onClick={toggleLike}
          label={formatCount(likeCount)}
          icon={
            <Heart
              className={`w-7 h-7 transition-colors ${
                liked ? "text-red-500" : "text-white"
              }`}
              fill={liked ? "currentColor" : "none"}
            />
          }
        />
        <RailButton
          onClick={toggleSave}
          label={saved ? "Saved" : "Save"}
          icon={
            <Bookmark
              className={`w-7 h-7 transition-colors ${
                saved ? "text-amber-400" : "text-white"
              }`}
              fill={saved ? "currentColor" : "none"}
            />
          }
        />
        {item.quiz && (
          <RailButton
            onClick={openQuiz}
            label="Quiz"
            icon={<Zap className="w-7 h-7 text-accent" fill="currentColor" />}
          />
        )}
        <RailButton
          onClick={() => setCommentsOpen(true)}
          label={formatCount(commentCount)}
          icon={<MessageCircle className="w-7 h-7 text-white" />}
        />
        <RailButton
          onClick={handleShare}
          label={shareNote ? "Copied!" : "Share"}
          icon={<Share2 className="w-7 h-7 text-white" />}
        />
        {!isOwn && currentUserId && (
          <RailButton
            onClick={() => setReportOpen(true)}
            label="Report"
            icon={<Flag className="w-7 h-7 text-white/60" />}
          />
        )}
        <RailButton
          onClick={onToggleMute}
          label={muted ? "Unmute" : "Mute"}
          icon={
            muted ? (
              <VolumeX className="w-7 h-7 text-white" />
            ) : (
              <Volume2 className="w-7 h-7 text-white" />
            )
          }
        />
      </div>

      {/* Comments sheet */}
      {commentsOpen && (
        <CommentsSheet
          videoId={item.id}
          currentUserId={currentUserId}
          onClose={() => {
            setCommentsOpen(false);
            // Refresh count after closing
            const supabase = createClient();
            supabase
              .from("comments")
              .select("id", { count: "exact", head: true })
              .eq("video_id", item.id)
              .then(({ count }) => { if (count !== null) setCommentCount(count); });
          }}
        />
      )}

      {/* Report / block overlay */}
      {reportOpen && (
        <ReportModal
          videoId={item.id}
          creatorId={item.creator.id}
          onClose={() => setReportOpen(false)}
        />
      )}

      {/* Quiz overlay */}
      {quizOpen && item.quiz && (
        <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-2xl bg-ink-900 border border-white/10 p-5">
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent uppercase tracking-wide">
                <Zap className="w-3.5 h-3.5" fill="currentColor" /> Quick quiz
              </span>
              <button
                onClick={() => setQuizOpen(false)}
                aria-label="Close quiz"
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="mt-3 font-semibold">{item.quiz.question}</p>

            <div className="mt-4 space-y-2">
              {item.quiz.choices.map((choice, i) => {
                let style =
                  "border-white/10 bg-ink-800 text-zinc-300 hover:border-white/30";
                if (submitted) {
                  if (i === item.quiz!.correctAnswer)
                    style = "border-green-500/60 bg-green-500/15 text-green-300";
                  else if (i === selectedAnswer)
                    style = "border-red-500/60 bg-red-500/15 text-red-300";
                  else style = "border-white/5 bg-ink-800 text-zinc-500";
                } else if (i === selectedAnswer) {
                  style = "border-brand bg-brand/15 text-white";
                }
                return (
                  <button
                    key={i}
                    disabled={submitted}
                    onClick={() => setSelectedAnswer(i)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition ${style}`}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>

            {submitted ? (
              <div className="mt-4">
                <p
                  className={`text-sm font-bold ${
                    selectedAnswer === item.quiz.correctAnswer
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {selectedAnswer === item.quiz.correctAnswer
                    ? "Correct! 🎉"
                    : "Not quite — the right answer is highlighted."}
                </p>
                <button
                  onClick={() => setQuizOpen(false)}
                  className="mt-3 w-full h-10 rounded-xl bg-gradient-to-r from-brand to-brand-hover text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  Keep scrolling
                </button>
              </div>
            ) : (
              <button
                onClick={submitQuizAnswer}
                disabled={selectedAnswer === null}
                className="mt-4 w-full h-10 rounded-xl bg-gradient-to-r from-brand to-brand-hover text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Check answer
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function RailButton({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1">
      <span className="drop-shadow-lg">{icon}</span>
      <span className="text-[11px] font-semibold text-white drop-shadow">
        {label}
      </span>
    </button>
  );
}
