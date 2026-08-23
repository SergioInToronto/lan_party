from init_db import add_guest


class FakeResponse:
    def __init__(self, body: bytes):
        self._body = body

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def read(self):
        return self._body


AVATAR_XML = b"""<?xml version="1.0"?><profile>
    <avatarMedium><![CDATA[https://example.com/a.jpg]]></avatarMedium>
</profile>"""


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
        "steam_id": "76561197960287930",
        "os": "Arch btw",
        "attending_saturday": "true",
        "attending_sunday": "false",
        "most_looking_forward_to": "repo",
    })
    assert resp.status_code == 200
    assert resp.get_json()["ok"] is True

    # Verify saved
    resp = client.get("/api/preferences")
    data = resp.get_json()
    assert data["handle"] == "al1ce"
    assert data["os"] == "Arch btw"
    assert data["attending_saturday"] == "true"
    assert data["attending_sunday"] == "false"
    assert data["most_looking_forward_to"] == "repo"


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


def test_set_steam_id_fetches_and_stores_avatar_url(client, db_conn, monkeypatch):
    """Setting a new steam_id triggers one Steam fetch, stored as avatar_url."""
    calls = []

    def fake_urlopen(url, timeout=5):
        calls.append(url)
        return FakeResponse(AVATAR_XML)

    monkeypatch.setattr("app.urllib.request.urlopen", fake_urlopen)
    _login(client, db_conn)

    resp = client.post("/api/preferences", json={"steam_id": "76561197960287930"})
    assert resp.status_code == 200
    assert len(calls) == 1

    data = client.get("/api/preferences").get_json()
    assert data["steam_id"] == "76561197960287930"
    assert data["avatar_url"] == "https://example.com/a.jpg"


def test_unchanged_steam_id_does_not_refetch(client, db_conn, monkeypatch):
    """Re-saving preferences without changing steam_id makes no Steam request."""
    calls = []

    def fake_urlopen(url, timeout=5):
        calls.append(url)
        return FakeResponse(AVATAR_XML)

    monkeypatch.setattr("app.urllib.request.urlopen", fake_urlopen)
    _login(client, db_conn)

    client.post("/api/preferences", json={"steam_id": "76561197960287930"})
    assert len(calls) == 1

    resp = client.post("/api/preferences", json={
        "steam_id": "76561197960287930",
        "os": "Arch",
    })
    assert resp.status_code == 200
    assert len(calls) == 1  # no new fetch, steam_id didn't change


def test_avatar_url_is_not_directly_settable(client, db_conn):
    """avatar_url isn't a user-writable preference; posting it is a no-op."""
    _login(client, db_conn)
    client.post("/api/preferences", json={"avatar_url": "https://evil.example/x.jpg"})

    data = client.get("/api/preferences").get_json()
    assert "avatar_url" not in data


def test_retry_after_failed_fetch_resolves_avatar(client, db_conn, monkeypatch):
    """If the first fetch fails, resubmitting the SAME steam_id should retry,
    not stay permanently null just because 'nothing changed'."""
    monkeypatch.setattr(
        "app.urllib.request.urlopen",
        lambda url, timeout=5: (_ for _ in ()).throw(OSError("network down"))
    )
    _login(client, db_conn)

    client.post("/api/preferences", json={"steam_id": "76561197960287930"})
    data = client.get("/api/preferences").get_json()
    assert data.get("avatar_url") is None  # fetch failed, nothing stored

    # Network recovers, user resubmits the exact same steam_id as a retry.
    monkeypatch.setattr(
        "app.urllib.request.urlopen",
        lambda url, timeout=5: FakeResponse(AVATAR_XML)
    )
    client.post("/api/preferences", json={"steam_id": "76561197960287930"})

    data = client.get("/api/preferences").get_json()
    assert data["avatar_url"] == "https://example.com/a.jpg"
