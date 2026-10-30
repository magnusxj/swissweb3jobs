import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // SQLite-Datei in die Serverless-Functions mitnehmen (Vercel: Root = frontend/).
  outputFileTracingIncludes: {
    "/*": ["./data/jobs.db"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
