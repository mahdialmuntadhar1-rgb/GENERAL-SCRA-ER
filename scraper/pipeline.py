"""
Scraping & validation pipeline.

Orchestrates:  scrape → normalise → validate → classify (validated / needs_review)

Designed to run in a background thread.  Checks a `threading.Event` (stop_event)
between every major step so the GUI can cancel cleanly.
"""

from __future__ import annotations

import re
import time
import threading
from dataclasses import dataclass, field
from typing import Callable, Optional

import requests

from utils.validators import validate_phone, validate_email, validate_url
from utils.text_utils import clean_text, safe_string, safe_float, safe_int


# ---------------------------------------------------------------------------
# Overpass (OpenStreetMap) source — scrapes universities / education POIs
# ---------------------------------------------------------------------------

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# All 18 Iraqi governorates with centre coordinates
IRAQ_GOVERNORATES: list[dict] = [
    {"name": "Baghdad",      "lat": 33.3152, "lon": 44.3661},
    {"name": "Basra",        "lat": 30.5081, "lon": 47.7804},
    {"name": "Nineveh",      "lat": 36.3350, "lon": 43.1333},
    {"name": "Erbil",        "lat": 36.1911, "lon": 44.0092},
    {"name": "Sulaymaniyah", "lat": 35.5553, "lon": 45.4343},
    {"name": "Duhok",        "lat": 36.8635, "lon": 42.9356},
    {"name": "Kirkuk",       "lat": 35.4686, "lon": 44.3938},
    {"name": "Diyala",       "lat": 33.7750, "lon": 44.9600},
    {"name": "Anbar",        "lat": 33.4333, "lon": 43.2500},
    {"name": "Maysan",       "lat": 31.8369, "lon": 47.2786},
    {"name": "Muthanna",     "lat": 31.3170, "lon": 45.3000},
    {"name": "Qadisiyyah",   "lat": 31.9667, "lon": 45.0167},
    {"name": "Babil",        "lat": 32.4640, "lon": 44.4240},
    {"name": "Wasit",        "lat": 32.5000, "lon": 45.8333},
    {"name": "Salahaddin",   "lat": 34.6167, "lon": 43.9333},
    {"name": "Najaf",        "lat": 32.0280, "lon": 44.3860},
    {"name": "Karbala",      "lat": 32.6167, "lon": 44.0333},
    {"name": "Dhi Qar",      "lat": 31.0500, "lon": 46.2667},
]


def _overpass_query_universities(lat: float, lon: float, radius: int = 30000) -> list[dict]:
    """
    Query Overpass API for university / college nodes around a coordinate.
    Returns raw list of dicts with tags.
    """
    query = f"""
    [out:json][timeout:60];
    (
      nwr["amenity"="university"](around:{radius},{lat},{lon});
      nwr["amenity"="college"](around:{radius},{lat},{lon});
      nwr["isced:level"](around:{radius},{lat},{lon});
    );
    out center tags;
    """
    try:
        resp = requests.post(OVERPASS_URL, data={"data": query}, timeout=65)
        resp.raise_for_status()
        elements = resp.json().get("elements", [])
        return elements
    except Exception as e:
        return []


def _parse_osm_element(el: dict, governorate: str) -> dict:
    """Convert a raw Overpass element into our normalised record dict."""
    tags = el.get("tags", {})

    lat = el.get("lat") or el.get("center", {}).get("lat")
    lon = el.get("lon") or el.get("center", {}).get("lon")

    return {
        "name":        tags.get("name", "").strip() or tags.get("name:en", "").strip(),
        "name_ar":     tags.get("name:ar", "").strip(),
        "name_en":     tags.get("name:en", "").strip(),
        "address":     tags.get("addr:full", "") or tags.get("addr:street", ""),
        "latitude":    lat,
        "longitude":   lon,
        "website":     tags.get("website", "") or tags.get("contact:website", ""),
        "_phone":      tags.get("phone", "") or tags.get("contact:phone", ""),
        "_email":      tags.get("email", "") or tags.get("contact:email", ""),
        "_facebook":   tags.get("contact:facebook", "") or tags.get("facebook", ""),
        "_instagram":  tags.get("contact:instagram", "") or tags.get("instagram", ""),
        "_governorate": governorate,
        "_city":       tags.get("addr:city", "").strip(),
        "type":        "unknown",
        "source":      "osm",
        "external_id": f"osm_{el.get('type','?')}_{el.get('id','')}",
    }


# ---------------------------------------------------------------------------
# Validation / classification
# ---------------------------------------------------------------------------

