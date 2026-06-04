import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig: NextConfig = {
  // Only use static export for GitHub Pages (when BASE_PATH is set)
  // Vercel uses server-side rendering (no output: 'export')
  ...(basePath ? { output: "export" as const, basePath } : {}),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["localhost", "127.0.0.1", "0.0.0.0", ".space.chatglm.site"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
