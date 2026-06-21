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

    # Store require_auth on app for use in later route registration
    app.require_auth = require_auth

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
