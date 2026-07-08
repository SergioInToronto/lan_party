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


def generate_access_code(length=5):
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
            print(f'Username: "{name}" Access code: "{code}"')

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
