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
