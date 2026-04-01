"""
Main CustomTkinter application — tabbed interface.
"""

import customtkinter as ctk

from gui.frames.import_frame import ImportFrame
from gui.frames.scraper_frame import ScraperFrame
from gui.frames.review_frame import ReviewFrame
from gui.frames.browse_frame import BrowseFrame
from gui.frames.settings_frame import SettingsFrame


class App(ctk.CTk):
    def __init__(self) -> None:
        super().__init__()

        # ── window setup ─────────────────────────────────────────────────
        self.title("Iraq University Platform")
        self.geometry("1200x750")
        self.minsize(900, 600)
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")

        # ── shared staging list (local memory before push) ───────────────
        self.staged_records: list[dict] = []

        # ── tab view ─────────────────────────────────────────────────────
        self.tabview = ctk.CTkTabview(self, anchor="nw")
        self.tabview.pack(fill="both", expand=True, padx=10, pady=10)

        tab_import   = self.tabview.add("Import")
        tab_scraper  = self.tabview.add("Scraper")
        tab_review   = self.tabview.add("Review & Approve")
        tab_browse   = self.tabview.add("Browse Data")
        tab_settings = self.tabview.add("Settings")

        # ── frames ───────────────────────────────────────────────────────
        self.import_frame   = ImportFrame(tab_import, app=self)
        self.scraper_frame  = ScraperFrame(tab_scraper, app=self)
        self.review_frame   = ReviewFrame(tab_review, app=self)
        self.browse_frame   = BrowseFrame(tab_browse, app=self)
        self.settings_frame = SettingsFrame(tab_settings, app=self)

        self.import_frame.pack(fill="both", expand=True)
        self.scraper_frame.pack(fill="both", expand=True)
        self.review_frame.pack(fill="both", expand=True)
        self.browse_frame.pack(fill="both", expand=True)
        self.settings_frame.pack(fill="both", expand=True)

        # ── status bar ───────────────────────────────────────────────────
        self.status_var = ctk.StringVar(value="Ready")
        self.status_bar = ctk.CTkLabel(
            self, textvariable=self.status_var, anchor="w",
            font=ctk.CTkFont(size=12),
        )
        self.status_bar.pack(fill="x", padx=12, pady=(0, 6))

    # ── helpers available to child frames ────────────────────────────────
    def set_status(self, msg: str) -> None:
        self.status_var.set(msg)
        self.update_idletasks()

    def stage_records(self, records: list[dict]) -> None:
        """Add validated records to the staging area."""
        self.staged_records.extend(records)
        self.set_status(f"Staged {len(records)} records  (total staged: {len(self.staged_records)})")
        self.review_frame.refresh()

    def clear_staged(self) -> None:
        self.staged_records.clear()
        self.review_frame.refresh()
        self.set_status("Staging area cleared")
