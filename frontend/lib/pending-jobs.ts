import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { getJobsDbPath } from "@/lib/jobs";

export type PendingJobInput = {
  title: string;
  company: string;
  website: string;
  location: string;
  employment_type: string;
  apply: string;
  description: string;
  billing_email: string;
};

export type PendingJobRecord = PendingJobInput & {
  id: number;
  listing_id: string;
  status: "pending_payment";
  source_site: string;
  created_at: string;
};

const globalForPendingDb = globalThis as unknown as {
  __pendingJobsDb?: Database.Database;
};

/**
 * Eigene, beschreibbare Verbindung: `lib/jobs.ts` öffnet die DB bewusst
 * read-only für den öffentlichen Feed. Die Pending-Tabelle wird beim ersten
 * Schreibzugriff angelegt.
 */
function pendingDb(): Database.Database {
  if (globalForPendingDb.__pendingJobsDb) {
    return globalForPendingDb.__pendingJobsDb;
  }

  const dbPath = getJobsDbPath();
  if (!dbPath) {
    throw new Error("Jobs database not found.");
  }

  const database = new Database(dbPath);
  database.pragma("busy_timeout = 5000");
  database.exec(`
    CREATE TABLE IF NOT EXISTS pending_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      website TEXT NOT NULL,
      location TEXT NOT NULL,
      employment_type TEXT NOT NULL,
      apply_url TEXT NOT NULL,
      description TEXT NOT NULL,
      billing_email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending_payment',
      source_site TEXT NOT NULL DEFAULT 'direct',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  globalForPendingDb.__pendingJobsDb = database;
  return database;
}

export function createPendingJob(
  input: PendingJobInput,
): Pick<PendingJobRecord, "id" | "listing_id" | "status" | "created_at"> {
  const database = pendingDb();
  const listingId = `SW3-${randomUUID().slice(0, 8).toUpperCase()}`;

  const result = database
    .prepare(
      `INSERT INTO pending_jobs
        (listing_id, title, company, website, location, employment_type, apply_url, description, billing_email, status, source_site)
       VALUES
        (@listing_id, @title, @company, @website, @location, @employment_type, @apply_url, @description, @billing_email, 'pending_payment', 'direct')`,
    )
    .run({
      listing_id: listingId,
      title: input.title,
      company: input.company,
      website: input.website,
      location: input.location,
      employment_type: input.employment_type,
      apply_url: input.apply,
      description: input.description,
      billing_email: input.billing_email,
    });

  const row = database
    .prepare(
      "SELECT id, listing_id, status, created_at FROM pending_jobs WHERE id = ?",
    )
    .get(result.lastInsertRowid) as {
    id: number;
    listing_id: string;
    status: "pending_payment";
    created_at: string;
  };

  return row;
}
