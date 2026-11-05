"""
Scraper-Pipeline für Schweizer Web3-/FinTech-Jobs.

Quellen:
    1. SwissDevJobs  - Kategorie Blockchain (ohne Firmen mit eigener ATS-Quelle)
    2. Sygnum Bank   - Lever-ATS (mit Fallback auf das Sygnum-Karriereportal,
                       weil jobs.lever.co/sygnum aktuell 404 liefert)
    3. Personio      - AMINA Bank, Cardano Foundation, Lisk
    4. Workable      - Crypto Finance AG, Web3 Foundation, Aleph Zero Foundation
    5. join.com      - Taurus SA
    6. SmartRecruiters - Swissquote (nur Krypto-/Blockchain-Rollen)
    7. onlyfy        - Bitcoin Suisse (nur CH-Standorte)
    8. Greenhouse    - DFINITY Foundation, Dialectic
    9. Lever         - Safe, SwissBorg
   10. YouHodler     - eigene Webflow-Karriereseite
   11. Obligate      - kein öffentlicher ATS-Jobfeed (LinkedIn)

Ausführen (aus dem Ordner scraper/):
    venv\\Scripts\\python.exe crawler.py
    venv\\Scripts\\python.exe crawler.py --headed
    venv\\Scripts\\python.exe crawler.py --source swissdevjobs
"""

import argparse
import asyncio
import json
import random
import re
import ssl
import sys
import traceback
import urllib.error
import urllib.request
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urlunsplit

# Eigener Ordner in den Suchpfad, damit "import db" auch von ausserhalb klappt.
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import db  # noqa: E402
from geo import is_bare_remote, is_swiss_location, normalize_location  # noqa: E402

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

# Mindestlänge, damit ein Text als echte Beschreibung gilt. Es gibt bewusst
# KEIN Maximum mehr: Beschreibungen werden vollständig gespeichert.
SUMMARY_MIN_CHARS = 80


def clean_text(value) -> str:
    text = str(value or "").replace("\xa0", " ").replace("\ufffd", "'")
    return " ".join(text.split()).strip()


# Blöcke, die im Text eine Absatzgrenze erzeugen.
_BLOCK_TAGS = (
    "p|div|section|article|header|footer|main|aside|tr|table|thead|tbody|"
    "ul|ol|dl|dt|dd|blockquote|figure|figcaption|form|fieldset|address|h[1-6]"
)


def html_to_text(html: str) -> str:
    """
    HTML -> Plain Text mit erhaltener Struktur:
    - <br>, Absätze und Block-Elemente werden zu Zeilenumbrüchen
    - <li> wird zu "• "
    - Tabellenzellen werden mit " | " getrennt
    - Überschriften bleiben als eigene Zeile stehen

    So erkennt das Frontend Abschnitte wie "Responsibilities" und Listen.
    """
    text = re.sub(r"(?is)<(script|style|noscript|svg|template).*?</\1>", " ", html or "")
    text = re.sub(r"(?is)<!--.*?-->", " ", text)

    text = re.sub(r"(?i)<br\s*/?>", "\n", text)
    text = re.sub(rf"(?i)<(?:{_BLOCK_TAGS})(?:\s[^>]*)?>", "\n\n", text)
    text = re.sub(rf"(?i)</(?:{_BLOCK_TAGS})\s*>", "\n\n", text)
    text = re.sub(r"(?i)<li(?:\s[^>]*)?>", "\n• ", text)
    text = re.sub(r"(?i)</li\s*>", "\n", text)
    text = re.sub(r"(?i)</t[dh]\s*>", " | ", text)
    text = re.sub(r"<[^>]+>", " ", text)

    from html import unescape

    text = unescape(text).replace("\r\n", "\n").replace("\r", "\n").replace("\ufffd", "'")
    # Zero-Width-Zeichen (z. B. aus Webflow) entfernen.
    text = re.sub(r"[\u200b\u200c\u200d\ufeff]", "", text)

    zeilen: list[str] = []
    for roh in text.split("\n"):
        zeile = " ".join(roh.replace("\xa0", " ").split())
        if not zeile:
            # Mehr als eine Leerzeile bringt nichts.
            if zeilen and zeilen[-1] != "":
                zeilen.append("")
            continue
        zeilen.append(zeile)

    return "\n".join(zeilen).strip()


def strip_html(html: str) -> str:
    """HTML -> strukturierter Plain Text (Absätze, Aufzählungen, Überschriften)."""
    return html_to_text(html)


def clean_summary(text: str, limit: int | None = None) -> str | None:
    """
    Säubert die Stellenbeschreibung für die DB: HTML weg, Whitespace pro Zeile
    normalisieren, Bewerbungs-Floskeln entfernen. Standardmässig wird NICHT
    gekürzt – die vollständige Beschreibung bleibt erhalten. `limit` nur
    setzen, wenn wirklich gekürzt werden soll.

    Zu kurze Texte (Cookie-/Menü-Reste) -> None.
    """
    sauber = strip_html(text or "")
    sauber = re.sub(
        r"(?i)\b(jetzt bewerben|apply now|apply for this job|apply for this position|"
        r"zurück zur übersicht|back to overview)\b",
        " ",
        sauber,
    )

    zeilen: list[str] = []
    for roh in sauber.split("\n"):
        zeile = " ".join(roh.split())
        if not zeile:
            if zeilen and zeilen[-1] != "":
                zeilen.append("")
            continue
        zeilen.append(zeile)

    sauber = "\n".join(zeilen).strip()
    # Satzzeichen sauber an den Text binden, aber Zeilenumbrüche behalten.
    sauber = re.sub(r"[ \t]*([,;:.!?])[ \t]*", r"\1 ", sauber)
    sauber = re.sub(r"[ \t]+\n", "\n", sauber).strip()

    if len(clean_text(sauber)) < SUMMARY_MIN_CHARS:
        return None

    if limit is not None and len(sauber) > limit:
        cut = sauber[:limit]
        grenze = max(cut.rfind(". "), cut.rfind("! "), cut.rfind("? "), cut.rfind("; "))
        if grenze >= limit * 0.4:
            cut = cut[: grenze + 1]
        sauber = cut.rstrip(" ,;:-–") + " …"

    return sauber


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


