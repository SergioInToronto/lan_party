#! /bin/bash

cd server/
# Dev: http localhost, so don't require secure cookies.
export COOKIE_SECURE=0
exec uv run python app.py
