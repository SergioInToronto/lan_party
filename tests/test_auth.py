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
