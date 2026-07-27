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


def test_guest_list_shows_preferences(client, db_conn, monkeypatch):
    """Guests with preferences show handle, avatar_url, days, snacks."""
    monkeypatch.delenv("STEAM_API_KEY", raising=False)
    _seed_guests(db_conn)
    resp = client.get("/api/guests")
    data = resp.get_json()

    alice = next(g for g in data if g.get("handle") == "al1ce")
    assert "avatar_url" in alice
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


def test_fetch_steam_avatars_no_api_key(monkeypatch):
    """Without STEAM_API_KEY configured, no network call is made."""
    monkeypatch.delenv("STEAM_API_KEY", raising=False)
    assert fetch_steam_avatars(["76561197960287930"]) == {}


def test_fetch_steam_avatars_empty_input(monkeypatch):
    """No steam_ids means no network call, regardless of API key."""
    monkeypatch.setenv("STEAM_API_KEY", "fake-key")
    assert fetch_steam_avatars([]) == {}
    assert fetch_steam_avatars([None]) == {}


def test_fetch_steam_avatars_maps_response(monkeypatch):
    """Successful GetPlayerSummaries response maps steamid -> avatarmedium."""
    monkeypatch.setenv("STEAM_API_KEY", "fake-key")

    class FakeResponse:
        def __enter__(self):
            return self

        def __exit__(self, *exc):
            return False

        def read(self):
            return b""

    fake_payload = {
        "response": {
            "players": [
                {"steamid": "76561197960287930", "avatarmedium": "https://example.com/a.jpg"},
            ]
        }
    }

    def fake_urlopen(url, timeout=5):
        assert "76561197960287930" in url
        return FakeResponse()

    monkeypatch.setattr("app.json.load", lambda resp: fake_payload)
    monkeypatch.setattr("app.urllib.request.urlopen", fake_urlopen)

    result = fetch_steam_avatars(["76561197960287930"])
    assert result == {"76561197960287930": "https://example.com/a.jpg"}


def test_fetch_steam_avatars_handles_errors(monkeypatch):
    """Network/API failures degrade to {} instead of raising."""
    monkeypatch.setenv("STEAM_API_KEY", "fake-key")

    def broken_urlopen(url, timeout=5):
        raise OSError("network down")

    monkeypatch.setattr("app.urllib.request.urlopen", broken_urlopen)
    assert fetch_steam_avatars(["76561197960287930"]) == {}
