import type { Job } from "@/lib/jobs";
import { buildJobPosting, serializeJsonLd } from "@/lib/seo";

/**
 * Rendert valides schema.org-JobPosting als JSON-LD.
 * Server Component – kein Client-JS nötig.
 */
export function JobPostingJsonLd({ job }: { job: Job }) {
  return (
    <script
      type="application/ld+json"
      // JSON-LD enthält die komplette Job-Beschreibung.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildJobPosting(job)) }}
    />
  );
}
