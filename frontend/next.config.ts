import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // SQLite-Datei in jede Serverless-Function mitnehmen. Je nach Vercel-Root
  // (frontend/ oder Repo-Root) liegt die DB unter data/ oder frontend/data/.
  // Beide Pfade werden deklariert; "/**" deckt Root- und Detail-Routen ab.
  outputFileTracingIncludes: {
    "/**": ["./data/jobs.db", "./frontend/data/jobs.db"],
    "/(.*)": ["./data/jobs.db", "./frontend/data/jobs.db"],
    "/": ["./data/jobs.db", "./frontend/data/jobs.db"],
    "/jobs/[slug]": ["./data/jobs.db", "./frontend/data/jobs.db"],
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
