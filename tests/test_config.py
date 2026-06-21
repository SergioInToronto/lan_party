import json
import os


def test_config_returns_event_details(client, app):
    # Write a test config file
    config_path = app.config["EVENT_DETAILS_PATH"]
    os.makedirs(os.path.dirname(config_path), exist_ok=True)
    with open(config_path, "w") as f:
        json.dump({"event_name": "TEST EVENT", "wifi_ssid": "TEST-WIFI"}, f)

    resp = client.get("/api/config")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["event_name"] == "TEST EVENT"
    assert data["wifi_ssid"] == "TEST-WIFI"
