def test_config_returns_event_details(client, app, db_conn):
    db_conn.execute(
        "INSERT OR REPLACE INTO event (key, value) VALUES (?, ?)",
        ("event_name", "TEST EVENT")
    )
    db_conn.execute(
        "INSERT OR REPLACE INTO event (key, value) VALUES (?, ?)",
        ("wifi_ssid", "TEST-WIFI")
    )
    db_conn.commit()

    resp = client.get("/api/config")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["event_name"] == "TEST EVENT"
    assert data["wifi_ssid"] == "TEST-WIFI"