# ---------------------------------------------------------------------------
# HTTP-Helfer (ATS-APIs ohne Browser)
# ---------------------------------------------------------------------------

HTTP_TIMEOUT = 30
_SSL_CONTEXT = ssl.create_default_context()


def http_get(url: str, timeout: int = HTTP_TIMEOUT, retries: int = 2) -> str:
    """GET mit Retries, Browser-UA und ohne Cookie-/Tracking-Ballast."""
    letzter_fehler: Exception | None = None
    for versuch in range(1, retries + 1):
        try:
            request = urllib.request.Request(
                url,
                headers={
                    "User-Agent": USER_AGENT,
                    "Accept": "text/html,application/json,*/*",
                    "Accept-Language": "de-CH,de;q=0.9,en;q=0.8",
                },
            )
            with urllib.request.urlopen(
                request, timeout=timeout, context=_SSL_CONTEXT
            ) as antwort:
                return antwort.read().decode("utf-8", "replace")
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            letzter_fehler = exc
            if versuch < retries:
                continue
    raise RuntimeError(f"HTTP-Fehler bei {url}: {letzter_fehler}")


def http_get_json(url: str) -> dict | list:
    return json.loads(http_get(url))


def json_ld_jobposting(html: str) -> dict | None:
    """Liest das erste schema.org-JobPosting aus einer Detailseite."""
    for block in re.findall(
        r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>', html, re.S | re.I
    ):
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


def location_from_postal(address: dict) -> str:
    """Baut aus schema.org PostalAddress einen lesbaren Standort."""
    if not isinstance(address, dict):
        return ""
    teile = [
        clean_text(address.get("addressLocality")),
        clean_text(address.get("addressRegion")),
        clean_text(address.get("addressCountry")),
    ]
    return ", ".join(teil for teil in teile if teil)


def swiss_location(raw: str, fallback: str = "") -> tuple[str, str | None]:
    """Whitelist-Filter ohne Liechtenstein (Auftrag: nur Schweiz)."""
    ort, kanton = normalize_location(raw)
    if not ort or kanton == "FL":
        return "", None
    return ort, kanton


def iso_date(value) -> str | None:
    text = clean_text(value)
    if not text:
        return None
    treffer = re.match(r"(\d{4}-\d{2}-\d{2})", text)
    return treffer.group(1) if treffer else None



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
        "summary": clean_summary(kwargs.get("summary") or ""),
        "source_url": canonical_url(kwargs.get("source_url", "")),
        "apply_url": kwargs.get("apply_url") or kwargs.get("source_url"),
        "source_site": kwargs.get("source_site"),
        "status": "active",
        "posted_at": kwargs.get("posted_at"),
        "dedupe_extra": clean_text(kwargs.get("dedupe_extra")),
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


async def resolve_apply_href(page, href: str) -> str:
    """Löst ATS-Kurzlinks (z. B. grnh.se) auf die konkrete Stellen-URL auf.

    Abgelaufene Kurzlinks landen auf der Board-Wurzel mit ``?error=true`` –
    solche Links geben wir unverändert zurück; das Frontend fällt dann auf die
    Karriereseite der Firma zurück.
    """
    if not urlsplit(href).hostname or not urlsplit(href).hostname.endswith("grnh.se"):
        return href

    try:
        response = await page.request.get(href, max_redirects=5, timeout=10_000)
        final = response.url
        path = urlsplit(final).path
        if (
            final
            and "error=true" not in final
            and not re.match(r"/[^/]+/?$", path)
        ):
            return final
    except Exception:
        pass

    return href


async def read_apply_url(page, fallback: str) -> str:
    for selektor in ("#applybtn a[href]", "a[aria-label='apply button']", "a.job-apply-button"):
        try:
            href = await page.locator(selektor).first.get_attribute("href", timeout=2000)
            if href:
                return await resolve_apply_href(page, urljoin(page.url, href))
        except Exception:
            continue
    return fallback


# Textbausteine, die keine echte Stellenbeschreibung sind (Portal-Rahmen,
# Salesforce-Platzhalter, reine Titelzeilen).
JUNK_DESCRIPTION_MARKERS = (
    "applicant portal",
    "full details of the job",
    "this is a generic vacancy template",
    "job details:",
)

# Erst ab dieser Länge gilt ein Text als echte Beschreibung (Thin Content).
MIN_REAL_DESCRIPTION = 200

# Salesforce-Recruiting-Portale (z. B. Sygnum) liefern die Beschreibung als
# Label-/Wert-Tabelle. Nur rollenspezifische Labels übernehmen.
SALESFORCE_DETAIL_JS = """
root => {
    const out = [];
    for (const row of root.querySelectorAll('tr')) {
        const th = row.querySelector('th');
        const td = row.querySelector('td');
        if (!th || !td) continue;
        const label = th.textContent.replace(/\\s+/g, ' ').trim();
        const value = td.innerText.replace(/\\s+/g, ' ').trim();
        if (value) out.push([label, value]);
    }
    return out;
}
"""

ROLE_DETAIL_LABELS = {
    "about the role",
    "your main responsibilities",
    "key responsibilities",
    "our ideal candidate",
    "what will make you stand out",
    "your profile",
    "requirements",
    "our offer",
}


