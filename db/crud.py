"""
CRUD operations for every Supabase table.
Uses the lightweight REST client in db.client (requests-based).
API mirrors supabase-py: .insert(), .select(), .update(), .delete()
"""

from __future__ import annotations

from typing import Any, Optional

from db.client import supabase


# ── helpers ──────────────────────────────────────────────────────────────────

def _exec(query) -> list[dict]:
    """Execute a PostgREST query and return .data (list of dicts)."""
    response = query.execute()
    return response.data or []


# ============================================================================
# GOVERNORATES
# ============================================================================

def list_governorates() -> list[dict]:
    return _exec(supabase.table("governorates").select("*").order("name"))


def get_governorate(gov_id: str) -> Optional[dict]:
    rows = _exec(supabase.table("governorates").select("*").eq("id", gov_id))
    return rows[0] if rows else None


def get_governorate_by_name(name: str) -> Optional[dict]:
    rows = _exec(supabase.table("governorates").select("*").eq("name", name))
    return rows[0] if rows else None


def upsert_governorate(data: dict) -> dict:
    return _exec(
        supabase.table("governorates")
        .upsert(data, on_conflict="name")
    )[0]


def delete_governorate(gov_id: str) -> None:
    supabase.table("governorates").delete().eq("id", gov_id).execute()


# ============================================================================
# CITIES
# ============================================================================

def list_cities(governorate_id: Optional[str] = None) -> list[dict]:
    q = supabase.table("cities").select("*, governorates(name)")
    if governorate_id:
        q = q.eq("governorate_id", governorate_id)
    return _exec(q.order("name"))


def get_city(city_id: str) -> Optional[dict]:
    rows = _exec(supabase.table("cities").select("*").eq("id", city_id))
    return rows[0] if rows else None


def get_city_by_name(name: str, governorate_id: str) -> Optional[dict]:
    rows = _exec(
        supabase.table("cities")
        .select("*")
        .eq("name", name)
        .eq("governorate_id", governorate_id)
    )
    return rows[0] if rows else None


def upsert_city(data: dict) -> dict:
    return _exec(
        supabase.table("cities")
        .upsert(data, on_conflict="name,governorate_id")
    )[0]


def delete_city(city_id: str) -> None:
    supabase.table("cities").delete().eq("id", city_id).execute()


# ============================================================================
# UNIVERSITIES
# ============================================================================

def list_universities(
    governorate_id: Optional[str] = None,
    city_id: Optional[str] = None,
    quality: Optional[str] = None,
    limit: int = 200,
    offset: int = 0,
) -> list[dict]:
    q = supabase.table("universities").select(
        "*, governorates(name), cities(name)"
    )
    if governorate_id:
        q = q.eq("governorate_id", governorate_id)
    if city_id:
        q = q.eq("city_id", city_id)
    if quality:
        q = q.eq("data_quality", quality)
    return _exec(q.order("name").range(offset, offset + limit - 1))


def get_university(uni_id: str) -> Optional[dict]:
    rows = _exec(supabase.table("universities").select("*").eq("id", uni_id))
    return rows[0] if rows else None


def insert_university(data: dict) -> dict:
    return _exec(supabase.table("universities").insert(data))[0]


def upsert_university(data: dict) -> dict:
    return _exec(
        supabase.table("universities")
        .upsert(data, on_conflict="name,governorate_id")
    )[0]


def update_university(uni_id: str, data: dict) -> dict:
    return _exec(
        supabase.table("universities").update(data).eq("id", uni_id)
    )[0]


def delete_university(uni_id: str) -> None:
    supabase.table("universities").delete().eq("id", uni_id).execute()


def search_universities(query: str, limit: int = 50) -> list[dict]:
    return _exec(
        supabase.table("universities")
        .select("*, governorates(name), cities(name)")
        .ilike("name", f"%{query}%")
        .limit(limit)
    )


def count_universities() -> int:
    resp = (
        supabase.table("universities")
        .select("id", count="exact")
        .execute()
    )
    return resp.count or 0


# ============================================================================
# UNIVERSITY_CONTACTS
# ============================================================================

def list_contacts(university_id: str) -> list[dict]:
    return _exec(
        supabase.table("university_contacts")
        .select("*")
        .eq("university_id", university_id)
        .order("is_primary", desc=True)
    )


def insert_contact(data: dict) -> dict:
    return _exec(supabase.table("university_contacts").insert(data))[0]


def update_contact(contact_id: str, data: dict) -> dict:
    return _exec(
        supabase.table("university_contacts").update(data).eq("id", contact_id)
    )[0]


def delete_contact(contact_id: str) -> None:
    supabase.table("university_contacts").delete().eq("id", contact_id).execute()


# ============================================================================
# SOCIAL_LINKS
# ============================================================================

def list_social_links(university_id: str) -> list[dict]:
    return _exec(
        supabase.table("social_links")
        .select("*")
        .eq("university_id", university_id)
    )


def upsert_social_link(data: dict) -> dict:
    return _exec(
        supabase.table("social_links")
        .upsert(data, on_conflict="university_id,platform")
    )[0]


def delete_social_link(link_id: str) -> None:
    supabase.table("social_links").delete().eq("id", link_id).execute()


# ============================================================================
# POSTS
# ============================================================================

def list_posts(university_id: Optional[str] = None, limit: int = 50) -> list[dict]:
    q = supabase.table("posts").select("*")
    if university_id:
        q = q.eq("university_id", university_id)
    return _exec(q.order("created_at", desc=True).limit(limit))


def insert_post(data: dict) -> dict:
    return _exec(supabase.table("posts").insert(data))[0]


def update_post(post_id: str, data: dict) -> dict:
    return _exec(supabase.table("posts").update(data).eq("id", post_id))[0]


def delete_post(post_id: str) -> None:
    supabase.table("posts").delete().eq("id", post_id).execute()


# ============================================================================
# OPPORTUNITIES
# ============================================================================

def list_opportunities(university_id: Optional[str] = None, limit: int = 50) -> list[dict]:
    q = supabase.table("opportunities").select("*")
    if university_id:
        q = q.eq("university_id", university_id)
    return _exec(q.order("created_at", desc=True).limit(limit))


def insert_opportunity(data: dict) -> dict:
    return _exec(supabase.table("opportunities").insert(data))[0]


def update_opportunity(opp_id: str, data: dict) -> dict:
    return _exec(
        supabase.table("opportunities").update(data).eq("id", opp_id)
    )[0]


def delete_opportunity(opp_id: str) -> None:
    supabase.table("opportunities").delete().eq("id", opp_id).execute()


# ============================================================================
# STATS (view)
# ============================================================================

def get_platform_stats() -> dict:
    rows = _exec(supabase.table("platform_stats").select("*"))
    return rows[0] if rows else {}
