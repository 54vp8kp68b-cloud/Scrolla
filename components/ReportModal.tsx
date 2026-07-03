"use client";

import { useState } from "react";
import { X, Flag } from "lucide-react";
import { submitReport, blockUser, type ReportReason } from "@/app/actions/report";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam", label: "Spam or misleading" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "misinformation", label: "False information" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "other", label: "Other" },
];

type Props = {
  videoId: string;
  creatorId: string;
  onClose: () => void;
};

export default function ReportModal({ videoId, creatorId, onClose }: Props) {
  const [step, setStep] = useState<"menu" | "report" | "done">("menu");
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleReport() {
    if (!reason) return;
    setLoading(true);
    const result = await submitReport(videoId, reason, details);
    setLoading(false);
    if (result.error) {
      setFeedback(result.error);
    } else {
      setStep("done");
    }
  }

  async function handleBlock() {
    setLoading(true);
    await blockUser(creatorId);
    setLoading(false);
    setStep("done");
  }

  return (
    <div
      className="absolute inset-0 z-20 bg-black/70 backdrop-blur-sm flex items-end justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-t-2xl bg-ink-900 border border-white/10 p-5 pb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-white">
            {step === "report" ? "Report video" : step === "done" ? "Thank you" : "More options"}
          </span>
          <button onClick={onClose} aria-label="Close" className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === "menu" && (
          <div className="space-y-2">
            <button
              onClick={() => setStep("report")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-ink-800 hover:bg-ink-700 text-white text-sm font-medium transition-colors"
            >
              <Flag className="w-4 h-4 text-red-400" />
              Report this video
            </button>
            <button
              onClick={handleBlock}
              disabled={loading}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-ink-800 hover:bg-ink-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4 text-zinc-400" />
              {loading ? "Blocking…" : "Block this creator"}
            </button>
          </div>
        )}

        {step === "report" && (
          <div className="space-y-3">
            <p className="text-sm text-zinc-400 mb-3">Why are you reporting this video?</p>
            <div className="space-y-2">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setReason(r.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                    reason === r.value
                      ? "border-brand bg-brand/15 text-white"
                      : "border-white/10 bg-ink-800 text-zinc-300 hover:border-white/30"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Add details (optional)"
              maxLength={500}
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-ink-800 border border-white/10 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-brand resize-none"
            />
            {feedback && <p className="text-xs text-red-400">{feedback}</p>}
            <button
              onClick={handleReport}
              disabled={!reason || loading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-brand to-brand-hover text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {loading ? "Submitting…" : "Submit report"}
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="text-center py-4">
            <p className="text-white font-semibold mb-1">Done</p>
            <p className="text-sm text-zinc-400">
              Your feedback helps keep Scrolla safe. We review every report.
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full h-11 rounded-xl bg-ink-800 text-sm font-semibold text-white hover:bg-ink-700 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