def is_junk_description(text: str) -> bool:
    """True, wenn der Text nur Portal-Rahmen oder ein Platzhalter ist."""
    klein = clean_text(text).lower()
    if len(klein) < SUMMARY_MIN_CHARS:
        return True
    return any(marker in klein for marker in JUNK_DESCRIPTION_MARKERS)


def is_real_description(text: str) -> bool:
    """Echte Beschreibung: kein Platzhalter und lang genug gegen Thin Content."""
    return not is_junk_description(text) and len(clean_text(text)) >= MIN_REAL_DESCRIPTION


async def read_description(page) -> str:
    """Liest die echte Stellenbeschreibung: JSON-LD, Salesforce-Tabelle, Inhalt."""
    posting = await read_jobposting(page)
    if posting:
        teile = []
        for feld in ("responsibilities", "description", "jobBenefits"):
            wert = posting.get(feld)
            if isinstance(wert, str):
                sauber = strip_html(wert)
                if not is_junk_description(sauber):
                    teile.append(sauber)
        text = "\n\n".join(teile)
        if is_real_description(text):
            return text

    # Salesforce-Recruiting-Portal: Label-/Wert-Paare der Detail-Tabelle.
    for selektor in ("table.detailList", "div.pbBody table"):
        try:
            zeilen = await page.locator(selektor).first.evaluate(SALESFORCE_DETAIL_JS)
        except Exception:
            continue
        teile = [
            f"{label}: {value}"
            for label, value in zeilen
            if label.lower().strip() in ROLE_DETAIL_LABELS and len(value) > 40
        ]
        text = "\n\n".join(teile)
        if is_real_description(text):
            return text

    for selektor in (
        "article[class*='job']",
        "div.content",
        "div.content-wrapper",
        "section[data-qa='job-description']",
        "div.job-description",
        "div[class*='jobdescription']",
        "article",
        "main",
    ):
        try:
            text = await page.locator(selektor).first.inner_text(timeout=2000)
        except Exception:
            continue
        if is_real_description(text):
            return text
    return ""


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

            if firma and firma.strip().lower() in SWISSDEVJOBS_EXCLUDED:
                log(f"  übersprungen (direkte ATS-Quelle vorhanden): {firma} – {titel}")
                continue

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

            # Strikte Geo-Whitelist: alles ausserhalb CH/FL fliegt raus.
            if not ort:
                stats["ausserhalb_ch"] = stats.get("ausserhalb_ch", 0) + 1
                log(
                    f"  [{index}/{len(eindeutig)}] übersprungen (nicht CH/FL): "
                    f"{clean_text(karte.get('address')) or 'unbekannt'}"
                )
                continue

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
                summary=beschreibung,
                source_url=karte["url"],
                apply_url=applying,
                source_site=firma or "direct",
                posted_at=posting.get("datePosted"),
            )
            jobs.append(job)
            log(
                f"  [{index}/{len(eindeutig)}] {job['title']} – {job['company']} "
                f"({job['location']}, summary {len(job['summary'] or '')} Zeichen)"
            )
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


def _vacancy_no(url: str) -> str:
    """Eindeutige Vacancy-Nummer aus einer Salesforce-Recruit-URL."""
    treffer = re.search(r"[?&]vacancyNo=([^&]+)", url or "")
    return treffer.group(1) if treffer else ""


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
                    if not ort or kanton == "FL":
                        stats["ausserhalb_ch"] = stats.get("ausserhalb_ch", 0) + 1
                        log(
                            f"  übersprungen (nicht CH): {eintrag['title']} – "
                            f"{clean_text(eintrag.get('location')) or 'unbekannt'}"
                        )
                        continue

                    # Detailseite für die echte Stellenbeschreibung.
                    beschreibung = ""
                    if await goto(page, eintrag["url"], retries=1):
                        beschreibung = await read_description(page)
                        await pause(0.8, 1.6)

                    job = make_job(
                        title=eintrag["title"],
                        company="Sygnum Bank",
                        location=ort,
                        workplace_type=normalize_workplace(eintrag.get("workplace", "")),
                        employment_type=normalize_percent(eintrag["title"]),
                        tags=derive_tags(
                            titel=f"{eintrag['title']} {eintrag.get('team', '')}",
                            beschreibung=beschreibung,
                            extra=[eintrag.get("team", "")], kanton=kanton,
                        ),
                        summary=beschreibung,
                        source_url=canonical_url(eintrag["url"]),
                        apply_url=eintrag["url"],
                        source_site="Sygnum Bank",
                    )
                    jobs.append(job)
                    log(
                        f"  {job['title']} – {job['location']} "
                        f"(summary {len(job['summary'] or '')} Zeichen)"
                    )
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
            if not ort or kanton == "FL":
                stats["ausserhalb_ch"] = stats.get("ausserhalb_ch", 0) + 1
                log(
                    f"  übersprungen (nicht CH): {eintrag['title']} – "
                    f"{clean_text(eintrag.get('location')) or 'unbekannt'}"
                )
                continue

            beschreibung = ""
            if await goto(page, eintrag["url"], retries=1):
                try:
                    await page.wait_for_selector(
                        "table.detailList, div.content, main", timeout=8000
                    )
                except PlaywrightTimeout:
                    pass
                beschreibung = await read_description(page)
                await pause(0.8, 1.6)
            if not beschreibung:
                log(f"  [WARN] keine echte Beschreibung: {eintrag['title']}")

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
                summary=beschreibung,
                source_url=canonical_url(eintrag["url"]),
                apply_url=eintrag["url"],
                source_site="Sygnum Bank",
                dedupe_extra=_vacancy_no(eintrag["url"]),
            )
            jobs.append(job)
            log(
                f"  {job['title']} – {job['location']} "
                f"(summary {len(job['summary'] or '')} Zeichen)"
            )
        except Exception as exc:
            stats["fehler"] += 1
            log(f"  Fehler bei Sygnum-Eintrag: {type(exc).__name__}: {exc}")

    return jobs


