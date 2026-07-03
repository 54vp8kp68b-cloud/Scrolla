import type { LucideIcon } from "lucide-react";

export default function EmptyState({
  icon: Icon,
  title,
  message,
}: {
  icon: LucideIcon;
  title: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-8 py-20">
      <span className="grid place-items-center w-14 h-14 rounded-2xl bg-ink-800 border border-white/5 text-zinc-500 mb-4">
        <Icon className="w-6 h-6" />
      </span>
      <h2 className="font-semibold text-zinc-200">{title}</h2>
      <p className="mt-1.5 text-sm text-zinc-500 max-w-xs">{message}</p>
    </div>
  );
}
