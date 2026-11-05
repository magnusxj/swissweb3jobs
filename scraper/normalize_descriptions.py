import sqlite3
import urllib.request
import json
import os
import sys
import shutil
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

DB_PATH = Path("data/jobs.db").resolve()
FRONTEND_DB_PATH = Path("frontend/data/jobs.db").resolve()

def normalize_text(company: str, text: str) -> str:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY not found.")
        sys.exit(1)
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key={api_key}"
    
    prompt = f"""Du bist ein B2B-Daten-Normalizer für Schweizer FinTech-Jobs. Nimm den Rohtext und extrahiere ausschliesslich relevante Job-Fakten. Kürze Unternehmens-PR und Auszeichnungen radikal auf 2-3 Kernsätze. Erstelle Markdown mit exakt folgenden H2-Abschnitten:
## About {company}
## About the role
## Responsibilities
## Requirements
## Nice to Have

Verwende für Listen ausnahmslos '• '. Entferne Footer wie 'Send your CV', 'How to apply', Cookie-Hinweise und allgemeine Slogans.

Rohtext:
{text}
"""
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.1
        }
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result['candidates'][0]['content']['parts'][0]['text'].strip()
    except Exception as e:
        print(f"Failed to process job for {company}: {e}")
        return text

def process_job(row):
    job_id, company, summary = row["id"], row["company"], row["summary"]
    if not summary:
        return None
    print(f"Normalizing job ID {job_id} ({company})...")
    new_summary = normalize_text(company, summary)
    return (new_summary, job_id)

def main():
    print(f"Connecting to {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    
    rows = conn.execute("SELECT id, company, summary FROM jobs WHERE status = 'active'").fetchall()
    print(f"Found {len(rows)} active jobs to normalize.")
    
    updates = []
    
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(process_job, r): r for r in rows}
        for future in as_completed(futures):
            res = future.result()
            if res:
                updates.append(res)
    
    # Apply updates
    if updates:
        conn.executemany("UPDATE jobs SET summary = ? WHERE id = ?", updates)
        conn.commit()
    
    print("Database updated. Optimizing...")
    conn.execute("PRAGMA journal_mode = DELETE;")
    conn.execute("VACUUM;")
    conn.commit()
    conn.close()
    
    print(f"Copying database to {FRONTEND_DB_PATH}")
    shutil.copy2(DB_PATH, FRONTEND_DB_PATH)
    print("Done!")

if __name__ == "__main__":
    main()