# ---------------------------------------------------------------------------
# Weitere Schweizer Arbeitgeber (ATS-APIs)
# ---------------------------------------------------------------------------

WORKABLE_SOURCES = {
    "cryptofinance": {
        "account": "crypto-finance",
        "company": "Crypto Finance AG",
        "source_site": "Crypto Finance AG",
        "hq": "Zürich",
    },
    "web3foundation": {
        "account": "web3-foundation",
        "company": "Web3 Foundation",
        "source_site": "Web3 Foundation",
        "hq": "Zug",
    },
    "alephzero": {
        "account": "aleph-zero",
        "company": "Aleph Zero Foundation",
        "source_site": "Aleph Zero Foundation",
        "hq": "Zug",
    },
}

PERSONIO_SOURCES = {
    "amina": {
        "slug": "amina",
        "company": "AMINA Bank",
        "source_site": "AMINA Bank",
        "hq": "Zug",
    },
    "cardano": {
        "slug": "cardano-foundation",
        "company": "Cardano Foundation",
        "source_site": "Cardano Foundation",
        "hq": "Zug",
    },
    "lisk": {
        "slug": "lisk",
        "company": "Lisk",
        "source_site": "Lisk",
        "hq": "Zug",
    },
}

GREENHOUSE_SOURCES = {
    "dfinity": {
        "board": "dfinity",
        "company": "DFINITY Foundation",
        "source_site": "DFINITY Foundation",
        "hq": "Zürich",
    },
    "dialectic": {
        "board": "dialecticch",
        "company": "Dialectic",
        "source_site": "Dialectic",
        "hq": "Zug",
    },
}

LEVER_SOURCES = {
    "safe": {
        "board": "safe",
        "company": "Safe",
        "source_site": "Safe",
        "hq": "Zug",
    },
    "swissborg": {
        "board": "swissborg",
        "company": "SwissBorg",
        "source_site": "SwissBorg",
        "hq": "Lausanne",
    },
}

# Firmen mit eigener ATS-Quelle: SwissDevJobs-Karten würden sonst Duplikate
# mit abweichender URL und veralteten Titeln erzeugen.
SWISSDEVJOBS_EXCLUDED = {"dialectic"}

SMARTRECRUITERS_SOURCES = {
    "swissquote": {
        "slug": "Swissquote",
        "company": "Swissquote",
        "source_site": "Swissquote",
        "hq": "Gland",
        "keywords": ("crypto", "blockchain", "digital asset", "web3", "defi"),
    },
}


def pick_swiss_office(offices: list[str], hq: str) -> str:
    """Wählt den Schweizer Standort aus einer ATS-Standortliste."""
    for office in offices:
        office = clean_text(office)
        if not office:
            continue
        if office.lower() in {"switzerland", "schweiz", "suisse", "ch"}:
            return hq
        if is_swiss_location(office) and kanton_of(office) != "FL":
            return office
    return ""


def kanton_of(raw: str) -> str | None:
    _, kanton = normalize_location(raw)
    return kanton


async def scrape_workable(key: str, stats: dict) -> list[dict]:
    cfg = WORKABLE_SOURCES[key]
    url = (
        "https://apply.workable.com/api/v1/widget/accounts/"
        f"{cfg['account']}?details=true"
    )
    log(f"{cfg['company']}: {url}")
    try:
        daten = http_get_json(url)
    except Exception as exc:
        stats["fehler"] += 1
        log(f"  ATS nicht erreichbar: {type(exc).__name__}: {exc}")
        return []

    eintraege = daten.get("jobs", []) if isinstance(daten, dict) else []
    log(f"  {len(eintraege)} Inserate im Workable-Board gefunden.")
    jobs: list[dict] = []

    for eintrag in eintraege:
        try:
            orte = eintrag.get("locations") or []
            offices = [
                ", ".join(
                    teil for teil in (
                        clean_text(ort.get("city")),
                        clean_text(ort.get("region")),
                        clean_text(ort.get("country")),
                    ) if teil
                )
                for ort in orte if isinstance(ort, dict)
            ]
            if eintrag.get("telecommuting"):
                offices.append("Remote")
            if not offices:
                offices = [", ".join(filter(None, [
                    clean_text(eintrag.get("city")),
                    clean_text(eintrag.get("country")),
                ]))]

            roh_ort = pick_swiss_office(offices, cfg["hq"])
            ort, kanton = swiss_location(roh_ort, cfg["hq"])
            if not ort:
                stats["ausserhalb_ch"] = stats.get("ausserhalb_ch", 0) + 1
                continue

            beschreibung = strip_html(eintrag.get("description", ""))
            titel = clean_text(eintrag.get("title"))
            if not titel:
                continue

            job = make_job(
                title=titel,
                company=cfg["company"],
                location=ort,
                workplace_type=normalize_workplace(
                    roh_ort, titel, beschreibung[:1500], "remote" if eintrag.get("telecommuting") else ""
                ),
                employment_type=normalize_percent(titel, beschreibung[:2000]),
                tags=derive_tags(
                    titel=f"{titel} {eintrag.get('department', '')}",
                    beschreibung=beschreibung,
                    extra=[eintrag.get("department", ""), eintrag.get("industry", "")],
                    kanton=kanton,
                ),
                summary=beschreibung,
                source_url=eintrag.get("url") or eintrag.get("shortlink", ""),
                apply_url=eintrag.get("url") or eintrag.get("shortlink", ""),
                source_site=cfg["source_site"],
                posted_at=iso_date(eintrag.get("published_on")),
            )
            jobs.append(job)
            log(f"  {job['title']} – {job['location']} (summary {len(job['summary'] or '')} Zeichen)")
        except Exception as exc:
            stats["fehler"] += 1
            log(f"  Fehler bei Workable-Eintrag: {type(exc).__name__}: {exc}")

    return jobs


