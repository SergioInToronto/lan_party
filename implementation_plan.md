# LAN Party — Implementation Plan

**Goal:** Build the complete LAN Party website — Flask API backend, SQLite database, 5-page vanilla HTML/CSS/JS frontend with Tailwind CSS.

**Architecture:** nginx serves static files (HTML, CSS, JS, images). Flask handles `/api/*` routes only. SQLite database with 4 tables. No ORM, no bundler, no framework. `event_details.json` for site-wide config.

**Tech Stack:** Python/Flask, SQLite, vanilla HTML5/CSS3/JS (ES modules), Tailwind CSS (CDN or CLI build), Line Awesome icons.

---

## File Map

```
lan_party/
├── implementation_plan.md
├── event_details.json              # Site-wide config (WiFi, dates, address)
├── server/
│   ├── app.py                      # Flask app — all API routes
│   ├── db.py                       # DB connection helper, query helpers
│   ├── init_db.py                  # Schema creation + CLI to add guests
│   └── pyproject.toml              # uv-managed Python dependencies
├── static/
│   ├── css/
│   │   └── style.css               # Tailwind output + custom overrides
│   ├── js/
│   │   ├── api.mjs                 # Fetch wrapper, auth token handling
│   │   ├── app.mjs                 # Nav, login modal, preferences modal, auth state
│   │   ├── countdown.mjs           # Countdown timer (index only)
│   │   ├── schedule.mjs            # Schedule data + render + "now playing" (index only)
│   │   ├── guests.mjs              # Guest list fetch + render (guests page)
│   │   ├── food.mjs                # Food suggest + vote logic (food page)
│   │   └── preferences.mjs         # Preferences modal form logic
│   ├── img/
│   │   ├── hero-bg.png             # Hero background (placeholder)
│   │   └── games/                  # Game cover images (placeholders)
│   └── avatars/                    # Pre-defined avatar PNGs
├── pages/
│   ├── index.html                  # Dashboard: hero, countdown, schedule, event details
│   ├── games.html                  # Game lineup grid
│   ├── guests.html                 # Public guest list
│   ├── food.html                   # Food voting
│   └── gear.html                   # BYO checklist + rules
├── tests/
│   ├── conftest.py                 # Shared fixtures (test client, test DB)
│   ├── test_auth.py                # Login, logout, session validation
│   ├── test_guests.py              # Guest list API
│   ├── test_preferences.py         # Preferences GET/POST
│   ├── test_food.py                # Food CRUD + voting
│   ├── test_config.py              # Config endpoint
│   └── test_init_db.py             # DB init + guest creation
└── docs/
    ├── LAN_plan.md
    ├── design-kit.md
    └── superpowers/specs/...
```

---

## Task 1: Project Scaffolding + Dependencies

**Files:**
- Create: `pyproject.toml` (at repo root, uv-managed)
- Create: `event_details.json`
- Create: `static/css/style.css` (empty placeholder)
- Create directory structure

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p server tests static/css static/js static/img/games static/avatars pages
```

- [ ] **Step 2: Create `pyproject.toml`**

```toml
[project]
name = "lan-party"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "flask>=3.0",
]

[tool.pytest.ini_options]
testpaths = ["tests"]
```

- [ ] **Step 3: Create `event_details.json`**

```json
{
  "event_name": "SUDOBASH '26",
  "date_start": "2026-08-15",
  "date_end": "2026-08-16",
  "time_start": "09:00",
  "time_end": "22:00",
  "address": "1234 Placeholder Street, City, Province",
  "maps_link": "https://maps.google.com/?q=1234+Placeholder+Street",
  "wifi_ssid": "SUDOBASH-LAN",
  "wifi_password": "changeme123"
}
```

- [ ] **Step 4: Create empty `static/css/style.css`**

Just a comment for now:
```css
/* Tailwind utilities loaded via CDN. Custom overrides go here. */
```

- [ ] **Step 5: Install dependencies**

```bash
uv sync
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: project scaffolding and dependencies"
```

---

## Task 2: Database Layer (`db.py` + `init_db.py`)

**Files:**
- Create: `server/db.py`
- Create: `server/init_db.py`
- Create: `tests/conftest.py`
- Create: `tests/test_init_db.py`

- [ ] **Step 1: Write test fixtures in `tests/conftest.py`**

```python
import os
import sys
import tempfile
import pytest

# Add server/ to path so we can import modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'server'))

from app import create_app
from db import get_db, init_db


@pytest.fixture
def app(tmp_path):
    db_path = str(tmp_path / "test.db")
    app = create_app({
        "TESTING": True,
        "DATABASE": db_path,
        "SECRET_KEY": "test-secret-key",
    })
    with app.app_context():
        init_db()
    yield app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def db_conn(app):
    with app.app_context():
        conn = get_db()
        yield conn
```

- [ ] **Step 2: Write tests for init_db in `tests/test_init_db.py`**

```python
def test_tables_created(db_conn):
    """All 4 tables should exist after init_db."""
    tables = db_conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    ).fetchall()
    table_names = [t["name"] for t in tables]
    assert "guests" in table_names
    assert "guest_preferences" in table_names
    assert "food_options" in table_names
    assert "food_votes" in table_names


def test_add_guest(db_conn):
    """Insert a guest and verify access_code_hash is stored, not plaintext."""
    from init_db import add_guest
    code = add_guest(db_conn, "TestUser")
    assert len(code) == 7

    row = db_conn.execute("SELECT * FROM guests WHERE name = ?", ("TestUser",)).fetchone()
    assert row is not None
    assert row["name"] == "TestUser"
    # access_code_hash should NOT equal the plaintext code
    assert row["access_code_hash"] != code
    assert len(row["access_code_hash"]) > 7


def test_add_guest_unique_codes(db_conn):
    """Each guest gets a unique access code."""
    from init_db import add_guest
    codes = [add_guest(db_conn, f"User{i}") for i in range(10)]
    assert len(set(codes)) == 10
```

- [ ] **Step 3: Run tests — expect failure (no modules yet)**

```bash
pytest tests/test_init_db.py -v
```

Expected: ImportError — `app` and `db` modules don't exist.

- [ ] **Step 4: Implement `server/db.py`**

```python
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
    """)
    db.commit()
```

- [ ] **Step 5: Implement `server/init_db.py`**

```python
"""
Database initialization and guest management CLI.

Usage:
    python init_db.py create          # Create tables
    python init_db.py add "Alice"     # Add guest, prints access code
    python init_db.py list            # List all guests (no codes)
