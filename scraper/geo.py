"""
Strenge Standort-Whitelist für die Schweizer Web3-Jobs-DB.

Kern: Nur Orte in der Schweiz oder in Liechtenstein gelten als gültig, plus
explizite "Remote"-Angaben ohne Auslandsbezug. Alles andere (Singapore, UAE,
London, ...) wird verworfen, statt es mit "Schweiz" zu beschriften.
"""

import re

SWISS_CANTON_CODES = {
    "AG", "AI", "AR", "BE", "BL", "BS", "FR", "GE", "GL", "GR", "JU", "LU",
    "NE", "NW", "OW", "SG", "SH", "SO", "SZ", "TG", "TI", "UR", "VD", "VS",
    "ZG", "ZH", "FL",
}

# Stadt -> (Anzeigename, Kantonskürzel). Nur Schweizer Orte plus Liechtenstein.
CITY_MAP: dict[str, tuple[str, str | None]] = {
    "zurich": ("Zürich", "ZH"),
    "zürich": ("Zürich", "ZH"),
    "zuerich": ("Zürich", "ZH"),
    "zug": ("Zug", "ZG"),
    "baar": ("Baar", "ZG"),
    "cham": ("Cham", "ZG"),
    "steinhausen": ("Steinhausen", "ZG"),
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

# Positive Marker: Schweiz/Liechtenstein.
SWISS_MARKERS = (
    r"\bswitzerland\b", r"\bschweiz\b", r"\bsuisse\b", r"\bsvizzera\b",
    r"\bsvizra\b", r"\bch\b", r"\bliechtenstein\b", r"\bfl\b",
    *[rf"\b{re.escape(stadt)}\b" for stadt in CITY_MAP],
    *[rf"\b{code.lower()}\b" for code in SWISS_CANTON_CODES],
)

# Negative Marker: alles ausserhalb CH/FL. Bewusst grosszügig.
FOREIGN_MARKERS = (
    r"\bsingapore\b", r"\bsingapur\b", r"\buae\b", r"\bunited arab emirates\b",
    r"\babu dhabi\b", r"\bdubai\b", r"\bdoha\b", r"\bqatar\b",
    r"\blondon\b", r"\bunited kingdom\b", r"\bengland\b", r"\buk\b",
    r"\bnew york\b", r"\busa\b", r"\bunited states\b", r"\bus\b",
    r"\bgermany\b", r"\bdeutschland\b", r"\bberlin\b", r"\bmunich\b", r"\bmünchen\b",
    r"\baustria\b", r"\bösterreich\b", r"\bvienna\b", r"\bwien\b",
    r"\bportugal\b", r"\blisbon\b", r"\blissabon\b",
    r"\bfrance\b", r"\bfrankreich\b", r"\bparis\b",
    r"\bnetherlands\b", r"\bamsterdam\b", r"\bspain\b", r"\bmadrid\b",
    r"\bitaly\b", r"\bitalien\b", r"\bmilan\b", r"\broma\b",
    r"\bpoland\b", r"\bwarsaw\b", r"\bindia\b", r"\bbangalore\b",
    r"\bisrael\b", r"\btel aviv\b", r"\bhong kong\b", r"\bjapan\b", r"\btokyo\b",
    r"\baustralia\b", r"\bsydney\b", r"\bcanada\b", r"\btoronto\b",
    r"\bbrazil\b", r"\bemea\b", r"\bapac\b", r"\beurope\b", r"\beuropa\b",
    r"\bamericas\b", r"\bnorth america\b", r"\bsouth america\b", r"\blatam\b",
    r"\basia\b", r"\bafrica\b", r"\bmiddle east\b", r"\boceania\b",
)

_SWISS_RE = re.compile("|".join(SWISS_MARKERS), re.IGNORECASE)
_FOREIGN_RE = re.compile("|".join(FOREIGN_MARKERS), re.IGNORECASE)
_REMOTE_RE = re.compile(r"\b(remote|home ?office|telecommute)\b", re.IGNORECASE)


def clean_text(value) -> str:
    return " ".join(str(value or "").replace("\xa0", " ").split()).strip()


def foreign_marker(text: str) -> str | None:
    """Liefert den ersten Auslands-Marker (für Logs) oder None."""
    treffer = _FOREIGN_RE.search(text)
    return treffer.group(0) if treffer else None


def is_bare_remote(raw) -> bool:
    """True für "Remote" ohne Länder-/CH-Bezug (z. B. globales ATS-Board)."""
    text = clean_text(raw)
    return bool(_REMOTE_RE.search(text)) and not _SWISS_RE.search(text)


def is_swiss_location(raw) -> bool:
    """True, wenn der Standort Schweiz, Liechtenstein oder Remote CH ist."""
    text = clean_text(raw)
    if not text:
        return False

    ausland = foreign_marker(text)
    if ausland:
        return False

    if _SWISS_RE.search(text):
        return True

    # "Remote" ohne Länderangabe gilt als Remote CH (Portal-Fokus Schweiz).
    if _REMOTE_RE.search(text):
        return True

    return False


def normalize_location(raw) -> tuple[str, str | None]:
    """
    Gibt (Ort, Kantonskürzel) zurück – oder ("", None), wenn der Standort
    nicht in der Whitelist liegt. Caller müssen leere Orte verwerfen.
    """
    text = clean_text(raw)
    if not is_swiss_location(text):
        return "", None

    if _REMOTE_RE.search(text):
        for stadt, (anzeige, kanton) in CITY_MAP.items():
            if re.search(rf"\b{re.escape(stadt)}\b", text.lower()):
                return f"Remote {anzeige}", kanton
        return "Remote Schweiz", None

    # "Grafenaustrasse 5, Zug" -> letzter Teil; "Zurich, Switzerland" -> erster.
    teile = [clean_text(t) for t in re.split(r"[,;|]", text) if clean_text(t)]
    kandidaten = [
        t for t in teile
        if t.lower() not in {"switzerland", "schweiz", "suisse", "liechtenstein"}
    ] or teile

    # Exakter Treffer zuerst.
    for teil in kandidaten:
        key = teil.lower().strip()
        if key in CITY_MAP:
            return CITY_MAP[key]

    # Teilstring-/Kantons-Treffer.
    for teil in kandidaten:
        key = teil.lower()
        for stadt, (anzeige, kanton) in CITY_MAP.items():
            if re.search(rf"\b{re.escape(stadt)}\b", key):
                return anzeige, kanton
        for teilwort in key.split():
            if teilwort.upper() in SWISS_CANTON_CODES:
                return kandidaten[0], teilwort.upper()

    # Land bekannt, Stadt unbekannt: Stadt übernehmen, Kanton offen.
    ort = kandidaten[0]
    if len(ort) > 60:
        ort = "Schweiz"
    return ort, None