async def scrape_personio(key: str, stats: dict) -> list[dict]:
    cfg = PERSONIO_SOURCES[key]
    url = f"https://{cfg['slug']}.jobs.personio.com/search.json?language=en"
    log(f"{cfg['company']}: {url}")
    try:
        daten = http_get_json(url)
    except Exception as exc:
        stats["fehler"] += 1
        log(f"  ATS nicht erreichbar: {type(exc).__name__}: {exc}")
        return []

    eintraege = daten if isinstance(daten, list) else []
    log(f"  {len(eintraege)} Inserate im Personio-Board gefunden.")
    jobs: list[dict] = []

    for eintrag in eintraege:
        try:
            offices = [clean_text(o) for o in (eintrag.get("offices") or []) if clean_text(o)]
            if not offices:
                offices = [clean_text(eintrag.get("office"))]
            roh_ort = pick_swiss_office(offices, cfg["hq"])
            ort, kanton = swiss_location(roh_ort, cfg["hq"])
            if not ort:
                stats["ausserhalb_ch"] = stats.get("ausserhalb_ch", 0) + 1
                continue

            beschreibung = strip_html(eintrag.get("description", ""))
            titel = clean_text(eintrag.get("name"))
            if not titel:
                continue
            job_id = eintrag.get("id")
            job_url = f"https://{cfg['slug']}.jobs.personio.com/job/{job_id}"

            job = make_job(
                title=titel,
                company=cfg["company"],
                location=ort,
                workplace_type=normalize_workplace(
                    roh_ort, titel, beschreibung[:1500], eintrag.get("schedule", "")
                ),
                employment_type=normalize_percent(titel, beschreibung[:2000]),
                tags=derive_tags(
                    titel=f"{titel} {eintrag.get('department', '')}",
                    beschreibung=beschreibung,
                    extra=[eintrag.get("department", ""), eintrag.get("category", "")],
                    kanton=kanton,
                ),
                summary=beschreibung,
                source_url=job_url,
                apply_url=job_url,
                source_site=cfg["source_site"],
            )
            jobs.append(job)
            log(f"  {job['title']} – {job['location']} (summary {len(job['summary'] or '')} Zeichen)")
        except Exception as exc:
            stats["fehler"] += 1
            log(f"  Fehler bei Personio-Eintrag: {type(exc).__name__}: {exc}")

    return jobs


async def scrape_taurus(page, stats: dict) -> list[dict]:
    cfg = {
        "company": "Taurus SA",
        "source_site": "Taurus SA",
        "careers": "https://www.taurushq.com/careers",
        "prefix": "https://join.com/companies/taurusgroup/",
        "hq": "Genève",
    }
    log(f"Taurus SA: {cfg['careers']} (join.com-Widget)")
    if not await goto(page, cfg["careers"]):
        stats["fehler"] += 1
        return []

    try:
        await page.wait_for_selector(
            "a[href*='join.com/companies/taurusgroup/']", timeout=SELECTOR_TIMEOUT_MS
        )
    except PlaywrightTimeout:
        log("  Keine Taurus-Stellen im join.com-Widget gefunden.")
        return []

    eintraege = await page.eval_on_selector_all(
        "a[href*='join.com/companies/taurusgroup/']",
        """els => els.map(a => ({
            url: a.href,
            text: (a.innerText || '').replace(/\\s+/g, ' ').trim()
        }))""",
    )
    gesehen: set[str] = set()
    jobs: list[dict] = []

    for eintrag in eintraege:
        try:
            url = eintrag.get("url", "").split("?")[0]
            if not url or url in gesehen:
                continue
            gesehen.add(url)

            posting = json_ld_jobposting(http_get(url)) or {}
            adresse = (posting.get("jobLocation") or {}).get("address", {})
            roh_ort = location_from_postal(adresse) or "Genève, Switzerland"
            ort, kanton = swiss_location(roh_ort, cfg["hq"])
            if not ort:
                stats["ausserhalb_ch"] = stats.get("ausserhalb_ch", 0) + 1
                continue

            beschreibung = strip_html(posting.get("description", ""))
            titel = clean_text(posting.get("title")) or clean_text(
                re.sub(r"\s*\[.*?\]\s*$", "", eintrag.get("text", ""))
            )
            if not titel:
                continue

            job = make_job(
                title=titel,
                company=cfg["company"],
                location=ort,
                workplace_type=normalize_workplace(
                    eintrag.get("text", ""), titel, beschreibung[:1500]
                ),
                employment_type=normalize_percent(titel, beschreibung[:2000]),
                tags=derive_tags(
                    titel=titel,
                    beschreibung=beschreibung,
                    extra=[posting.get("employmentType", ""), "Taurus"],
                    kanton=kanton,
                ),
                summary=beschreibung,
                source_url=posting.get("url") or url,
                apply_url=posting.get("url") or url,
                source_site=cfg["source_site"],
                posted_at=iso_date(posting.get("datePosted")),
            )
            jobs.append(job)
            log(f"  {job['title']} – {job['location']} (summary {len(job['summary'] or '')} Zeichen)")
        except Exception as exc:
            stats["fehler"] += 1
            log(f"  Fehler bei Taurus-Eintrag: {type(exc).__name__}: {exc}")

    return jobs