"""
import hashlib
import secrets
import string
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from db import get_db, init_db as _init_db


def generate_access_code(length=7):
    """Generate a random alphanumeric access code."""
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def hash_code(code):
    """Hash an access code with SHA-256."""
    return hashlib.sha256(code.encode()).hexdigest()


def add_guest(db, name):
    """Add a guest to the database. Returns the plaintext access code (show once)."""
    code = generate_access_code()
    db.execute(
        "INSERT INTO guests (name, access_code_hash) VALUES (?, ?)",
        (name, hash_code(code))
    )
    db.commit()
    return code


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    # Create a minimal Flask app context for DB access
    from app import create_app
    app = create_app()

    command = sys.argv[1]

    with app.app_context():
        db = get_db()

        if command == "create":
            _init_db()
            print("Tables created.")

        elif command == "add":
            if len(sys.argv) < 3:
                print("Usage: python init_db.py add \"Guest Name\"")
                sys.exit(1)
            name = sys.argv[2]
            _init_db()  # Ensure tables exist
            code = add_guest(db, name)
            print(f"Added guest: {name}")
            print(f"Access code: {code}")
            print("(Save this code — it cannot be retrieved later)")

        elif command == "list":
            rows = db.execute("SELECT id, name FROM guests ORDER BY id").fetchall()
            for row in rows:
                print(f"  [{row['id']}] {row['name']}")

        else:
            print(f"Unknown command: {command}")
            print(__doc__)
            sys.exit(1)


if __name__ == "__main__":
    main()
```

- [ ] **Step 6: Create stub `server/app.py`** (just enough for tests to pass)

```python
from flask import Flask
from db import close_db

def create_app(test_config=None):
    app = Flask(__name__, static_folder=None)
    app.config["SECRET_KEY"] = "dev-secret-change-me"

    if test_config:
        app.config.update(test_config)

    app.teardown_appcontext(close_db)

    return app
```

- [ ] **Step 7: Run tests — expect pass**

```bash
pytest tests/test_init_db.py -v
```

Expected: 3 tests pass.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: database layer with init_db CLI"
```

---

## Task 3: Authentication API (login, logout, me)

**Files:**
- Modify: `server/app.py`
- Create: `tests/test_auth.py`

- [ ] **Step 1: Write auth tests in `tests/test_auth.py`**

```python
import json

from init_db import add_guest, hash_code


def _add_test_guest(db_conn, name="Alice"):
    """Helper: add a guest and return (name, plaintext_code)."""
    code = add_guest(db_conn, name)
    return name, code


def test_login_success(client, db_conn):
    name, code = _add_test_guest(db_conn)
    resp = client.post("/api/login", json={"name": name, "access_code": code})
    assert resp.status_code == 200
    data = resp.get_json()
    assert "token" in data
    assert data["guest"]["name"] == name
    assert data["guest"]["id"] is not None


def test_login_wrong_code(client, db_conn):
    name, _ = _add_test_guest(db_conn)
    resp = client.post("/api/login", json={"name": name, "access_code": "WRONG00"})
    assert resp.status_code == 401
    assert "error" in resp.get_json()


def test_login_wrong_name(client, db_conn):
    _, code = _add_test_guest(db_conn)
    resp = client.post("/api/login", json={"name": "Nobody", "access_code": code})
    assert resp.status_code == 401


def test_login_missing_fields(client):
    resp = client.post("/api/login", json={"name": "Alice"})
    assert resp.status_code == 400


def test_me_authenticated(client, db_conn):
    name, code = _add_test_guest(db_conn)
    client.post("/api/login", json={"name": name, "access_code": code})
    resp = client.get("/api/me")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["name"] == name
    assert "preferences" in data


def test_me_unauthenticated(client):
    resp = client.get("/api/me")
    assert resp.status_code == 401


def test_logout(client, db_conn):
    name, code = _add_test_guest(db_conn)
    client.post("/api/login", json={"name": name, "access_code": code})
    resp = client.post("/api/logout")
    assert resp.status_code == 200
    # Confirm session is cleared
    resp = client.get("/api/me")
    assert resp.status_code == 401
```

- [ ] **Step 2: Run tests — expect failure**

```bash
pytest tests/test_auth.py -v
```

Expected: All fail — no routes defined.

- [ ] **Step 3: Implement auth routes in `server/app.py`**

```python
import json
import os
import secrets
import time

from flask import Flask, request, jsonify, session
from db import close_db, get_db, init_db
from init_db import hash_code


def create_app(test_config=None):
    app = Flask(__name__, static_folder=None)
    app.config["SECRET_KEY"] = "dev-secret-change-me"

    base_dir = os.path.dirname(os.path.abspath(__file__))
    app.config["EVENT_DETAILS_PATH"] = os.path.join(base_dir, "..", "event_details.json")

    if test_config:
        app.config.update(test_config)

    app.teardown_appcontext(close_db)

    def require_auth(f):
        """Decorator: return 401 if no valid session."""
        from functools import wraps
        @wraps(f)
        def wrapped(*args, **kwargs):
            if "guest_id" not in session:
                return jsonify({"error": "Not authenticated"}), 401
            return f(*args, **kwargs)
        return wrapped

    # --- Auth routes ---

    @app.route("/api/login", methods=["POST"])
    def login():
        data = request.get_json(silent=True) or {}
        name = data.get("name", "").strip()
        access_code = data.get("access_code", "").strip()

        if not name or not access_code:
            return jsonify({"error": "Name and access_code required"}), 400

        db = get_db()
        guest = db.execute(
            "SELECT id, name, access_code_hash FROM guests WHERE name = ?",
            (name,)
        ).fetchone()

        if guest is None or guest["access_code_hash"] != hash_code(access_code):
            if not app.config.get("TESTING"):
                time.sleep(3)
            return jsonify({"error": "Invalid credentials"}), 401

        session.clear()
        session["guest_id"] = guest["id"]

        token = secrets.token_urlsafe(32)
        session["token"] = token

        return jsonify({
            "token": token,
            "guest": {"id": guest["id"], "name": guest["name"]}
        })

    @app.route("/api/me", methods=["GET"])
    @require_auth
    def me():
        db = get_db()
        guest_id = session["guest_id"]
        guest = db.execute(
            "SELECT id, name FROM guests WHERE id = ?", (guest_id,)
        ).fetchone()

        if guest is None:
            session.clear()
            return jsonify({"error": "Not authenticated"}), 401

        prefs = db.execute(
            "SELECT key, value FROM guest_preferences WHERE guest_id = ?",
            (guest_id,)
        ).fetchall()
        preferences = {row["key"]: row["value"] for row in prefs}

        return jsonify({
            "id": guest["id"],
            "name": guest["name"],
            "preferences": preferences,
        })

    @app.route("/api/logout", methods=["POST"])
    @require_auth
    def logout():
        session.clear()
        return jsonify({"ok": True})

    # Store require_auth on app for use in later route registration
    app.require_auth = require_auth

    return app
```

- [ ] **Step 4: Run tests — expect pass**

```bash
pytest tests/test_auth.py -v
```

Expected: All 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: auth API — login, logout, session validation"
```

---

## Task 4: Config API + Guest List API

**Files:**
- Modify: `server/app.py`
- Create: `tests/test_config.py`
- Create: `tests/test_guests.py`

- [ ] **Step 1: Write config test in `tests/test_config.py`**

```python
import json
import os


def test_config_returns_event_details(client, app):
    # Write a test config file
    config_path = app.config["EVENT_DETAILS_PATH"]
    os.makedirs(os.path.dirname(config_path), exist_ok=True)
    with open(config_path, "w") as f:
        json.dump({"event_name": "TEST EVENT", "wifi_ssid": "TEST-WIFI"}, f)

    resp = client.get("/api/config")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["event_name"] == "TEST EVENT"
    assert data["wifi_ssid"] == "TEST-WIFI"
```

- [ ] **Step 2: Write guest list tests in `tests/test_guests.py`**

```python
from init_db import add_guest


def _seed_guests(db_conn):
    """Add guests with preferences for testing."""
    code1 = add_guest(db_conn, "Alice")
    code2 = add_guest(db_conn, "Bob")

    # Set preferences for Alice
    db_conn.execute(
        "INSERT INTO guest_preferences (guest_id, key, value) VALUES (1, 'handle', 'al1ce')"
    )
    db_conn.execute(
        "INSERT INTO guest_preferences (guest_id, key, value) VALUES (1, 'avatar', 'pixel-cat.png')"
    )
    db_conn.execute(
        "INSERT INTO guest_preferences (guest_id, key, value) VALUES (1, 'days_attending', 'both')"
    )
    db_conn.execute(
        "INSERT INTO guest_preferences (guest_id, key, value) VALUES (1, 'snack_contribution', 'Doritos')"
    )
    db_conn.commit()
    return code1, code2


def test_guest_list_public(client, db_conn):
    """Guest list endpoint requires no auth."""
    _seed_guests(db_conn)
    resp = client.get("/api/guests")
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data) == 2


def test_guest_list_shows_preferences(client, db_conn):
    """Guests with preferences show handle, avatar, days, snacks."""
    _seed_guests(db_conn)
    resp = client.get("/api/guests")
    data = resp.get_json()

    alice = next(g for g in data if g.get("handle") == "al1ce")
    assert alice["avatar"] == "pixel-cat.png"
    assert alice["days_attending"] == "both"
    assert alice["snack_contribution"] == "Doritos"


def test_guest_list_fallback_to_name(client, db_conn):
    """Guests without a handle preference show their real name as handle."""
    _seed_guests(db_conn)
    resp = client.get("/api/guests")
    data = resp.get_json()

    bob = next(g for g in data if g.get("handle") == "Bob")
    assert bob is not None


def test_guest_list_excludes_secrets(client, db_conn):
    """Guest list must not contain access_code_hash or name (when handle exists)."""
    _seed_guests(db_conn)
    resp = client.get("/api/guests")
    data = resp.get_json()

    for guest in data:
        assert "access_code_hash" not in guest
        assert "name" not in guest
```

- [ ] **Step 3: Run tests — expect failure**

```bash
pytest tests/test_config.py tests/test_guests.py -v
```

- [ ] **Step 4: Add config + guest routes to `server/app.py`**

Add these routes inside `create_app()`, after the auth routes:

```python
    # --- Config route ---

    @app.route("/api/config", methods=["GET"])
    def config():
        config_path = app.config["EVENT_DETAILS_PATH"]
        try:
            with open(config_path, "r") as f:
                return jsonify(json.load(f))
        except FileNotFoundError:
            return jsonify({"error": "Config not found"}), 500

    # --- Guest list route ---

    @app.route("/api/guests", methods=["GET"])
    def guest_list():
        db = get_db()
        guests = db.execute("SELECT id, name FROM guests ORDER BY id").fetchall()

        result = []
        for guest in guests:
            prefs = db.execute(
                "SELECT key, value FROM guest_preferences WHERE guest_id = ?",
                (guest["id"],)
            ).fetchall()
            pref_dict = {row["key"]: row["value"] for row in prefs}

            result.append({
                "id": guest["id"],
                "handle": pref_dict.get("handle", guest["name"]),
                "avatar": pref_dict.get("avatar"),
                "days_attending": pref_dict.get("days_attending"),
                "snack_contribution": pref_dict.get("snack_contribution"),
            })

        return jsonify(result)
```

Add `import json` to top of `app.py` if not already there.

- [ ] **Step 5: Run tests — expect pass**

```bash
pytest tests/test_config.py tests/test_guests.py -v
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: config API + public guest list endpoint"
```

---

## Task 5: Preferences API

**Files:**
- Modify: `server/app.py`
- Create: `tests/test_preferences.py`

- [ ] **Step 1: Write preferences tests in `tests/test_preferences.py`**

```python
from init_db import add_guest


def _login(client, db_conn, name="Alice"):
    code = add_guest(db_conn, name)
    client.post("/api/login", json={"name": name, "access_code": code})
    return code


def test_get_preferences_empty(client, db_conn):
    """New user has no preferences."""
    _login(client, db_conn)
    resp = client.get("/api/preferences")
    assert resp.status_code == 200
    assert resp.get_json() == {}


def test_set_preferences(client, db_conn):
    """POST preferences saves key-value pairs."""
    _login(client, db_conn)
    resp = client.post("/api/preferences", json={
        "handle": "al1ce",
        "avatar": "pixel-cat.png",
        "os": "Arch btw",
        "days_attending": "both",
        "skill_level": "competitive",
        "snack_contribution": "Doritos",
    })
    assert resp.status_code == 200
    assert resp.get_json()["ok"] is True

    # Verify saved
    resp = client.get("/api/preferences")
    data = resp.get_json()
    assert data["handle"] == "al1ce"
    assert data["os"] == "Arch btw"
    assert data["days_attending"] == "both"


def test_update_preferences(client, db_conn):
    """Updating preferences overwrites existing values."""
    _login(client, db_conn)
    client.post("/api/preferences", json={"handle": "old_handle"})
    client.post("/api/preferences", json={"handle": "new_handle"})

    resp = client.get("/api/preferences")
    assert resp.get_json()["handle"] == "new_handle"


def test_partial_update(client, db_conn):
    """Updating one key doesn't erase others."""
    _login(client, db_conn)
    client.post("/api/preferences", json={"handle": "al1ce", "os": "Arch"})
    client.post("/api/preferences", json={"os": "Ubuntu"})

    resp = client.get("/api/preferences")
    data = resp.get_json()
    assert data["handle"] == "al1ce"
    assert data["os"] == "Ubuntu"


def test_preferences_require_auth(client):
    resp = client.get("/api/preferences")
    assert resp.status_code == 401
    resp = client.post("/api/preferences", json={"handle": "test"})
    assert resp.status_code == 401
```

- [ ] **Step 2: Run tests — expect failure**

```bash
pytest tests/test_preferences.py -v
```

- [ ] **Step 3: Add preferences routes to `server/app.py`**

Add inside `create_app()`:

```python
    # --- Preferences routes ---

    @app.route("/api/preferences", methods=["GET"])
    @require_auth
    def get_preferences():
        db = get_db()
        prefs = db.execute(
            "SELECT key, value FROM guest_preferences WHERE guest_id = ?",
            (session["guest_id"],)
        ).fetchall()
        return jsonify({row["key"]: row["value"] for row in prefs})

    @app.route("/api/preferences", methods=["POST"])
    @require_auth
    def set_preferences():
        data = request.get_json(silent=True) or {}
        if not data:
            return jsonify({"error": "No data provided"}), 400

        db = get_db()
        guest_id = session["guest_id"]

        allowed_keys = {"handle", "avatar", "os", "days_attending", "skill_level", "snack_contribution"}
        for key, value in data.items():
            if key not in allowed_keys:
                continue
            db.execute(
                "INSERT INTO guest_preferences (guest_id, key, value) VALUES (?, ?, ?) "
                "ON CONFLICT(guest_id, key) DO UPDATE SET value = excluded.value",
                (guest_id, key, value)
            )
        db.commit()
        return jsonify({"ok": True})
