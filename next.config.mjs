/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage public URLs (Phase 2+). Update project ref when known.
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;
