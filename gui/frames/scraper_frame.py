"""
Scraper tab — Start/Stop scraping with a background thread.
Shows real-time log, classifies results as validated / needs_review,
and lets the user push validated data to Supabase.
"""

from __future__ import annotations

import threading
import queue
from tkinter import messagebox
from typing import TYPE_CHECKING

import customtkinter as ctk

from scraper.pipeline import run_pipeline, IRAQ_GOVERNORATES, PipelineResult
from db import crud

if TYPE_CHECKING:
    from gui.app import App


class ScraperFrame(ctk.CTkFrame):
    def __init__(self, master, app: "App") -> None:
        super().__init__(master)
        self.app = app

        # Threading state
        self._stop_event = threading.Event()
        self._thread: threading.Thread | None = None
        self._log_queue: queue.Queue[str] = queue.Queue()
        self._result: PipelineResult | None = None

        self._build_ui()

    # ── UI ───────────────────────────────────────────────────────────────
    def _build_ui(self) -> None:
        # ── toolbar ──────────────────────────────────────────────────
        bar = ctk.CTkFrame(self)
        bar.pack(fill="x", padx=8, pady=(8, 4))

        self.start_btn = ctk.CTkButton(
            bar, text="▶  Start Scraping", width=160,
            fg_color="green", command=self._start,
        )
        self.start_btn.pack(side="left", padx=4)

        self.stop_btn = ctk.CTkButton(
            bar, text="■  Stop", width=100,
            fg_color="firebrick", state="disabled", command=self._stop,
        )
        self.stop_btn.pack(side="left", padx=4)

        self.status_label = ctk.CTkLabel(bar, text="Idle", anchor="w")
        self.status_label.pack(side="left", padx=12, fill="x", expand=True)

        # ── config row ───────────────────────────────────────────────
        cfg = ctk.CTkFrame(self)
        cfg.pack(fill="x", padx=8, pady=2)

        ctk.CTkLabel(cfg, text="Radius (m):").pack(side="left", padx=(8, 4))
        self.radius_var = ctk.StringVar(value="30000")
        ctk.CTkEntry(cfg, textvariable=self.radius_var, width=80).pack(side="left", padx=4)

        ctk.CTkLabel(cfg, text="Governorates:").pack(side="left", padx=(16, 4))
        self.gov_var = ctk.StringVar(value="All 18")
        ctk.CTkOptionMenu(
            cfg, values=["All 18"] + [g["name"] for g in IRAQ_GOVERNORATES],
            variable=self.gov_var, width=160,
        ).pack(side="left", padx=4)

        # ── log area ─────────────────────────────────────────────────
        self.log_box = ctk.CTkTextbox(self, state="disabled", wrap="word")
        self.log_box.pack(fill="both", expand=True, padx=8, pady=4)

        # ── results bar ──────────────────────────────────────────────
        res = ctk.CTkFrame(self)
        res.pack(fill="x", padx=8, pady=(4, 8))

        self.result_label = ctk.CTkLabel(res, text="No results yet.", anchor="w")
        self.result_label.pack(side="left", padx=8, fill="x", expand=True)

        ctk.CTkButton(
            res, text="Stage Validated", width=140,
            command=self._stage_validated,
        ).pack(side="right", padx=4)

        ctk.CTkButton(
            res, text="Stage Needs Review", width=160,
            command=self._stage_needs_review,
        ).pack(side="right", padx=4)

        ctk.CTkButton(
            res, text="Push Validated → Supabase", width=200,
            fg_color="green", command=self._push_validated,
        ).pack(side="right", padx=4)

    # ── start / stop ─────────────────────────────────────────────────────
    def _start(self) -> None:
        if self._thread and self._thread.is_alive():
            return

        self._stop_event.clear()
        self._result = None
        self._clear_log()
        self._set_running(True)

        # Resolve governorates selection
        choice = self.gov_var.get()
        if choice == "All 18":
            govs = None  # pipeline defaults to all
        else:
            govs = [g for g in IRAQ_GOVERNORATES if g["name"] == choice]

        radius = int(self.radius_var.get() or 30000)

        self._thread = threading.Thread(
            target=self._run_in_thread, args=(govs, radius), daemon=True
        )
        self._thread.start()
        self._poll_log()

    def _stop(self) -> None:
        self._stop_event.set()
        self.status_label.configure(text="Stopping…")

    def _run_in_thread(self, govs, radius) -> None:
        """Runs in background thread — must NOT touch tkinter directly."""
        try:
            self._result = run_pipeline(
                governorates=govs,
                radius=radius,
                stop_event=self._stop_event,
                on_progress=lambda msg: self._log_queue.put(msg),
            )
        except Exception as e:
            self._log_queue.put(f"[ERROR] {e}")
        finally:
            self._log_queue.put("__DONE__")

    # ── log polling (runs on main thread via after()) ────────────────────
    def _poll_log(self) -> None:
        while True:
            try:
                msg = self._log_queue.get_nowait()
            except queue.Empty:
                break
            if msg == "__DONE__":
                self._set_running(False)
                self._show_result_summary()
                return
            self._append_log(msg)

        self.after(200, self._poll_log)

    def _append_log(self, text: str) -> None:
        self.log_box.configure(state="normal")
        self.log_box.insert("end", text + "\n")
        self.log_box.see("end")
        self.log_box.configure(state="disabled")

    def _clear_log(self) -> None:
        self.log_box.configure(state="normal")
        self.log_box.delete("1.0", "end")
        self.log_box.configure(state="disabled")

    def _set_running(self, running: bool) -> None:
        if running:
            self.start_btn.configure(state="disabled")
            self.stop_btn.configure(state="normal")
            self.status_label.configure(text="Scraping…")
            self.app.set_status("Scraper running")
        else:
            self.start_btn.configure(state="normal")
            self.stop_btn.configure(state="disabled")
            self.status_label.configure(text="Idle")
            self.app.set_status("Scraper idle")

    def _show_result_summary(self) -> None:
        r = self._result
        if not r:
            return
        self.result_label.configure(
            text=(
                f"Scraped: {r.total_scraped}  |  "
                f"Validated: {len(r.validated)}  |  "
                f"Needs review: {len(r.needs_review)}  |  "
                f"Errors: {len(r.errors)}"
            )
        )

    # ── result actions ───────────────────────────────────────────────────
    def _stage_validated(self) -> None:
        if not self._result or not self._result.validated:
            messagebox.showinfo("Nothing", "No validated records to stage.")
            return
        self.app.stage_records(list(self._result.validated))
        messagebox.showinfo("Staged", f"{len(self._result.validated)} validated records staged.")

    def _stage_needs_review(self) -> None:
        if not self._result or not self._result.needs_review:
            messagebox.showinfo("Nothing", "No needs-review records to stage.")
            return
        self.app.stage_records(list(self._result.needs_review))
        messagebox.showinfo("Staged", f"{len(self._result.needs_review)} needs-review records staged.")

    def _push_validated(self) -> None:
        """Push validated records directly to Supabase (skip staging)."""
        if not self._result or not self._result.validated:
            messagebox.showinfo("Nothing", "No validated records to push.")
            return

        records = self._result.validated
        if not messagebox.askyesno("Confirm", f"Push {len(records)} validated records to Supabase?"):
            return

        self.app.set_status("Pushing validated records…")
        pushed = 0
        errors: list[str] = []

        for rec in records:
            try:
                # Resolve governorate
                gov_name = rec.pop("_governorate", None)
                gov_id = None
                if gov_name:
                    gov = crud.get_governorate_by_name(gov_name)
                    if not gov:
                        gov = crud.upsert_governorate({"name": gov_name})
                    gov_id = gov["id"]

                # Resolve city
                city_name = rec.pop("_city", None)
                city_id = None
                if city_name and gov_id:
                    city = crud.get_city_by_name(city_name, gov_id)
                    if not city:
                        city = crud.upsert_city({"name": city_name, "governorate_id": gov_id})
                    city_id = city["id"]

                # Extract staging-only fields
                phone = rec.pop("_phone", None)
                email = rec.pop("_email", None)
                facebook = rec.pop("_facebook", None)
                instagram = rec.pop("_instagram", None)
                rec.pop("_status", None)

                # Insert university
                rec["governorate_id"] = gov_id
                rec["city_id"] = city_id
                uni_data = {k: v for k, v in rec.items() if v is not None and not k.startswith("_")}
                uni = crud.upsert_university(uni_data)
                uni_id = uni["id"]

                # Contacts
                if phone:
                    crud.insert_contact({"university_id": uni_id, "contact_type": "phone", "value": phone, "is_primary": True})
                if email:
                    crud.insert_contact({"university_id": uni_id, "contact_type": "email", "value": email})

                # Social links
                if facebook:
                    url = facebook if facebook.startswith("http") else f"https://facebook.com/{facebook}"
                    try:
                        crud.upsert_social_link({"university_id": uni_id, "platform": "facebook", "url": url})
                    except Exception:
                        pass
                if instagram:
                    url = instagram if instagram.startswith("http") else f"https://instagram.com/{instagram}"
                    try:
                        crud.upsert_social_link({"university_id": uni_id, "platform": "instagram", "url": url})
                    except Exception:
                        pass

                pushed += 1
            except Exception as e:
                errors.append(f"{rec.get('name', '?')}: {e}")

        self.app.set_status(f"Pushed {pushed}/{len(records)}")

        if errors:
            preview = "\n".join(errors[:15])
            if len(errors) > 15:
                preview += f"\n… +{len(errors) - 15} more"
            messagebox.showwarning("Push errors", preview)

        if pushed:
            messagebox.showinfo("Done", f"Pushed {pushed} validated records to Supabase.")
