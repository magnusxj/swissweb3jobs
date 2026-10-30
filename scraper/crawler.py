"""
Scraper-Pipeline für Schweizer Web3-/FinTech-Jobs.

Quellen:
    1. SwissDevJobs  - Kategorie Blockchain
    2. Sygnum Bank   - Lever-ATS (mit Fallback auf das Sygnum-Karriereportal,
                       weil jobs.lever.co/sygnum aktuell 404 liefert)

Ausführen (aus dem Ordner scraper/):
    venv\\Scripts\\python.exe crawler.py
    venv\\Scripts\\python.exe crawler.py --headed
    venv\\Scripts\\python.exe crawler.py --source swissdevjobs
"""

import argparse
import asyncio
import json
import os
import random
import re
import sys
import traceback
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urlunsplit

# Eigener Ordner in den Suchpfad, damit "import db" auch von ausserhalb klappt.
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import db  # noqa: E402

try:
    from playwright.async_api import TimeoutError as PlaywrightTimeout
    from playwright.async_api import async_playwright
except ImportError:  # pragma: no cover
    print("Playwright fehlt. Installation: venv\\Scripts\\pip.exe install playwright")
    sys.exit(1)

# Windows-Konsole auf UTF-8 stellen, damit Emojis/Sonderzeichen nicht crashen.
for stream in (sys.stdout, sys.stderr):
    try:
        stream.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)
VIEWPORT = {"width": 1920, "height": 1080}

SWISSDEVJOBS_URL = "https://swissdevjobs.ch/jobs/Blockchain/all"
LEVER_URL = "https://jobs.lever.co/sygnum"
SYGNUM_PORTAL_URL = "https://www.sygnum.com/careers-portal/"

NAV_TIMEOUT_MS = 45_000
SELECTOR_TIMEOUT_MS = 20_000

# ---------------------------------------------------------------------------
# Normalisierung
# ---------------------------------------------------------------------------

# Stadt -> (Anzeigename, Kantonskürzel). Nur Schweizer Orte plus Grenzfälle.
CITY_MAP = {
    "zurich": ("Zürich", "ZH"),
    "zürich": ("Zürich", "ZH"),
    "zuerich": ("Zürich", "ZH"),
    "zug": ("Zug", "ZG"),
    "geneva": ("Genève", "GE"),
    "genève": ("Genève", "GE"),
    "geneve": ("Genève", "GE"),
    "basel": ("Basel", "BS"),
    "bern": ("Bern", "BE"),
    "berne": ("Bern", "BE"),
    "lausanne": ("Lausanne", "VD"),
    "lugano": ("Lugano", "TI"),
    "st-gallen": ("St. Gallen", "SG"),
    "st. gallen": ("St. Gallen", "SG"),
    "saint-gall": ("St. Gallen", "SG"),
    "winterthur": ("Winterthur", "ZH"),
    "baden": ("Baden", "AG"),
    "aarau": ("Aarau", "AG"),
    "luzern": ("Luzern", "LU"),
    "lucerne": ("Luzern", "LU"),
    "chur": ("Chur", "GR"),
    "sion": ("Sion", "VS"),
    "solothurn": ("Solothurn", "SO"),
    "thun": ("Thun", "BE"),
    "biel": ("Biel", "BE"),
    "fribourg": ("Fribourg", "FR"),
    "schaffhausen": ("Schaffhausen", "SH"),
    "olten": ("Olten", "SO"),
    "liechtenstein": ("Liechtenstein", "FL"),
    "vaduz": ("Vaduz", "FL"),
}

# Titel/Text-Hinweise auf Arbeitsmodell.
REMOTE_HINTS = ("remote", "home office", "homeoffice", "telecommute", "fully remote")
HYBRID_HINTS = ("hybrid", "partial home office", "teilweise home office", "partly remote")

