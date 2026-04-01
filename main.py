#!/usr/bin/env python3
"""
Iraq University Platform — Desktop GUI application.
All data is stored in Supabase via the official Python SDK.

Usage:
    python main.py
"""

import sys
import os

# Ensure project root is on sys.path so `db`, `models`, etc. resolve
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from gui.app import App


def main() -> None:
    app = App()
    app.mainloop()


if __name__ == "__main__":
    main()
