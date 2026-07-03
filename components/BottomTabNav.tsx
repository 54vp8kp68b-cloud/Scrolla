"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PlusSquare, BookOpen, User, Video, X } from "lucide-react";

const TABS = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  null, // placeholder for the + button
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/dashboard", label: "You", icon: User },
];

export default function BottomTabNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when tapping outside
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <>
      {/* Create menu popup */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setMenuOpen(false)}
        />
      )}
      {menuOpen && (
        <div
          ref={menuRef}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-56 rounded-2xl bg-ink-900 border border-white/10 shadow-2xl overflow-hidden"
        >
          <Link
            href="/upload"
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-ink-800 transition-colors"
          >
            <span className="w-8 h-8 rounded-lg bg-brand/15 grid place-items-center text-brand-glow">
              <Video className="w-4 h-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Post a lesson</p>
              <p className="text-[11px] text-zinc-500">Upload a short video</p>
            </div>
          </Link>
          <div className="h-px bg-white/8 mx-3" />
          <Link
            href="/creator/courses"
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-ink-800 transition-colors"
          >
            <span className="w-8 h-8 rounded-lg bg-accent/15 grid place-items-center text-accent">
              <BookOpen className="w-4 h-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Create a course</p>
              <p className="text-[11px] text-zinc-500">Group lessons into a series</p>
            </div>
          </Link>
        </div>
      )}

      <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-ink-950/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-lg grid grid-cols-5 h-14">
          {TABS.map((tab, i) => {
            if (!tab) {
              // The + button
              return (
                <button
                  key="create"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-label="Create"
                  className="grid place-items-center"
                >
                  <span className={`grid place-items-center w-11 h-8 rounded-lg bg-gradient-to-r from-brand to-accent text-white shadow-lg shadow-brand/30 transition-transform ${menuOpen ? "scale-90" : ""}`}>
                    {menuOpen ? (
                      <X className="w-5 h-5" strokeWidth={2.25} />
                    ) : (
                      <PlusSquare className="w-5 h-5" strokeWidth={2.25} />
                    )}
                  </span>
                </button>
              );
            }
            const { href, label, icon: Icon } = tab;
            const active = pathname === href || pathname.startsWith(href + "/");
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
    </>
  );
}