# Keyword -> Tag. Reihenfolge = Anzeige-Reihenfolge der Tags.
KEYWORD_TAGS = {
    "Web3": ("web3", "web 3"),
    "Blockchain": ("blockchain", "block chain"),
    "DeFi": ("defi", "decentralized finance", "dezentral"),
    "NFT": ("nft", "non-fungible"),
    "Crypto": ("crypto", "krypto", "cryptocurrenc"),
    "DLT": ("dlt", "distributed ledger"),
    "Digital Assets": ("digital asset", "digital assets", "digitale vermögenswerte"),
    "Solidity": ("solidity",),
    "Ethereum": ("ethereum", "evm"),
    "Smart Contracts": ("smart contract", "smart contracts"),
    "Custody": ("custody", "verwahrung"),
    "Wallet": ("wallet",),
    "Staking": ("staking",),
    "Tokenization": ("tokenization", "tokenisation", "tokenisierung"),
    "FinTech": ("fintech", "fin-tech", "financial technology"),
    "Banking": ("banking", "banking platform", "core banking"),
    "Payments": ("payment", "payments", "zahlungsverkehr"),
    "Trading": ("trading", "market making", "exchange"),
    "Compliance": ("compliance",),
    "AML/KYC": ("aml", "kyc", "anti-money", "money laundering"),
    "Risk": ("risk management", "risk", "risikomanagement"),
    "RegTech": ("regtech", "regulatory"),
    "Wealth": ("wealth management", "private banking"),
    "Data": ("data engineering", "data platform", "data science", "machine learning"),
}

PERCENT_RE = re.compile(r"(\d{2,3})\s*(?:[–\-bis]{1,4}\s*(\d{2,3}))?\s*%", re.IGNORECASE)


def clean_text(value) -> str:
    return " ".join(str(value or "").replace("\xa0", " ").split()).strip()