```

- [ ] **Step 4: Run tests — expect pass**

```bash
pytest tests/test_preferences.py -v
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: preferences API — get and upsert"
```

---

## Task 6: Food API (CRUD + Voting)

**Files:**
- Modify: `server/app.py`
- Create: `tests/test_food.py`

- [ ] **Step 1: Write food tests in `tests/test_food.py`**

```python
from init_db import add_guest


def _login(client, db_conn, name="Alice"):
    code = add_guest(db_conn, name)
    resp = client.post("/api/login", json={"name": name, "access_code": code})
    return resp.get_json()["guest"]["id"]


def test_food_list_empty(client):
    resp = client.get("/api/foods")
    assert resp.status_code == 200
    assert resp.get_json() == []


def test_add_food(client, db_conn):
    _login(client, db_conn)
    resp = client.post("/api/foods", json={"name": "Pizza"})
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["name"] == "Pizza"
    assert "id" in data


def test_add_food_requires_auth(client):
    resp = client.post("/api/foods", json={"name": "Pizza"})
    assert resp.status_code == 401


def test_add_food_requires_name(client, db_conn):
    _login(client, db_conn)
    resp = client.post("/api/foods", json={})
    assert resp.status_code == 400


def test_food_list_with_scores(client, db_conn):
    """After voting, food list shows aggregate scores."""
    alice_id = _login(client, db_conn, "Alice")
    client.post("/api/foods", json={"name": "Pizza"})
    client.post("/api/foods", json={"name": "Tacos"})
    client.post("/api/foods", json={"name": "Sushi"})

    # Alice votes
    client.post("/api/foods/vote", json={
        "votes": [
            {"option_id": 1, "rank": 1},
            {"option_id": 2, "rank": 2},
            {"option_id": 3, "rank": 3},
        ]
    })

    resp = client.get("/api/foods")
    data = resp.get_json()
    pizza = next(f for f in data if f["name"] == "Pizza")
    assert pizza["score"] == 3  # 1st place = 3 points
    assert pizza["votes"]["1st"] == 1


def test_vote_requires_auth(client):
    resp = client.post("/api/foods/vote", json={"votes": []})
    assert resp.status_code == 401


def test_vote_editable(client, db_conn):
    """Re-voting overwrites previous votes."""
    _login(client, db_conn)
    client.post("/api/foods", json={"name": "Pizza"})
    client.post("/api/foods", json={"name": "Tacos"})
    client.post("/api/foods", json={"name": "Sushi"})

    # First vote
    client.post("/api/foods/vote", json={
        "votes": [
            {"option_id": 1, "rank": 1},
            {"option_id": 2, "rank": 2},
            {"option_id": 3, "rank": 3},
        ]
    })

    # Change vote: Tacos now first
    client.post("/api/foods/vote", json={
        "votes": [
            {"option_id": 2, "rank": 1},
            {"option_id": 1, "rank": 2},
            {"option_id": 3, "rank": 3},
        ]
    })

    resp = client.get("/api/foods")
    data = resp.get_json()
    tacos = next(f for f in data if f["name"] == "Tacos")
    assert tacos["score"] == 3  # Now 1st place


def test_get_my_votes_empty(client, db_conn):
    _login(client, db_conn)
    resp = client.get("/api/foods/votes")
    assert resp.status_code == 200
    assert resp.get_json() == []


def test_get_my_votes(client, db_conn):
    _login(client, db_conn)
    client.post("/api/foods", json={"name": "Pizza"})
    client.post("/api/foods", json={"name": "Tacos"})
    client.post("/api/foods", json={"name": "Sushi"})
    client.post("/api/foods/vote", json={
        "votes": [
            {"option_id": 1, "rank": 1},
            {"option_id": 2, "rank": 2},
            {"option_id": 3, "rank": 3},
        ]
    })

    resp = client.get("/api/foods/votes")
    data = resp.get_json()
    assert len(data) == 3
    first = next(v for v in data if v["rank"] == 1)
    assert first["option_id"] == 1
```

- [ ] **Step 2: Run tests — expect failure**

```bash
pytest tests/test_food.py -v
```

- [ ] **Step 3: Add food routes to `server/app.py`**

Add inside `create_app()`:

```python
    # --- Food routes ---

    @app.route("/api/foods", methods=["GET"])
    def food_list():
        db = get_db()
        foods = db.execute("""
            SELECT f.id, f.name, f.created_by_guest_id,
                   COALESCE(gp.value, g.name) as suggested_by
            FROM food_options f
            JOIN guests g ON g.id = f.created_by_guest_id
            LEFT JOIN guest_preferences gp
                ON gp.guest_id = f.created_by_guest_id AND gp.key = 'handle'
            ORDER BY f.id
        """).fetchall()

        # Get vote tallies
        votes = db.execute("""
            SELECT option_id, rank, COUNT(*) as cnt
            FROM food_votes
            GROUP BY option_id, rank
        """).fetchall()

        vote_map = {}
        for v in votes:
            oid = v["option_id"]
            if oid not in vote_map:
                vote_map[oid] = {"1st": 0, "2nd": 0, "3rd": 0}
            rank_labels = {1: "1st", 2: "2nd", 3: "3rd"}
            vote_map[oid][rank_labels[v["rank"]]] = v["cnt"]

        score_weights = {"1st": 3, "2nd": 2, "3rd": 1}

        result = []
        for food in foods:
            fid = food["id"]
            tallies = vote_map.get(fid, {"1st": 0, "2nd": 0, "3rd": 0})
            score = sum(tallies[k] * score_weights[k] for k in score_weights)
            result.append({
                "id": fid,
                "name": food["name"],
                "suggested_by": food["suggested_by"],
                "score": score,
                "votes": tallies,
            })

        return jsonify(result)

    @app.route("/api/foods", methods=["POST"])
    @require_auth
    def add_food():
        data = request.get_json(silent=True) or {}
        name = data.get("name", "").strip()
        if not name:
            return jsonify({"error": "Food name required"}), 400

        db = get_db()
        cursor = db.execute(
            "INSERT INTO food_options (name, created_by_guest_id) VALUES (?, ?)",
            (name, session["guest_id"])
        )
        db.commit()
        return jsonify({"id": cursor.lastrowid, "name": name}), 201

    @app.route("/api/foods/vote", methods=["POST"])
    @require_auth
    def vote_food():
        data = request.get_json(silent=True) or {}
        votes = data.get("votes", [])

        if not votes or len(votes) > 3:
            return jsonify({"error": "Provide 1-3 ranked votes"}), 400

        db = get_db()
        guest_id = session["guest_id"]

        # Atomic: delete old votes, insert new
        db.execute("DELETE FROM food_votes WHERE guest_id = ?", (guest_id,))
        for vote in votes:
            db.execute(
                "INSERT INTO food_votes (guest_id, option_id, rank) VALUES (?, ?, ?)",
                (guest_id, vote["option_id"], vote["rank"])
            )
        db.commit()
        return jsonify({"ok": True})

    @app.route("/api/foods/votes", methods=["GET"])
    @require_auth
    def my_votes():
        db = get_db()
        rows = db.execute(
            "SELECT option_id, rank FROM food_votes WHERE guest_id = ? ORDER BY rank",
            (session["guest_id"],)
        ).fetchall()
        return jsonify([{"option_id": r["option_id"], "rank": r["rank"]} for r in rows])
```

- [ ] **Step 4: Run tests — expect pass**

```bash
pytest tests/test_food.py -v
```

- [ ] **Step 5: Run ALL tests**

```bash
pytest tests/ -v
```

Expected: All tests pass (init_db + auth + config + guests + preferences + food).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: food CRUD + ranked voting API"
```

---

## Task 7: Tailwind Setup + Base HTML Template

**Files:**
- Create: `pages/index.html` (base layout only — content in later tasks)
- Create: `static/css/style.css` (Tailwind config via CDN + custom properties)

This task establishes the shared HTML structure (nav, footer, modals) that all pages will use. Since there's no templating engine, we'll build the HTML structure as a reusable pattern — each page copies the shell.

- [ ] **Step 1: Create `static/css/style.css`**

```css
/*
  Custom overrides on top of Tailwind CDN.
  Design kit: design-kit.md
*/

/* Import Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;700&family=Roboto:wght@400;500&family=Fira+Code:wght@400;500&display=swap');

/* Custom properties for design-kit colors */
:root {
  --bg-base: #121212;
  --bg-surface: #1E1E1E;
  --border: #333333;
  --text-primary: #E0E0E0;
  --text-muted: #8A8A8A;
  --accent-orange: #E95420;
  --accent-blue: #1793D1;
  --accent-green: #87A556;
}

body {
  font-family: 'Roboto', 'DejaVu Sans', sans-serif;
  background-color: var(--bg-base);
  color: var(--text-primary);
  margin: 0;
  min-height: 100vh;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Ubuntu', sans-serif;
  font-weight: 700;
}

code, .mono {
  font-family: 'Fira Code', 'Liberation Mono', monospace;
}

/* Modal overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-overlay.hidden {
  display: none;
}

.modal-panel {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  padding: 2rem;
  width: 100%;
  max-width: 28rem;
  border-radius: 2px;
}

/* Status badges */
.badge {
  font-family: 'Fira Code', monospace;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 1px;
}

.badge-green { color: var(--accent-green); border-color: var(--accent-green); }
.badge-orange { color: var(--accent-orange); border-color: var(--accent-orange); }
.badge-blue { color: var(--accent-blue); border-color: var(--accent-blue); }

/* Form inputs */
input[type="text"],
input[type="password"],
select,
textarea {
  background: var(--bg-base);
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 0.5rem 0.75rem;
  border-radius: 2px;
  width: 100%;
  font-family: 'Roboto', sans-serif;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: var(--accent-blue);
}

/* Buttons */
.btn {
  padding: 0.5rem 1.25rem;
  border: 1px solid var(--border);
  border-radius: 2px;
  font-family: 'Ubuntu', sans-serif;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary {
  background: var(--accent-orange);
  color: #fff;
  border-color: var(--accent-orange);
}

.btn-primary:hover {
  background: #d14810;
}

.btn-secondary {
  background: var(--bg-surface);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: var(--border);
}
```