def validate_record(rec: dict) -> dict:
    """
    Run field-level validation on a single record.
    Mutates in place and adds `_status` = 'validated' | 'needs_review'.
    """
    rec["name"] = clean_text(rec.get("name", ""))
    rec["name_ar"] = clean_text(rec.get("name_ar", ""))
    rec["name_en"] = clean_text(rec.get("name_en", ""))
    rec["address"] = clean_text(rec.get("address", ""))

    # Website
    raw_web = safe_string(rec.get("website", ""))
    rec["website"] = validate_url(raw_web) if raw_web else None

    # Phone
    raw_phone = safe_string(rec.get("_phone", ""))
    rec["_phone"] = validate_phone(raw_phone) if raw_phone else None

    # Email
    raw_email = safe_string(rec.get("_email", ""))
    rec["_email"] = validate_email(raw_email) if raw_email else None

    # Coordinates sanity (Iraq bounding box ~29-38 lat, 38-49 lon)
    lat = safe_float(rec.get("latitude"))
    lon = safe_float(rec.get("longitude"))
    if lat and (lat < 29.0 or lat > 38.0):
        lat = None
    if lon and (lon < 38.0 or lon > 49.0):
        lon = None
    rec["latitude"] = lat
    rec["longitude"] = lon

    # ── classify ─────────────────────────────────────────────────────
    score = 0
    if rec.get("name"):
        score += 2
    if rec.get("_phone"):
        score += 2
    if rec.get("website"):
        score += 1
    if rec.get("_email"):
        score += 1
    if rec.get("_facebook") or rec.get("_instagram"):
        score += 1
    if rec.get("address") and len(rec["address"]) > 10:
        score += 1
    if lat and lon:
        score += 1

    if score >= 5:
        rec["data_quality"] = "real"
        rec["_status"] = "validated"
    elif score >= 2 and rec.get("name"):
        rec["data_quality"] = "partial"
        rec["_status"] = "validated"
    else:
        rec["data_quality"] = "unverified"
        rec["_status"] = "needs_review"

    rec["verified"] = rec["_status"] == "validated"
    return rec


# ---------------------------------------------------------------------------
# Pipeline orchestrator
# ---------------------------------------------------------------------------

@dataclass
class PipelineResult:
    validated: list[dict] = field(default_factory=list)
    needs_review: list[dict] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    total_scraped: int = 0
    finished: bool = False


def run_pipeline(
    *,
    governorates: list[dict] | None = None,
    radius: int = 30000,
    stop_event: threading.Event,
    on_progress: Callable[[str], None] | None = None,
) -> PipelineResult:
    """
    Full scraping + validation pipeline.

    Args:
        governorates: list of {"name", "lat", "lon"} dicts. Defaults to all 18.
        radius: search radius in metres.
        stop_event: checked between steps — set() to abort cleanly.
        on_progress: optional callback(message) for UI log updates.

    Returns:
        PipelineResult with validated / needs_review lists.
    """
    result = PipelineResult()
    govs = governorates or IRAQ_GOVERNORATES

    def log(msg: str) -> None:
        if on_progress:
            on_progress(msg)

    seen_ids: set[str] = set()

    for gov in govs:
        if stop_event.is_set():
            log("[STOP] Cancelled by user.")
            break

        gov_name = gov["name"]
        log(f"[SCRAPE] {gov_name} …")

        elements = _overpass_query_universities(gov["lat"], gov["lon"], radius)
        log(f"[SCRAPE] {gov_name}: {len(elements)} raw results from OSM")

        for el in elements:
            if stop_event.is_set():
                break

            rec = _parse_osm_element(el, gov_name)

            # Skip nameless
            if not rec.get("name"):
                continue

            # Deduplicate by external_id
            eid = rec.get("external_id", "")
            if eid in seen_ids:
                continue
            seen_ids.add(eid)

            result.total_scraped += 1

            # ── validate ─────────────────────────────────────────────
            try:
                rec = validate_record(rec)
            except Exception as e:
                result.errors.append(f"{rec.get('name','?')}: {e}")
                continue

            if rec["_status"] == "validated":
                result.validated.append(rec)
            else:
                result.needs_review.append(rec)

        # Rate-limit between governorates
        if not stop_event.is_set():
            log(f"[DONE]  {gov_name}  (validated: {len(result.validated)}, review: {len(result.needs_review)})")
            time.sleep(2)

    result.finished = not stop_event.is_set()
    log(
        f"[FINISHED] Scraped {result.total_scraped} | "
        f"Validated {len(result.validated)} | "
        f"Needs review {len(result.needs_review)} | "
        f"Errors {len(result.errors)}"
    )
    return result
