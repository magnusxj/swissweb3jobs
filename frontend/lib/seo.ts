import type { Job } from "@/lib/jobs";

/**
 * Zentrale SEO-Konstanten.
 *
 * NEXT_PUBLIC_SITE_URL setzen (z.B. in .env.local), sobald die Domain steht.
 * Der Fallback ist nur ein Platzhalter für Builds ohne Env.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://swissweb3jobs.ch"
).replace(/\/+$/, "");

export const SITE_NAME = "Swiss Web3 Jobs";

export const HOME_TITLE =
  "Swiss Web3 Jobs | Blockchain & FinTech Stellen Schweiz";

export const HOME_DESCRIPTION =
  "Handverlesene Blockchain-, Web3- und FinTech-Stellen in Zug, Zürich und Remote CH. Täglich aktualisiert – direkt bewerben, ohne Umwege.";

export const HOME_KEYWORDS = [
  "Web3 Jobs Schweiz",
  "Blockchain Jobs",
  "FinTech Jobs Schweiz",
  "Krypto Jobs Zürich",
  "Crypto Jobs Zug",
  "Solidity Jobs",
  "Remote Blockchain Jobs",
];

export const HOME_METADATA = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  keywords: HOME_KEYWORDS,
} as const;

/* -------------------------------------------------------------------------- */
/*  Slugs                                                                     */
/* -------------------------------------------------------------------------- */

const UMLAUTE: Record<string, string> = {
  ä: "ae",
  ö: "oe",
  ü: "ue",
  ß: "ss",
  à: "a",
  á: "a",
  â: "a",
  ã: "a",
  å: "a",
  æ: "ae",
  ç: "c",
  è: "e",
  é: "e",
  ê: "e",
  ë: "e",
  ì: "i",
  í: "i",
  î: "i",
  ï: "i",
  ñ: "n",
  ò: "o",
  ó: "o",
  ô: "o",
  õ: "o",
  ø: "o",
  ù: "u",
  ú: "u",
  û: "u",
  ý: "y",
  ÿ: "y",
};

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[äöüßàáâãåæçèéêëìíîïñòóôõøùúûýÿ]/g, (char) => UMLAUTE[char] ?? char)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/, "");
}

/** Stabiler, keyword-reicher Slug: "defi-engineer-2". */
export function jobSlug(job: Pick<Job, "id" | "title">): string {
  const base = slugify(job.title) || "job";
  return `${base}-${job.id}`;
}

export function jobPath(job: Pick<Job, "id" | "title">): string {
  return `/jobs/${jobSlug(job)}`;
}

export function jobUrl(job: Pick<Job, "id" | "title">): string {
  return `${SITE_URL}${jobPath(job)}`;
}

/* -------------------------------------------------------------------------- */
/*  Geodaten (Schweiz + internationale Standorte)                             */
/* -------------------------------------------------------------------------- */

type Geo = {
  locality: string;
  country: string;
  region?: string;
};

const CH_CITIES: Record<string, Geo> = {
  zürich: { locality: "Zürich", country: "CH", region: "ZH" },
  zurich: { locality: "Zürich", country: "CH", region: "ZH" },
  zuerich: { locality: "Zürich", country: "CH", region: "ZH" },
  zug: { locality: "Zug", country: "CH", region: "ZG" },
  baar: { locality: "Baar", country: "CH", region: "ZG" },
  cham: { locality: "Cham", country: "CH", region: "ZG" },
  steinhausen: { locality: "Steinhausen", country: "CH", region: "ZG" },
  luzern: { locality: "Luzern", country: "CH", region: "LU" },
  bern: { locality: "Bern", country: "CH", region: "BE" },
  basel: { locality: "Basel", country: "CH", region: "BS" },
  "basel-landschaft": { locality: "Basel", country: "CH", region: "BL" },
  genf: { locality: "Genf", country: "CH", region: "GE" },
  geneve: { locality: "Genf", country: "CH", region: "GE" },
  "genève": { locality: "Genf", country: "CH", region: "GE" },
  lausanne: { locality: "Lausanne", country: "CH", region: "VD" },
  vaud: { locality: "Lausanne", country: "CH", region: "VD" },
  winterthur: { locality: "Winterthur", country: "CH", region: "ZH" },
  st: { locality: "St. Gallen", country: "CH", region: "SG" },
  "st-gallen": { locality: "St. Gallen", country: "CH", region: "SG" },
  "st. gallen": { locality: "St. Gallen", country: "CH", region: "SG" },
  lugano: { locality: "Lugano", country: "CH", region: "TI" },
  ticino: { locality: "Lugano", country: "CH", region: "TI" },
  fribourg: { locality: "Fribourg", country: "CH", region: "FR" },
  neuchatel: { locality: "Neuchâtel", country: "CH", region: "NE" },
  "neuchâtel": { locality: "Neuchâtel", country: "CH", region: "NE" },
  schwyz: { locality: "Schwyz", country: "CH", region: "SZ" },
  aargau: { locality: "Aarau", country: "CH", region: "AG" },
  aarau: { locality: "Aarau", country: "CH", region: "AG" },
};

