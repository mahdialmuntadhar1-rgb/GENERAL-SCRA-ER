"""
Lightweight Supabase REST client built on `requests`.
Mirrors the supabase-py table() builder we need:
    supabase.table("x").select(...).eq(...).execute()
    supabase.table("x").insert(data).execute()
    supabase.table("x").upsert(data, on_conflict="col").execute()
    supabase.table("x").update(data).eq(...).execute()
    supabase.table("x").delete().eq(...).execute()

Works on Python 3.15 alpha without native-extension dependencies.
"""

from __future__ import annotations

import os
import sys
from typing import Any, Optional

import requests as _requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL: str = os.environ.get("SCRAPER_SUPABASE_URL") or os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY: str = os.environ.get("SCRAPER_SUPABASE_KEY") or os.environ.get("SUPABASE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    print(
        "[WARN] SCRAPER_SUPABASE_URL and SCRAPER_SUPABASE_KEY not set in .env\n"
        "       Copy .env.example → .env and fill in your Supabase values.\n"
        "       WARNING: Do NOT use credentials from the public 'belive' database.\n"
        "       The app will launch but Supabase operations will fail."
    )


# ── Response wrapper ─────────────────────────────────────────────────────

class SupabaseResponse:
    """Wraps the HTTP response to expose .data and .count."""

    def __init__(self, data: list[dict], count: int | None = None) -> None:
        self.data = data
        self.count = count


# ── Query builder ────────────────────────────────────────────────────────

class QueryBuilder:
    """Chainable PostgREST query builder for a single table."""

    def __init__(self, url: str, key: str, table: str) -> None:
        self._base = f"{url}/rest/v1/{table}"
        self._key = key
        self._method: str = "GET"
        self._headers: dict[str, str] = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        }
        self._params: dict[str, str] = {}
        self._body: Any = None
        self._count_mode: str | None = None
        self._range_from: int | None = None
        self._range_to: int | None = None

    # ── verb starters ────────────────────────────────────────────────

    def select(self, columns: str = "*", *, count: str | None = None) -> "QueryBuilder":
        self._method = "GET"
        self._params["select"] = columns
        if count == "exact":
            self._headers["Prefer"] = "count=exact"
            self._count_mode = "exact"
        return self

    def insert(self, data: dict | list[dict]) -> "QueryBuilder":
        self._method = "POST"
        self._headers["Prefer"] = "return=representation"
        self._body = data if isinstance(data, list) else [data]
        return self

    def upsert(self, data: dict | list[dict], *, on_conflict: str = "") -> "QueryBuilder":
        self._method = "POST"
        prefer = "return=representation,resolution=merge-duplicates"
        self._headers["Prefer"] = prefer
        self._body = data if isinstance(data, list) else [data]
        if on_conflict:
            self._params["on_conflict"] = on_conflict
        return self

    def update(self, data: dict) -> "QueryBuilder":
        self._method = "PATCH"
        self._headers["Prefer"] = "return=representation"
        self._body = data
        return self

    def delete(self) -> "QueryBuilder":
        self._method = "DELETE"
        self._headers["Prefer"] = "return=representation"
        return self

    # ── filters ──────────────────────────────────────────────────────

    def eq(self, column: str, value: Any) -> "QueryBuilder":
        self._params[column] = f"eq.{value}"
        return self

    def neq(self, column: str, value: Any) -> "QueryBuilder":
        self._params[column] = f"neq.{value}"
        return self

    def ilike(self, column: str, pattern: str) -> "QueryBuilder":
        self._params[column] = f"ilike.{pattern}"
        return self

    def order(self, column: str, *, desc: bool = False) -> "QueryBuilder":
        direction = "desc" if desc else "asc"
        self._params["order"] = f"{column}.{direction}"
        return self

    def limit(self, n: int) -> "QueryBuilder":
        self._params["limit"] = str(n)
        return self

    def range(self, start: int, end: int) -> "QueryBuilder":
        self._range_from = start
        self._range_to = end
        return self

    # ── execute ──────────────────────────────────────────────────────

    def execute(self) -> SupabaseResponse:
        headers = dict(self._headers)
        if self._range_from is not None and self._range_to is not None:
            headers["Range"] = f"{self._range_from}-{self._range_to}"
            headers["Range-Unit"] = "items"

        if self._method == "GET":
            resp = _requests.get(self._base, headers=headers, params=self._params, timeout=30)
        elif self._method == "POST":
            resp = _requests.post(
                self._base, headers=headers, params=self._params, json=self._body, timeout=30
            )
        elif self._method == "PATCH":
            resp = _requests.patch(
                self._base, headers=headers, params=self._params, json=self._body, timeout=30
            )
        elif self._method == "DELETE":
            resp = _requests.delete(self._base, headers=headers, params=self._params, timeout=30)
        else:
            raise ValueError(f"Unsupported method: {self._method}")

        if resp.status_code >= 400:
            raise RuntimeError(
                f"Supabase {self._method} error {resp.status_code}: {resp.text[:300]}"
            )

        data = resp.json() if resp.text else []
        count = None
        if self._count_mode == "exact":
            cr = resp.headers.get("Content-Range", "")
            if "/" in cr:
                try:
                    count = int(cr.split("/")[1])
                except ValueError:
                    pass

        return SupabaseResponse(data=data, count=count)


# ── Client facade ────────────────────────────────────────────────────────

class SupabaseClient:
    """Minimal Supabase client — call supabase.table("name") to start a query."""

    def __init__(self, url: str, key: str) -> None:
        self.url = url.rstrip("/")
        self.key = key

    def table(self, name: str) -> QueryBuilder:
        return QueryBuilder(self.url, self.key, name)


# Singleton
supabase = SupabaseClient(SUPABASE_URL, SUPABASE_KEY)