def strip_html(html: str) -> str:
    text = re.sub(r"(?is)<(script|style).*?</\1>", " ", html or "")
    text = re.sub(r"(?i)<br\s*/?>", " ", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = (
        text.replace("&amp;", "&").replace("&nbsp;", " ").replace("&quot;", '"')
        .replace("&#39;", "'").replace("&apos;", "'").replace("&lt;", "<").replace("&gt;", ">")
    )
    return clean_text(text)


def canonical_url(url: str) -> str:
    """UTM-Parameter entfernen, damit dieselbe Stelle nicht mehrfach landet."""
    parts = urlsplit(url.strip())
    query = ""
    if parts.query:
        relevante = [
            kv for kv in parts.query.split("&")
            if kv and not kv.lower().startswith(("utm_", "source=", "ref=", "fbclid"))
        ]
        query = "&".join(relevante)
    return urlunsplit((parts.scheme, parts.netloc.lower(), parts.path, query, ""))


def normalize_location(raw: str) -> tuple[str, str | None]:
    """Gibt (Ort, Kantonskürzel oder None) zurück."""
    text = clean_text(raw)
    if not text:
        return "Schweiz", None

    if re.search(r"\b(remote|home ?office)\b", text, re.IGNORECASE):
        return "Remote Schweiz", None

    # "Grafenaustrasse 5, Zug" -> letzter Teil; "Zurich, Switzerland" -> erster Teil.
    teile = [clean_text(t) for t in re.split(r"[,;|]", text) if clean_text(t)]
    kandidaten = [t for t in teile if t.lower() != "switzerland" and t.lower() != "schweiz"] or teile

    for teil in kandidaten:
        key = teil.lower().strip()
        if key in CITY_MAP:
            return CITY_MAP[key]
        # "8001 Zürich" oder "Zug ZG"
        for stadt, (anzeige, kanton) in CITY_MAP.items():
            if re.search(rf"\b{re.escape(stadt)}\b", key):
                return anzeige, kanton

    ort = kandidaten[0]
    return ort, None


def normalize_percent(*texte: str) -> str:
    """Ermittelt das Pensum aus Titel/Beschreibung. Default: 100%."""
    for text in texte:
        if not text:
            continue
        treffer = PERCENT_RE.search(text)
        if not treffer:
            continue
        von = int(treffer.group(1))
        bis = int(treffer.group(2)) if treffer.group(2) else None
        if not 10 <= von <= 100:
            continue
        if bis and 10 <= bis <= 100 and bis != von:
            return f"{von}-{bis}%"
        return f"{von}%"
    return "100%"


def normalize_workplace(*texte: str) -> str:
    zusammen = " ".join(clean_text(t).lower() for t in texte if t)
    if any(h in zusammen for h in HYBRID_HINTS):
        return "Hybrid"
    if any(h in zusammen for h in REMOTE_HINTS):
        return "Remote"
    return "On-site"


def derive_tags(*, titel: str, beschreibung: str, extra: list[str] | None = None,
                kanton: str | None = None) -> str:
    """Kombiniert Quell-Tags, Keyword-Tags und Kantonskürzel, ohne Duplikate."""
    tags: list[str] = []

    def add(tag: str):
        tag = clean_text(tag)
        if tag and tag.lower() not in {t.lower() for t in tags}:
            tags.append(tag)

    for tag in extra or []:
        add(tag)

    haystack = f"{titel} {beschreibung[:6000]}".lower()
    for tag, keywords in KEYWORD_TAGS.items():
        if any(kw in haystack for kw in keywords):
            add(tag)

    if kanton:
        add(kanton)

    return ", ".join(tags)


def make_job(**kwargs) -> dict:
    return {
        "title": clean_text(kwargs.get("title")),
        "company": clean_text(kwargs.get("company")),
        "location": clean_text(kwargs.get("location")),
        "workplace_type": kwargs.get("workplace_type") or "On-site",
        "employment_type": kwargs.get("employment_type") or "100%",
        "tags": kwargs.get("tags") or "",
        "summary": None,
        "source_url": canonical_url(kwargs.get("source_url", "")),
        "apply_url": kwargs.get("apply_url") or kwargs.get("source_url"),
        "source_site": kwargs.get("source_site"),
        "status": "active",
        "posted_at": kwargs.get("posted_at"),
    }


# ---------------------------------------------------------------------------
# Playwright-Helfer
# ---------------------------------------------------------------------------

def log(nachricht: str):
    print(f"[{datetime.now():%H:%M:%S}] {nachricht}", flush=True)


async def pause(a: float = 1.2, b: float = 2.5):
    await asyncio.sleep(random.uniform(a, b))


async def goto(page, url: str, retries: int = 2) -> bool:
    """Robustes Navigieren: domcontentloaded statt networkidle."""
    for versuch in range(1, retries + 1):
        try:
            antwort = await page.goto(url, wait_until="domcontentloaded", timeout=NAV_TIMEOUT_MS)
            if antwort is None:
                return True
            if antwort.status >= 400:
                log(f"  HTTP {antwort.status}: {url}")
                return False
            return True
        except PlaywrightTimeout:
            log(f"  Timeout beim Laden (Versuch {versuch}/{retries}): {url}")
        except Exception as exc:
            log(f"  Ladefehler (Versuch {versuch}/{retries}): {type(exc).__name__}: {exc}")
        if versuch < retries:
            await asyncio.sleep(1.5 * versuch)
    return False


async def dismiss_cookies(page):
    """Klickt gängige Cookie-Banner weg; Fehler werden bewusst ignoriert."""
    selektoren = [
        "#onetrust-accept-btn-handler",
        "button#onetrust-accept-btn-handler",
        "button:has-text('Accept all')",
        "button:has-text('Alle akzeptieren')",
        "button:has-text('Accept All')",
        "button:has-text('Akzeptieren')",
        "button:has-text('I agree')",
        "a:has-text('Accept all')",
    ]
    for selektor in selektoren:
        try:
            element = page.locator(selektor).first
            if await element.count() and await element.is_visible(timeout=1000):
                await element.click(timeout=2500)
                log("  Cookie-Banner akzeptiert.")
                await asyncio.sleep(0.8)
                return
        except Exception:
            continue


async def read_jobposting(page) -> dict | None:
    """Liest das schema.org-JobPosting aus den JSON-LD-Blöcken."""
    try:
        bloecke = await page.eval_on_selector_all(
            'script[type="application/ld+json"]', "els => els.map(e => e.textContent)"
        )
    except Exception:
        return None

    for block in bloecke:
        try:
            daten = json.loads(block)
        except (json.JSONDecodeError, TypeError):
            continue

        stapel = daten if isinstance(daten, list) else [daten]
        while stapel:
            eintrag = stapel.pop(0)
            if not isinstance(eintrag, dict):
                continue
            if eintrag.get("@type") == "JobPosting":
                return eintrag
            if isinstance(eintrag.get("@graph"), list):
                stapel.extend(eintrag["@graph"])
    return None


async def read_apply_url(page, fallback: str) -> str:
    for selektor in ("#applybtn a[href]", "a[aria-label='apply button']", "a.job-apply-button"):
        try:
            href = await page.locator(selektor).first.get_attribute("href", timeout=2000)
            if href:
                return urljoin(page.url, href)
        except Exception:
            continue
    return fallback


# ---------------------------------------------------------------------------
# Quelle 1: SwissDevJobs
# ---------------------------------------------------------------------------

CARD_JS = """
els => els.map(card => {
    const link = card.querySelector('a[href^="/jobs/"]');
    if (!link) return null;
    const titleAttr = link.getAttribute('title') || '';
    if (!/\\bjob in\\b/i.test(titleAttr)) return null;
    const text = sel => {
        const el = card.querySelector(sel);
        return el ? el.textContent.replace(/\\s+/g, ' ').trim() : '';
    };
    const tags = Array.from(card.querySelectorAll('a[href^="/jobs/"]'))
        .filter(a => a !== link && a.href !== link.href)
        .filter(a => /\\/all\\/?$/i.test(a.getAttribute('href') || ''))
        .map(a => (a.textContent || '').replace(/\\s+/g, ' ').trim())
        .filter(t => t && t.length < 40);
    return {
        url: link.getAttribute('href'),
        listing_title: titleAttr.replace(/\\s+job in\\s+.*$/i, '').trim(),
        company: text('[aria-label="hiring organization"]'),
        address: text('[aria-label="hiring organization address"]'),
        tags: tags
    };
}).filter(Boolean)
"""


async def scrape_swissdevjobs(page, stats: dict) -> list[dict]:
    log(f"SwissDevJobs: {SWISSDEVJOBS_URL}")
    if not await goto(page, SWISSDEVJOBS_URL):
        stats["fehler"] += 1
        return []

    await dismiss_cookies(page)

    try:
        await page.wait_for_selector('article a[href^="/jobs/"]', timeout=SELECTOR_TIMEOUT_MS)
    except PlaywrightTimeout:
        log("  Keine Job-Karten gefunden (Selektor-Timeout).")
        stats["fehler"] += 1
        return []

    # Lazy/Virtualisierte Liste nachladen.
    for _ in range(8):
        await page.mouse.wheel(0, 1600)
        await asyncio.sleep(random.uniform(0.35, 0.7))
    await page.mouse.wheel(0, -20000)
    await asyncio.sleep(0.5)

    karten = await page.eval_on_selector_all('li[role="listitem"] article, article', CARD_JS)
    # Nach URL deduplizieren, Reihenfolge beibehalten.
    gesehen, eindeutig = set(), []
    for karte in karten:
        url = canonical_url(urljoin(SWISSDEVJOBS_URL, karte["url"]))
        if url in gesehen:
            continue
        gesehen.add(url)
        karte["url"] = url
        eindeutig.append(karte)

    log(f"  {len(eindeutig)} Inserate in der Liste gefunden.")
    jobs: list[dict] = []

    for index, karte in enumerate(eindeutig, start=1):
        try:
            if not await goto(page, karte["url"], retries=2):
                stats["fehler"] += 1
                continue
            await dismiss_cookies(page)
            # Detailseite hydratisiert die JSON-LD-Daten teils erst nach DOMContentLoaded.
            posting = None
            for _ in range(6):
                posting = await read_jobposting(page)
                if posting:
                    break
                await asyncio.sleep(0.6)
            posting = posting or {}
            beschreibung = strip_html(posting.get("description", ""))
            applying = await read_apply_url(page, karte["url"])

            titel = clean_text(karte.get("listing_title")) or clean_text(posting.get("title"))
            firma = clean_text(karte.get("company"))
            if not firma:
                organisation = posting.get("hiringOrganization") or {}
                firma = clean_text(organisation.get("name") if isinstance(organisation, dict) else organisation)

            ort, kanton = normalize_location(karte.get("address") or "")
            if not karte.get("address"):
                orte = posting.get("jobLocation") or []
                if isinstance(orte, dict):
                    orte = [orte]
                if orte:
                    adresse = (orte[0] or {}).get("address") or {}
                    ort, kanton = normalize_location(
                        " ".join(filter(None, [
                            adresse.get("addressLocality"),
                            adresse.get("addressRegion"),
                            adresse.get("addressCountry"),
                        ]))
                    )

            # Pensum: Titel zuerst, dann Beschreibung.
            pensum = normalize_percent(titel, beschreibung[:2000])
            arbeitsmodell = normalize_workplace(
                karte.get("address", ""), titel, beschreibung[:2000],
                str(posting.get("jobLocationType", "")),
            )

            job = make_job(
                title=titel,
                company=firma,
                location=ort,
                workplace_type=arbeitsmodell,
                employment_type=pensum,
                tags=derive_tags(
                    titel=titel, beschreibung=beschreibung,
                    extra=karte.get("tags"), kanton=kanton,
                ),
                source_url=karte["url"],
                apply_url=applying,
                source_site="SwissDevJobs",
                posted_at=posting.get("datePosted"),
            )
            jobs.append(job)
            log(f"  [{index}/{len(eindeutig)}] {job['title']} – {job['company']} ({job['location']})")
            await pause()
        except Exception as exc:
            stats["fehler"] += 1
            log(f"  [{index}/{len(eindeutig)}] Fehler bei {karte.get('url')}: {type(exc).__name__}: {exc}")

    return jobs


# ---------------------------------------------------------------------------
# Quelle 2: Sygnum Bank (Lever mit Portal-Fallback)
# ---------------------------------------------------------------------------

LEVER_JS = """
els => els.map(p => {
    const link = p.querySelector('a.posting-title, a[href*="jobs.lever.co"]');
    const text = sel => {
        const el = p.querySelector(sel);
        return el ? el.textContent.replace(/\\s+/g, ' ').trim() : '';
    };
    return {
        url: link ? link.href : '',
        title: text('.posting-title h5') || (link ? link.textContent.trim() : ''),
        location: text('.location'),
        workplace: text('.workplaceTypes'),
        team: text('.team'),
        commitment: text('.commitment')
    };
}).filter(x => x.url && x.title)
"""

SYGNUM_JS = """
els => els.map(li => {
    const link = li.querySelector('.result-item__title a[href]');
    if (!link) return null;
    const text = sel => {
        const el = li.querySelector(sel);
        return el ? el.textContent.replace(/\\s+/g, ' ').trim() : '';
    };
    return {
        url: link.href,
        title: text('.result-item__title'),
        workplace: text('.result-item__work-type'),
        location: text('.result-item__location'),
        department: text('.result-item__department'),
        role_type: text('.result-item__role-type')
    };
}).filter(Boolean)
"""


async def scrape_sygnum(page, stats: dict) -> list[dict]:
    jobs: list[dict] = []

    # 2a. Lever-ATS, wie im Auftrag vorgegeben.
    log(f"Sygnum Bank: {LEVER_URL}")
    if await goto(page, LEVER_URL, retries=1):
        try:
            await page.wait_for_selector("div.posting", timeout=8000)
        except PlaywrightTimeout:
            pass
        eintraege = await page.eval_on_selector_all("div.posting", LEVER_JS)
        if eintraege:
            log(f"  {len(eintraege)} Inserate über Lever gefunden.")
            for eintrag in eintraege:
                try:
                    ort, kanton = normalize_location(eintrag.get("location"))
                    job = make_job(
                        title=eintrag["title"],
                        company="Sygnum Bank",
                        location=ort,
                        workplace_type=normalize_workplace(eintrag.get("workplace", "")),
                        employment_type=normalize_percent(eintrag["title"]),
                        tags=derive_tags(
                            titel=f"{eintrag['title']} {eintrag.get('team', '')}",
                            beschreibung="", extra=[eintrag.get("team", "")], kanton=kanton,
                        ),
                        source_url=canonical_url(eintrag["url"]),
                        apply_url=eintrag["url"],
                        source_site="Sygnum Bank",
                    )
                    jobs.append(job)
                    log(f"  {job['title']} – {job['location']}")
                except Exception as exc:
                    stats["fehler"] += 1
                    log(f"  Fehler bei Lever-Eintrag: {type(exc).__name__}: {exc}")
            return jobs

    # 2b. Fallback: offizielles Sygnum-Karriereportal (Salesforce-Recruit).
    log(f"  Lever nicht verfügbar, Fallback: {SYGNUM_PORTAL_URL}")
    if not await goto(page, SYGNUM_PORTAL_URL):
        stats["fehler"] += 1
        return jobs

    await dismiss_cookies(page)
    try:
        await page.wait_for_selector("li.result-item", timeout=SELECTOR_TIMEOUT_MS)
    except PlaywrightTimeout:
        log("  Keine Stellen im Sygnum-Portal gefunden.")
        stats["fehler"] += 1
        return jobs

    for _ in range(5):
        await page.mouse.wheel(0, 1600)
        await asyncio.sleep(random.uniform(0.3, 0.6))

    eintraege = await page.eval_on_selector_all("li.result-item", SYGNUM_JS)
    log(f"  {len(eintraege)} Inserate im Sygnum-Portal gefunden.")

    for eintrag in eintraege:
        try:
            ort, kanton = normalize_location(eintrag.get("location"))
            beschreibung = clean_text(
                f"{eintrag.get('department', '')} {eintrag.get('role_type', '')}"
            )
            job = make_job(
                title=eintrag["title"],
                company="Sygnum Bank",
                location=ort,
                workplace_type=normalize_workplace(eintrag.get("workplace", "")),
                employment_type=normalize_percent(eintrag["title"]),
                tags=derive_tags(
                    titel=eintrag["title"], beschreibung=beschreibung,
                    extra=[eintrag.get("department", "")],
                    kanton=kanton,
                ),
                source_url=canonical_url(eintrag["url"]),
                apply_url=eintrag["url"],
                source_site="Sygnum Bank",
            )
            jobs.append(job)
            log(f"  {job['title']} – {job['location']}")
        except Exception as exc:
            stats["fehler"] += 1
            log(f"  Fehler bei Sygnum-Eintrag: {type(exc).__name__}: {exc}")

    return jobs


# ---------------------------------------------------------------------------
# Orchestrierung
# ---------------------------------------------------------------------------

async def run_pipeline(headless: bool, quellen: set[str]) -> tuple[int, int, int]:
    stats = {"neu": 0, "duplikate": 0, "fehler": 0, "gefunden": 0}

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            headless=headless,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
        )
        context = await browser.new_context(
            viewport=VIEWPORT,
            user_agent=USER_AGENT,
            locale="de-CH",
            timezone_id="Europe/Zurich",
            extra_http_headers={"Accept-Language": "de-CH,de;q=0.9,en;q=0.8"},
        )
        context.set_default_timeout(30_000)
        context.set_default_navigation_timeout(NAV_TIMEOUT_MS)
        page = await context.new_page()

        # Tracking-/Ad-Ressourcen blocken: schneller und weniger Timeouts.
        async def route_filter(route):
            if route.request.resource_type in {"image", "media", "font"}:
                await route.abort()
            else:
                await route.continue_()

        await page.route("**/*", route_filter)

        try:
            if "swissdevjobs" in quellen:
                jobs = await scrape_swissdevjobs(page, stats)
                stats["gefunden"] += len(jobs)
                await persist(jobs, stats)
                log(f"SwissDevJobs fertig: {len(jobs)} Jobs verarbeitet.\n")

            if "sygnum" in quellen:
                jobs = await scrape_sygnum(page, stats)
                stats["gefunden"] += len(jobs)
                await persist(jobs, stats)
                log(f"Sygnum fertig: {len(jobs)} Jobs verarbeitet.\n")
        finally:
            await context.close()
            await browser.close()

    return stats["neu"], stats["duplikate"], stats["fehler"]


