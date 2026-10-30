"""
Pipeline-Runner: Scraper (headless, --no-pause) -> Link-Rot-Checker.

Alle Ausgaben landen zusätzlich in data/automation.log.

Aufruf:
    venv\\Scripts\\python.exe scraper\\run_pipeline.py
    venv\\Scripts\\python.exe scraper\\run_pipeline.py --no-pause
"""

import argparse
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PROJEKT_DIR = BASE_DIR.parent
LOG_PATH = PROJEKT_DIR / "data" / "automation.log"

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass


def log(line: str):
    print(line, flush=True)
    try:
        LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with LOG_PATH.open("a", encoding="utf-8") as datei:
            datei.write(line + "\n")
    except Exception as exc:
        print(f"[WARN] Log konnte nicht geschrieben werden: {exc}", file=sys.stderr, flush=True)


def run_step(name: str, skript: Path, args: list[str]) -> bool:
    """Führt ein Skript aus, streamt die Ausgabe ins Log und liefert den Erfolg."""
    if not skript.exists():
        log(f"{datetime.now():%Y-%m-%d %H:%M:%S} | ERROR   | {name}: Datei fehlt: {skript}")
        return False

    log("")
    log(f"{datetime.now():%Y-%m-%d %H:%M:%S} | INFO    | ===== START {name} =====")
    start = datetime.now()

    umgebung = os.environ.copy()
    umgebung["PYTHONIOENCODING"] = "utf-8"
    umgebung["PYTHONUTF8"] = "1"

    try:
        prozess = subprocess.Popen(
            [sys.executable, str(skript), *args],
            cwd=str(BASE_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            bufsize=1,
            env=umgebung,
        )
    except Exception as exc:
        log(f"{datetime.now():%Y-%m-%d %H:%M:%S} | ERROR   | {name} konnte nicht starten: {exc}")
        return False

    try:
        for zeile in prozess.stdout:
            log(zeile.rstrip())
        rueckgabe = prozess.wait()
    except KeyboardInterrupt:
        prozess.terminate()
        try:
            prozess.wait(timeout=10)
        except subprocess.TimeoutExpired:
            prozess.kill()
        raise

    dauer = (datetime.now() - start).total_seconds()
    status = "OK" if rueckgabe == 0 else f"FEHLER (Exit {rueckgabe})"
    log(f"{datetime.now():%Y-%m-%d %H:%M:%S} | INFO    | ===== ENDE {name}: {status} in {dauer:.1f}s =====")
    return rueckgabe == 0


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description="Tägliche Scraping-Pipeline")
    parser.add_argument("--no-pause", action="store_true", help="Am Ende nicht auf Enter warten")
    return parser.parse_args(argv)


def main(argv=None) -> int:
    args = parse_args(argv)

    log("")
    log("#" * 60)
    log(f"# Pipeline-Lauf gestartet: {datetime.now():%Y-%m-%d %H:%M:%S}")
    log(f"# Python: {sys.executable}")
    log("#" * 60)

    ergebnisse = []
    ergebnisse.append(("Scraper", run_step("Scraper", BASE_DIR / "crawler.py", ["--no-pause"])))
    ergebnisse.append(("Link-Checker", run_step("Link-Checker", BASE_DIR / "check_links.py", [])))

    fehlgeschlagen = [name for name, ok in ergebnisse if not ok]
    log("")
    log(
        f"{datetime.now():%Y-%m-%d %H:%M:%S} | INFO    | Pipeline beendet. "
        f"Status: {'OK' if not fehlgeschlagen else 'MIT FEHLERN: ' + ', '.join(fehlgeschlagen)}"
    )

    if not args.no_pause and sys.stdin and sys.stdin.isatty():
        try:
            input("\nPress Enter to exit...")
        except EOFError:
            pass

    return 0 if not fehlgeschlagen else 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        log(f"{datetime.now():%Y-%m-%d %H:%M:%S} | WARN    | Pipeline abgebrochen.")
        sys.exit(130)
