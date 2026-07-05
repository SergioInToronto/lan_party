## Review: `deploy/lanparty.conf`

**Correctness bugs**

1. **`conf:70` dotfile deny does NOT protect db.** `lanparty.db` at `/srv/lanparty/`, but nginx `root` = `/srv/lanparty/static`. DB not under root → unreachable anyway. Good. BUT the `deny /\.` regex only blocks dotfiles. Non-dot files under `static/` all served. DB safe by path, not by rule. Comment "or the sqlite db" is **misleading** — rule does nothing for db. Fine security-wise, wrong comment.

2. **`conf:48-50` `try_files $uri $uri.html $uri/ =404` on `location /` — path traversal? No.** nginx normalizes `..`. Safe. But `$uri.html` means `/index` serves `index.html`, `/games` → `games.html`. Intended. OK.

3. **`conf:52-57` `location /static/` alias overlaps `location /`.** nginx picks longest prefix → `/static/` wins for those. Fine. But `root` already = `static/`, so `/static/foo` via `location /` would look for `/srv/lanparty/static/static/foo` (double). The alias fixes it → maps `/static/foo` → `/srv/lanparty/static/foo`. Correct, but redundant layout. Works.

**Security gaps**

4. **`add_header` inheritance trap (real bug).** `location /static/` adds `Cache-Control`. nginx rule: if a `location` has ANY `add_header`, it **drops all parent `add_header`**. So `/static/` responses lose HSTS, CSP, nosniff, X-Frame-Options. Static HTML (`games.html` etc.) served via `location /` keep them, but anything under `/static/` (css/js) loses them. CSP loss on JS matters less; nosniff loss matters. Fix: re-add security headers in `/static/`, or move them to `http`/`server` via `include`, or accept.

5. **No CSP `script-src`.** CSP sets `default-src 'self'` (covers scripts) but `style-src` allows `'unsafe-inline'`. Inline styles in HTML → needed. Acceptable. No `'unsafe-inline'` for scripts — good, means JS must be external files. Verify no inline `<script>` in html or app breaks. Minor.

6. **`ssl_ciphers` not set.** Relying on nginx defaults + `ssl_prefer_server_ciphers off`. Modern nginx defaults OK for TLS1.2/1.3. Acceptable.

## Review: `deploy/lanparty.service`

7. **`service:38` `ReadWritePaths=/srv/lanparty` too broad.** `ProtectSystem=strict` makes all read-only except this. App writes ONLY `lanparty.db` at repo root. Granting write to entire tree (incl `static/`, `.git`, code) = if app compromised, attacker rewrites served HTML/JS + code. Tighten:

```
ReadWritePaths=/srv/lanparty/lanparty.db
```

Wait — sqlite needs to create `-wal`/`-journal` **sibling files** in same dir. Writing those needs dir write. So can't scope to single file. Options: move db to own dir (`/srv/lanparty/data/`), grant `ReadWritePaths=/srv/lanparty/data`. Cleaner + safer. Requires `DATABASE` env override or db.py change. Recommended.

8. **Missing hardening directives.** Given `Type=notify`, easy wins absent:

```
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictNamespaces=true
RestrictSUIDSGID=true
RestrictRealtime=true
LockPersonality=true
MemoryDenyWriteExecute=true
SystemCallFilter=@system-call ... (or @default deny)
PrivateDevices=true
ProtectHostname=true
ProtectClock=true
CapabilityBoundingSet=      (empty — needs none)
```

Not bugs; defense-in-depth. Add per taste.

9. **`service:6` `After=network.target` fine** (unix socket, no network bind). Could drop network dep entirely. Minor.

10. **No `UMask`.** Socket created in `RuntimeDirectory` mode `0750`, group `www-data` = nginx group? **Check:** nginx worker user must be in `www-data` group to read socket at `/run/lanparty/gunicorn.sock`. Default nginx runs as `www-data` on Debian → same group → `0750` dir + default socket perms OK. On other distros nginx = `nginx` user → **502, permission denied on socket**. INSTALL.md doesn't mention. Add `UMask=007` + note nginx user must share group.

## Cross-file / INSTALL

11. **`INSTALL.md:112-113` COOKIE_SECURE guidance correct** — matches `app.py:17`.

12. **`app.py:12` dev SECRET_KEY fallback `"dev-secret-change-me"`.** If `EnvironmentFile` missing/typo'd, app silently runs with known secret → session forgery. `init_db` runs at import so app still boots. **Recommend fail-fast in production:** raise if `SECRET_KEY` unset and not testing. Config files can't enforce; note it.

13. **`init_db` runs on every gunicorn worker start** (`app.py:25-26`, 3 workers). Idempotent (`IF NOT EXISTS` / `INSERT OR IGNORE`) → safe, just redundant + 3 concurrent writers first boot. Minor race, sqlite serializes. OK.

## Verdict

Both **deployable and largely correct**. No critical hole. Priorities:

| # | Sev | File | Issue | Fix |
|---|-----|------|-------|-----|
| 4 | Med | conf | `/static/` drops security headers (nginx add_header inheritance) | re-add headers in `/static/` block |
| 7 | Med | service | `ReadWritePaths` = whole tree; app compromise → rewrite served JS/code | scope db to own dir |
| 10 | Med | service/INSTALL | socket perms assume nginx∈www-data group; breaks on non-Debian | doc + `UMask=007` |
| 12 | Med | app/INSTALL | insecure SECRET_KEY fallback if env missing | fail-fast note |
| 1 | Low | conf | comment claims dotfile rule protects db; it doesn't | fix comment |
| 8 | Low | service | more hardening dirs available | add defense-in-depth |
