"""
One-off data migration: backfill avatar_url preferences from existing steam_id
preferences, now that /api/guests and /api/me read a stored avatar_url instead
of fetching Steam live on every request.

Does NOT touch/delete the steam_id rows — left in place, stale, per design.

Usage:
    cd server && uv run python migrate_avatar_urls.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app import create_app, fetch_steam_avatars
from db import get_db


def main():
    app = create_app()
    with app.app_context():
        db = get_db()
        steam_ids = db.execute(
            "SELECT guest_id, value FROM guest_preferences WHERE key = 'steam_id'"
        ).fetchall()

        avatars = fetch_steam_avatars(row["value"] for row in steam_ids)

        updated = 0
        for row in steam_ids:
            avatar_url = avatars.get(row["value"])
            if not avatar_url:
                continue
            db.execute(
                "INSERT INTO guest_preferences (guest_id, key, value) VALUES (?, 'avatar_url', ?) "
                "ON CONFLICT(guest_id, key) DO UPDATE SET value = excluded.value",
                (row["guest_id"], avatar_url)
            )
            updated += 1
        db.commit()
        print(f"Backfilled avatar_url for {updated}/{len(steam_ids)} guests with a steam_id.")


if __name__ == "__main__":
    main()
