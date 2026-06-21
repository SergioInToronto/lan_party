
# Project Plan: SUDOBASH '26 — LAN Party Event Website

This document outlines the end-to-end plan for building a website to promote and manage a one-time LAN Party event. All decisions from brainstorming are recorded here as the single source of truth.

---

## 🎯 1. Project Objectives
*   **Inform:** Provide all necessary details (date, time, location, requirements).
*   **Guide:** Provide a "Bring Your Own" (BYO) checklist for attendees.
*   **Organize:** Guest preferences, RSVP tracking, food voting, snack coordination.
*   **Hype:** Create excitement using a Linux-themed, terminal-inspired aesthetic.

---

## 🗺️ 2. Site Map & Content

- **5 HTML pages**, true multi-page (not SPA)
- Responsive for both desktop and mobile
- Global nav header on all pages with login button/modal

### Pages:

#### `index.html` — Dashboard
*   **Hero Section:** Event name, date, static retro PC background image, "RSVP" CTA button.
*   **Countdown timer** to event date (client-side JS).
*   **"Now Playing" banner:** Client-side JS evaluates system clock against static schedule. Shows currently scheduled game title. **Home page only** (not global).
*   **Schedule of Events:** Hour-by-hour timeline for 2-day event (Saturday & Sunday). Hardcoded placeholder template. Rendered client-side based on system datetime.
*   **Event Details:** Location/address (placeholder), start/end times, entry fee (if applicable).
*   **Wi-Fi card:** SSID and password fetched from backend config (`event_details.json`).
*   **Location:** Static link to Google Maps (no API key, no embed).

#### `games.html` — Game Lineup
*   Showcase grid of games with cover images, player count, server status indicators.
*   Direct hyperlinks to Steam store pages.
*   Placeholder games: Dota Allstars, Minecraft Beta 1.7, Call of Duty 2, The Sims 2, Pokemon Red/Blue (+ 1 blank slot).

#### `guests.html` — Guest List
*   Public roster showing: handle, avatar, days attending, snack contributions.
*   No editing on this page — all guest data is set via preferences.
*   Visible to everyone (no auth required to view).

#### `food.html` — Food Voting (Auth Required)
*   Authenticated users can suggest menu items.
*   Ranked voting: assign 1st, 2nd, 3rd choices.
*   Votes are editable (can change after submitting).
*   Shows current vote tallies.

#### `gear.html` — What to Bring + Rules
*   **Hardware checklist:** PC, Monitor, Keyboard, Mouse, Ethernet Cable.
*   **Software requirements:** Pre-installed games, OS updates.
*   **Rules & Code of Conduct:** Network etiquette, banned software, behavior expectations.

### Global Components:
*   **Nav header:** Links to all 5 pages + login button.
*   **Login modal:** Appears on any page. Name + access code fields.
*   **Preferences modal:** Triggered on first login, accessible anytime from nav. Contains:
    - Handle (editable, stored in `guest_preferences`)
    - Avatar selection (from pre-defined free pixel-art/gaming avatars)
    - Operating system
    - Which days attending: Saturday, Sunday, or Both (radio buttons) — **this replaces RSVP**
    - Skill level
    - Snack contribution (free text: "Are you bringing any snacks?")
    - All fields optional.
*   **Footer:** Contact info and credits.

---

## 🛠️ 3. Technical Stack

### Frontend
* No framework. Plain HTML5, CSS3, and vanilla JavaScript.
* No bundler. Use JavaScript modules (e.g. `app.mjs`).
* No TypeScript.
* Tailwind CSS for styling (dark-mode, terminal-inspired aesthetic).
* Icons: Line Awesome — https://icons8.com/line-awesome

### Backend
* Language: Python
* Framework: Flask. 1-2 web workers max.
* Raw SQL queries via native `sqlite3` module with parameterized inputs. **No ORM.**
* Form handling: HTML forms with correct input types for browser-native validation.
* Hosting: Dedicated VPS.
* Domain: `lanparty.sergiomartins.ca`. Nginx routes subdomain traffic to Flask. **Nginx config not included** — handled separately.

### Configuration
* **`event_details.json`** — Single JSON config file on server containing:
    - Event name, dates, times
    - Venue address
    - WiFi SSID and password
    - Google Maps link
    - Any other site-wide config
* Backend serves relevant config values via API.

### Database
* SQLite. **No migrations.** Schema managed by `init_db.py`.
* `init_db.py` creates tables only. **Database starts empty.** Admin manually adds guests via SQL (no admin UI or admin APIs).
* Access codes: `init_db.py` generates and hashes codes when admin inserts guests.

#### Schema
* **`guests`** — `id`, `name`, `access_code_hash`
* **`guest_preferences`** — `guest_id`, `key`, `value`
    - Known keys: `handle`, `avatar`, `os`, `days_attending`, `skill_level`, `snack_contribution`
* **`food_options`** — `id`, `name`, `created_by_guest_id`
* **`food_votes`** — `guest_id`, `option_id`, `rank` (UNIQUE on `guest_id` + `rank`; upsert on re-vote)

---

## 🔐 3b. Authentication & Security

*   **Access Codes:** Each guest receives a unique 7-character access code. **Never exposed via API.**
*   **Login:** POST `/api/login` requires **both** guest Name and Access Code. Parameterized SQL.
*   **Brute-force mitigation:** `time.sleep(3)` on login failure.
*   **Session handling:** Flask signed sessions (HTTP-only cookie) as primary auth. Token also returned in login response for `localStorage` (client-side UX convenience — lets JS know auth state without hitting `/api/me`). **Server validates cookie only.**
*   **Session validation:** GET `/api/me` validates active session.
*   **Navigation:** Global header with login modal on every page.

---

## 🔌 3c. API Endpoints

All static HTML/CSS/JS served by nginx. Flask handles API calls only.

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/login` | POST | No | Authenticate with name + access code |
| `/api/me` | GET | Yes | Validate active session, return guest info |
| `/api/guests` | GET | No | Public guest list (handles, avatars, days attending, snacks — **excludes** `access_code_hash`) |
| `/api/preferences` | GET | Yes | Get current user's preferences |
| `/api/preferences` | POST | Yes | Update current user's preferences (key-value pairs) |
| `/api/foods` | GET | No | List food options with vote tallies |
| `/api/foods` | POST | Yes | Add a food option |
| `/api/foods/vote` | POST | Yes | Submit/update ranked food votes (1st, 2nd, 3rd) |
| `/api/foods/votes` | GET | Yes | Get current user's votes (for pre-filling form) |
| `/api/logout` | POST | Yes | Clear session |
| `/api/config` | GET | No | Public event config (name, dates, WiFi, address, map link) |

---

## 🎨 4. Design & Aesthetics

See file: `design-kit.md`

**Summary:** "Root Access Nostalgia" — flat, high-contrast, terminal-inspired dark mode. No transparency, sharp edges (0-2px radius), 1px solid borders. Colors: deep charcoal base (#121212), Ubuntu Orange (#E95420) for CTAs, Arch Blue (#1793D1) for links, Mint Green (#87A556) for success states. Monospace for data, Ubuntu Sans for headers, Roboto for body. CLI-style indicators: `[ ONLINE ]`, `[ OFFLINE ]`.

---

## 🚀 5. Implementation Plan

- Goal: one-shot entire website with all functionality.
- Deferred items go to `future-TODO.md`.
- Avatars: source free pixel-art / gaming character avatars (pre-defined set, user selects one).