async def scrape_bitcoin_suisse(page, stats: dict) -> list[dict]:
    """Bitcoin Suisse: eigene Karriere-API, Details über onlyfy."""
    log("Bitcoin Suisse: https://bitcoinsuisse.com/api/careers")
    try:
        eintraege = http_get_json("https://bitcoinsuisse.com/api/careers")
    except Exception as exc:
        stats["fehler"] += 1
        log(f"  API nicht erreichbar: {type(exc).__name__}: {exc}")
        return []

    if not isinstance(eintraege, list):
        return []
    log(f"  {len(eintraege)} Inserate gemeldet, prüfe Standorte.")
    jobs: list[dict] = []

    for eintrag in eintraege:
        try:
            url = clean_text(eintrag.get("url"))
            if not url:
                continue
            posting = json_ld_jobposting(http_get(url)) or {}
            adresse = (posting.get("jobLocation") or {}).get("address", {})
            roh_ort = location_from_postal(adresse)
            land = clean_text(adresse.get("addressCountry")).upper()
            if land not in {"CH", "SCHWEIZ", "SWITZERLAND"}:
                stats["ausserhalb_ch"] = stats.get("ausserhalb_ch", 0) + 1
                continue

            ort, kanton = swiss_location(roh_ort, "Zug")
            if not ort:
                stats["ausserhalb_ch"] = stats.get("ausserhalb_ch", 0) + 1
                continue

            titel = clean_text(posting.get("title")) or clean_text(eintrag.get("title"))
            beschreibung = strip_html(posting.get("description", ""))
            job = make_job(
                title=titel,
                company="Bitcoin Suisse",
                location=ort,
                workplace_type=normalize_workplace(roh_ort, titel, beschreibung[:1500]),
                employment_type=normalize_percent(titel, beschreibung[:2000]),
                tags=derive_tags(
                    titel=titel,
                    beschreibung=beschreibung,
                    extra=eintrag.get("departments") or [],
                    kanton=kanton,
                ),
                summary=beschreibung,
                source_url=url,
                apply_url=url,
                source_site="Bitcoin Suisse",
                posted_at=iso_date(posting.get("datePosted")),
            )
            jobs.append(job)
            log(f"  {job['title']} – {job['location']}")
        except Exception as exc:
            stats["fehler"] += 1
            log(f"  Fehler bei Bitcoin-Suisse-Eintrag: {type(exc).__name__}: {exc}")

    return jobs


async def scrape_greenhouse(key: str, stats: dict) -> list[dict]:
    cfg = GREENHOUSE_SOURCES[key]
    url = f"https://boards-api.greenhouse.io/v1/boards/{cfg['board']}/jobs?content=true"
    log(f"{cfg['company']}: {url}")
    try:
        daten = http_get_json(url)
    except Exception as exc:
        stats["fehler"] += 1
        log(f"  ATS nicht erreichbar: {type(exc).__name__}: {exc}")
        return []

    jobs: list[dict] = []
    eintraege = daten.get("jobs", []) if isinstance(daten, dict) else []
    log(f"  {len(eintraege)} Inserate im Greenhouse-Board gefunden.")
    for eintrag in eintraege:
        try:
            roh_ort = clean_text((eintrag.get("location") or {}).get("name"))
            if is_bare_remote(roh_ort):
                stats["ausserhalb_ch"] = stats.get("ausserhalb_ch", 0) + 1
                log(f"  übersprungen (Remote ohne Länderbezug): {eintrag.get('title')}")
                continue
            ort, kanton = swiss_location(roh_ort, cfg["hq"])
            if not ort:
                stats["ausserhalb_ch"] = stats.get("ausserhalb_ch", 0) + 1
                continue
            beschreibung = strip_html(eintrag.get("content", ""))
            titel = clean_text(eintrag.get("title"))
            job = make_job(
                title=titel,
                company=cfg["company"],
                location=ort,
                workplace_type=normalize_workplace(roh_ort, titel, beschreibung[:1500]),
                employment_type=normalize_percent(titel, beschreibung[:2000]),
                tags=derive_tags(titel=titel, beschreibung=beschreibung, kanton=kanton),
                summary=beschreibung,
                source_url=eintrag.get("absolute_url", ""),
                apply_url=eintrag.get("absolute_url", ""),
                source_site=cfg["source_site"],
                posted_at=iso_date(eintrag.get("updated_at")),
            )
            jobs.append(job)
            log(f"  {job['title']} – {job['location']}")
        except Exception as exc:
            stats["fehler"] += 1
            log(f"  Fehler bei Greenhouse-Eintrag: {type(exc).__name__}: {exc}")
    return jobs


async def scrape_lever(key: str, stats: dict) -> list[dict]:
    cfg = LEVER_SOURCES[key]
    url = f"https://api.lever.co/v0/postings/{cfg['board']}?mode=json"
    log(f"{cfg['company']}: {url}")
    try:
        daten = http_get_json(url)
    except Exception as exc:
        stats["fehler"] += 1
        log(f"  ATS nicht erreichbar: {type(exc).__name__}: {exc}")
        return []

    jobs: list[dict] = []
    eintraege = daten if isinstance(daten, list) else []
    log(f"  {len(eintraege)} Inserate im Lever-Board gefunden.")
    for eintrag in eintraege:
        try:
            kategorien = eintrag.get("categories") or {}
            roh_ort = clean_text(kategorien.get("location"))
            if is_bare_remote(roh_ort):
                stats["ausserhalb_ch"] = stats.get("ausserhalb_ch", 0) + 1
                log(f"  übersprungen (Remote ohne Länderbezug): {eintrag.get('text')}")
                continue
            ort, kanton = swiss_location(roh_ort, cfg["hq"])
            if not ort:
                stats["ausserhalb_ch"] = stats.get("ausserhalb_ch", 0) + 1
                continue
            titel = clean_text(eintrag.get("text"))
            beschreibung = strip_html(
                eintrag.get("descriptionPlain") or eintrag.get("description", "")
            )
            job = make_job(
                title=titel,
                company=cfg["company"],
                location=ort,
                workplace_type=normalize_workplace(
                    roh_ort, kategorien.get("workplaceType", ""), titel, beschreibung[:1500]
                ),
                employment_type=normalize_percent(titel, beschreibung[:2000]),
                tags=derive_tags(
                    titel=f"{titel} {kategorien.get('team', '')}",
                    beschreibung=beschreibung,
                    extra=[kategorien.get("team", ""), kategorien.get("commitment", "")],
                    kanton=kanton,
                ),
                summary=beschreibung,
                source_url=eintrag.get("hostedUrl", ""),
                apply_url=eintrag.get("applyUrl") or eintrag.get("hostedUrl", ""),
                source_site=cfg["source_site"],
                posted_at=iso_date(
                    datetime.fromtimestamp(eintrag["createdAt"] / 1000).isoformat()
                    if eintrag.get("createdAt") else None
                ),
            )
            jobs.append(job)
            log(f"  {job['title']} – {job['location']}")
        except Exception as exc:
            stats["fehler"] += 1
            log(f"  Fehler bei Lever-Eintrag: {type(exc).__name__}: {exc}")
    return jobs


