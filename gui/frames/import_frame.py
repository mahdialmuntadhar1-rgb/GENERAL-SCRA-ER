"""
Import tab — load CSV / Excel / JSON, map columns, validate, and stage records.
"""

from __future__ import annotations

import tkinter as tk
from tkinter import filedialog, messagebox
from typing import TYPE_CHECKING

import customtkinter as ctk

from utils.importers import load_file, detect_column_mapping, SUPPORTED_EXTENSIONS
from utils.validators import validate_phone, validate_email, validate_url
from utils.text_utils import clean_text, safe_string, safe_float, safe_int

if TYPE_CHECKING:
    from gui.app import App


class ImportFrame(ctk.CTkFrame):
    def __init__(self, master, app: "App") -> None:
        super().__init__(master)
        self.app = app
        self._raw_records: list[dict] = []
        self._column_map: dict[str, str | None] = {}
        self._build_ui()

    # ── UI construction ──────────────────────────────────────────────────
    def _build_ui(self) -> None:
        # Top bar — file picker
        top = ctk.CTkFrame(self)
        top.pack(fill="x", padx=8, pady=(8, 4))

        self.file_label = ctk.CTkLabel(top, text="No file loaded", anchor="w")
        self.file_label.pack(side="left", padx=8, expand=True, fill="x")

        ctk.CTkButton(top, text="Open File…", width=120, command=self._open_file).pack(side="right", padx=4)

        # Column mapping area
        self.map_frame = ctk.CTkScrollableFrame(self, label_text="Column Mapping")
        self.map_frame.pack(fill="both", expand=True, padx=8, pady=4)

        # Stats + actions
        bot = ctk.CTkFrame(self)
        bot.pack(fill="x", padx=8, pady=(4, 8))

        self.stats_label = ctk.CTkLabel(bot, text="", anchor="w")
        self.stats_label.pack(side="left", padx=8)

        ctk.CTkButton(bot, text="Validate & Stage", width=160, command=self._validate_and_stage).pack(side="right", padx=4)

    # ── file loading ─────────────────────────────────────────────────────
    def _open_file(self) -> None:
        ftypes = [
            ("Supported files", "*.csv *.xlsx *.xls *.json"),
            ("CSV", "*.csv"),
            ("Excel", "*.xlsx *.xls"),
            ("JSON", "*.json"),
        ]
        path = filedialog.askopenfilename(filetypes=ftypes)
        if not path:
            return
        try:
            self._raw_records = load_file(path)
        except Exception as e:
            messagebox.showerror("Import Error", str(e))
            return

        self.file_label.configure(text=f"{path}  ({len(self._raw_records)} rows)")
        self.app.set_status(f"Loaded {len(self._raw_records)} rows from file")
        self._show_mapping()

    # ── column mapping UI ────────────────────────────────────────────────
    def _show_mapping(self) -> None:
        # clear previous widgets
        for w in self.map_frame.winfo_children():
            w.destroy()

        if not self._raw_records:
            return

        source_cols = list(self._raw_records[0].keys())
        auto_map = detect_column_mapping(source_cols)

        self._combo_vars: dict[str, ctk.StringVar] = {}
        options = ["— skip —"] + source_cols

        row = 0
        for field, auto_col in auto_map.items():
            ctk.CTkLabel(self.map_frame, text=field, width=140, anchor="e").grid(
                row=row, column=0, padx=(4, 8), pady=2, sticky="e"
            )
            var = ctk.StringVar(value=auto_col if auto_col else "— skip —")
            combo = ctk.CTkComboBox(self.map_frame, values=options, variable=var, width=220)
            combo.grid(row=row, column=1, padx=4, pady=2, sticky="w")
            self._combo_vars[field] = var
            row += 1

    # ── validation ───────────────────────────────────────────────────────
    def _validate_and_stage(self) -> None:
        if not self._raw_records:
            messagebox.showwarning("No data", "Load a file first.")
            return

        # Build mapping from combo boxes
        mapping: dict[str, str | None] = {}
        for field, var in self._combo_vars.items():
            val = var.get()
            mapping[field] = None if val == "— skip —" else val

        # Validate & transform rows
        valid_rows: list[dict] = []
        errors: list[str] = []

        for idx, raw in enumerate(self._raw_records, start=1):
            name = safe_string(raw.get(mapping.get("name", ""), ""))
            if not name:
                errors.append(f"Row {idx}: missing name — skipped")
                continue

            rec: dict = {
                "name": clean_text(name),
                "name_ar": safe_string(raw.get(mapping.get("name_ar", ""), "")),
                "name_en": safe_string(raw.get(mapping.get("name_en", ""), "")),
                "type": safe_string(raw.get(mapping.get("type", ""), ""), "unknown"),
                "address": safe_string(raw.get(mapping.get("address", ""), "")),
                "latitude": safe_float(raw.get(mapping.get("latitude", ""), None)),
                "longitude": safe_float(raw.get(mapping.get("longitude", ""), None)),
                "founded_year": safe_int(raw.get(mapping.get("founded_year", ""), None)),
                "description": safe_string(raw.get(mapping.get("description", ""), "")),
                "data_quality": "unverified",
                "verified": False,
                "source": "import",
            }

            # Validate website
            raw_web = safe_string(raw.get(mapping.get("website", ""), ""))
            rec["website"] = validate_url(raw_web) if raw_web else None

            # Extra fields for staging only (not in universities table)
            raw_phone = safe_string(raw.get(mapping.get("phone", ""), ""))
            rec["_phone"] = validate_phone(raw_phone) if raw_phone else None
            if raw_phone and not rec["_phone"]:
                errors.append(f"Row {idx}: invalid phone '{raw_phone}'")

            raw_email = safe_string(raw.get(mapping.get("email", ""), ""))
            rec["_email"] = validate_email(raw_email) if raw_email else None
            if raw_email and not rec["_email"]:
                errors.append(f"Row {idx}: invalid email '{raw_email}'")

            rec["_facebook"] = safe_string(raw.get(mapping.get("facebook", ""), "")) or None
            rec["_instagram"] = safe_string(raw.get(mapping.get("instagram", ""), "")) or None
            rec["_governorate"] = safe_string(raw.get(mapping.get("governorate", ""), "")) or None
            rec["_city"] = safe_string(raw.get(mapping.get("city", ""), "")) or None

            valid_rows.append(rec)

        # Summary
        summary = f"Valid: {len(valid_rows)}  |  Errors: {len(errors)}"
        self.stats_label.configure(text=summary)

        if errors:
            # Show first 20 errors
            preview = "\n".join(errors[:20])
            if len(errors) > 20:
                preview += f"\n... and {len(errors) - 20} more"
            messagebox.showwarning("Validation warnings", preview)

        if valid_rows:
            self.app.stage_records(valid_rows)
            messagebox.showinfo("Staged", f"{len(valid_rows)} records staged for review.")
