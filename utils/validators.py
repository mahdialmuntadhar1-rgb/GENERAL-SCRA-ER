"""
Validation helpers for phone numbers, emails, URLs, and duplicate detection.
"""

import re
from typing import Optional

import phonenumbers

# ---------------------------------------------------------------------------
# Phone
# ---------------------------------------------------------------------------
_IRAQ_COUNTRY_CODE = "IQ"


def validate_phone(raw: str) -> Optional[str]:
    """
    Return an E.164-formatted Iraqi phone number or None if invalid.
    Accepts local (07xx) and international (+964) formats.
    """
    raw = raw.strip()
    if not raw:
        return None
    try:
        parsed = phonenumbers.parse(raw, _IRAQ_COUNTRY_CODE)
        if phonenumbers.is_valid_number(parsed):
            return phonenumbers.format_number(
                parsed, phonenumbers.PhoneNumberFormat.E164
            )
    except phonenumbers.NumberParseException:
        pass
    return None


# ---------------------------------------------------------------------------
# Email
# ---------------------------------------------------------------------------
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$")


def validate_email(raw: str) -> Optional[str]:
    """Return lowercase trimmed email or None if invalid."""
    raw = raw.strip().lower()
    if _EMAIL_RE.match(raw):
        return raw
    return None


# ---------------------------------------------------------------------------
# URL
# ---------------------------------------------------------------------------
_URL_RE = re.compile(r"^https?://\S+$", re.IGNORECASE)


def validate_url(raw: str) -> Optional[str]:
    """Return trimmed URL or None if invalid."""
    raw = raw.strip()
    if _URL_RE.match(raw):
        return raw
    return None


# ---------------------------------------------------------------------------
# Duplicate detection (simple key-based)
# ---------------------------------------------------------------------------

def make_dedup_key(name: str, governorate: str) -> str:
    """Normalised dedup key: lowercase name + governorate, whitespace collapsed."""
    return f"{name.strip().lower()}||{governorate.strip().lower()}"


def find_duplicates(records: list[dict], key_fields: tuple[str, ...] = ("name", "governorate_id")) -> dict[str, list[int]]:
    """
    Return a dict mapping dedup-key → list of row indices that share that key.
    Only keys with >1 index are included (i.e. actual duplicates).
    """
    seen: dict[str, list[int]] = {}
    for idx, rec in enumerate(records):
        parts = [str(rec.get(f, "")).strip().lower() for f in key_fields]
        key = "||".join(parts)
        seen.setdefault(key, []).append(idx)
    return {k: v for k, v in seen.items() if len(v) > 1}
