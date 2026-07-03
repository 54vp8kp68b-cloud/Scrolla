"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PlusSquare, BookOpen, User } from "lucide-react";

const TABS = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/upload", label: "Create", icon: PlusSquare, isPrimary: true },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/dashboard", label: "You", icon: User },
];

/**
 * TikTok-style bottom tab bar. Mobile-first; on desktop it stays bottom-fixed
 * and centered (we can move to a side rail later if we want).
 */
export default function BottomTabNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-ink-950/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-lg grid grid-cols-5 h-14">
        {TABS.map(({ href, label, icon: Icon, isPrimary }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          if (isPrimary) {
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className="grid place-items-center"
              >
                <span className="grid place-items-center w-11 h-8 rounded-lg bg-gradient-to-r from-brand to-accent text-white shadow-lg shadow-brand/30">
                  <Icon className="w-5 h-5" strokeWidth={2.25} />
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
