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
