"""
SQLite-Zugriffsschicht für data/jobs.db.

Enthält:
- init_db()          -> Tabelle anlegen / fehlende Spalten nachrüsten
- insert_job(job)    -> Job einfügen, Duplikate über source_url ignorieren
- count_jobs()       -> Anzahl Jobs (optional nach Status)
"""

import sqlite3
from contextlib import contextmanager
from pathlib import Path

# Immer absolut, unabhängig vom Aufrufort im Terminal.
DB_PATH = Path(__file__).resolve().parent.parent / "data" / "jobs.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    workplace_type TEXT DEFAULT 'On-site',
    employment_type TEXT DEFAULT '100%',
    tags TEXT,
    summary TEXT,
    source_url TEXT UNIQUE NOT NULL,
    apply_url TEXT NOT NULL,
    source_site TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    posted_at TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
"""

# Spalten, die in älteren jobs.db-Versionen fehlen können.
MIGRATIONS = {
    "summary": "TEXT",
    "posted_at": "TEXT",
    "workplace_type": "TEXT DEFAULT 'On-site'",
    "employment_type": "TEXT DEFAULT '100%'",
    "status": "TEXT DEFAULT 'active'",
}

INSERT_SQL = """
INSERT OR IGNORE INTO jobs (
    title, company, location, workplace_type, employment_type,
    tags, summary, source_url, apply_url, source_site, status, posted_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
"""

REQUIRED_FIELDS = ("title", "company", "location", "source_url", "apply_url", "source_site")


@contextmanager
def get_connection():
    """Context Manager: committet, rollt bei Fehler zurück und schliesst immer."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA busy_timeout = 30000")
        # WAL reduziert File-Locks bei parallelen Lesern (z. B. Frontend).
        conn.execute("PRAGMA journal_mode = WAL")
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Legt die Tabelle an und ergänzt fehlende Spalten ohne Datenverlust."""
    with get_connection() as conn:
        conn.execute(SCHEMA)

        vorhandene = {row["name"] for row in conn.execute("PRAGMA table_info(jobs)")}
        for spalte, typ in MIGRATIONS.items():
            if spalte not in vorhandene:
                conn.execute(f"ALTER TABLE jobs ADD COLUMN {spalte} {typ}")

        conn.execute("CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_jobs_source_site ON jobs (source_site)")

    print(f"Datenbank bereit: {DB_PATH}")


def _clean(value) -> str:
    return " ".join(str(value or "").split()).strip()


def insert_job(job: dict) -> bool:
    """
    Fügt einen Job ein. Duplikate werden über den UNIQUE-Key source_url
    ignoriert.

    Rückgabe:
        True  -> Job war neu und wurde gespeichert
        False -> Job existierte bereits (Duplikat)
    """
    daten = {feld: _clean(job.get(feld)) for feld in REQUIRED_FIELDS}
    fehlend = [feld for feld in REQUIRED_FIELDS if not daten[feld]]
    if fehlend:
        raise ValueError(f"Pflichtfelder fehlen: {', '.join(fehlend)}")

    params = (
        daten["title"],
        daten["company"],
        daten["location"],
        _clean(job.get("workplace_type")) or "On-site",
        _clean(job.get("employment_type")) or "100%",
        _clean(job.get("tags")),
        _clean(job.get("summary")) or None,
        daten["source_url"],
        daten["apply_url"],
        daten["source_site"],
        _clean(job.get("status")) or "active",
        _clean(job.get("posted_at")) or None,
    )

    with get_connection() as conn:
        cursor = conn.execute(INSERT_SQL, params)
        return cursor.rowcount == 1


def count_jobs(status: str | None = None) -> int:
    """Anzahl Jobs, optional nur mit einem bestimmten Status."""
    with get_connection() as conn:
        if status:
            row = conn.execute("SELECT COUNT(*) AS n FROM jobs WHERE status = ?", (status,)).fetchone()
        else:
            row = conn.execute("SELECT COUNT(*) AS n FROM jobs").fetchone()
    return int(row["n"])


if __name__ == "__main__":
    init_db()
    print(f"Aktuell in der Datenbank: {count_jobs()} Jobs")
    try:
        input("\nPress Enter to exit...")
    except EOFError:
        pass
