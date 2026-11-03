"""
Datenbereinigung für data/jobs.db.

1. Sichert die DB als Snapshot (data/backups/jobs-<Zeitstempel>.db).
2. Entfernt Jobs ausserhalb der Schweiz/Liechtenstein-Whitelist.
3. Entfernt Dubletten (normalized_title + company + location) und behält
   dabei den Eintrag mit der ausführlichsten Beschreibung.

Aufruf (aus scraper/):
    venv\\Scripts\\python.exe cleanup_db.py
    venv\\Scripts\\python.exe cleanup_db.py --dry-run
"""

import argparse
import sys
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import db  # noqa: E402
import crawler  # noqa: E402
import geo  # noqa: E402

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass


def backup() -> Path:
    ziel = db.DB_PATH.parent / "backups" / f"jobs-{datetime.now():%Y%m%d-%H%M%S}.db"
    ziel.parent.mkdir(parents=True, exist_ok=True)
    with db.get_connection() as conn:
        conn.execute(f"VACUUM INTO '{str(ziel).replace(chr(39), chr(39) * 2)}'")
    return ziel


def remove_non_swiss(conn, dry_run: bool) -> list[dict]:
    entfernt = []
    for row in conn.execute("SELECT id, title, company, location FROM jobs").fetchall():
        if geo.is_swiss_location(row["location"]):
            continue
        entfernt.append(dict(row))
        if not dry_run:
            conn.execute("DELETE FROM jobs WHERE id = ?", (row["id"],))
    return entfernt


def remove_duplicates(conn, dry_run: bool, keys: dict[int, str]) -> list[tuple[str, list[int]]]:
    gruppen: dict[str, list] = {}
    for row in conn.execute(
        "SELECT id, title, company, location, summary FROM jobs ORDER BY id"
    ).fetchall():
        key = keys.get(row["id"]) or db.build_dedupe_key(
            row["title"], row["company"], row["location"]
        )
        gruppen.setdefault(key, []).append(row)

    bereinigt = []
    for key, rows in gruppen.items():
        if len(rows) < 2:
            continue

        # Behalten: Eintrag mit der längsten Beschreibung, sonst die älteste ID.
        behalten = max(rows, key=lambda r: (len(r["summary"] or ""), -r["id"]))
        doppelte = [r for r in rows if r["id"] != behalten["id"]]

        if not (behalten["summary"] or "").strip():
            ersatz = max((r["summary"] or "" for r in doppelte), key=len, default="")
            if ersatz and not dry_run:
                conn.execute(
                    "UPDATE jobs SET summary = ? WHERE id = ?", (ersatz, behalten["id"])
                )

        for row in doppelte:
            if not dry_run:
                conn.execute("DELETE FROM jobs WHERE id = ?", (row["id"],))
        bereinigt.append((key, [r["id"] for r in doppelte]))
    return bereinigt


def clear_junk_summaries(conn, dry_run: bool) -> list[dict]:
    """Setzt Platzhalter-/Rahmentexte als summary auf NULL (Thin Content)."""
    bereinigt = []
    for row in conn.execute("SELECT id, title, summary FROM jobs").fetchall():
        text = (row["summary"] or "").strip()
        if not text:
            continue
        if not crawler.is_junk_description(text):
            continue
        bereinigt.append({"id": row["id"], "title": row["title"], "summary": text[:80]})
        if not dry_run:
            conn.execute("UPDATE jobs SET summary = NULL WHERE id = ?", (row["id"],))
    return bereinigt


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Jobs-DB bereinigen")
    parser.add_argument("--dry-run", action="store_true", help="Nur anzeigen, nichts löschen")
    args = parser.parse_args(argv)

    if not db.DB_PATH.exists():
        print(f"Keine DB gefunden: {db.DB_PATH}")
        return 1

    if not args.dry_run:
        sicherung = backup()
        print(f"Backup: {sicherung}")

    db.init_db()

    with db.get_connection() as conn:
        vorher = conn.execute("SELECT COUNT(*) AS n FROM jobs").fetchone()["n"]

        # Schlüssel mit der aktuellen Normalisierung neu berechnen.
        if not args.dry_run:
            for row in conn.execute("SELECT id, title, company, location FROM jobs").fetchall():
                conn.execute(
                    "UPDATE jobs SET dedupe_key = ? WHERE id = ?",
                    (db.build_dedupe_key(row["title"], row["company"], row["location"]), row["id"]),
                )
            keys = {
                r["id"]: r["dedupe_key"]
                for r in conn.execute("SELECT id, dedupe_key FROM jobs")
            }
        else:
            keys = {
                r["id"]: db.build_dedupe_key(r["title"], r["company"], r["location"])
                for r in conn.execute("SELECT id, title, company, location FROM jobs")
            }

        ausland = remove_non_swiss(conn, args.dry_run)
        dubletten = remove_duplicates(conn, args.dry_run, keys)
        platzhalter = clear_junk_summaries(conn, args.dry_run)
        nachher = conn.execute("SELECT COUNT(*) AS n FROM jobs").fetchone()["n"]

    print()
    print(f"Jobs vorher: {vorher}")
    print(f"Ausserhalb CH/FL entfernt: {len(ausland)}")
    for row in ausland:
        print(f"  - #{row['id']} {row['title']} ({row['location']})")
    print(f"Dubletten entfernt: {sum(len(ids) for _, ids in dubletten)}")
    for key, ids in dubletten:
        print(f"  - {key} -> doppelte IDs {ids}")
    print(f"Platzhalter-Beschreibungen geleert: {len(platzhalter)}")
    for row in platzhalter:
        print(f"  - #{row['id']} {row['title']}: {row['summary']!r}")
    print(f"Jobs nachher: {nachher if not args.dry_run else vorher - len(ausland)}")
    if args.dry_run:
        print("(dry-run: nichts geändert)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