async def persist(jobs: list[dict], stats: dict):
    """Schreibt Jobs einzeln und zählt neu vs. Duplikat."""
    for job in jobs:
        try:
            if db.insert_job(job):
                stats["neu"] += 1
            else:
                stats["duplikate"] += 1
        except Exception as exc:
            stats["fehler"] += 1
            log(f"  DB-Fehler bei {job.get('source_url')}: {type(exc).__name__}: {exc}")


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description="Schweizer Web3-/FinTech-Job-Scraper")
    parser.add_argument("--headed", action="store_true", help="Browser sichtbar starten")
    parser.add_argument(
        "--source",
        choices=["all", "swissdevjobs", "sygnum"],
        default="all",
        help="Nur eine Quelle scrapen (Default: all)",
    )
    parser.add_argument(
        "--no-pause", action="store_true", help="Am Ende nicht auf Enter warten (für Automatisierung)"
    )
    return parser.parse_args(argv)


def main(argv=None) -> int:
    args = parse_args(argv)
    quellen = {"swissdevjobs", "sygnum"} if args.source == "all" else {args.source}

    log("Starte Scraping-Pipeline.")
    db.init_db()

    try:
        neu, duplikate, fehler = asyncio.run(run_pipeline(headless=not args.headed, quellen=quellen))
    except KeyboardInterrupt:
        log("Abbruch durch Benutzer.")
        return 130
    except Exception:
        log("Pipeline abgebrochen:")
        traceback.print_exc()
        return 1

    print()
    log("=" * 52)
    log(f"Ergebnis: {neu} neue Jobs gespeichert, {duplikate} Duplikate ignoriert, {fehler} Fehler.")
    log(f"Datenbank: {db.DB_PATH} (Total: {db.count_jobs('active')} aktive Jobs)")
    log("=" * 52)

    if not args.no_pause:
        try:
            input("\nPress Enter to exit...")
        except EOFError:
            pass

    return 0 if (neu + duplikate) > 0 or fehler == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
