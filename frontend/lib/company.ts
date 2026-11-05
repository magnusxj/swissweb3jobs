/**
 * Firmen-Metadaten für Logo, Website und Karriereseite.
 *
 * Die DB kennt keine Firmen-Domains. Deshalb pflegen wir bekannte Arbeitgeber
 * hier und leiten für alles andere eine Domain aus der Bewerbungs-URL ab –
 * ausser die URL gehört zu einem ATS/Jobboard, dann gibt es kein Logo-Bild.
 */
type CompanyProfile = {
  domain?: string;
  careersUrl?: string;
};

const COMPANY_PROFILES: Record<string, CompanyProfile> = {
  dialectic: {
    domain: "dialectic.com",
    careersUrl: "https://dialectic.com/jobs",
  },
  "sygnum bank": {
    domain: "sygnum.com",
    careersUrl: "https://www.sygnum.com/careers-portal/",
  },
};

/** Hosts, die nie die Firma selbst sind (ATS, Jobboards, Social). */
const JOB_BOARD_HOSTS = [
  "greenhouse.io",
  "grnh.se",
  "lever.co",
  "workday.com",
  "myworkdayjobs.com",
  "personio.de",
  "recruitee.com",
  "smartrecruiters.com",
  "workable.com",
  "breezy.hr",
  "swissdevjobs.ch",
  "linkedin.com",
  "indeed.com",
  "glassdoor.com",
];

function profileKey(company: string): string {
  return company.trim().toLowerCase();
}

function isJobBoardHost(hostname: string): boolean {
  return JOB_BOARD_HOSTS.some(
    (board) => hostname === board || hostname.endsWith(`.${board}`),
  );
}

function domainFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return isJobBoardHost(hostname) ? null : hostname;
  } catch {
    return null;
  }
}

/** Domain für den Logo-Favicon-Abruf – null bedeutet Initials-Badge. */
export function companyDomain(
  company: string,
  applyUrl?: string | null,
): string | null {
  const profile = COMPANY_PROFILES[profileKey(company)];
  return profile?.domain ?? domainFromUrl(applyUrl);
}

/** Offizielle Karriereseite als Fallback für kaputte Bewerbungs-Links. */
export function companyCareersUrl(company: string): string | null {
  return COMPANY_PROFILES[profileKey(company)]?.careersUrl ?? null;
}
