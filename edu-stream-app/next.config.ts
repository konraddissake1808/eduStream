import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    serverActions: {
      // Lesson video uploads go through a Server Action; the 1MB default
      // is nowhere near enough for video files. Routing uploads through
      // the server like this is simple but doesn't scale well for large
      // files/production traffic — a direct-to-storage signed upload URL
      // would be the next step if that becomes a problem.
      bodySizeLimit: "500mb",
    },
  },
};

export default nextConfig;