- [ ] **Step 2: Create `pages/index.html`** (shell with nav + login modal + preferences modal + footer)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SUDOBASH '26</title>
  <!-- Tailwind CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            'base': '#121212',
            'surface': '#1E1E1E',
            'border-c': '#333333',
            'text-primary': '#E0E0E0',
            'text-muted': '#8A8A8A',
            'accent-orange': '#E95420',
            'accent-blue': '#1793D1',
            'accent-green': '#87A556',
          },
          fontFamily: {
            'ubuntu': ['Ubuntu', 'sans-serif'],
            'roboto': ['Roboto', 'DejaVu Sans', 'sans-serif'],
            'mono': ['Fira Code', 'Liberation Mono', 'monospace'],
          },
          borderRadius: {
            'kit': '2px',
          }
        }
      }
    }
  </script>
  <!-- Line Awesome Icons -->
  <link rel="stylesheet" href="https://maxst.icons8.com/vue-static/lanern/line-awesome/css/line-awesome.min.css">
  <!-- Custom CSS -->
  <link rel="stylesheet" href="/static/css/style.css">
</head>
<body class="bg-base text-text-primary min-h-screen flex flex-col">

  <!-- ===== NAV HEADER ===== -->
  <header class="border-b border-border-c bg-surface">
    <nav class="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
      <div class="flex items-center gap-6">
        <a href="/" class="font-ubuntu font-bold text-xl text-accent-orange tracking-wide">SUDOBASH '26</a>
        <div class="hidden md:flex items-center gap-4 text-sm">
          <a href="/" class="hover:text-accent-blue">Dashboard</a>
          <a href="/games.html" class="hover:text-accent-blue">Games</a>
          <a href="/#schedule" class="hover:text-accent-blue">Schedule</a>
          <a href="/guests.html" class="hover:text-accent-blue">Guests</a>
          <a href="/food.html" class="hover:text-accent-blue">Food</a>
          <a href="/gear.html" class="hover:text-accent-blue">Gear</a>
        </div>
      </div>
      <div id="nav-auth">
        <!-- JS populates: login button or user info -->
        <button id="nav-login-btn" class="btn btn-primary text-sm" onclick="document.getElementById('login-modal').classList.remove('hidden')">
          LOGIN
        </button>
        <div id="nav-user-info" class="hidden flex items-center gap-3">
          <img id="nav-avatar" src="" alt="" class="w-8 h-8 rounded-kit border border-border-c">
          <span id="nav-handle" class="font-mono text-sm"></span>
          <div class="relative">
            <button id="nav-menu-btn" class="text-text-muted hover:text-text-primary text-sm">
              <i class="las la-chevron-down"></i>
            </button>
            <div id="nav-dropdown" class="hidden absolute right-0 top-8 bg-surface border border-border-c py-1 min-w-[140px] z-50">
              <button id="nav-prefs-btn" class="block w-full text-left px-4 py-2 text-sm hover:bg-base">Preferences</button>
              <button id="nav-logout-btn" class="block w-full text-left px-4 py-2 text-sm hover:bg-base text-accent-orange">Logout</button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  </header>

  <!-- ===== LOGIN MODAL ===== -->
  <div id="login-modal" class="modal-overlay hidden">
    <div class="modal-panel">
      <h2 class="font-ubuntu text-lg mb-4">Login</h2>
      <form id="login-form">
        <div class="mb-3">
          <label class="block text-sm text-text-muted mb-1">Name</label>
          <input type="text" name="name" required autocomplete="name">
        </div>
        <div class="mb-4">
          <label class="block text-sm text-text-muted mb-1">Access Code</label>
          <input type="text" name="access_code" required maxlength="7" autocomplete="off" class="font-mono tracking-widest uppercase">
        </div>
        <div id="login-error" class="text-accent-orange text-sm mb-3 hidden"></div>
        <div class="flex gap-3">
          <button type="submit" class="btn btn-primary flex-1">LOGIN</button>
          <button type="button" class="btn btn-secondary" onclick="document.getElementById('login-modal').classList.add('hidden')">Cancel</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ===== PREFERENCES MODAL ===== -->
  <div id="prefs-modal" class="modal-overlay hidden">
    <div class="modal-panel max-w-lg">
      <h2 class="font-ubuntu text-lg mb-4">Your Preferences</h2>
      <form id="prefs-form">
        <div class="mb-3">
          <label class="block text-sm text-text-muted mb-1">Handle</label>
          <input type="text" name="handle" placeholder="Your display name">
        </div>
        <div class="mb-3">
          <label class="block text-sm text-text-muted mb-1">Avatar</label>
          <div id="avatar-picker" class="grid grid-cols-6 gap-2">
            <!-- JS populates avatar options -->
          </div>
          <input type="hidden" name="avatar">
        </div>
        <div class="mb-3">
          <label class="block text-sm text-text-muted mb-1">Operating System</label>
          <input type="text" name="os" placeholder="e.g. Arch btw">
        </div>
        <div class="mb-3">
          <label class="block text-sm text-text-muted mb-1">Days Attending</label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2"><input type="radio" name="days_attending" value="saturday"> Saturday</label>
            <label class="flex items-center gap-2"><input type="radio" name="days_attending" value="sunday"> Sunday</label>
            <label class="flex items-center gap-2"><input type="radio" name="days_attending" value="both"> Both</label>
          </div>
        </div>
        <div class="mb-3">
          <label class="block text-sm text-text-muted mb-1">Skill Level</label>
          <select name="skill_level">
            <option value="">-- Select --</option>
            <option value="casual">Casual</option>
            <option value="intermediate">Intermediate</option>
            <option value="competitive">Competitive</option>
          </select>
        </div>
        <div class="mb-4">
          <label class="block text-sm text-text-muted mb-1">Snack Contribution</label>
          <input type="text" name="snack_contribution" placeholder="Bringing any snacks?">
        </div>
        <div class="flex gap-3">
          <button type="submit" class="btn btn-primary flex-1">Save</button>
          <button type="button" class="btn btn-secondary" onclick="document.getElementById('prefs-modal').classList.add('hidden')">Cancel</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ===== MAIN CONTENT ===== -->
  <main class="flex-1">
    <!-- Page-specific content goes here -->
  </main>

  <!-- ===== FOOTER ===== -->
  <footer class="border-t border-border-c bg-surface py-6 mt-auto">
    <div class="max-w-7xl mx-auto px-4 flex justify-between text-text-muted text-sm font-mono">
      <span>SUDOBASH '26 — LAN Party</span>
      <span>Contact: sergio@example.com</span>
    </div>
  </footer>

  <!-- JS Modules -->
  <script type="module" src="/static/js/app.mjs"></script>
</body>
</html>
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: base HTML template with Tailwind, nav, modals, footer"
```

---

## Task 8: Core Frontend JS — API Client + Auth + Nav + Modals

**Files:**
- Create: `static/js/api.mjs`
- Create: `static/js/app.mjs`
- Create: `static/js/preferences.mjs`

- [ ] **Step 1: Create `static/js/api.mjs`**

```javascript
/**
 * API client — thin fetch wrapper.
 * All API calls go through here.
 */

const API_BASE = '/api';

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const resp = await fetch(url, config);
  const data = await resp.json().catch(() => null);

  if (!resp.ok) {
    const err = new Error(data?.error || `HTTP ${resp.status}`);
    err.status = resp.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  login: (name, access_code) =>
    apiFetch('/login', { method: 'POST', body: { name, access_code } }),

  logout: () =>
    apiFetch('/logout', { method: 'POST' }),

  me: () =>
    apiFetch('/me'),

  config: () =>
    apiFetch('/config'),

  guests: () =>
    apiFetch('/guests'),

  getPreferences: () =>
    apiFetch('/preferences'),

  setPreferences: (prefs) =>
    apiFetch('/preferences', { method: 'POST', body: prefs }),

  foods: () =>
    apiFetch('/foods'),

  addFood: (name) =>
    apiFetch('/foods', { method: 'POST', body: { name } }),

  vote: (votes) =>
    apiFetch('/foods/vote', { method: 'POST', body: { votes } }),

  myVotes: () =>
    apiFetch('/foods/votes'),
};
```

- [ ] **Step 2: Create `static/js/preferences.mjs`**

```javascript
/**
 * Preferences modal logic.
 * Handles avatar picker, form population, and submission.
 */
import { api } from './api.mjs';

const AVATARS = [
  'pixel-cat.png', 'pixel-dog.png', 'pixel-robot.png', 'pixel-warrior.png',
  'pixel-wizard.png', 'pixel-alien.png', 'pixel-ghost.png', 'pixel-tux.png',
  'pixel-skull.png', 'pixel-mushroom.png', 'pixel-crown.png', 'pixel-flame.png',
];

let selectedAvatar = null;

export function initPreferencesModal() {
  const modal = document.getElementById('prefs-modal');
  const form = document.getElementById('prefs-form');
  const picker = document.getElementById('avatar-picker');
  if (!modal || !form || !picker) return;

  // Build avatar picker grid
  picker.innerHTML = '';
  AVATARS.forEach(filename => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'w-10 h-10 border border-border-c rounded-kit p-0.5 hover:border-accent-blue transition-colors';
    btn.dataset.avatar = filename;

    const img = document.createElement('img');
    img.src = `/static/avatars/${filename}`;
    img.alt = filename.replace('.png', '');
    img.className = 'w-full h-full object-contain';
    btn.appendChild(img);

    btn.addEventListener('click', () => {
      picker.querySelectorAll('button').forEach(b => b.classList.remove('border-accent-orange'));
      btn.classList.add('border-accent-orange');
      selectedAvatar = filename;
      form.querySelector('[name="avatar"]').value = filename;
    });

    picker.appendChild(btn);
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const prefs = {};
    for (const [key, value] of formData.entries()) {
      if (value) prefs[key] = value;
    }

    try {
      await api.setPreferences(prefs);
      modal.classList.add('hidden');
      window.location.reload();
    } catch (err) {
      console.error('Failed to save preferences:', err);
    }
  });
}

