import Link from "next/link";

export type GridVideo = {
  id: string;
  title: string;
  video_url: string;
};

export default function VideoGrid({ videos }: { videos: GridVideo[] }) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {videos.map((v) => (
        <Link
          key={v.id}
          href={`/video/${v.id}`}
          className="relative aspect-[9/16] rounded-lg bg-ink-800 border border-white/5 overflow-hidden group"
        >
          <video
            src={`${v.video_url}#t=0.1`}
            preload="metadata"
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover group-hover:opacity-80 transition-opacity"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
            <p className="text-[11px] text-zinc-200 line-clamp-2">{v.title}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
