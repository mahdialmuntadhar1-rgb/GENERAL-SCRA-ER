"""
Text cleaning and normalisation helpers.
"""

import re
import unicodedata
from typing import Optional


def clean_text(text: str) -> str:
    """Strip control characters, collapse whitespace, strip outer spaces."""
    if not text:
        return ""
    # Remove control chars except newlines
    text = "".join(ch for ch in text if unicodedata.category(ch)[0] != "C" or ch in "\n\t")
    # Collapse whitespace
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def normalise_arabic(text: str) -> str:
    """Basic Arabic normalisation (remove diacritics, normalise alef/ya)."""
    if not text:
        return ""
    # Remove tashkeel (diacritics)
    text = re.sub(r"[\u0610-\u061A\u064B-\u065F\u0670]", "", text)
    # Normalise alef variants → ا
    text = re.sub(r"[إأآ]", "ا", text)
    # Normalise ya
    text = text.replace("ي", "ى").replace("ئ", "ى")
    # Normalise ta marbuta → ه
    text = text.replace("ة", "ه")
    return text


def safe_string(value, default: str = "") -> str:
    """Coerce any value to a stripped string; return default if falsy."""
    if value is None:
        return default
    s = str(value).strip()
    return s if s else default


def safe_float(value) -> Optional[float]:
    """Try to parse a float; return None on failure."""
    if value is None:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def safe_int(value) -> Optional[int]:
    """Try to parse an int; return None on failure."""
    if value is None:
        return None
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return None
