"""
Browse Data tab — query universities stored in Supabase and view details.
"""

from __future__ import annotations

from tkinter import messagebox
from typing import TYPE_CHECKING

import customtkinter as ctk

from db import crud

if TYPE_CHECKING:
    from gui.app import App


class BrowseFrame(ctk.CTkFrame):
    def __init__(self, master, app: "App") -> None:
        super().__init__(master)
        self.app = app
        self._universities: list[dict] = []
        self._build_ui()

    def _build_ui(self) -> None:
        # ── search bar ───────────────────────────────────────────────────
        bar = ctk.CTkFrame(self)
        bar.pack(fill="x", padx=8, pady=(8, 4))

        ctk.CTkLabel(bar, text="Search:").pack(side="left", padx=(8, 4))
        self.search_var = ctk.StringVar()
        self.search_entry = ctk.CTkEntry(bar, textvariable=self.search_var, width=280)
        self.search_entry.pack(side="left", padx=4)
        self.search_entry.bind("<Return>", lambda _: self._do_search())

        ctk.CTkButton(bar, text="Search", width=80, command=self._do_search).pack(side="left", padx=4)
        ctk.CTkButton(bar, text="Load All", width=80, command=self._load_all).pack(side="left", padx=4)
        ctk.CTkButton(bar, text="Refresh Stats", width=110, command=self._show_stats).pack(side="right", padx=4)

        self.stats_label = ctk.CTkLabel(bar, text="", anchor="e")
        self.stats_label.pack(side="right", padx=8)

        # ── results list ─────────────────────────────────────────────────
        self.scroll = ctk.CTkScrollableFrame(self, label_text="Universities")
        self.scroll.pack(fill="both", expand=True, padx=8, pady=(4, 4))

        # ── detail panel ─────────────────────────────────────────────────
        self.detail_frame = ctk.CTkFrame(self, height=180)
        self.detail_frame.pack(fill="x", padx=8, pady=(0, 8))
        self.detail_label = ctk.CTkLabel(
            self.detail_frame, text="Select a university above to view details.",
            anchor="nw", justify="left", wraplength=1100,
        )
        self.detail_label.pack(fill="both", expand=True, padx=8, pady=8)

    # ── data loading ─────────────────────────────────────────────────────
    def _load_all(self) -> None:
        self.app.set_status("Loading universities…")
        try:
            self._universities = crud.list_universities(limit=500)
            self._render_list()
            self.app.set_status(f"Loaded {len(self._universities)} universities")
        except Exception as e:
            messagebox.showerror("Error", str(e))

    def _do_search(self) -> None:
        q = self.search_var.get().strip()
        if not q:
            self._load_all()
            return
        self.app.set_status(f"Searching '{q}'…")
        try:
            self._universities = crud.search_universities(q)
            self._render_list()
            self.app.set_status(f"Found {len(self._universities)} results")
        except Exception as e:
            messagebox.showerror("Error", str(e))

    def _show_stats(self) -> None:
        try:
            stats = crud.get_platform_stats()
            parts = [f"{k}: {v}" for k, v in stats.items()]
            self.stats_label.configure(text="  |  ".join(parts))
        except Exception as e:
            self.stats_label.configure(text=f"Error: {e}")

    # ── rendering ────────────────────────────────────────────────────────
    def _render_list(self) -> None:
        for w in self.scroll.winfo_children():
            w.destroy()

        if not self._universities:
            ctk.CTkLabel(self.scroll, text="No results.").pack(pady=20)
            return

        # header
        hdr = ctk.CTkFrame(self.scroll)
        hdr.pack(fill="x", pady=(0, 4))
        for col, w in [("Name", 280), ("Governorate", 140), ("City", 140), ("Type", 100), ("Quality", 90), ("Verified", 70)]:
            ctk.CTkLabel(hdr, text=col, width=w, anchor="w",
                         font=ctk.CTkFont(weight="bold")).pack(side="left", padx=2)

        for uni in self._universities:
            row = ctk.CTkFrame(self.scroll)
            row.pack(fill="x", pady=1)

            gov_name = ""
            if isinstance(uni.get("governorates"), dict):
                gov_name = uni["governorates"].get("name", "")
            city_name = ""
            if isinstance(uni.get("cities"), dict):
                city_name = uni["cities"].get("name", "")

            ctk.CTkLabel(row, text=(uni.get("name") or "")[:45], width=280, anchor="w").pack(side="left", padx=2)
            ctk.CTkLabel(row, text=gov_name, width=140, anchor="w").pack(side="left", padx=2)
            ctk.CTkLabel(row, text=city_name, width=140, anchor="w").pack(side="left", padx=2)
            ctk.CTkLabel(row, text=uni.get("type", ""), width=100, anchor="w").pack(side="left", padx=2)
            ctk.CTkLabel(row, text=uni.get("data_quality", ""), width=90, anchor="w").pack(side="left", padx=2)
            verified_text = "Yes" if uni.get("verified") else "No"
            ctk.CTkLabel(row, text=verified_text, width=70, anchor="w").pack(side="left", padx=2)

            row.bind("<Button-1>", lambda e, u=uni: self._show_detail(u))
            for child in row.winfo_children():
                child.bind("<Button-1>", lambda e, u=uni: self._show_detail(u))

    def _show_detail(self, uni: dict) -> None:
        uni_id = uni.get("id", "")
        lines = [
            f"Name: {uni.get('name', '')}",
            f"Arabic: {uni.get('name_ar', '') or '—'}",
            f"English: {uni.get('name_en', '') or '—'}",
            f"Type: {uni.get('type', '')}  |  Quality: {uni.get('data_quality', '')}  |  Verified: {uni.get('verified')}",
            f"Address: {uni.get('address', '') or '—'}",
            f"Website: {uni.get('website', '') or '—'}",
            f"Founded: {uni.get('founded_year') or '—'}",
            f"Coords: {uni.get('latitude', '—')}, {uni.get('longitude', '—')}",
        ]

        # Fetch contacts and social links
        try:
            contacts = crud.list_contacts(uni_id)
            if contacts:
                lines.append("Contacts: " + ", ".join(
                    f"{c['contact_type']}: {c['value']}" for c in contacts
                ))
            socials = crud.list_social_links(uni_id)
            if socials:
                lines.append("Social: " + ", ".join(
                    f"{s['platform']}: {s['url']}" for s in socials
                ))
        except Exception:
            pass

        self.detail_label.configure(text="\n".join(lines))
