"""
Data-validation helpers (plain dataclasses — no pydantic / Rust deps).
Fields that are missing or unclear are stored as None — never guessed.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field, asdict
from typing import Optional

# ---------------------------------------------------------------------------
# Regex helpers
# ---------------------------------------------------------------------------
_PHONE_RE = re.compile(r"^\+?[0-9\s\-()]{7,20}$")
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$")
_URL_RE = re.compile(r"^https?://\S+$")

NOT_VERIFIED = "NOT VERIFIED"

UNIVERSITY_TYPES = {"public", "private", "technical", "religious", "unknown"}
QUALITY_LEVELS = {"real", "partial", "unverified", "rejected"}
CONTACT_TYPES = {"phone", "mobile", "fax", "email", "whatsapp", "telegram", "other"}
SOCIAL_PLATFORMS = {
    "facebook", "instagram", "twitter", "youtube",
    "linkedin", "tiktok", "telegram", "other",
}
OPPORTUNITY_TYPES = {
    "scholarship", "job", "internship", "event", "admission", "other",
}


# ---------------------------------------------------------------------------
# Coerce helpers
# ---------------------------------------------------------------------------

def _clamp_set(value: str, allowed: set[str], default: str) -> str:
    return value if value in allowed else default


def _clean_url(value: Optional[str]) -> Optional[str]:
    if value and _URL_RE.match(value.strip()):
        return value.strip()
    return None


# ---------------------------------------------------------------------------
# Dataclass models
# ---------------------------------------------------------------------------

@dataclass
class GovernorateIn:
    name: str
    name_ar: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    def to_dict(self) -> dict:
        return {k: v for k, v in asdict(self).items() if v is not None}


@dataclass
class CityIn:
    name: str
    name_ar: Optional[str] = None
    governorate_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    def to_dict(self) -> dict:
        return {k: v for k, v in asdict(self).items() if v is not None}


@dataclass
class UniversityIn:
    name: str
    name_ar: Optional[str] = None
    name_en: Optional[str] = None
    type: str = "unknown"
    city_id: Optional[str] = None
    governorate_id: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    founded_year: Optional[int] = None
    website: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    verified: bool = False
    data_quality: str = "unverified"
    source: str = "manual"
    external_id: Optional[str] = None

    def __post_init__(self) -> None:
        self.type = _clamp_set(self.type, UNIVERSITY_TYPES, "unknown")
        self.data_quality = _clamp_set(self.data_quality, QUALITY_LEVELS, "unverified")
        self.website = _clean_url(self.website)

    def to_dict(self) -> dict:
        return {k: v for k, v in asdict(self).items() if v is not None}


@dataclass
class ContactIn:
    university_id: str
    value: str
    contact_type: str = "phone"
    label: Optional[str] = None
    is_primary: bool = False
    verified: bool = False

    def __post_init__(self) -> None:
        self.contact_type = _clamp_set(self.contact_type, CONTACT_TYPES, "other")
        self.value = self.value.strip()
        if not self.value:
            raise ValueError("Contact value cannot be empty")

    def to_dict(self) -> dict:
        return {k: v for k, v in asdict(self).items() if v is not None}


@dataclass
class SocialLinkIn:
    university_id: str
    platform: str
    url: str
    verified: bool = False

    def __post_init__(self) -> None:
        self.platform = _clamp_set(self.platform, SOCIAL_PLATFORMS, "other")
        self.url = self.url.strip()
        if not _URL_RE.match(self.url):
            raise ValueError(f"Invalid URL: {self.url}")

    def to_dict(self) -> dict:
        return {k: v for k, v in asdict(self).items() if v is not None}


@dataclass
class PostIn:
    title: str
    university_id: Optional[str] = None
    body: Optional[str] = None
    source_url: Optional[str] = None
    published_at: Optional[str] = None
    language: str = "ar"
    tags: Optional[list[str]] = None

    def to_dict(self) -> dict:
        return {k: v for k, v in asdict(self).items() if v is not None}


@dataclass
class OpportunityIn:
    title: str
    university_id: Optional[str] = None
    description: Optional[str] = None
    opportunity_type: str = "other"
    deadline: Optional[str] = None
    source_url: Optional[str] = None
    tags: Optional[list[str]] = None

    def __post_init__(self) -> None:
        self.opportunity_type = _clamp_set(self.opportunity_type, OPPORTUNITY_TYPES, "other")

    def to_dict(self) -> dict:
        return {k: v for k, v in asdict(self).items() if v is not None}
