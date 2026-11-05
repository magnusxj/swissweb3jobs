"""
SQLite-Zugriffsschicht für data/jobs.db.

Enthält:
- init_db()          -> Tabelle anlegen / fehlende Spalten nachrüsten
- insert_job(job)    -> Job einfügen, Duplikate über source_url UND über
                        normalized_title + company + location erkennen und
                        den bestehenden Eintrag aktualisieren
- count_jobs()       -> Anzahl Jobs (optional nach Status)
"""

import re
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dedupe_key TEXT,
    is_featured INTEGER NOT NULL DEFAULT 0
)
"""

# Spalten, die in älteren jobs.db-Versionen fehlen können.
MIGRATIONS = {
    "summary": "TEXT",
    "posted_at": "TEXT",
    "workplace_type": "TEXT DEFAULT 'On-site'",
    "employment_type": "TEXT DEFAULT '100%'",
    "status": "TEXT DEFAULT 'active'",
    "dedupe_key": "TEXT",
    "is_featured": "INTEGER NOT NULL DEFAULT 0",
}

INSERT_SQL = """
INSERT INTO jobs (
    title, company, location, workplace_type, employment_type,
    tags, summary, source_url, apply_url, source_site, status, posted_at,
    dedupe_key
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
"""

UPDATE_SQL = """
UPDATE jobs SET
    title = ?,
    company = ?,
    location = ?,
    workplace_type = ?,
    employment_type = ?,
    tags = ?,
    summary = COALESCE(NULLIF(?, ''), summary),
    apply_url = ?,
    source_site = ?,
    status = 'active',
    posted_at = COALESCE(NULLIF(?, ''), posted_at),
    dedupe_key = ?
WHERE id = ?
"""

REQUIRED_FIELDS = ("title", "company", "location", "source_url", "apply_url", "source_site")

# Für die sekundäre Dubletten-Erkennung.
_PENSUM_RE = re.compile(r"\b\d{1,3}\s*(?:[-–]\s*\d{1,3})?\s*%")
_KLAMMER_RE = re.compile(r"[\(\[\{].*?[\)\]\}]")
_NICHT_ALNUM_RE = re.compile(r"[^a-z0-9]+")
_FIRMEN_SUFFIXE = {
    "ag", "gmbh", "sa", "sàrl", "sarl", "ltd", "limited", "inc", "plc", "llc",
    "holding", "group", "bank",
}


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


def _clean(value) -> str:
    return " ".join(str(value or "").split()).strip()


def _ascii_key(value) -> str:
    text = _clean(value).lower().replace("&", " und ")
    text = _KLAMMER_RE.sub(" ", text)
    text = _NICHT_ALNUM_RE.sub(" ", text)
    return " ".join(text.split())


def normalize_title(value: str) -> str:
    """Titel ohne Pensum, Gender-Zusätze und Satzzeichen – Basis für den Dup-Check."""
    text = _clean(value).lower().replace("&", " und ")
    text = _PENSUM_RE.sub(" ", text)
    text = re.sub(r"\b(m/w/d|m/f/d|w/m/d|gn|all genders)\b", " ", text)
    text = _NICHT_ALNUM_RE.sub(" ", text)
    return " ".join(text.split())


def normalize_company(value: str) -> str:
    """Firmenname ohne Rechtsform (AG, GmbH, ...)."""
    worte = [w for w in _ascii_key(value).split() if w not in _FIRMEN_SUFFIXE]
    return " ".join(worte)


def normalize_location_key(value: str) -> str:
    return _ascii_key(value)


def build_dedupe_key(title: str, company: str, location: str, extra: str = "") -> str:
    """Sekundärschlüssel: normalisierter Titel + Firma + Ort (+ optional ID)."""
    basis = f"{normalize_title(title)}|{normalize_company(company)}|{normalize_location_key(location)}"
    extra_key = _ascii_key(extra)
    return f"{basis}|{extra_key}" if extra_key else basis


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
        conn.execute("CREATE INDEX IF NOT EXISTS idx_jobs_dedupe ON jobs (dedupe_key)")

        # Bestehende Zeilen nachindizieren.
        offen = conn.execute(
            "SELECT id, title, company, location FROM jobs "
            "WHERE dedupe_key IS NULL OR dedupe_key = ''"
        ).fetchall()
        for row in offen:
            conn.execute(
                "UPDATE jobs SET dedupe_key = ? WHERE id = ?",
                (build_dedupe_key(row["title"], row["company"], row["location"]), row["id"]),
            )

    print(f"Datenbank bereit: {DB_PATH}")


def insert_job(job: dict) -> bool:
    """
    Fügt einen Job ein oder aktualisiert einen bestehenden.

    Dubletten werden in dieser Reihenfolge erkannt:
    1. identische source_url (UNIQUE)
    2. gleicher dedupe_key: normalized_title + company + location

    Rückgabe:
        True  -> Job war neu und wurde gespeichert
        False -> Job existierte bereits und wurde aktualisiert
    """
    daten = {feld: _clean(job.get(feld)) for feld in REQUIRED_FIELDS}
    fehlend = [feld for feld in REQUIRED_FIELDS if not daten[feld]]
    if fehlend:
        raise ValueError(f"Pflichtfelder fehlen: {', '.join(fehlend)}")

    summary = _clean(job.get("summary")) or ""
    tags = _clean(job.get("tags"))
    workplace = _clean(job.get("workplace_type")) or "On-site"
    pensum = _clean(job.get("employment_type")) or "100%"
    posted_at = _clean(job.get("posted_at"))
    key = build_dedupe_key(
        daten["title"], daten["company"], daten["location"],
        _clean(job.get("dedupe_extra")),
    )

    with get_connection() as conn:
        bestehend = conn.execute(
            "SELECT id FROM jobs WHERE source_url = ?", (daten["source_url"],)
        ).fetchone()

        if bestehend is None:
            bestehend = conn.execute(
                "SELECT id FROM jobs WHERE dedupe_key = ? ORDER BY id LIMIT 1", (key,)
            ).fetchone()

        if bestehend is not None:
            job_id = bestehend["id"]

            # source_url nur übernehmen, wenn sie keinem anderen Job gehört.
            konflikt = conn.execute(
                "SELECT id FROM jobs WHERE source_url = ? AND id <> ?",
                (daten["source_url"], job_id),
            ).fetchone()
            if konflikt is None:
                conn.execute(
                    "UPDATE jobs SET source_url = ? WHERE id = ?",
                    (daten["source_url"], job_id),
                )

            conn.execute(
                UPDATE_SQL,
                (
                    daten["title"],
                    daten["company"],
                    daten["location"],
                    workplace,
                    pensum,
                    tags,
                    summary,
                    daten["apply_url"],
                    daten["source_site"],
                    posted_at,
                    key,
                    job_id,
                ),
            )
            return False

        conn.execute(
            INSERT_SQL,
            (
                daten["title"],
                daten["company"],
                daten["location"],
                workplace,
                pensum,
                tags,
                summary or None,
                daten["source_url"],
                daten["apply_url"],
                daten["source_site"],
                _clean(job.get("status")) or "active",
                posted_at or None,
                key,
            ),
        )
        return True


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
