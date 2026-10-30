import type { Job } from "@/lib/jobs";
import { jobUrl } from "@/lib/seo";

export const APPLY_REF = "swissweb3jobs";

export const TAKEDOWN_EMAIL = "magnus.scherrer@gmail.com";

/**
 * Hängt den Attributions-Parameter an eine Bewerbungs-URL.
 * Vorhandene Query und Hash bleiben intakt.
 */
export function applyUrlWithRef(url: string): string {
  if (!url) return url;

  const hashIndex = url.indexOf("#");
  const base = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : url.slice(hashIndex);

  const separator = base.includes("?")
    ? base.endsWith("?") || base.endsWith("&")
      ? ""
      : "&"
    : "?";

  return `${base}${separator}ref=${APPLY_REF}${hash}`;
}

/** Mailto-Takedown-Link mit vorausgefülltem Betreff und Text. */
export function takedownMailto(job: Pick<Job, "id" | "title" | "company">): string {
  const subject = `Takedown-Anfrage: ${job.title} bei ${job.company}`;

  const body = [
    "Hallo Magnus,",
    "",
    "bitte entferne folgendes Inserat von deiner Plattform:",
    `Job-ID/Titel: ${job.title}`,
    `Firma: ${job.company}`,
    `Link: ${jobUrl(job)}`,
    "",
    "Grund: ",
  ].join("\r\n");

  return `mailto:${TAKEDOWN_EMAIL}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
}
