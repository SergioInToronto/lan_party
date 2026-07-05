# Deploying LAN Party into an existing NGINX server

Small Flask app served by **gunicorn** (behind a unix socket) with **nginx**
serving static files and terminating TLS. Python + `uv` assumed present.

Files referenced below live in `deploy/`:

- `deploy/lanparty.conf` — nginx server block
- `deploy/lanparty.service` — systemd unit running gunicorn via uv

---

## 1. Put the code on the server

Deploy the repo to `/srv/lanparty` (any path works; update the config files to
match if you change it).

```bash
sudo mkdir -p /srv/lanparty
sudo rsync -a --exclude '.venv' --exclude '.git' ./ /srv/lanparty/
sudo chown -R www-data:www-data /srv/lanparty
```

## 2. Create the virtualenv with uv

`uv` manages the venv from the project's `pyproject.toml` / `uv.lock`. Create it
in place so the systemd unit's `uv run` finds it:

```bash
cd /srv/lanparty
sudo -u www-data uv sync --no-dev      # installs flask + gunicorn into .venv
```

> `uv run` (used by the service) auto-creates/uses `.venv` here. `--no-dev`
> skips pytest and friends.

## 3. Set the secret and environment

The app reads `SECRET_KEY` from the environment (falls back to an insecure dev
default otherwise). Generate a strong one and store it root-only:

```bash
sudo sh -c 'umask 077; cat > /etc/lanparty.env' <<EOF
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(48))")
COOKIE_SECURE=1
EOF
sudo chown root:www-data /etc/lanparty.env
sudo chmod 640 /etc/lanparty.env
```

## 4. Initialize / seed the database

The app creates tables on startup. It also needs guest rows (with hashed access
codes) to log in — seed them with `server/init_db.py`:

```bash
cd /srv/lanparty/server
sudo -u www-data uv run python init_db.py
```

The sqlite file is written to `/srv/lanparty/lanparty.db`; `www-data` must own
the repo dir (step 1) so it can write there.

## 5. Install and start the gunicorn service

```bash
sudo cp /srv/lanparty/deploy/lanparty.service /etc/systemd/system/lanparty.service
sudo systemctl daemon-reload
sudo systemctl enable --now lanparty.service
sudo systemctl status lanparty.service        # confirm it's running
```

The service binds a socket at `/run/lanparty/gunicorn.sock`.

## 6. Install the nginx site

Edit `deploy/lanparty.conf`: replace `REPLACE_WITH_DOMAIN` and the TLS cert
paths, then:

```bash
sudo cp /srv/lanparty/deploy/lanparty.conf /etc/nginx/sites-available/lanparty.conf
sudo ln -s /etc/nginx/sites-available/lanparty.conf /etc/nginx/sites-enabled/
sudo nginx -t            # validate
sudo systemctl reload nginx
```

### TLS with certbot (if you don't already have a cert)

```bash
sudo certbot --nginx -d REPLACE_WITH_DOMAIN
```

Certbot will fill in the cert paths automatically.

---

## Updating after code changes

```bash
cd /srv/lanparty
sudo -u www-data git pull            # or rsync again
sudo -u www-data uv sync --no-dev
sudo systemctl restart lanparty.service
```

Static-only changes need no restart — nginx serves them directly.

## Troubleshooting

- **502 Bad Gateway** — gunicorn not running or socket missing.
  `sudo journalctl -u lanparty -e`.
- **Login always fails over HTTPS** — ensure `COOKIE_SECURE=1`; over plain HTTP
  it must be `0` (cookies won't set on insecure origins otherwise).
- **Permission denied on db** — `sudo chown -R www-data:www-data /srv/lanparty`.
- **Static 404s** — confirm nginx `root` points at `/srv/lanparty/static`.