async def scrape_smartrecruiters(key: str, stats: dict) -> list[dict]:
    cfg = SMARTRECRUITERS_SOURCES[key]
    url = (
        "https://api.smartrecruiters.com/v1/companies/"
        f"{cfg['slug']}/postings?limit=100"
    )
    log(f"{cfg['company']}: {url}")
    try:
        daten = http_get_json(url)
    except Exception as exc:
        stats["fehler"] += 1
        log(f"  ATS nicht erreichbar: {type(exc).__name__}: {exc}")
        return []

    jobs: list[dict] = []
    eintraege = daten.get("content", []) if isinstance(daten, dict) else []
    log(f"  {len(eintraege)} Inserate im SmartRecruiters-Board gefunden.")
    for eintrag in eintraege:
        try:
            titel = clean_text(eintrag.get("name"))
            if not any(k in titel.lower() for k in cfg["keywords"]):
                continue
            adresse = eintrag.get("location") or {}
            if clean_text(adresse.get("country")).lower() != "ch":
                stats["ausserhalb_ch"] = stats.get("ausserhalb_ch", 0) + 1
                continue
            roh_ort = ", ".join(filter(None, [
                clean_text(adresse.get("city")),
                clean_text(adresse.get("country")),
            ]))
            ort, kanton = swiss_location(roh_ort, cfg["hq"])
            if not ort:
                stats["ausserhalb_ch"] = stats.get("ausserhalb_ch", 0) + 1
                continue

            posting_id = eintrag.get("id")
            detail = http_get_json(
                f"https://api.smartrecruiters.com/v1/companies/{cfg['slug']}/postings/{posting_id}"
            )
            abschnitte = (detail.get("jobAd") or {}).get("sections") or {}
            beschreibung = strip_html(" ".join(
                f"{teil.get('title', '')}: {teil.get('text', '')}"
                for teil in abschnitte.values() if isinstance(teil, dict)
            ))
            job_url = f"https://jobs.smartrecruiters.com/{cfg['slug']}/{posting_id}"

            job = make_job(
                title=titel,
                company=cfg["company"],
                location=ort,
                workplace_type=normalize_workplace(roh_ort, titel, beschreibung[:1500]),
                employment_type=normalize_percent(titel, beschreibung[:2000]),
                tags=derive_tags(
                    titel=f"{titel} {eintrag.get('department', {}).get('label', '')}",
                    beschreibung=beschreibung,
                    extra=[(eintrag.get("department") or {}).get("label", "")],
                    kanton=kanton,
                ),
                summary=beschreibung,
                source_url=job_url,
                apply_url=job_url,
                source_site=cfg["source_site"],
                posted_at=iso_date(eintrag.get("releasedDate")),
            )
            jobs.append(job)
            log(f"  {job['title']} – {job['location']}")
        except Exception as exc:
            stats["fehler"] += 1
            log(f"  Fehler bei SmartRecruiters-Eintrag: {type(exc).__name__}: {exc}")
    return jobs


async def scrape_obligate(page, stats: dict) -> list[dict]:
    """Obligate führt keinen eigenen ATS-Jobfeed; Karriere läuft über LinkedIn."""
    log("Obligate: kein öffentlicher ATS-Jobfeed (Karriere verweist auf LinkedIn).")
    return []


YOUHODLER_CAREERS_URL = "https://www.youhodler.com/careers"
_YOUHODLER_JOB_RE = re.compile(r'href="(/careers/[a-z0-9][a-z0-9\-]+)"')
_SWISS_ADDRESS_RE = re.compile(r"([A-Za-zÀ-ÿ.\- ]{2,60}),\s*Switzerland")