export async function openPreferencesModal() {
  const modal = document.getElementById('prefs-modal');
  const form = document.getElementById('prefs-form');
  if (!modal || !form) return;

  // Pre-fill with existing preferences
  try {
    const prefs = await api.getPreferences();

    if (prefs.handle) form.querySelector('[name="handle"]').value = prefs.handle;
    if (prefs.os) form.querySelector('[name="os"]').value = prefs.os;
    if (prefs.snack_contribution) form.querySelector('[name="snack_contribution"]').value = prefs.snack_contribution;

    if (prefs.days_attending) {
      const radio = form.querySelector(`[name="days_attending"][value="${prefs.days_attending}"]`);
      if (radio) radio.checked = true;
    }

    if (prefs.skill_level) {
      form.querySelector('[name="skill_level"]').value = prefs.skill_level;
    }

    if (prefs.avatar) {
      form.querySelector('[name="avatar"]').value = prefs.avatar;
      const avatarBtn = document.querySelector(`[data-avatar="${prefs.avatar}"]`);
      if (avatarBtn) avatarBtn.classList.add('border-accent-orange');
      selectedAvatar = prefs.avatar;
    }
  } catch (err) {
    // No preferences yet — form stays empty
  }

  modal.classList.remove('hidden');
}
```

- [ ] **Step 3: Create `static/js/app.mjs`**

```javascript
/**
 * Shared app logic — runs on every page.
 * Handles: auth state, nav updates, login modal, logout, preferences trigger.
 */
import { api } from './api.mjs';
import { initPreferencesModal, openPreferencesModal } from './preferences.mjs';

const AUTH_TOKEN_KEY = 'sudobash_token';

// --- Auth State ---

function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function isLoggedIn() {
  return !!getToken();
}

// --- Nav Updates ---

async function updateNav() {
  const loginBtn = document.getElementById('nav-login-btn');
  const userInfo = document.getElementById('nav-user-info');
  const navHandle = document.getElementById('nav-handle');
  const navAvatar = document.getElementById('nav-avatar');

  if (!isLoggedIn()) {
    loginBtn?.classList.remove('hidden');
    userInfo?.classList.add('hidden');
    return;
  }

  try {
    const data = await api.me();
    loginBtn?.classList.add('hidden');
    userInfo?.classList.remove('hidden');

    const handle = data.preferences?.handle || data.name;
    if (navHandle) navHandle.textContent = handle;

    const avatar = data.preferences?.avatar;
    if (navAvatar && avatar) {
      navAvatar.src = `/static/avatars/${avatar}`;
      navAvatar.classList.remove('hidden');
    } else if (navAvatar) {
      navAvatar.classList.add('hidden');
    }

    // Auto-open preferences if none exist
    if (!data.preferences || Object.keys(data.preferences).length === 0) {
      openPreferencesModal();
    }
  } catch (err) {
    // Session expired or invalid
    clearToken();
    loginBtn?.classList.remove('hidden');
    userInfo?.classList.add('hidden');
  }
}

// --- Login ---

function initLogin() {
  const form = document.getElementById('login-form');
  const modal = document.getElementById('login-modal');
  const errorEl = document.getElementById('login-error');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl?.classList.add('hidden');

    const name = form.querySelector('[name="name"]').value.trim();
    const access_code = form.querySelector('[name="access_code"]').value.trim();

    try {
      const data = await api.login(name, access_code);
      setToken(data.token);
      modal?.classList.add('hidden');
      window.location.reload();
    } catch (err) {
      if (errorEl) {
        errorEl.textContent = err.data?.error || 'Login failed';
        errorEl.classList.remove('hidden');
      }
    }
  });
}

// --- Logout ---

function initLogout() {
  const btn = document.getElementById('nav-logout-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    try {
      await api.logout();
    } catch (err) {
      // Ignore — clear local state anyway
    }
    clearToken();
    window.location.reload();
  });
}

// --- Nav Dropdown ---

function initNavDropdown() {
  const menuBtn = document.getElementById('nav-menu-btn');
  const dropdown = document.getElementById('nav-dropdown');
  if (!menuBtn || !dropdown) return;

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    dropdown.classList.add('hidden');
  });

  // Preferences button
  const prefsBtn = document.getElementById('nav-prefs-btn');
  if (prefsBtn) {
    prefsBtn.addEventListener('click', () => {
      dropdown.classList.add('hidden');
      openPreferencesModal();
    });
  }
}

// --- Init ---

document.addEventListener('DOMContentLoaded', () => {
  initLogin();
  initLogout();
  initNavDropdown();
  initPreferencesModal();
  updateNav();
});
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: core JS — API client, auth state, nav, login/prefs modals"
```

---

## Task 9: Dashboard Page Content (index.html)

**Files:**
- Modify: `pages/index.html` (add hero, countdown, schedule, event details to `<main>`)
- Create: `static/js/countdown.mjs`
- Create: `static/js/schedule.mjs`

- [ ] **Step 1: Create `static/js/countdown.mjs`**

```javascript
/**
 * Countdown timer — counts down to event start.
 * Reads event date from /api/config.
 */
import { api } from './api.mjs';

export async function initCountdown() {
  const el = document.getElementById('countdown');
  if (!el) return;

  let targetDate;
  try {
    const config = await api.config();
    targetDate = new Date(`${config.date_start}T${config.time_start}:00`);
  } catch (err) {
    el.textContent = '[ ERROR LOADING CONFIG ]';
    return;
  }

  function update() {
    const now = new Date();
    const diff = targetDate - now;

    if (diff <= 0) {
      el.innerHTML = '<span class="text-accent-green font-mono text-2xl">[ EVENT LIVE ]</span>';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    el.innerHTML = `
      <div class="flex gap-4 justify-center font-mono text-3xl md:text-5xl text-accent-orange">
        <div class="text-center">
          <div>${String(days).padStart(2, '0')}</div>
          <div class="text-xs text-text-muted mt-1">DAYS</div>
        </div>
        <span class="text-text-muted">:</span>
        <div class="text-center">
          <div>${String(hours).padStart(2, '0')}</div>
          <div class="text-xs text-text-muted mt-1">HRS</div>
        </div>
        <span class="text-text-muted">:</span>
        <div class="text-center">
          <div>${String(minutes).padStart(2, '0')}</div>
          <div class="text-xs text-text-muted mt-1">MIN</div>
        </div>
        <span class="text-text-muted">:</span>
        <div class="text-center">
          <div>${String(seconds).padStart(2, '0')}</div>
          <div class="text-xs text-text-muted mt-1">SEC</div>
        </div>
      </div>
    `;
  }

  update();
  setInterval(update, 1000);
}
```

- [ ] **Step 2: Create `static/js/schedule.mjs`**

```javascript
/**
 * Schedule data + rendering + "Now Playing" banner.
 * All schedule data is hardcoded here.
 */

export const SCHEDULE = [
  // Saturday
  { day: 'saturday', time: '09:00', end: '10:00', title: 'Doors Open', description: 'Setup your rigs, get settled in' },
  { day: 'saturday', time: '10:00', end: '11:30', title: 'Free Play', description: 'Warm up with whatever you want' },
  { day: 'saturday', time: '11:30', end: '12:00', title: 'Tournament Bracket Draw', description: 'Random seeding for afternoon tournament' },
  { day: 'saturday', time: '12:00', end: '13:00', title: 'Lunch Break', description: 'Food vote winner served' },
  { day: 'saturday', time: '13:00', end: '15:00', title: 'Dota Tournament', description: 'Round robin, best of 1' },
  { day: 'saturday', time: '15:00', end: '15:30', title: 'Snack Break', description: 'Refuel' },
  { day: 'saturday', time: '15:30', end: '17:30', title: 'Minecraft Build Battle', description: 'Theme announced at start' },
  { day: 'saturday', time: '17:30', end: '18:30', title: 'Dinner Break', description: 'Second food vote winner' },
  { day: 'saturday', time: '18:30', end: '22:00', title: 'Free Play / CoD2', description: 'Casual games until close' },
  // Sunday
  { day: 'sunday', time: '09:00', end: '10:00', title: 'Day 2 — Doors Open', description: 'Coffee and setup' },
  { day: 'sunday', time: '10:00', end: '12:00', title: 'Pokemon Tournament', description: 'Link battles, single elimination' },
  { day: 'sunday', time: '12:00', end: '13:00', title: 'Lunch Break', description: '' },
  { day: 'sunday', time: '13:00', end: '15:00', title: 'Sims 2 Challenge', description: 'Speed-build a house, community judges' },
  { day: 'sunday', time: '15:00', end: '15:30', title: 'Awards Ceremony', description: 'Trophies for tournament winners' },
  { day: 'sunday', time: '15:30', end: '17:00', title: 'Free Play / Wrap Up', description: 'Last games, pack up' },
];

/**
 * Find the currently active schedule entry based on system clock.
 * Returns null if no event is currently happening.
 */
export function getCurrentEvent(schedule = SCHEDULE) {
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const currentTime = now.getHours().toString().padStart(2, '0') + ':' +
                      now.getMinutes().toString().padStart(2, '0');

  return schedule.find(event =>
    event.day === dayName && currentTime >= event.time && currentTime < event.end
  ) || null;
}

/**
 * Render the "Now Playing" banner.
 */
export function initNowPlaying() {
  const el = document.getElementById('now-playing');
  if (!el) return;

  function update() {
    const current = getCurrentEvent();
    if (current) {
      el.innerHTML = `
        <div class="bg-surface border border-accent-green py-3 px-4 font-mono text-center">
          <span class="text-accent-green">&gt; NOW PLAYING:</span>
          <span class="text-text-primary ml-2 font-bold">${current.title}</span>
          <span class="text-text-muted ml-2">— ${current.description}</span>
        </div>
      `;
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  }

  update();
  setInterval(update, 60000); // Check every minute
}

/**
 * Render the schedule table for a given day.
 */
function renderDaySchedule(day, schedule = SCHEDULE) {
  const events = schedule.filter(e => e.day === day);
  const current = getCurrentEvent(schedule);

  return events.map(event => {
    const isCurrent = current && current.time === event.time && current.day === event.day;
    const rowClass = isCurrent ? 'bg-accent-orange/10 border-l-2 border-accent-orange' : '';

    return `
      <tr class="${rowClass}">
        <td class="py-2 px-3 font-mono text-sm text-accent-orange whitespace-nowrap">${event.time}</td>
        <td class="py-2 px-3 font-bold">${event.title}</td>
        <td class="py-2 px-3 text-text-muted text-sm">${event.description}</td>
      </tr>
    `;
  }).join('');
}

/**
 * Initialize schedule section with day tabs.
 */
export function initSchedule() {
  const el = document.getElementById('schedule');
  if (!el) return;

  let activeDay = 'saturday';

  function render() {
    el.innerHTML = `
      <div class="flex gap-2 mb-4">
        <button class="btn ${activeDay === 'saturday' ? 'btn-primary' : 'btn-secondary'} text-sm"
                data-day="saturday">Saturday</button>
        <button class="btn ${activeDay === 'sunday' ? 'btn-primary' : 'btn-secondary'} text-sm"
                data-day="sunday">Sunday</button>
      </div>
      <div class="border border-border-c rounded-kit overflow-hidden">
        <table class="w-full">
          <thead>
            <tr class="bg-surface border-b border-border-c">
              <th class="py-2 px-3 text-left font-mono text-xs text-text-muted">TIME</th>
              <th class="py-2 px-3 text-left font-mono text-xs text-text-muted">EVENT</th>
              <th class="py-2 px-3 text-left font-mono text-xs text-text-muted">DESCRIPTION</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-c">
            ${renderDaySchedule(activeDay)}
          </tbody>
        </table>
      </div>
    `;

    // Day tab click handlers
    el.querySelectorAll('[data-day]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeDay = btn.dataset.day;
        render();
      });
    });
  }

  render();
}
```

- [ ] **Step 3: Add dashboard content to `pages/index.html` `<main>`**

Replace the `<main>` section in index.html with:

```html
  <main class="flex-1">
    <!-- NOW PLAYING BANNER -->
    <div id="now-playing" class="hidden max-w-7xl mx-auto px-4 mt-4"></div>

    <!-- HERO SECTION -->
    <section class="relative overflow-hidden border-b border-border-c">
      <div class="absolute inset-0 bg-cover bg-center opacity-30" style="background-image: url('/static/img/hero-bg.png')"></div>
      <div class="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
        <h1 class="font-ubuntu text-5xl md:text-7xl font-bold leading-tight">
          ROOT ACCESS<br>
          <span class="text-accent-orange">NOSTALGIA.</span>
        </h1>
        <p class="mt-4 text-lg text-text-muted max-w-lg">
          Get ready for a weekend of pure, un-monetized gaming fun.
        </p>
        <button id="hero-rsvp-btn" class="btn btn-primary text-lg mt-6 px-8 py-3">
          RSVP [ ONLINE ]
        </button>
      </div>
    </section>

    <!-- COUNTDOWN -->
    <section class="py-10 border-b border-border-c">
      <div class="max-w-7xl mx-auto px-4 text-center">
        <h2 class="font-mono text-text-muted text-sm mb-4 tracking-widest">COUNTDOWN TO LAUNCH</h2>
        <div id="countdown" class="font-mono text-3xl text-text-muted">Loading...</div>
      </div>
    </section>

    <!-- SCHEDULE -->
    <section id="schedule-section" class="py-10 border-b border-border-c">
      <div class="max-w-7xl mx-auto px-4">
        <h2 class="font-ubuntu text-2xl font-bold mb-6">
          <i class="las la-calendar-alt text-accent-blue"></i> Schedule
        </h2>
        <div id="schedule"></div>
      </div>
    </section>

    <!-- EVENT DETAILS -->
    <section class="py-10">
      <div class="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-6">
        <!-- Location Card -->
        <div class="border border-border-c bg-surface p-6 rounded-kit">
          <h3 class="font-ubuntu text-lg font-bold mb-3">
            <i class="las la-map-marker text-accent-orange"></i> Location
          </h3>
          <p id="event-address" class="text-text-muted mb-3">Loading...</p>
          <a id="event-maps-link" href="#" target="_blank" class="text-accent-blue hover:underline font-mono text-sm">
            [ OPEN IN MAPS ]
          </a>
        </div>

        <!-- WiFi Card -->
        <div class="border border-border-c bg-surface p-6 rounded-kit">
          <h3 class="font-ubuntu text-lg font-bold mb-3">
            <i class="las la-wifi text-accent-green"></i> WiFi
          </h3>
          <div class="font-mono">
            <div class="mb-2">
              <span class="text-text-muted text-sm">SSID:</span>
              <span id="wifi-ssid" class="ml-2 text-accent-green">Loading...</span>
            </div>
            <div>
              <span class="text-text-muted text-sm">PASS:</span>
              <span id="wifi-password" class="ml-2 text-text-primary">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
