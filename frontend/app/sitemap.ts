import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getActiveJobs } from "@/lib/jobs";
import { SITE_URL, jobPath, toDate } from "@/lib/seo";

/**
 * Dynamische Sitemap: alle aktiven Inserate + Startseite.
 * `connection()` verhindert, dass die Liste beim Build einfriert –
 * neue Jobs aus der SQLite-DB sind so ohne Rebuild drin.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();

  const jobs = getActiveJobs();

  const jobEntries: MetadataRoute.Sitemap = jobs.map((job) => ({
    url: `${SITE_URL}${jobPath(job)}`,
    lastModified: toDate(job.posted_at) ?? toDate(job.created_at) ?? new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...jobEntries,
    {
      url: `${SITE_URL}/impressum`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/datenschutz`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