async def scrape_youhodler(stats: dict) -> list[dict]:
    """YouHodler (Lausanne): Webflow-Karriereseite ohne ATS-API."""
    log(f"YouHodler: {YOUHODLER_CAREERS_URL}")
    try:
        liste = http_get(YOUHODLER_CAREERS_URL)
    except Exception as exc:
        stats["fehler"] += 1
        log(f"  Karriereseite nicht erreichbar: {type(exc).__name__}: {exc}")
        return []

    pfade = sorted(set(_YOUHODLER_JOB_RE.findall(liste)))
    log(f"  {len(pfade)} Inserate in der Liste gefunden.")

    jobs: list[dict] = []
    for pfad in pfade:
        url = canonical_url(urljoin(YOUHODLER_CAREERS_URL, pfad))
        try:
            detail = http_get(url)
        except Exception as exc:
            stats["fehler"] += 1
            log(f"  Fehler bei {pfad}: {type(exc).__name__}: {exc}")
            continue

        haupt = re.search(r"(?is)<main[\s\S]*?</main>", detail)
        text = html_to_text(haupt.group(0) if haupt else detail)
        titel_match = re.search(r"(?is)<h1[^>]*>([\s\S]*?)</h1>", detail)
        titel = strip_html(titel_match.group(1)) if titel_match else ""
        if not titel:
            continue

        ort, kanton = "", None
        adresse = _SWISS_ADDRESS_RE.search(text)
        if adresse:
            ort, kanton = normalize_location(adresse.group(0))
        if not ort:
            stats["ausserhalb_ch"] = stats.get("ausserhalb_ch", 0) + 1
            log(f"  übersprungen (nicht CH): {titel}")
            continue

        beschreibung = text
        for marker in ("About YouHodler", "About the role", "About "):
            pos = beschreibung.find(marker)
            if pos > 0:
                beschreibung = beschreibung[pos:]
                break
        # Navigation/Footer der Karriereseite abschneiden, Inhalt bleibt vollständig.
        for endmarker in (
            "Didn’t find a job",
            "Didn't find a job",
            "Get YouHodler Crypto Wallet App",
        ):
            pos = beschreibung.find(endmarker)
            if pos > 0:
                beschreibung = beschreibung[:pos]
                break

        job = make_job(
            title=titel,
            company="YouHodler",
            location=ort,
            workplace_type=normalize_workplace(text[:500], titel),
            employment_type=normalize_percent(titel, beschreibung),
            tags=derive_tags(titel=titel, beschreibung=beschreibung, kanton=kanton),
            summary=beschreibung,
            source_url=url,
            apply_url=url,
            source_site="YouHodler",
        )
        jobs.append(job)
        log(f"  {job['title']} – {job['location']}")

    return jobs


# ---------------------------------------------------------------------------
# Orchestrierung
# ---------------------------------------------------------------------------

ALL_SOURCES = [
    "swissdevjobs",
    "sygnum",
    "amina",
    "cardano",
    "lisk",
    "taurus",
    "cryptofinance",
    "swissquote",
    "bitcoin-suisse",
    "dfinity",
    "dialectic",
    "safe",
    "swissborg",
    "web3foundation",
    "alephzero",
    "obligate",
    "youhodler",
]


async def run_pipeline(headless: bool, quellen: set[str]) -> tuple[int, int, int, int]:
    stats = {"neu": 0, "duplikate": 0, "fehler": 0, "gefunden": 0, "ausserhalb_ch": 0}

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

        async def run_source(name: str, coro) -> None:
            jobs = await coro
            stats["gefunden"] += len(jobs)
            await persist(jobs, stats)
            log(f"{name} fertig: {len(jobs)} Jobs verarbeitet.\n")

        try:
            if "swissdevjobs" in quellen:
                await run_source("SwissDevJobs", scrape_swissdevjobs(page, stats))

            if "sygnum" in quellen:
                await run_source("Sygnum", scrape_sygnum(page, stats))

            for key in ("amina", "cardano", "lisk"):
                if key in quellen:
                    await run_source(
                        PERSONIO_SOURCES[key]["company"],
                        scrape_personio(key, stats),
                    )

            if "taurus" in quellen:
                await run_source("Taurus SA", scrape_taurus(page, stats))

            for key in ("cryptofinance", "web3foundation", "alephzero"):
                if key in quellen:
                    await run_source(
                        WORKABLE_SOURCES[key]["company"],
                        scrape_workable(key, stats),
                    )

            if "swissquote" in quellen:
                await run_source("Swissquote", scrape_smartrecruiters("swissquote", stats))

            if "bitcoin-suisse" in quellen:
                await run_source("Bitcoin Suisse", scrape_bitcoin_suisse(page, stats))

            for key in ("dfinity", "dialectic"):
                if key in quellen:
                    await run_source(
                        GREENHOUSE_SOURCES[key]["company"],
                        scrape_greenhouse(key, stats),
                    )

            for key in ("safe", "swissborg"):
                if key in quellen:
                    await run_source(
                        LEVER_SOURCES[key]["company"],
                        scrape_lever(key, stats),
                    )

            if "obligate" in quellen:
                await run_source("Obligate", scrape_obligate(page, stats))

            if "youhodler" in quellen:
                await run_source("YouHodler", scrape_youhodler(stats))
        finally:
            await context.close()
            await browser.close()

    return stats["neu"], stats["duplikate"], stats["fehler"], stats["ausserhalb_ch"]


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
        choices=["all", *ALL_SOURCES],
        default="all",
        help="Nur eine Quelle scrapen (Default: all)",
    )
    parser.add_argument(
        "--no-pause", action="store_true", help="Am Ende nicht auf Enter warten (für Automatisierung)"
    )
    return parser.parse_args(argv)


def main(argv=None) -> int:
    args = parse_args(argv)
    quellen = set(ALL_SOURCES) if args.source == "all" else {args.source}

    log("Starte Scraping-Pipeline.")
    db.init_db()

    try:
        neu, duplikate, fehler, ausserhalb_ch = asyncio.run(
            run_pipeline(headless=not args.headed, quellen=quellen)
        )
    except KeyboardInterrupt:
        log("Abbruch durch Benutzer.")
        return 130
    except Exception:
        log("Pipeline abgebrochen:")
        traceback.print_exc()
        return 1

    print()
    log("=" * 52)
    log(
        f"Ergebnis: {neu} neue Jobs gespeichert, {duplikate} Duplikate aktualisiert/ignoriert, "
        f"{ausserhalb_ch} wegen Standort (nicht CH) verworfen, {fehler} Fehler."
    )
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