```

- [ ] **Step 4: Add page-specific JS imports to index.html**

Replace the script tag at the bottom of index.html:

```html
  <script type="module" src="/static/js/app.mjs"></script>
  <script type="module">
    import { initCountdown } from '/static/js/countdown.mjs';
    import { initSchedule, initNowPlaying } from '/static/js/schedule.mjs';
    import { api } from '/static/js/api.mjs';
    import { isLoggedIn } from '/static/js/app.mjs';
    import { openPreferencesModal } from '/static/js/preferences.mjs';

    document.addEventListener('DOMContentLoaded', async () => {
      initCountdown();
      initSchedule();
      initNowPlaying();

      // Load event details into the cards
      try {
        const config = await api.config();
        document.getElementById('event-address').textContent = config.address;
        const mapsLink = document.getElementById('event-maps-link');
        mapsLink.href = config.maps_link;
        document.getElementById('wifi-ssid').textContent = config.wifi_ssid;
        document.getElementById('wifi-password').textContent = config.wifi_password;
      } catch (err) {
        console.error('Failed to load config:', err);
      }

      // Hero RSVP button
      const rsvpBtn = document.getElementById('hero-rsvp-btn');
      if (rsvpBtn) {
        rsvpBtn.addEventListener('click', () => {
          if (isLoggedIn()) {
            openPreferencesModal();
          } else {
            document.getElementById('login-modal').classList.remove('hidden');
          }
        });
      }
    });
  </script>
```

Note: export `isLoggedIn` from `app.mjs` (already done in Step 3 of Task 8).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: dashboard page — hero, countdown, schedule, event details"
```

---

## Task 10: Games Page

**Files:**
- Create: `pages/games.html`

- [ ] **Step 1: Create `pages/games.html`**

Copy the full HTML shell from index.html (head, nav, modals, footer) and replace `<main>` with:

```html
  <main class="flex-1">
    <section class="py-10">
      <div class="max-w-7xl mx-auto px-4">
        <h1 class="font-ubuntu text-3xl font-bold mb-8">
          <i class="las la-gamepad text-accent-orange"></i> Games to Play
        </h1>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="games-grid">

          <!-- Dota Allstars -->
          <a href="https://store.steampowered.com/app/570/Dota_2/" target="_blank"
             class="block border border-border-c bg-surface rounded-kit overflow-hidden hover:border-accent-blue transition-colors">
            <div class="h-40 bg-base flex items-center justify-center">
              <img src="/static/img/games/dota.jpg" alt="Dota Allstars" class="h-full w-full object-cover">
            </div>
            <div class="p-3 flex justify-between items-center">
              <div>
                <div class="font-bold">Dota Allstars</div>
                <div class="font-mono text-xs text-text-muted">Players: 10</div>
              </div>
              <span class="badge badge-green">[ ON ]</span>
            </div>
          </a>

          <!-- Minecraft Beta 1.7 -->
          <a href="https://www.minecraft.net/" target="_blank"
             class="block border border-border-c bg-surface rounded-kit overflow-hidden hover:border-accent-blue transition-colors">
            <div class="h-40 bg-base flex items-center justify-center">
              <img src="/static/img/games/minecraft.jpg" alt="Minecraft Beta 1.7" class="h-full w-full object-cover">
            </div>
            <div class="p-3 flex justify-between items-center">
              <div>
                <div class="font-bold">Minecraft Beta 1.7</div>
                <div class="font-mono text-xs text-text-muted">Players: 20</div>
              </div>
              <span class="badge badge-green">[ ON ]</span>
            </div>
          </a>

          <!-- Call of Duty 2 -->
          <a href="https://store.steampowered.com/app/2630/Call_of_Duty_2/" target="_blank"
             class="block border border-border-c bg-surface rounded-kit overflow-hidden hover:border-accent-blue transition-colors">
            <div class="h-40 bg-base flex items-center justify-center">
              <img src="/static/img/games/cod2.jpg" alt="Call of Duty 2" class="h-full w-full object-cover">
            </div>
            <div class="p-3 flex justify-between items-center">
              <div>
                <div class="font-bold">Call of Duty 2</div>
                <div class="font-mono text-xs text-text-muted">Players: 16</div>
              </div>
              <span class="badge badge-green">[ ON ]</span>
            </div>
          </a>

          <!-- The Sims 2 -->
          <a href="https://www.ea.com/games/the-sims" target="_blank"
             class="block border border-border-c bg-surface rounded-kit overflow-hidden hover:border-accent-blue transition-colors">
            <div class="h-40 bg-base flex items-center justify-center">
              <img src="/static/img/games/sims2.jpg" alt="The Sims 2" class="h-full w-full object-cover">
            </div>
            <div class="p-3 flex justify-between items-center">
              <div>
                <div class="font-bold">The Sims 2</div>
                <div class="font-mono text-xs text-text-muted">Players: 1</div>
              </div>
              <span class="badge badge-green">[ ON ]</span>
            </div>
          </a>

          <!-- Pokemon Red/Blue -->
          <a href="https://www.pokemon.com/" target="_blank"
             class="block border border-border-c bg-surface rounded-kit overflow-hidden hover:border-accent-blue transition-colors">
            <div class="h-40 bg-base flex items-center justify-center">
              <img src="/static/img/games/pokemon.jpg" alt="Pokemon Red/Blue" class="h-full w-full object-cover">
            </div>
            <div class="p-3 flex justify-between items-center">
              <div>
                <div class="font-bold">Pokemon Red/Blue</div>
                <div class="font-mono text-xs text-text-muted">Players: 2</div>
              </div>
              <span class="badge badge-green">[ ON ]</span>
            </div>
          </a>

          <!-- TBD -->
          <div class="border border-border-c border-dashed bg-base rounded-kit overflow-hidden flex items-center justify-center h-[232px]">
            <div class="text-center text-text-muted">
              <i class="las la-question-circle text-4xl"></i>
              <div class="font-mono text-sm mt-2">[ TBD ]</div>
            </div>
          </div>

        </div>
      </div>
    </section>
  </main>
```

Same `<script>` tag as other pages: just `app.mjs`.

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: games page — static grid with placeholder games"
```

---

## Task 11: Guest List Page

**Files:**
- Create: `pages/guests.html`
- Create: `static/js/guests.mjs`

- [ ] **Step 1: Create `static/js/guests.mjs`**

```javascript
/**
 * Guest list page logic.
 * Fetches /api/guests and renders the roster.
 */
import { api } from './api.mjs';