const FOREIGN_CITIES: Record<string, Geo> = {
  vaduz: { locality: "Vaduz", country: "LI" },
  singapur: { locality: "Singapur", country: "SG" },
  singapore: { locality: "Singapur", country: "SG" },
  "abu dhabi": { locality: "Abu Dhabi", country: "AE" },
  dubai: { locality: "Dubai", country: "AE" },
  london: { locality: "London", country: "GB" },
  berlin: { locality: "Berlin", country: "DE" },
  munchen: { locality: "München", country: "DE" },
  "münchen": { locality: "München", country: "DE" },
  wien: { locality: "Wien", country: "AT" },
  "new york": { locality: "New York", country: "US" },
  lisbon: { locality: "Lissabon", country: "PT" },
  lissabon: { locality: "Lissabon", country: "PT" },
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

/** Erkennt Kanton/Land aus dem Freitext-Standort der DB. */
export function resolveGeo(location: string): Geo {
  const key = normalize(location);

  if (CH_CITIES[key]) return CH_CITIES[key];
  if (FOREIGN_CITIES[key]) return FOREIGN_CITIES[key];

  // "Zürich, Schweiz", "Remote (Zug)" usw.
  for (const [city, geo] of Object.entries(CH_CITIES)) {
    if (key.includes(city)) return geo;
  }
  for (const [city, geo] of Object.entries(FOREIGN_CITIES)) {
    if (key.includes(city)) return geo;
  }

  // Unbekannt: Ort übernehmen, Schweiz annehmen (Portal-Fokus CH).
  return { locality: location.trim() || "Schweiz", country: "CH" };
}

/** Kantonskürzel oder Land – für Titel und Anzeige. */
export function geoLabel(location: string): string {
  const geo = resolveGeo(location);
  return geo.region ?? geo.country;
}

/* -------------------------------------------------------------------------- */
/*  Datums-Helfer                                                             */
/* -------------------------------------------------------------------------- */

/** SQLite liefert "2026-10-29 18:57:16" (UTC) oder ISO mit T/Z. */
export function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  const raw = value.includes("T")
    ? value
    : `${value.replace(" ", "T")}Z`;

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** posted_at, sonst created_at – als ISO-String für JSON-LD. */
export function jobDatePosted(job: Job): string {
  const date = toDate(job.posted_at) ?? toDate(job.created_at) ?? new Date();
  return date.toISOString();
}

/** 60 Tage Gültigkeit ab Publikation. */
export function jobValidThrough(job: Job): string {
  const date = toDate(job.posted_at) ?? toDate(job.created_at) ?? new Date();
  date.setUTCDate(date.getUTCDate() + 60);
  return date.toISOString();
}

const DATE_FORMAT = new Intl.DateTimeFormat("de-CH", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Absolutes Datum für Detailseiten (kein Date.now() – prerender-sicher). */
export function jobDateLabel(job: Job): string {
  const date = toDate(job.posted_at) ?? toDate(job.created_at);
  return date ? DATE_FORMAT.format(date) : "";
}

/* -------------------------------------------------------------------------- */
/*  Anstellungsart                                                            */
/* -------------------------------------------------------------------------- */

type EmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "INTERN"
  | "CONTRACTOR"
  | "TEMPORARY";

export function employmentType(job: Job): EmploymentType {
  const title = job.title.toLowerCase();
  const raw = (job.employment_type ?? "").toLowerCase();

  if (title.includes("intern") || title.includes("praktik")) return "INTERN";
  if (title.includes("werkstudent")) return "PART_TIME";
  if (raw.includes("contract") || raw.includes("freelance")) {
    return "CONTRACTOR";
  }
  if (raw.includes("temporary") || raw.includes("befristet")) {
    return "TEMPORARY";
  }

  // "100%", "80-100%", "60 %" → höchster Wert entscheidet.
  const percentages = [...raw.matchAll(/(\d{1,3})\s*%/g)].map((match) =>
    Number(match[1]),
  );
  if (percentages.length > 0 && Math.max(...percentages) < 100) {
    return "PART_TIME";
  }

  return "FULL_TIME";
}

/* -------------------------------------------------------------------------- */
/*  Beschreibung                                                              */
/* -------------------------------------------------------------------------- */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function splitTags(tags: string | null): string[] {
  return (tags ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/** Absätze für die Detailseite – summary, sonst sauberer Fallback. */
export function jobDescriptionParagraphs(job: Job): string[] {
  const geo = resolveGeo(job.location);
  const tags = splitTags(job.tags);
  const workplace = job.workplace_type ?? "On-site";
  const employment = job.employment_type ?? "100%";

  const intro = job.summary?.trim()
    ? job.summary.trim()
    : `${job.company} sucht eine Person für die Rolle «${job.title}» in ${geo.locality}${
        geo.region ? ` (${geo.region})` : ""
      }.`;

  const paragraphs = [
    intro,
    `Arbeitsmodell: ${workplace}. Pensum: ${employment}. Standort: ${geo.locality}, ${
      geo.country === "CH" ? "Schweiz" : geo.country
    }.`,
  ];

  if (tags.length > 0) {
    paragraphs.push(`Im Fokus: ${tags.join(", ")}.`);
  }

  return paragraphs;
}

/** HTML-Version für das JobPosting-`description`-Feld. */
export function jobDescriptionHtml(job: Job): string {
  const paragraphs = jobDescriptionParagraphs(job);
  const tags = splitTags(job.tags);

  const body = paragraphs.map((text) => `<p>${escapeHtml(text)}</p>`).join("");

  const list =
    tags.length > 0
      ? `<ul>${tags
          .map((tag) => `<li>${escapeHtml(tag)}</li>`)
          .join("")}</ul>`
      : "";

  return `${body}${list}`;
}

/* -------------------------------------------------------------------------- */
/*  Meta-Texte pro Job                                                        */
/* -------------------------------------------------------------------------- */

export function jobSeoTitle(job: Job): string {
  const geo = resolveGeo(job.location);
  const region = geo.region ?? geo.country;
  return `${job.title} in ${geo.locality} (${region})`;
}

export function jobSeoDescription(job: Job): string {
  const geo = resolveGeo(job.location);
  const tags = splitTags(job.tags).slice(0, 3).join(", ");
  const workplace = job.workplace_type ?? "On-site";
  const employment = job.employment_type ?? "100%";

  const text = [
    `${job.title} bei ${job.company} in ${geo.locality}`,
    tags ? `– ${tags}` : "",
    `· ${workplace}, ${employment}. Jetzt auf Swiss Web3 Jobs bewerben.`,
  ]
    .filter(Boolean)
    .join(" ");

  return text.length > 158 ? `${text.slice(0, 155).trimEnd()}…` : text;
}

/* -------------------------------------------------------------------------- */
/*  Schema.org JobPosting                                                     */
/* -------------------------------------------------------------------------- */

export type JobPostingJsonLd = Record<string, unknown>;

export function buildJobPosting(job: Job): JobPostingJsonLd {
  const geo = resolveGeo(job.location);
  const workplace = (job.workplace_type ?? "On-site").toLowerCase();

  const address: Record<string, unknown> = {
    "@type": "PostalAddress",
    addressLocality: geo.locality,
    addressCountry: geo.country,
  };
  if (geo.region) address.addressRegion = geo.region;

  const data: JobPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: jobDescriptionHtml(job),
    identifier: {
      "@type": "PropertyValue",
      name: job.company,
      value: String(job.id),
    },
    datePosted: jobDatePosted(job),
    validThrough: jobValidThrough(job),
    employmentType: employmentType(job),
    directApply: false,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
    },
    jobLocation: {
      "@type": "Place",
      address,
    },
    url: jobUrl(job),
  };

  // Vollständig remote: TELECOMMUTE + Zielregion.
  if (workplace === "remote") {
    data.jobLocationType = "TELECOMMUTE";
    data.applicantLocationRequirements = {
      "@type": "Country",
      name: "Schweiz",
    };
  }

  // Hybrid bleibt bewusst On-site mit Bürostandort – so verlangt es Google.
  return data;
}

/** JSON-LD sicher in ein <script> einbetten. */
export function serializeJsonLd(data: JobPostingJsonLd): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
