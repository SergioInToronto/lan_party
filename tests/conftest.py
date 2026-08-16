import os
import sys
import tempfile
import pytest

# Add server/ to path so we can import modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'server'))

from app import create_app
from db import get_db, init_db


@pytest.fixture
def app(tmp_path):
    db_path = str(tmp_path / "test.db")
    app = create_app({
        "TESTING": True,
        "DATABASE": db_path,
        "SECRET_KEY": "test-secret-key",
    })
    with app.app_context():
        init_db()
    yield app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def db_conn(app):
    with app.app_context():
        conn = get_db()
        yield conn


@pytest.fixture(autouse=True)
def block_network(monkeypatch):
    """fetch_steam_avatars hits the network per steam_id with no key gate to
    skip it — block by default so tests stay hermetic. Tests exercising the
    success path override this with their own monkeypatch."""
    def deny(*args, **kwargs):
        raise OSError("network disabled in tests")
    monkeypatch.setattr("app.urllib.request.urlopen", deny)
