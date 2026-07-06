import os
import secrets
import time

from flask import Flask, request, jsonify, session
from db import close_db, get_db, init_db
from init_db import hash_code


def create_app(test_config=None):
    app = Flask(__name__, static_folder=None)
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    # Secure session cookies (HTTPS-only, no JS access, CSRF-resistant).
    app.config.update(
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        SESSION_COOKIE_SECURE=os.environ.get("COOKIE_SECURE", "1") == "1",
    )

    if test_config:
        app.config.update(test_config)

    app.teardown_appcontext(close_db)

    with app.app_context():
        init_db()

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
                time.sleep(2.5)
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

    # --- Config route ---

    @app.route("/api/config", methods=["GET"])
    def config():
        db = get_db()
        rows = db.execute("SELECT key, value FROM event").fetchall()
        return jsonify({row["key"]: row["value"] for row in rows})

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

    # Store require_auth on app for use in later route registration
    app.require_auth = require_auth

    # --- Development static file serving ---
    # In production, nginx handles this. For dev, Flask serves pages + static.

    base_dir_static = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

    static_dir = os.path.join(base_dir_static, 'static')

    @app.route('/')
    def index():
        from flask import send_from_directory
        return send_from_directory(static_dir, 'index.html')

    @app.route('/<path:filename>')
    def serve_page(filename):
        """Serve HTML pages and static assets for development."""
        from flask import send_from_directory, abort
        rel = filename[len('static/'):] if filename.startswith('static/') else filename
        if os.path.isfile(os.path.join(static_dir, rel)):
            return send_from_directory(static_dir, rel)
        abort(404)

    # Configure Flask static folder for /static/ URL prefix
    app.static_folder = static_dir
    app.static_url_path = '/static'

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
