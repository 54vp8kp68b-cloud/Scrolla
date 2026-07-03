import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="min-h-screen bg-ink-950 flex flex-col items-center justify-center px-4 py-10">
      <div
        aria-hidden
        className="fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute left-1/2 -top-40 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-brand/15 blur-[120px]" />
      </div>
      <Link href="/" className="flex items-center gap-2 mb-8">
        <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand to-accent">
          <GraduationCap className="w-5 h-5 text-white" />
        </span>
        <span className="text-xl font-bold tracking-tight">scrolla</span>
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-ink-900 p-6 sm:p-8">
        {children}
      </div>
    </main>
  );
}
