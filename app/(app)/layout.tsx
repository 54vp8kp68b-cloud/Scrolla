import BottomTabNav from "@/components/BottomTabNav";

/**
 * Shell for the signed-in app experience: full-height pages + bottom tabs.
 * Pages inside this group own their own scrolling (the feed uses snap scroll).
 */
export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="h-screen-safe bg-ink-950">
      <div className="h-full pb-14">{children}</div>
      <BottomTabNav />
    </div>
  );
}
