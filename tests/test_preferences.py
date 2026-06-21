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
