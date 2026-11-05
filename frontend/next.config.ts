import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // SQLite-Datei in jede Serverless-Function mitnehmen (Vercel: Root = frontend/).
  // "/(.*)" deckt alle App-Router-Routen ab, inkl. /jobs/[slug] und /api/*.
  // Der Pfad wird zur Laufzeit über process.cwd() + data/jobs.db aufgelöst.
  outputFileTracingIncludes: {
    "/(.*)": ["./data/jobs.db"],
    "/jobs/[slug]": ["./data/jobs.db"],
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
