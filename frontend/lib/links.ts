import { companyCareersUrl } from "@/lib/company";
import type { Job } from "@/lib/jobs";
import { jobUrl } from "@/lib/seo";

export const APPLY_REF = "swissweb3jobs";

/**
 * Manche Jobboards liefern als Bewerbungslink nur die Board-Wurzel oder eine
 * abgelaufene Kurz-URL. Beides endet im Fehler-Link (`?error=true`) statt auf
 * der konkreten Stelle. Solche Links ersetzen wir durch die Karriereseite der
 * Firma, damit der Button nie ins Leere führt.
 */
function isBrokenBoardUrl(url: URL): boolean {
  const host = url.hostname;
  const isGreenhouse = host === "greenhouse.io" || host.endsWith(".greenhouse.io");
  const isShortLink = host === "grnh.se";

  if (isShortLink) return true;
  if (!isGreenhouse) return false;

  if (url.searchParams.get("error") === "true") return true;

  // Board-Wurzel wie /dialecticch – ohne konkrete Job-ID.
  return /^\/[^/]+\/?$/.test(url.pathname) && !/\/jobs\/\d+/.test(url.pathname);
}

/** Bewerbungsziel inkl. Fallback auf die Firmen-Karriereseite. */
export function resolveApplyUrl(job: Pick<Job, "apply_url" | "source_url" | "company">): string {
  const raw = job.apply_url?.trim();
  if (!raw) {
    return companyCareersUrl(job.company) ?? job.source_url;
  }

  // E-Mail-Bewerbungen direkt durchreichen, damit formatApplyUrl daraus
  // einen mailto:-Link mit Betreff bauen kann.
  if (/^mailto:/i.test(raw) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
    return raw;
  }

  try {
    const url = new URL(raw);

    if (isBrokenBoardUrl(url)) {
      return companyCareersUrl(job.company) ?? job.source_url ?? raw;
    }

    // Fremd-Attribution aus alten Scrapes entfernen (utm_* / source).
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|source$|gh_src$)/i.test(key)) {
        const value = url.searchParams.get(key) ?? "";
        if (/swissdevjobs/i.test(value)) url.searchParams.delete(key);
      }
    }

    return url.toString();
  } catch {
    return companyCareersUrl(job.company) ?? job.source_url ?? raw;
  }
}

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
  const subject = `Takedown request: ${job.title} at ${job.company}`;

  const body = [
    "Hi Magnus,",
    "",
    "please remove the following listing from your platform:",
    `Job ID/Title: ${job.title}`,
    `Company: ${job.company}`,
    `Link: ${jobUrl(job)}`,
    "",
    "Reason: ",
  ].join("\r\n");

  return `mailto:${TAKEDOWN_EMAIL}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
}
