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
  "amina bank": {
    domain: "aminagroup.com",
    careersUrl: "https://www.aminagroup.com/careers/",
  },
  "bitcoin suisse": {
    domain: "bitcoinsuisse.com",
    careersUrl: "https://www.bitcoinsuisse.com/careers",
  },
  "web3 foundation": {
    domain: "web3.foundation",
    careersUrl: "https://web3.foundation/careers/",
  },
  "dfinity foundation": {
    domain: "dfinity.org",
    careersUrl: "https://dfinity.org/careers/",
  },
  dfinity: {
    domain: "dfinity.org",
    careersUrl: "https://dfinity.org/careers/",
  },
  "taurus sa": {
    domain: "taurusgroup.ch",
    careersUrl: "https://www.taurusgroup.ch/en/careers",
  },
  safe: {
    domain: "safe.global",
    careersUrl: "https://safe.global/careers",
  },
  "aleph zero foundation": {
    domain: "alephzero.org",
    careersUrl: "https://alephzero.org/careers",
  },
  obligate: {
    domain: "obligate.com",
    careersUrl: "https://www.obligate.com/careers",
  },
  "crypto finance ag": {
    domain: "cryptofinance.com",
    careersUrl: "https://www.cryptofinance.com/careers",
  },
  swissborg: {
    domain: "swissborg.com",
    careersUrl: "https://swissborg.com/careers",
  },
  youhodler: {
    domain: "youhodler.com",
    careersUrl: "https://www.youhodler.com/careers",
  },
  lisk: {
    domain: "lisk.com",
    careersUrl: "https://lisk.com/careers",
  },
  swissquote: {
    domain: "swissquote.com",
    careersUrl: "https://www.swissquote.com/en-ch/career",
  },
  "cardano foundation": {
    domain: "cardanofoundation.org",
    careersUrl: "https://cardanofoundation.org/en/careers/",
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
  "personio.com",
  "join.com",
  "onlyfy.jobs",
  "onlyfy.com",
  "salesforce-sites.com",
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