export async function initGuestList() {
  const el = document.getElementById('guest-list');
  if (!el) return;

  el.innerHTML = '<div class="text-text-muted font-mono text-sm">Loading guest list...</div>';

  try {
    const guests = await api.guests();

    if (guests.length === 0) {
      el.innerHTML = '<div class="text-text-muted font-mono">[ NO GUESTS YET ]</div>';
      return;
    }

    el.innerHTML = `
      <div class="grid gap-3">
        ${guests.map(guest => {
          const avatar = guest.avatar
            ? `<img src="/static/avatars/${guest.avatar}" alt="" class="w-10 h-10 rounded-kit border border-border-c">`
            : `<div class="w-10 h-10 rounded-kit border border-border-c bg-base flex items-center justify-center font-mono text-xs text-text-muted">?</div>`;

          const daysText = guest.days_attending
            ? { saturday: 'Sat', sunday: 'Sun', both: 'Sat + Sun' }[guest.days_attending] || guest.days_attending
            : '—';

          const snack = guest.snack_contribution
            ? `<span class="text-text-muted text-sm">🍿 ${guest.snack_contribution}</span>`
            : '';

          return `
            <div class="flex items-center gap-4 border border-border-c bg-surface p-3 rounded-kit">
              ${avatar}
              <div class="flex-1 min-w-0">
                <div class="font-bold truncate">${guest.handle}</div>
                <div class="text-sm text-text-muted font-mono">[ ${daysText} ]</div>
              </div>
              <div class="text-right">
                ${snack}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (err) {
    el.innerHTML = '<div class="text-accent-orange font-mono text-sm">[ ERROR LOADING GUESTS ]</div>';
    console.error('Failed to load guests:', err);
  }
}
```

- [ ] **Step 2: Create `pages/guests.html`**

Copy HTML shell from index.html. Replace `<main>` with:

```html
  <main class="flex-1">
    <section class="py-10">
      <div class="max-w-3xl mx-auto px-4">
        <h1 class="font-ubuntu text-3xl font-bold mb-8">
          <i class="las la-users text-accent-blue"></i> Guest List
        </h1>
        <div id="guest-list"></div>
      </div>
    </section>
  </main>
```

Add page-specific script:

```html
  <script type="module" src="/static/js/app.mjs"></script>
  <script type="module">
    import { initGuestList } from '/static/js/guests.mjs';
    document.addEventListener('DOMContentLoaded', () => { initGuestList(); });
  </script>
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: guest list page — public roster with avatars"
```

---

## Task 12: Food Voting Page

**Files:**
- Create: `pages/food.html`
- Create: `static/js/food.mjs`

- [ ] **Step 1: Create `static/js/food.mjs`**

```javascript
/**
 * Food suggestion + ranked voting logic.
 */
import { api } from './api.mjs';
import { isLoggedIn } from './app.mjs';

let allFoods = [];
let myVotes = [];

async function loadFoods() {
  try {
    allFoods = await api.foods();
  } catch (err) {
    allFoods = [];
  }
}

async function loadMyVotes() {
  if (!isLoggedIn()) { myVotes = []; return; }
  try {
    myVotes = await api.myVotes();
  } catch (err) {
    myVotes = [];
  }
}

function renderFoodList(el) {
  if (allFoods.length === 0) {
    el.innerHTML = '<div class="text-text-muted font-mono">[ NO FOOD SUGGESTIONS YET ]</div>';
    return;
  }

  const sorted = [...allFoods].sort((a, b) => b.score - a.score);

  el.innerHTML = `
    <div class="space-y-2">
      ${sorted.map((food, i) => `
        <div class="flex items-center gap-4 border border-border-c bg-surface p-3 rounded-kit">
          <span class="font-mono text-accent-orange w-8 text-center">#${i + 1}</span>
          <div class="flex-1">
            <span class="font-bold">${food.name}</span>
            <span class="text-text-muted text-sm ml-2">by ${food.suggested_by}</span>
          </div>
          <div class="flex gap-3 font-mono text-xs">
            <span class="text-accent-orange">${food.votes['1st']}×1st</span>
            <span class="text-accent-blue">${food.votes['2nd']}×2nd</span>
            <span class="text-text-muted">${food.votes['3rd']}×3rd</span>
          </div>
          <span class="font-mono font-bold text-accent-green">${food.score}pts</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderVoteForm(el) {
  if (!isLoggedIn()) {
    el.innerHTML = '<div class="text-text-muted font-mono text-sm">[ LOGIN TO VOTE ]</div>';
    return;
  }

  if (allFoods.length === 0) {
    el.innerHTML = '<div class="text-text-muted font-mono text-sm">[ ADD FOOD OPTIONS FIRST ]</div>';
    return;
  }

  const options = allFoods.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
  const ranks = ['1st', '2nd', '3rd'];

  el.innerHTML = `
    <form id="vote-form" class="space-y-3">
      ${ranks.map((label, i) => {
        const rank = i + 1;
        const currentVote = myVotes.find(v => v.rank === rank);
        return `
          <div class="flex items-center gap-3">
            <label class="font-mono text-sm text-accent-orange w-12">${label}:</label>
            <select name="rank_${rank}" class="flex-1">
              <option value="">-- Select --</option>
              ${allFoods.map(f =>
                `<option value="${f.id}" ${currentVote && currentVote.option_id === f.id ? 'selected' : ''}>${f.name}</option>`
              ).join('')}
            </select>
          </div>
        `;
      }).join('')}
      <button type="submit" class="btn btn-primary text-sm">Submit Votes</button>
      <div id="vote-status" class="text-sm font-mono hidden"></div>
    </form>
  `;

  document.getElementById('vote-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('vote-status');
    const votes = [];

    for (let rank = 1; rank <= 3; rank++) {
      const val = e.target.querySelector(`[name="rank_${rank}"]`).value;
      if (val) votes.push({ option_id: parseInt(val), rank });
    }

    if (votes.length === 0) {
      statusEl.textContent = '[ SELECT AT LEAST ONE ]';
      statusEl.className = 'text-sm font-mono text-accent-orange';
      statusEl.classList.remove('hidden');
      return;
    }

    // Check for duplicates
    const ids = votes.map(v => v.option_id);
    if (new Set(ids).size !== ids.length) {
      statusEl.textContent = '[ NO DUPLICATE PICKS ]';
      statusEl.className = 'text-sm font-mono text-accent-orange';
      statusEl.classList.remove('hidden');
      return;
    }

    try {
      await api.vote(votes);
      statusEl.textContent = '[ VOTES SAVED ]';
      statusEl.className = 'text-sm font-mono text-accent-green';
      statusEl.classList.remove('hidden');
      // Refresh data
      await Promise.all([loadFoods(), loadMyVotes()]);
      renderFoodList(document.getElementById('food-list'));
    } catch (err) {
      statusEl.textContent = '[ ERROR SAVING VOTES ]';
      statusEl.className = 'text-sm font-mono text-accent-orange';
      statusEl.classList.remove('hidden');
    }
  });
}

function renderSuggestForm(el) {
  if (!isLoggedIn()) {
    el.innerHTML = '<div class="text-text-muted font-mono text-sm">[ LOGIN TO SUGGEST ]</div>';
    return;
  }

  el.innerHTML = `
    <form id="suggest-form" class="flex gap-3">
      <input type="text" name="food_name" placeholder="Suggest a food..." required class="flex-1">
      <button type="submit" class="btn btn-primary text-sm">Add</button>
    </form>
    <div id="suggest-status" class="text-sm font-mono mt-2 hidden"></div>
  `;

  document.getElementById('suggest-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = e.target.querySelector('[name="food_name"]').value.trim();
    const statusEl = document.getElementById('suggest-status');

    try {
      await api.addFood(name);
      e.target.querySelector('[name="food_name"]').value = '';
      statusEl.textContent = `[ ADDED: ${name} ]`;
      statusEl.className = 'text-sm font-mono mt-2 text-accent-green';
      statusEl.classList.remove('hidden');
      // Refresh
      await loadFoods();
      renderFoodList(document.getElementById('food-list'));
      renderVoteForm(document.getElementById('vote-section'));
    } catch (err) {
      statusEl.textContent = '[ ERROR ADDING FOOD ]';
      statusEl.className = 'text-sm font-mono mt-2 text-accent-orange';
      statusEl.classList.remove('hidden');
    }
  });
}

export async function initFoodPage() {
  await Promise.all([loadFoods(), loadMyVotes()]);

  const listEl = document.getElementById('food-list');
  const voteEl = document.getElementById('vote-section');
  const suggestEl = document.getElementById('suggest-section');

  if (listEl) renderFoodList(listEl);
  if (voteEl) renderVoteForm(voteEl);
  if (suggestEl) renderSuggestForm(suggestEl);
}
```

- [ ] **Step 2: Create `pages/food.html`**

Copy HTML shell. Replace `<main>` with:

```html
  <main class="flex-1">
    <section class="py-10">
      <div class="max-w-3xl mx-auto px-4">
        <h1 class="font-ubuntu text-3xl font-bold mb-8">
          <i class="las la-utensils text-accent-orange"></i> Food Voting
        </h1>

        <!-- Suggest -->
        <div class="mb-8">
          <h2 class="font-ubuntu text-xl font-bold mb-3">Suggest a Food</h2>
          <div id="suggest-section"></div>
        </div>

        <!-- Current Rankings -->
        <div class="mb-8">
          <h2 class="font-ubuntu text-xl font-bold mb-3">Current Rankings</h2>
          <div id="food-list"></div>
        </div>

        <!-- Vote -->
        <div class="mb-8">
          <h2 class="font-ubuntu text-xl font-bold mb-3">Your Votes</h2>
          <p class="text-text-muted text-sm mb-3">Pick your top 3 choices. You can change your votes anytime.</p>
          <div id="vote-section"></div>
        </div>
      </div>
    </section>
  </main>
