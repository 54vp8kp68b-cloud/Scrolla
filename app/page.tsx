import Link from "next/link";
import {
  Play,
  Bookmark,
  Users,
  Zap,
  Flame,
  Video,
  GraduationCap,
  ArrowRight,
} from "lucide-react";

const FEATURES = [
  {
    icon: Play,
    title: "Scroll to learn",
    desc: "A full-screen vertical feed of bite-size lessons. Swipe up, learn something. Swipe again.",
  },
  {
    icon: Zap,
    title: "Quick quizzes",
    desc: "Answer a one-tap quiz after a video and actually remember what you watched.",
  },
  {
    icon: Users,
    title: "Follow creators",
    desc: "Teachers, tutors, and experts posting SAT prep, coding, finance, science, and more.",
  },
  {
    icon: Bookmark,
    title: "Save useful lessons",
    desc: "Build a private library of lessons you'll come back to before the test.",
  },
  {
    icon: Flame,
    title: "Learning streaks",
    desc: "Keep the streak alive. Progress tracking that makes showing up daily addictive.",
  },
  {
    icon: Video,
    title: "Create and share",
    desc: "Record or upload your own short lessons, group them into courses, grow an audience.",
  },
];

const TOPICS = [
  "SAT Prep",
  "Math",
  "Coding",
  "Business",
  "Science",
  "History",
  "College Tips",
  "Personal Finance",
  "Languages",
  "Fitness",
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-ink-950 overflow-x-hidden">
      {/* Top nav */}
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-ink-950/70 border-b border-white/5">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid place-items-center w-8 h-8 rounded-xl bg-gradient-to-br from-brand to-accent">
              <GraduationCap className="w-5 h-5 text-white" />
            </span>
            <span className="text-lg font-bold tracking-tight">scrolla</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/auth/sign-up"
              className="px-4 py-2 text-sm font-semibold rounded-full bg-white text-ink-950 hover:bg-zinc-200 transition-colors"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-28 pb-16 px-4">
        {/* Glow */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand/20 blur-[120px]" />
          <div className="absolute right-0 top-64 w-[400px] h-[400px] rounded-full bg-accent/10 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left animate-fade-up">
            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-zinc-300 mb-6">
              <Flame className="w-3.5 h-3.5 text-accent-pink" />
              The feed that makes you smarter
            </p>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05]">
              Doomscrolling,
              <br />
              <span className="bg-gradient-to-r from-brand-glow via-accent to-accent-pink bg-clip-text text-transparent">
                but you learn stuff.
              </span>
            </h1>
            <p className="mt-6 text-lg text-zinc-400 max-w-xl mx-auto lg:mx-0">
              Short vertical videos that teach SAT prep, coding, money, science,
              and more. Swipe through lessons, follow creators, save the good
              ones, and keep your streak alive.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                href="/auth/sign-up"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-brand to-brand-hover text-white font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-brand/25"
              >
                Start learning
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/auth/sign-up?role=creator"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-white/15 bg-white/5 text-white font-semibold hover:bg-white/10 transition-colors"
              >
                <Video className="w-4 h-4" />
                Become a creator
              </Link>
            </div>
            {/* Topic chips */}
            <div className="mt-10 flex flex-wrap gap-2 justify-center lg:justify-start">
              {TOPICS.map((t) => (
                <span
                  key={t}
                  className="px-3 py-1.5 rounded-full bg-ink-800 border border-white/5 text-xs font-medium text-zinc-400"
                >
                  #{t.toLowerCase().replace(/ /g, "")}
                </span>
              ))}
            </div>
          </div>

          {/* Phone mockup */}
          <div className="hidden lg:flex justify-center animate-fade-in">
            <div className="relative w-[300px] h-[620px] rounded-[2.5rem] border-4 border-ink-700 bg-ink-900 shadow-2xl shadow-brand/10 overflow-hidden">
              {/* Fake video frame */}
              <div className="absolute inset-0 bg-gradient-to-b from-brand/30 via-ink-900 to-accent/20" />
              <div className="absolute inset-0 flex flex-col justify-end p-5 pb-8">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-brand" />
                  <div>
                    <p className="text-sm font-semibold">@satmath.daily</p>
                    <p className="text-[11px] text-zinc-400">SAT Prep</p>
                  </div>
                  <span className="ml-auto text-[11px] font-semibold px-3 py-1 rounded-full bg-white text-ink-950">
                    Follow
                  </span>
                </div>
                <p className="text-sm text-zinc-200">
                  The 30-second trick for every circle problem on the SAT 🎯
                </p>
                <p className="text-xs text-brand-glow mt-1">
                  #satprep #math #geometry
                </p>
              </div>
              {/* Right-side action rail */}
              <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5">
                {[
                  { icon: "❤️", n: "12.4k" },
                  { icon: "🔖", n: "3,208" },
                  { icon: "⚡", n: "Quiz" },
                  { icon: "💬", n: "482" },
                ].map((a) => (
                  <div key={a.n} className="flex flex-col items-center gap-1">
                    <span className="grid place-items-center w-11 h-11 rounded-full bg-white/10 backdrop-blur text-lg">
                      {a.icon}
                    </span>
                    <span className="text-[10px] font-semibold text-zinc-300">
                      {a.n}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-center mb-12">
            Everything TikTok got right.
            <span className="text-zinc-500"> None of the brain rot.</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl bg-ink-900 border border-white/5 hover:border-brand/30 transition-colors"
              >
                <span className="inline-grid place-items-center w-10 h-10 rounded-xl bg-brand/15 text-brand-glow mb-4">
                  <f.icon className="w-5 h-5" />
                </span>
                <h3 className="font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-3xl text-center rounded-3xl border border-white/10 bg-gradient-to-b from-ink-800 to-ink-900 p-10 sm:p-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Your screen time is about to
            <br className="hidden sm:block" /> have a GPA.
          </h2>
          <p className="mt-4 text-zinc-400">
            Join free. Pick your topics. Start scrolling smarter.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/sign-up"
              className="px-7 py-3.5 rounded-full bg-gradient-to-r from-brand to-brand-hover text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Start learning
            </Link>
            <Link
              href="/auth/sign-up?role=creator"
              className="px-7 py-3.5 rounded-full border border-white/15 text-white font-semibold hover:bg-white/5 transition-colors"
            >
              Become a creator
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-4 py-8 border-t border-white/5">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-zinc-500">
          <p>© {new Date().getFullYear()} Scrolla. Scroll smarter.</p>
          <p className="text-xs">Built for learners and the creators who teach them.</p>
        </div>
      </footer>
    </main>
  );
}
