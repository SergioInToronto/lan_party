from init_db import add_guest
from app import fetch_steam_avatars


def _seed_guests(db_conn):
    """Add guests with preferences for testing."""
    code1 = add_guest(db_conn, "Alice")
    code2 = add_guest(db_conn, "Bob")

    # Set preferences for Alice
    db_conn.execute(
        "INSERT INTO guest_preferences (guest_id, key, value) VALUES (1, 'handle', 'al1ce')"
    )
    db_conn.execute(
        "INSERT INTO guest_preferences (guest_id, key, value) VALUES (1, 'steam_id', '76561197960287930')"
    )
    db_conn.execute(
        "INSERT INTO guest_preferences (guest_id, key, value) VALUES (1, 'attending_saturday', 'true')"
    )
    db_conn.execute(
        "INSERT INTO guest_preferences (guest_id, key, value) VALUES (1, 'attending_sunday', 'true')"
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
    """Guests with preferences show handle, avatar_url, attendance days."""
    _seed_guests(db_conn)
    resp = client.get("/api/guests")
    data = resp.get_json()

    alice = next(g for g in data if g.get("handle") == "al1ce")
    assert "avatar_url" in alice
    assert alice["attending_saturday"] == "true"
    assert alice["attending_sunday"] == "true"


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


def test_fetch_steam_avatars_empty_input():
    """No steam_ids means no network call."""
    assert fetch_steam_avatars([]) == {}
    assert fetch_steam_avatars([None]) == {}


def test_fetch_steam_avatars_rejects_non_numeric_id():
    """Non-numeric steam_id (e.g. a vanity name) is skipped, no request made."""
    assert fetch_steam_avatars(["not_a_steamid"]) == {}


class FakeResponse:
    def __init__(self, body: bytes):
        self._body = body

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def read(self):
        return self._body


def test_fetch_steam_avatars_maps_response(monkeypatch):
    """Successful community-profile XML response maps steamid -> avatarMedium."""
    xml = b"""<?xml version="1.0"?><profile>
        <steamID64>76561197960287930</steamID64>
        <avatarMedium><![CDATA[https://example.com/a.jpg]]></avatarMedium>
    </profile>"""

    def fake_urlopen(url, timeout=5):
        assert "76561197960287930" in url
        assert "xml=1" in url
        return FakeResponse(xml)

    monkeypatch.setattr("app.urllib.request.urlopen", fake_urlopen)

    result = fetch_steam_avatars(["76561197960287930"])
    assert result == {"76561197960287930": "https://example.com/a.jpg"}


def test_fetch_steam_avatars_missing_profile_excluded(monkeypatch):
    """A profile-not-found XML response (no avatarMedium tag) is excluded, not a crash."""
    xml = b'<?xml version="1.0"?><response><error>The specified profile could not be found.</error></response>'
    monkeypatch.setattr("app.urllib.request.urlopen", lambda url, timeout=5: FakeResponse(xml))

    assert fetch_steam_avatars(["1"]) == {}


def test_fetch_steam_avatars_isolates_per_id_failures(monkeypatch):
    """One id failing (network error) doesn't take down other ids in the same call."""
    good_xml = b"""<?xml version="1.0"?><profile>
        <avatarMedium><![CDATA[https://example.com/a.jpg]]></avatarMedium>
    </profile>"""

    def fake_urlopen(url, timeout=5):
        if "111" in url:
            raise OSError("network down")
        return FakeResponse(good_xml)

    monkeypatch.setattr("app.urllib.request.urlopen", fake_urlopen)

    result = fetch_steam_avatars(["111", "222"])
    assert result == {"222": "https://example.com/a.jpg"}