```

Script:

```html
  <script type="module" src="/static/js/app.mjs"></script>
  <script type="module">
    import { initFoodPage } from '/static/js/food.mjs';
    document.addEventListener('DOMContentLoaded', () => { initFoodPage(); });
  </script>
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: food voting page — suggest, rank, view tallies"
```

---

## Task 13: Gear + Rules Page

**Files:**
- Create: `pages/gear.html`

- [ ] **Step 1: Create `pages/gear.html`**

Copy HTML shell. Replace `<main>` with:

```html
  <main class="flex-1">
    <section class="py-10">
      <div class="max-w-3xl mx-auto px-4">

        <h1 class="font-ubuntu text-3xl font-bold mb-8">
          <i class="las la-laptop text-accent-blue"></i> What to Bring
        </h1>

        <!-- Hardware -->
        <div class="border border-border-c bg-surface p-6 rounded-kit mb-6">
          <h2 class="font-ubuntu text-xl font-bold mb-4">
            <i class="las la-desktop text-accent-orange"></i> Hardware
          </h2>
          <ul class="space-y-2 font-mono text-sm">
            <li class="flex items-center gap-2"><span class="text-accent-green">▸</span> PC / Laptop</li>
            <li class="flex items-center gap-2"><span class="text-accent-green">▸</span> Monitor (with cables)</li>
            <li class="flex items-center gap-2"><span class="text-accent-green">▸</span> Keyboard</li>
            <li class="flex items-center gap-2"><span class="text-accent-green">▸</span> Mouse + Mousepad</li>
            <li class="flex items-center gap-2"><span class="text-accent-green">▸</span> Ethernet Cable (Cat5e or better)</li>
            <li class="flex items-center gap-2"><span class="text-accent-green">▸</span> Power Strip / Extension Cord</li>
            <li class="flex items-center gap-2"><span class="text-accent-green">▸</span> Headset / Headphones</li>
          </ul>
        </div>

        <!-- Software -->
        <div class="border border-border-c bg-surface p-6 rounded-kit mb-6">
          <h2 class="font-ubuntu text-xl font-bold mb-4">
            <i class="las la-code text-accent-blue"></i> Software
          </h2>
          <ul class="space-y-2 font-mono text-sm">
            <li class="flex items-center gap-2"><span class="text-accent-green">▸</span> OS fully updated</li>
            <li class="flex items-center gap-2"><span class="text-accent-green">▸</span> All tournament games pre-installed (see <a href="/games.html" class="text-accent-blue hover:underline">Games</a>)</li>
            <li class="flex items-center gap-2"><span class="text-accent-green">▸</span> Steam / game launchers logged in</li>
            <li class="flex items-center gap-2"><span class="text-accent-green">▸</span> Voice chat client (Discord / Mumble)</li>
          </ul>
        </div>

        <!-- Personal -->
        <div class="border border-border-c bg-surface p-6 rounded-kit mb-6">
          <h2 class="font-ubuntu text-xl font-bold mb-4">
            <i class="las la-user text-accent-orange"></i> Personal
          </h2>
          <ul class="space-y-2 font-mono text-sm">
            <li class="flex items-center gap-2"><span class="text-accent-green">▸</span> Snacks to share (optional — note it in your <a href="/guests.html" class="text-accent-blue hover:underline">profile</a>)</li>
            <li class="flex items-center gap-2"><span class="text-accent-green">▸</span> Drinks</li>
            <li class="flex items-center gap-2"><span class="text-accent-green">▸</span> Comfortable chair (if you have one)</li>
          </ul>
        </div>

        <!-- RULES -->
        <h1 class="font-ubuntu text-3xl font-bold mt-12 mb-8">
          <i class="las la-gavel text-accent-orange"></i> Rules & Code of Conduct
        </h1>

        <div class="border border-border-c bg-surface p-6 rounded-kit mb-6">
          <h2 class="font-ubuntu text-xl font-bold mb-4">Network Etiquette</h2>
          <ul class="space-y-2 font-mono text-sm">
            <li class="flex items-center gap-2"><span class="text-accent-orange">▸</span> No torrenting or excessive bandwidth usage</li>
            <li class="flex items-center gap-2"><span class="text-accent-orange">▸</span> No network scanning or sniffing tools</li>
            <li class="flex items-center gap-2"><span class="text-accent-orange">▸</span> No hosting unauthorized servers</li>
          </ul>
        </div>

        <div class="border border-border-c bg-surface p-6 rounded-kit mb-6">
          <h2 class="font-ubuntu text-xl font-bold mb-4">Banned Software</h2>
          <ul class="space-y-2 font-mono text-sm">
            <li class="flex items-center gap-2"><span class="text-accent-orange">▸</span> Aim hacks, wallhacks, or any cheat software</li>
            <li class="flex items-center gap-2"><span class="text-accent-orange">▸</span> DDoS or network attack tools</li>
            <li class="flex items-center gap-2"><span class="text-accent-orange">▸</span> Crypto miners</li>
          </ul>
        </div>

        <div class="border border-border-c bg-surface p-6 rounded-kit">
          <h2 class="font-ubuntu text-xl font-bold mb-4">Behavior</h2>
          <ul class="space-y-2 font-mono text-sm">
            <li class="flex items-center gap-2"><span class="text-accent-orange">▸</span> Be respectful to all attendees</li>
            <li class="flex items-center gap-2"><span class="text-accent-orange">▸</span> Keep noise levels reasonable (use headphones for audio)</li>
            <li class="flex items-center gap-2"><span class="text-accent-orange">▸</span> Clean up after yourself</li>
            <li class="flex items-center gap-2"><span class="text-accent-orange">▸</span> Tournament disputes resolved by event organizer — decisions are final</li>
          </ul>
        </div>

      </div>
    </section>
  </main>
```

Script: just `app.mjs` (no page-specific JS needed).

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: gear + rules page — BYO checklist and code of conduct"
```

---

## Task 14: Avatar Assets

**Files:**
- Create: `static/avatars/` — 12 placeholder avatar images

- [ ] **Step 1: Create placeholder avatar SVGs**

Since we can't source real pixel-art at build time, create simple SVG avatars as placeholders. Each is a colored circle with an initial/icon. Create 12 files:

Generate simple colored SVG avatars programmatically — one per file in `static/avatars/`. Each SVG is a 64x64 pixel icon with a distinct color and symbol. The filenames must match the `AVATARS` array in `preferences.mjs`:

```
pixel-cat.png     pixel-dog.png     pixel-robot.png   pixel-warrior.png
pixel-wizard.png  pixel-alien.png   pixel-ghost.png   pixel-tux.png
pixel-skull.png   pixel-mushroom.png pixel-crown.png  pixel-flame.png
```

For the initial build, use SVG files (rename to `.png` in the array, or change the array to `.svg`). Replace with real pixel art later — add to `future-TODO.md`.

A simple approach: write a small Python script that generates 12 distinct colored SVG files, each with a single emoji character centered. Or download 12 free pixel-art icons from an open-source icon set.

The implementer should either:
1. Use a free pixel-art icon set (like https://kenney.nl/assets or similar CC0 sets)
2. Or generate simple colored SVG placeholder avatars

- [ ] **Step 2: Add to future-TODO.md**

Add entry: `- [ ] Replace placeholder SVG avatars with real pixel-art avatars`

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: placeholder avatar assets"
```

---

## Task 15: Placeholder Game Cover Images

**Files:**
- Create: `static/img/games/` — placeholder images
- Create: `static/img/hero-bg.png` — placeholder hero image

- [ ] **Step 1: Create placeholder game images**

Create simple placeholder images for each game (can be solid-color SVGs with game name text, or download free placeholders). Files needed:

```
static/img/games/dota.jpg
static/img/games/minecraft.jpg
static/img/games/cod2.jpg
static/img/games/sims2.jpg
static/img/games/pokemon.jpg
```

And the hero background:
```
static/img/hero-bg.png
```

Use any approach: generate simple SVG placeholders, use https://placehold.co URLs in HTML instead, or source free images.

- [ ] **Step 2: Add to future-TODO.md**

Add entry: `- [ ] Replace placeholder game covers and hero image with real assets`

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: placeholder game covers and hero image"
```

---

## Task 16: Flask Static File Serving (Development Mode)

**Files:**
- Modify: `server/app.py`

In production, nginx serves static files. For development, Flask needs to serve the HTML pages and static assets.

- [ ] **Step 1: Add static/page serving to `server/app.py`**

Add to `create_app()`, after all API routes:

```python
    # --- Development static file serving ---
    # In production, nginx handles this. For dev, Flask serves pages + static.

    import os
    base_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

    @app.route('/')
    def index():
        return app.send_static_file('index.html')

    @app.route('/<path:filename>')
    def serve_page(filename):
        """Serve HTML pages and static files for development."""
        # Try pages/ first
        pages_dir = os.path.join(base_dir, 'pages')
        page_path = os.path.join(pages_dir, filename)
        if os.path.isfile(page_path):
            from flask import send_from_directory
            return send_from_directory(pages_dir, filename)

        # Try static/ next
        static_dir = os.path.join(base_dir, 'static')
        static_path = os.path.join(static_dir, filename.removeprefix('static/'))
        if filename.startswith('static/') and os.path.isfile(static_path):
            return send_from_directory(static_dir, filename.removeprefix('static/'))

        from flask import abort
        abort(404)

    # Reconfigure: index.html is in pages/
    app.static_folder = os.path.join(base_dir, 'static')
    app.static_url_path = '/static'

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
```

- [ ] **Step 2: Verify dev server starts**

```bash
cd server && python app.py
```

Open `http://localhost:5000` — should see the dashboard page.
Open `http://localhost:5000/games.html` — should see games page.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: dev-mode static file serving in Flask"
```

---

## Task 17: Integration Smoke Test

**Files:** None new — just verification.

- [ ] **Step 1: Run full test suite**

```bash
pytest tests/ -v
```

All tests must pass.

- [ ] **Step 2: Manual smoke test**

Start the dev server:
```bash
cd server && python app.py
```

Verify:
1. `http://localhost:5000` loads dashboard with hero, countdown, schedule
2. `http://localhost:5000/games.html` shows game grid
3. `http://localhost:5000/guests.html` shows empty guest list
4. `http://localhost:5000/food.html` shows food page (login required for actions)
5. `http://localhost:5000/gear.html` shows BYO checklist and rules
6. Login modal opens from nav
7. API calls work: `curl http://localhost:5000/api/config`

- [ ] **Step 3: Add a test guest via CLI**

```bash
cd server && python init_db.py create && python init_db.py add "TestUser"
```

Verify login works with the generated code.

- [ ] **Step 4: Test full flow**

1. Login as TestUser
2. Preferences modal auto-opens → fill in handle, pick avatar, select days
3. Check guest list page — TestUser appears with preferences
4. Go to food page → suggest "Pizza" → vote for it
5. Logout → verify guest list still shows data but food page shows "login to vote"

- [ ] **Step 5: Commit any fixes**

```bash
git add -A && git commit -m "fix: integration test fixes"
```

---

## Task 18: Final Cleanup

- [ ] **Step 1: Update `future-TODO.md`**

Ensure it contains all deferred items:
```markdown
- [ ] Replace placeholder SVG avatars with real pixel-art avatars
- [ ] Replace placeholder game covers and hero image with real assets
- [ ] Replace placeholder event dates, address, WiFi credentials
- [ ] Replace placeholder game list with real games + Steam URLs
- [ ] Add real schedule data
- [ ] Nginx configuration for production deployment
- [ ] Admin UI for managing guests (currently raw SQL)
- [ ] Mobile hamburger menu for nav
- [ ] Rate limiting on API endpoints beyond login
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "docs: update future-TODO with all deferred items"
```
