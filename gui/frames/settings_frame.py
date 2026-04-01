"""
Settings tab — connection test, seed governorates, quick stats.
"""

from __future__ import annotations

from tkinter import messagebox
from typing import TYPE_CHECKING

import customtkinter as ctk

from db.client import supabase
from db import crud

if TYPE_CHECKING:
    from gui.app import App

# Pre-defined Iraqi governorates for seeding
IRAQ_GOVERNORATES = [
    {"name": "Baghdad",       "name_ar": "بغداد",        "latitude": 33.3152, "longitude": 44.3661},
    {"name": "Basra",         "name_ar": "البصرة",       "latitude": 30.5081, "longitude": 47.7804},
    {"name": "Nineveh",       "name_ar": "نينوى",        "latitude": 36.3350, "longitude": 43.1333},
    {"name": "Erbil",         "name_ar": "أربيل",        "latitude": 36.1911, "longitude": 44.0092},
    {"name": "Sulaymaniyah",  "name_ar": "السليمانية",   "latitude": 35.5553, "longitude": 45.4343},
    {"name": "Duhok",         "name_ar": "دهوك",         "latitude": 36.8635, "longitude": 42.9356},
    {"name": "Kirkuk",        "name_ar": "كركوك",        "latitude": 35.4686, "longitude": 44.3938},
    {"name": "Diyala",        "name_ar": "ديالى",        "latitude": 33.7750, "longitude": 44.9600},
    {"name": "Anbar",         "name_ar": "الأنبار",      "latitude": 33.4333, "longitude": 43.2500},
    {"name": "Maysan",        "name_ar": "ميسان",        "latitude": 31.8369, "longitude": 47.2786},
    {"name": "Muthanna",      "name_ar": "المثنى",       "latitude": 31.3170, "longitude": 45.3000},
    {"name": "Qadisiyyah",    "name_ar": "القادسية",     "latitude": 31.9667, "longitude": 45.0167},
    {"name": "Babil",         "name_ar": "بابل",         "latitude": 32.4640, "longitude": 44.4240},
    {"name": "Wasit",         "name_ar": "واسط",         "latitude": 32.5000, "longitude": 45.8333},
    {"name": "Salahaddin",    "name_ar": "صلاح الدين",   "latitude": 34.6167, "longitude": 43.9333},
    {"name": "Najaf",         "name_ar": "النجف",        "latitude": 32.0280, "longitude": 44.3860},
    {"name": "Karbala",       "name_ar": "كربلاء",       "latitude": 32.6167, "longitude": 44.0333},
    {"name": "Dhi Qar",       "name_ar": "ذي قار",       "latitude": 31.0500, "longitude": 46.2667},
]


class SettingsFrame(ctk.CTkFrame):
    def __init__(self, master, app: "App") -> None:
        super().__init__(master)
        self.app = app
        self._build_ui()

    def _build_ui(self) -> None:
        pad = {"padx": 12, "pady": 6}

        ctk.CTkLabel(self, text="Settings & Utilities",
                     font=ctk.CTkFont(size=18, weight="bold")).pack(**pad)

        # Connection test
        ctk.CTkButton(self, text="Test Supabase Connection", width=250,
                      command=self._test_connection).pack(**pad)
        self.conn_label = ctk.CTkLabel(self, text="")
        self.conn_label.pack(**pad)

        ctk.CTkFrame(self, height=2, fg_color="gray40").pack(fill="x", padx=12, pady=8)

        # Seed governorates
        ctk.CTkButton(self, text="Seed 18 Iraqi Governorates", width=250,
                      command=self._seed_governorates).pack(**pad)
        self.seed_label = ctk.CTkLabel(self, text="")
        self.seed_label.pack(**pad)

        ctk.CTkFrame(self, height=2, fg_color="gray40").pack(fill="x", padx=12, pady=8)

        # Quick stats
        ctk.CTkButton(self, text="Show Platform Stats", width=250,
                      command=self._show_stats).pack(**pad)
        self.stats_text = ctk.CTkTextbox(self, height=140, state="disabled")
        self.stats_text.pack(fill="x", padx=12, pady=6)

        ctk.CTkFrame(self, height=2, fg_color="gray40").pack(fill="x", padx=12, pady=8)

        # Appearance
        ctk.CTkLabel(self, text="Appearance:").pack(**pad)
        mode_menu = ctk.CTkOptionMenu(
            self, values=["Dark", "Light", "System"],
            command=lambda v: ctk.set_appearance_mode(v.lower()),
        )
        mode_menu.set("Dark")
        mode_menu.pack(**pad)

    # ── actions ──────────────────────────────────────────────────────────
    def _test_connection(self) -> None:
        try:
            resp = supabase.table("governorates").select("id").limit(1).execute()
            self.conn_label.configure(
                text="Connected to Supabase successfully!",
                text_color="green",
            )
        except Exception as e:
            self.conn_label.configure(
                text=f"Connection failed: {e}",
                text_color="red",
            )

    def _seed_governorates(self) -> None:
        if not messagebox.askyesno("Confirm", "Upsert all 18 Iraqi governorates?"):
            return
        count = 0
        for gov in IRAQ_GOVERNORATES:
            try:
                crud.upsert_governorate(gov)
                count += 1
            except Exception as e:
                print(f"[WARN] Failed to seed {gov['name']}: {e}")
        self.seed_label.configure(text=f"Seeded {count}/18 governorates")
        self.app.set_status(f"Seeded {count} governorates")

    def _show_stats(self) -> None:
        try:
            stats = crud.get_platform_stats()
            self.stats_text.configure(state="normal")
            self.stats_text.delete("1.0", "end")
            for key, val in stats.items():
                self.stats_text.insert("end", f"{key}: {val}\n")
            self.stats_text.configure(state="disabled")
        except Exception as e:
            self.stats_text.configure(state="normal")
            self.stats_text.delete("1.0", "end")
            self.stats_text.insert("end", f"Error: {e}")
            self.stats_text.configure(state="disabled")
