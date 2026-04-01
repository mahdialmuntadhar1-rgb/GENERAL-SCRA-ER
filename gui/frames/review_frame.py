"""
Review & Approve tab — display staged records, allow editing, and push to Supabase.
"""

from __future__ import annotations

import tkinter as tk
from tkinter import messagebox
from typing import TYPE_CHECKING

import customtkinter as ctk

from db import crud
from utils.validators import find_duplicates

if TYPE_CHECKING:
    from gui.app import App


class ReviewFrame(ctk.CTkFrame):
    def __init__(self, master, app: "App") -> None:
        super().__init__(master)
        self.app = app
        self._selected_indices: set[int] = set()
        self._build_ui()

    # ── UI ───────────────────────────────────────────────────────────────
    def _build_ui(self) -> None:
        # toolbar
        bar = ctk.CTkFrame(self)
        bar.pack(fill="x", padx=8, pady=(8, 4))

        self.count_label = ctk.CTkLabel(bar, text="0 staged records")
        self.count_label.pack(side="left", padx=8)

        ctk.CTkButton(bar, text="Check Duplicates", width=140, command=self._check_dupes).pack(side="left", padx=4)
        ctk.CTkButton(bar, text="Select All", width=100, command=self._select_all).pack(side="left", padx=4)
        ctk.CTkButton(bar, text="Deselect All", width=100, command=self._deselect_all).pack(side="left", padx=4)
        ctk.CTkButton(bar, text="Remove Selected", width=130, fg_color="gray30", command=self._remove_selected).pack(side="left", padx=4)
        ctk.CTkButton(bar, text="Push to Supabase", width=160, fg_color="green", command=self._push).pack(side="right", padx=4)
        ctk.CTkButton(bar, text="Clear All", width=100, fg_color="firebrick", command=self._clear).pack(side="right", padx=4)

        # scrollable list
        self.scroll = ctk.CTkScrollableFrame(self, label_text="Staged Records")
        self.scroll.pack(fill="both", expand=True, padx=8, pady=(4, 8))

    # ── refresh ──────────────────────────────────────────────────────────
    def refresh(self) -> None:
        for w in self.scroll.winfo_children():
            w.destroy()
        self._selected_indices.clear()

        records = self.app.staged_records
        self.count_label.configure(text=f"{len(records)} staged records")

        if not records:
            ctk.CTkLabel(self.scroll, text="No staged records. Use the Import tab to load data.").pack(pady=20)
            return

        # Header
        hdr = ctk.CTkFrame(self.scroll)
        hdr.pack(fill="x", pady=(0, 4))
        for col, w in [("", 40), ("Name", 250), ("Gov.", 120), ("City", 120), ("Type", 90), ("Quality", 90)]:
            ctk.CTkLabel(hdr, text=col, width=w, anchor="w",
                         font=ctk.CTkFont(weight="bold")).pack(side="left", padx=2)

        self._check_vars: list[ctk.BooleanVar] = []
        for idx, rec in enumerate(records):
            row = ctk.CTkFrame(self.scroll)
            row.pack(fill="x", pady=1)

            var = ctk.BooleanVar(value=False)
            self._check_vars.append(var)
            cb = ctk.CTkCheckBox(row, text="", variable=var, width=40,
                                 command=lambda i=idx, v=var: self._toggle(i, v))
            cb.pack(side="left", padx=2)

            ctk.CTkLabel(row, text=rec.get("name", "")[:40], width=250, anchor="w").pack(side="left", padx=2)
            ctk.CTkLabel(row, text=rec.get("_governorate", "") or "", width=120, anchor="w").pack(side="left", padx=2)
            ctk.CTkLabel(row, text=rec.get("_city", "") or "", width=120, anchor="w").pack(side="left", padx=2)
            ctk.CTkLabel(row, text=rec.get("type", ""), width=90, anchor="w").pack(side="left", padx=2)
            ctk.CTkLabel(row, text=rec.get("data_quality", ""), width=90, anchor="w").pack(side="left", padx=2)

    def _toggle(self, idx: int, var: ctk.BooleanVar) -> None:
        if var.get():
            self._selected_indices.add(idx)
        else:
            self._selected_indices.discard(idx)

    # ── actions ──────────────────────────────────────────────────────────
    def _select_all(self) -> None:
        for i, v in enumerate(self._check_vars):
            v.set(True)
            self._selected_indices.add(i)

    def _deselect_all(self) -> None:
        for v in self._check_vars:
            v.set(False)
        self._selected_indices.clear()

    def _remove_selected(self) -> None:
        if not self._selected_indices:
            return
        self.app.staged_records = [
            r for i, r in enumerate(self.app.staged_records)
            if i not in self._selected_indices
        ]
        self.refresh()
        self.app.set_status("Removed selected records from staging")

    def _clear(self) -> None:
        if messagebox.askyesno("Confirm", "Clear all staged records?"):
            self.app.clear_staged()

    def _check_dupes(self) -> None:
        dupes = find_duplicates(
            self.app.staged_records,
            key_fields=("name", "_governorate"),
        )
        if not dupes:
            messagebox.showinfo("Duplicates", "No duplicates found in staged data.")
        else:
            lines = [f"• Rows {idxs}" for _, idxs in list(dupes.items())[:15]]
            messagebox.showwarning(
                "Duplicates found",
                f"{len(dupes)} duplicate groups:\n" + "\n".join(lines),
            )

    # ── push to Supabase ────────────────────────────────────────────────
    def _push(self) -> None:
        records = self.app.staged_records
        if not records:
            messagebox.showinfo("Nothing to push", "Stage some records first.")
            return

        if not messagebox.askyesno("Confirm push", f"Push {len(records)} records to Supabase?"):
            return

        self.app.set_status("Pushing to Supabase…")
        pushed = 0
        errors: list[str] = []

        for idx, rec in enumerate(records):
            try:
                # 1. Resolve governorate
                gov_name = rec.pop("_governorate", None)
                gov_id = None
                if gov_name:
                    gov = crud.get_governorate_by_name(gov_name)
                    if not gov:
                        gov = crud.upsert_governorate({"name": gov_name})
                    gov_id = gov["id"]

                # 2. Resolve city
                city_name = rec.pop("_city", None)
                city_id = None
                if city_name and gov_id:
                    city = crud.get_city_by_name(city_name, gov_id)
                    if not city:
                        city = crud.upsert_city({"name": city_name, "governorate_id": gov_id})
                    city_id = city["id"]

                # 3. Extract staging-only fields
                phone = rec.pop("_phone", None)
                email = rec.pop("_email", None)
                facebook = rec.pop("_facebook", None)
                instagram = rec.pop("_instagram", None)

                # 4. Insert university
                rec["governorate_id"] = gov_id
                rec["city_id"] = city_id
                # Remove None values to let DB defaults apply
                uni_data = {k: v for k, v in rec.items() if v is not None}
                uni = crud.upsert_university(uni_data)
                uni_id = uni["id"]

                # 5. Insert contact records
                if phone:
                    crud.insert_contact({
                        "university_id": uni_id,
                        "contact_type": "phone",
                        "value": phone,
                        "is_primary": True,
                    })
                if email:
                    crud.insert_contact({
                        "university_id": uni_id,
                        "contact_type": "email",
                        "value": email,
                    })

                # 6. Insert social links
                if facebook:
                    try:
                        crud.upsert_social_link({
                            "university_id": uni_id,
                            "platform": "facebook",
                            "url": facebook if facebook.startswith("http") else f"https://facebook.com/{facebook}",
                        })
                    except Exception:
                        pass
                if instagram:
                    try:
                        crud.upsert_social_link({
                            "university_id": uni_id,
                            "platform": "instagram",
                            "url": instagram if instagram.startswith("http") else f"https://instagram.com/{instagram}",
                        })
                    except Exception:
                        pass

                pushed += 1

            except Exception as e:
                errors.append(f"Row {idx + 1} ({rec.get('name', '?')}): {e}")

        self.app.set_status(f"Pushed {pushed}/{len(records)} records")

        if errors:
            preview = "\n".join(errors[:15])
            if len(errors) > 15:
                preview += f"\n… and {len(errors) - 15} more"
            messagebox.showwarning("Push errors", preview)

        if pushed:
            self.app.staged_records.clear()
            self.refresh()
            messagebox.showinfo("Done", f"Successfully pushed {pushed} records to Supabase.")
