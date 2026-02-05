import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  basePath: "/oxlink",
  experimental: {
    // Cache dynamic route segments in the client router cache to
    // avoid showing `app/loading.tsx` on quick back-and-forth navigations.
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
};

export default nextConfig;
