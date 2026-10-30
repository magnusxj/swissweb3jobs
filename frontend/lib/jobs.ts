import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  workplace_type: string | null;
  employment_type: string | null;
  tags: string | null;
  summary: string | null;
  source_url: string;
  apply_url: string;
  source_site: string;
  status: string;
  posted_at: string | null;
  created_at: string;
};

export type LocationFilter = "zuerich" | "zug" | "remote";
export type WorkplaceFilter = "Remote" | "Hybrid" | "On-site";

export type JobFilters = {
  q: string;
  ort: LocationFilter | null;
  workplace: WorkplaceFilter | null;
};

/**
 * DB-Pfad in dieser Reihenfolge:
 * 1. JOBS_DB_PATH (z.B. lokal oder in CI)
 * 2. ./data/jobs.db  (Vercel: Root = frontend/)
 * 3. ../data/jobs.db (Monorepo-Layout)
 */
function resolveDbPath(): string | null {
  const fromEnv = process.env.JOBS_DB_PATH;
  if (fromEnv) return fromEnv;

  const candidates = [
    path.join(process.cwd(), "data", "jobs.db"),
    path.join(process.cwd(), "..", "data", "jobs.db"),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

const DB_PATH = resolveDbPath();

const globalForDb = globalThis as unknown as {
  __jobsDb?: Database.Database;
};

function db(): Database.Database | null {
  if (globalForDb.__jobsDb) return globalForDb.__jobsDb;
  if (!DB_PATH) return null;

  try {
    globalForDb.__jobsDb = new Database(DB_PATH, {
      readonly: true,
      fileMustExist: true,
    });
  } catch (error) {
    console.warn(
      `[jobs] Datenbank konnte nicht geöffnet werden (${DB_PATH}):`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }

  return globalForDb.__jobsDb;
}

const LOCATION_SQL: Record<LocationFilter, string> = {
  zuerich: "(location LIKE '%Zürich%' OR location LIKE '%Zurich%')",
  zug: "location LIKE '%Zug%'",
  remote: "(workplace_type = 'Remote' OR location LIKE '%Remote%')",
};

export function getJobs(filters: JobFilters): Job[] {
  const database = db();
  if (!database) return [];

  const where: string[] = ["COALESCE(status, 'active') != 'archived'"];
  const params: (string | number)[] = [];

  if (filters.ort) {
    where.push(LOCATION_SQL[filters.ort]);
  }

  if (filters.workplace) {
    where.push("workplace_type = ?");
    params.push(filters.workplace);
  }

  const q = filters.q.trim();
  if (q) {
    where.push("(title LIKE ? OR company LIKE ? OR tags LIKE ?)");
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  const sql = `
    SELECT * FROM jobs
    WHERE ${where.join(" AND ")}
    ORDER BY COALESCE(posted_at, created_at) DESC, id DESC
  `;

  return database.prepare(sql).all(...params) as Job[];
}

/** Alle aktiven Inserate – Basis für Sitemap und Detailseiten. */
export function getActiveJobs(): Job[] {
  const database = db();
  if (!database) return [];

  return database
    .prepare(
      `SELECT * FROM jobs
       WHERE status = 'active'
       ORDER BY COALESCE(posted_at, created_at) DESC, id DESC`,
    )
    .all() as Job[];
}

/** Alle Inserate inkl. archivierter – für Detailseiten und Prerendering. */
export function getAllJobs(): Job[] {
  const database = db();
  if (!database) return [];

  return database
    .prepare(
      `SELECT * FROM jobs
       ORDER BY COALESCE(posted_at, created_at) DESC, id DESC`,
    )
    .all() as Job[];
}

/**
 * Ein Inserat anhand des ID-Suffix im Slug ("defi-engineer-2").
 * Archivierte Inserate bleiben abrufbar, damit alte Links nicht ins 404 laufen.
 */
export function getJobBySlug(slug: string): Job | null {
  const match = /-(\d+)$/.exec(slug);
  if (!match) return null;

  const id = Number(match[1]);
  if (!Number.isInteger(id)) return null;

  const database = db();
  if (!database) return null;

  const job = database.prepare(`SELECT * FROM jobs WHERE id = ?`).get(id) as
    | Job
    | undefined;

  return job ?? null;
}

export function parseFilters(searchParams: {
  [key: string]: string | string[] | undefined;
}): JobFilters {
  const one = (value: string | string[] | undefined) =>
    (Array.isArray(value) ? value[0] : value)?.trim() ?? "";

  const ort = one(searchParams.ort);
  const workplace = one(searchParams.workplace);

  return {
    q: one(searchParams.q).slice(0, 100),
    ort:
      ort === "zuerich" || ort === "zug" || ort === "remote" ? ort : null,
    workplace:
      workplace === "Remote" ||
      workplace === "Hybrid" ||
      workplace === "On-site"
        ? workplace
        : null,
  };
}

export function relativeDate(value: string | null): string {
  if (!value) return "";

  const then = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  const ms = then.getTime();
  if (Number.isNaN(ms)) return "";

  const days = Math.floor((Date.now() - ms) / 86_400_000);

  if (days <= 0) return "heute";
  if (days === 1) return "gestern";
  if (days < 7) return `vor ${days} Tagen`;
  if (days < 14) return "vor 1 Woche";
  if (days < 31) return `vor ${Math.floor(days / 7)} Wochen`;
  if (days < 60) return "vor 1 Monat";
  if (days < 365) return `vor ${Math.floor(days / 30)} Monaten`;
  if (days < 730) return "vor 1 Jahr";
  return `vor ${Math.floor(days / 365)} Jahren`;
}
