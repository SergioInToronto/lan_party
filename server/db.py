import sqlite3
import os

from flask import g, current_app

DATABASE_DEFAULT = os.path.join(os.path.dirname(__file__), '..', 'lanparty.db')


def get_db():
    """Get a database connection for the current request. Reuses per-request."""
    if "db" not in g:
        db_path = current_app.config.get("DATABASE", DATABASE_DEFAULT)
        g.db = sqlite3.connect(db_path)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


def close_db(e=None):
    """Close the database connection at end of request."""
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """Create all tables. Safe to run repeatedly (IF NOT EXISTS)."""
    db = get_db()
    db.executescript("""
        CREATE TABLE IF NOT EXISTS guests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            access_code_hash TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS guest_preferences (
            guest_id INTEGER NOT NULL,
            key TEXT NOT NULL,
            value TEXT,
            PRIMARY KEY (guest_id, key),
            FOREIGN KEY (guest_id) REFERENCES guests(id)
        );

        CREATE TABLE IF NOT EXISTS food_options (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            created_by_guest_id INTEGER NOT NULL,
            FOREIGN KEY (created_by_guest_id) REFERENCES guests(id)
        );

        CREATE TABLE IF NOT EXISTS food_votes (
            guest_id INTEGER NOT NULL,
            option_id INTEGER NOT NULL,
            rank INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 3),
            PRIMARY KEY (guest_id, rank),
            UNIQUE (guest_id, option_id),
            FOREIGN KEY (guest_id) REFERENCES guests(id),
            FOREIGN KEY (option_id) REFERENCES food_options(id)
        );

        CREATE TABLE IF NOT EXISTS event (
            key TEXT PRIMARY KEY,
            value TEXT
        );
    """)

    # Seed event details on first run (table starts empty).
    default_event = {
        "event_name": "Sergio's LAN Party",
        "date_start": "2026-08-15",
        "date_end": "2026-08-16",
        "time_start": "10:00",
        "time_end": "23:59",
        "address": "1234 Placeholder Street, City, Province",
        "maps_link": "https://maps.google.com/?q=1234+Placeholder+Street",
        "wifi_ssid": "WIFI GOES HERE",
        "wifi_password": "changeme123",
    }
    db.executemany(
        "INSERT OR IGNORE INTO event (key, value) VALUES (?, ?)",
        list(default_event.items())
    )
    db.commit()
