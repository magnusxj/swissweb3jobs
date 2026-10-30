"""
Link-Rot-Checker für data/jobs.db.

Prüft alle aktiven Jobs per HTTP-HEAD (Fallback: GET) und archiviert
Jobs, deren Quelle oder Bewerbungslink mit 404/410 antwortet.
Temporäre Fehler (Timeout, 5xx, 403) ändern den Status nicht.

Log: data/automation.log
"""

import logging
import sys
import time
from pathlib import Path

import requests

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import db  # noqa: E402

LOG_PATH = Path(__file__).resolve().parent.parent / "data" / "automation.log"
TIMEOUT = 10
DEAD_CODES = {404, 410}
GET_FALLBACK_CODES = {400, 403, 405, 406, 429, 500, 501, 503}
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "de-CH,de;q=0.9,en;q=0.8",
}


def setup_logging() -> logging.Logger:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    logger = logging.getLogger("link_checker")
    logger.setLevel(logging.INFO)
    logger.handlers.clear()
    logger.propagate = False

    formatter = logging.Formatter("%(asctime)s | %(levelname)-7s | %(message)s", "%Y-%m-%d %H:%M:%S")

    datei = logging.FileHandler(LOG_PATH, encoding="utf-8")
    datei.setFormatter(formatter)
    logger.addHandler(datei)

    konsole = logging.StreamHandler(sys.stdout)
    konsole.setFormatter(formatter)
    logger.addHandler(konsole)

    return logger


def check_url(session: requests.Session, url: str) -> tuple[str, int | str]:
    """
    Rückgabe: (zustand, detail)
        "ok"        -> erreichbar
        "dead"      -> 404/410
        "temporary" -> Timeout, 5xx, blockiert, Netzwerkfehler
    """
    if not url or not url.startswith(("http://", "https://")):
        return "dead", "ungültige URL"

    try:
        antwort = session.head(url, allow_redirects=True, timeout=TIMEOUT)
        code = antwort.status_code
        antwort.close()

        if code in DEAD_CODES:
            return "dead", code
        if code in GET_FALLBACK_CODES or code >= 500:
            # Manche Server blocken HEAD oder liefern Unsinn -> GET versuchen.
            antwort = session.get(url, allow_redirects=True, timeout=TIMEOUT, stream=True)
            code = antwort.status_code
            antwort.close()
            if code in DEAD_CODES:
                return "dead", code
            if code >= 500:
                return "temporary", code
            return "ok", code
        if 200 <= code < 400:
            return "ok", code
        # 401, 407, 409, 418 ... -> nicht als tot werten.
        return "temporary", code
    except requests.Timeout:
        return "temporary", "Timeout"
    except requests.RequestException as exc:
        return "temporary", type(exc).__name__


def archive_job(job_id: int, grund: str, log: logging.Logger) -> bool:
    try:
        with db.get_connection() as conn:
            cursor = conn.execute(
                "UPDATE jobs SET status = 'archived' WHERE id = ? AND status = 'active'",
                (job_id,),
            )
            geaendert = cursor.rowcount > 0
        if geaendert:
            log.info("  -> archiviert (id=%s): %s", job_id, grund)
        return geaendert
    except Exception as exc:
        log.error("  -> DB-Fehler beim Archivieren (id=%s): %s", job_id, exc)
        return False


def run() -> int:
    log = setup_logging()
    log.info("=" * 60)
    log.info("Link-Rot-Checker gestartet. DB: %s", db.DB_PATH)

    stats = {"geprueft": 0, "archiviert": 0, "temporaer": 0, "fehler": 0}

    try:
        with db.get_connection() as conn:
            jobs = conn.execute(
                "SELECT id, title, company, source_url, apply_url "
                "FROM jobs WHERE status = 'active' ORDER BY id"
            ).fetchall()
    except Exception as exc:
        log.exception("Datenbank konnte nicht gelesen werden: %s", exc)
        return 1

    log.info("%d aktive Jobs gefunden.", len(jobs))

    with requests.Session() as session:
        session.headers.update(HEADERS)

        for job in jobs:
            stats["geprueft"] += 1
            titel = f"{job['title']} ({job['company']})"

            try:
                urls = [("source_url", job["source_url"])]
                if job["apply_url"] and job["apply_url"] != job["source_url"]:
                    urls.append(("apply_url", job["apply_url"]))

                toter_treffer = None
                for feld, url in urls:
                    zustand, detail = check_url(session, url)
                    if zustand == "dead":
                        toter_treffer = (feld, url, detail)
                        break
                    if zustand == "temporary":
                        stats["temporaer"] += 1
                        log.warning("  temporär (%s, %s): %s", feld, detail, url)
                    time.sleep(0.3)

                if toter_treffer:
                    feld, url, code = toter_treffer
                    log.info("TOT [%s] %s -> HTTP %s | %s", feld, titel, code, url)
                    if archive_job(job["id"], f"HTTP {code} auf {feld}", log):
                        stats["archiviert"] += 1
                else:
                    log.info("OK   %s", titel)
            except Exception as exc:
                stats["fehler"] += 1
                log.exception("Unerwarteter Fehler bei %s: %s", titel, exc)

    log.info(
        "Fertig: %d geprüft, %d archiviert, %d temporäre Fehler, %d Ausnahmen.",
        stats["geprueft"], stats["archiviert"], stats["temporaer"], stats["fehler"],
    )
    log.info("=" * 60)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(run())
    except KeyboardInterrupt:
        print("\nAbgebrochen.")
        sys.exit(130)
