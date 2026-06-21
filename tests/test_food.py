from init_db import add_guest


def _login(client, db_conn, name="Alice"):
    code = add_guest(db_conn, name)
    resp = client.post("/api/login", json={"name": name, "access_code": code})
    return resp.get_json()["guest"]["id"]


def test_food_list_empty(client):
    resp = client.get("/api/foods")
    assert resp.status_code == 200
    assert resp.get_json() == []


def test_add_food(client, db_conn):
    _login(client, db_conn)
    resp = client.post("/api/foods", json={"name": "Pizza"})
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["name"] == "Pizza"
    assert "id" in data


def test_add_food_requires_auth(client):
    resp = client.post("/api/foods", json={"name": "Pizza"})
    assert resp.status_code == 401


def test_add_food_requires_name(client, db_conn):
    _login(client, db_conn)
    resp = client.post("/api/foods", json={})
    assert resp.status_code == 400


def test_food_list_with_scores(client, db_conn):
    """After voting, food list shows aggregate scores."""
    alice_id = _login(client, db_conn, "Alice")
    client.post("/api/foods", json={"name": "Pizza"})
    client.post("/api/foods", json={"name": "Tacos"})
    client.post("/api/foods", json={"name": "Sushi"})

    # Alice votes
    client.post("/api/foods/vote", json={
        "votes": [
            {"option_id": 1, "rank": 1},
            {"option_id": 2, "rank": 2},
            {"option_id": 3, "rank": 3},
        ]
    })

    resp = client.get("/api/foods")
    data = resp.get_json()
    pizza = next(f for f in data if f["name"] == "Pizza")
    assert pizza["score"] == 3  # 1st place = 3 points
    assert pizza["votes"]["1st"] == 1


def test_vote_requires_auth(client):
    resp = client.post("/api/foods/vote", json={"votes": []})
    assert resp.status_code == 401


def test_vote_editable(client, db_conn):
    """Re-voting overwrites previous votes."""
    _login(client, db_conn)
    client.post("/api/foods", json={"name": "Pizza"})
    client.post("/api/foods", json={"name": "Tacos"})
    client.post("/api/foods", json={"name": "Sushi"})

    # First vote
    client.post("/api/foods/vote", json={
        "votes": [
            {"option_id": 1, "rank": 1},
            {"option_id": 2, "rank": 2},
            {"option_id": 3, "rank": 3},
        ]
    })

    # Change vote: Tacos now first
    client.post("/api/foods/vote", json={
        "votes": [
            {"option_id": 2, "rank": 1},
            {"option_id": 1, "rank": 2},
            {"option_id": 3, "rank": 3},
        ]
    })

    resp = client.get("/api/foods")
    data = resp.get_json()
    tacos = next(f for f in data if f["name"] == "Tacos")
    assert tacos["score"] == 3  # Now 1st place


def test_get_my_votes_empty(client, db_conn):
    _login(client, db_conn)
    resp = client.get("/api/foods/votes")
    assert resp.status_code == 200
    assert resp.get_json() == []


def test_get_my_votes(client, db_conn):
    _login(client, db_conn)
    client.post("/api/foods", json={"name": "Pizza"})
    client.post("/api/foods", json={"name": "Tacos"})
    client.post("/api/foods", json={"name": "Sushi"})
    client.post("/api/foods/vote", json={
        "votes": [
            {"option_id": 1, "rank": 1},
            {"option_id": 2, "rank": 2},
            {"option_id": 3, "rank": 3},
        ]
    })

    resp = client.get("/api/foods/votes")
    data = resp.get_json()
    assert len(data) == 3
    first = next(v for v in data if v["rank"] == 1)
    assert first["option_id"] == 1
