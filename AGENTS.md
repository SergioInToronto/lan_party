# AGENTS.md

LAN party guest-management site. Flask + sqlite backend, vanilla JS frontend, no build step.

## Commands

- Assume the dev server is already and always running.
- Run dev server: `./run.sh` (sets `COOKIE_SECURE=0`, `cd server/`, `uv run python app.py`) → http://localhost:5000
- Run tests: `uv run pytest tests/` — **do not** call `.venv/bin/python -m pytest` directly, it can pick up a stale/wrong interpreter. Always go through `uv run`.
- Add a guest + access code: `./add.sh "Name"` (wraps `init_db.py add`, appends to `codes.txt`, untracked/local only)
- DB CLI: `cd server && uv run python init_db.py {create|add "Name"|list}`
- No migrations. Database is managed by hand.
- JavaScript lint/typecheck/format: run `npx biome lint` and `npx biome fmt`
- No JS build/bundler (no `package.json`). Editing anything in `static/` is live immediately; just refresh the browser.

## Architecture

- `server/app.py` — single-file Flask app, `create_app()` factory, all routes inline. Session-based auth (`guest_id` in Flask session) via `require_auth` decorator.
- `server/db.py` — raw `sqlite3`, one connection per request via `flask.g`. `init_db()` creates tables `IF NOT EXISTS` and re-seeds `event` defaults — safe to call repeatedly (also runs on every app boot).
- `server/init_db.py` — CLI for guest management; `generate_access_code()` makes a 5-char alphanumeric code, `hash_code()` is sha256 (matches `tests/test_init_db.py` expectations — code length is 5, not 7 or anything else).
- `server/wsgi.py` — prod entrypoint for gunicorn (`deploy/lanparty.service` runs `uv run gunicorn wsgi:app` behind a unix socket; nginx handles TLS/static in prod).
- In **dev only**, `app.py` has a catch-all route that serves `static/*.html` and assets directly through Flask. In **prod**, nginx serves `static/` and Flask never sees those requests — don't assume Flask-side static logic applies in prod.
- `lanparty.db` (sqlite file) lives at repo root, gitignored. Delete it locally to reset schema + reseed cleanly.

## `guest_preferences` is EAV, not fixed columns

Schema: `guest_preferences(guest_id, key, value)`, upserted via `ON CONFLICT DO UPDATE`. Adding a new preference field means touching **all** of:
1. `allowed_keys` whitelist in `set_preferences()` (`server/app.py`) — anything not listed is silently dropped, no error.
2. Any hand-built projection that exposes prefs, e.g. `/api/guests` and `/api/me` manually list which keys to return — a new key is invisible there until added explicitly.
3. The relevant `static/*.html` form field + `static/js/preferences.mjs` prefill logic.

## Frontend conventions

- Tailwind via CDN `<script>` (inline config per HTML page) — no Tailwind build/PostCSS.
- Every page is a standalone `.html` file; each loads `js/nav.mjs`, `js/app.mjs`, then a page-specific `.mjs` module via `<script type="module">`.
- `static/js/api.mjs` is the single fetch wrapper — all backend calls go through `api.*`, don't call `fetch()` directly elsewhere.
- `mise.toml` lists `node` as a tool but it's only there to make `npm` and `npx` available - node is never used.

## Steam avatar integration

`fetch_steam_avatars()` in `server/app.py` fetches each guest's avatar from Steam's public `https://steamcommunity.com/profiles/{steamid64}/?xml=1` community page via stdlib `urllib` (no API key, no `requests` dependency) — one request per id, since that endpoint has no batch form. Numeric SteamID64 only (no vanity-URL resolution). Any failure (non-numeric id, profile not found, network error) is skipped per-id, not a crash, and the frontend falls back to a placeholder (`?` avatar). No caching/retry by design (small guest list). Since there's no key gate to skip the network call, tests stay hermetic via the `autouse` `block_network` fixture in `tests/conftest.py`, which makes `urllib.request.urlopen` raise by default — tests exercising the success path override it with their own monkeypatch.

## Testing

- `tests/conftest.py` gives each test a fresh sqlite db in `tmp_path` via `create_app(test_config)` — no shared state, no external services, no network calls should occur in tests.
- Fixtures: `app`, `client` (Flask test client), `db_conn` (raw sqlite connection for seeding/asserting).

## Docs worth reading before touching deploy/config

- `docs/design-kit.md` — visual/UX rules (colors, typography, "no glassmorphism/transparency" constraints) if doing UI work.
- `docs/future-TODO.md` — known placeholder data/features — check before treating placeholders as bugs. Note: this list may be stale.
- `INSTALL.md` — full prod deploy steps (uv sync, systemd, nginx, certbot).
- `DEPLOY_CONCERNS.md` — known bugs/gaps in `deploy/lanparty.conf` and `deploy/lanparty.service` (header inheritance, `ReadWritePaths` too broad, etc.) — read before "fixing" deploy files, some issues are already tracked there.

## Secrets / env

- `SECRET_KEY` falls back to an insecure hardcoded dev default if unset — fine locally, must be set in prod (`INSTALL.md` step 3).
- `COOKIE_SECURE` must be `0` for local plain-HTTP dev (`run.sh` sets this) and `1` in prod, or login cookies silently fail to set.
