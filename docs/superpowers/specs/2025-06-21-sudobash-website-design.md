# SUDOBASH '26 — Full Website Design Spec

## Overview

LAN party event website for a 2-day (Saturday + Sunday) gaming event. Linux-themed, terminal-inspired aesthetic. Flask backend with SQLite, vanilla HTML/CSS/JS frontend styled with Tailwind CSS. Hosted at `lanparty.sergiomartins.ca`.

---

## 1. Architecture

```
nginx (static files)          Flask (API only)
  ├── index.html                ├── /api/login
  ├── games.html                ├── /api/me
  ├── guests.html               ├── /api/guests
  ├── food.html                 ├── /api/preferences
  ├── gear.html                 ├── /api/foods
  ├── static/                   ├── /api/foods/vote
  │   ├── css/                  └── /api/config
  │   ├── js/
  │   ├── img/
  │   └── avatars/
  └── event_details.json
```

**nginx** serves all HTML, CSS, JS, images. **Flask** handles only `/api/*` routes. No server-side rendering.

---

## 2. Pages

### 2.1 `index.html` — Dashboard

**Sections (top to bottom):**

1. **Hero:** Full-width banner with static retro PC illustration background. Event name "SUDOBASH '26", date (from config), "RSVP [ONLINE]" CTA button (opens login modal if not authenticated, opens preferences modal if authenticated).

2. **Countdown Timer:** Client-side JS. Counts down to event start date from `event_details.json`. Shows days/hours/minutes/seconds. Monospace font, terminal-style display.

3. **"Now Playing" Banner:** Only visible during event hours. JS compares `Date.now()` against hardcoded schedule data. Shows: `> NOW PLAYING: [Game Title]`. Hidden when no event is active or event hasn't started.

4. **Schedule:** Hour-by-hour timeline for both days. Hardcoded in a JS data structure (array of objects: `{time, title, description, day}`). Rendered as a table/timeline. Current event highlighted based on system clock. Two columns or tabs for Saturday/Sunday.

5. **Event Details Card:** Address (placeholder), start/end times, entry fee. Static Google Maps link (opens in new tab). WiFi card showing SSID + password (fetched from `/api/config`).

### 2.2 `games.html` — Game Lineup

Grid of game cards. Each card shows:
- Cover image
- Game title
- Player count (static)
- Server status indicator: `[ ON ]` in Mint Green (static/decorative)
- Link to Steam store page (or equivalent)

Placeholder games: Dota Allstars, Minecraft Beta 1.7, Call of Duty 2, The Sims 2, Pokemon Red/Blue, + 1 TBD slot.

Data hardcoded in HTML or a JS array. No API needed.

### 2.3 `guests.html` — Guest List

Public page (no auth to view). Fetches `/api/guests`.

Displays a roster/table:
- Avatar (small image)
- Handle
- Days attending (Sat / Sun / Both)
- Snack contribution text (if any)

No editing on this page. All data modified via preferences modal.

### 2.4 `food.html` — Food Voting

**Two sections:**

1. **Suggest Food:** Text input + submit button. Auth required. POSTs to `/api/foods`. Shows who suggested each item.

2. **Vote:** List of all food options. Auth required to vote. User assigns 1st, 2nd, 3rd choice via dropdowns or drag-and-drop (dropdowns simpler for vanilla JS). Votes are editable — re-submitting overwrites previous votes. Shows current tally (aggregate scores: 1st=3pts, 2nd=2pts, 3rd=1pt).

Unauthenticated users see food list and scores but cannot suggest or vote.

### 2.5 `gear.html` — What to Bring + Rules

**Two sections:**

1. **BYO Checklist:**
   - Hardware: PC, Monitor, Keyboard, Mouse, Ethernet Cable
   - Software: Pre-installed games (link to games page), OS updates
   - Personal: Headset, snacks, comfort items

2. **Rules & Code of Conduct:**
   - Network etiquette
   - Banned software
   - Behavior expectations
   - Placeholder content, admin fills in real rules

Static HTML. No JS needed.

---

## 3. Global Components

### 3.1 Navigation Header

Present on every page. Contains:
- Logo/title: "SUDOBASH '26" (links to index)
- Nav links: Dashboard, Games, Schedule (anchor to index#schedule), Guests, Food, Gear
- Login button (right side): opens login modal
- When authenticated: shows user handle + avatar, dropdown with "Preferences" and "Logout"

### 3.2 Login Modal

Overlay modal, accessible from any page.
- Fields: Name (text), Access Code (text, 7 chars)
- Submit → POST `/api/login`
- On success: store session token in localStorage, reload page
- On failure: show error, 3-second server delay makes brute force impractical
- Flask sets HTTP-only signed session cookie automatically

### 3.3 Preferences Modal

Overlay modal. Triggered:
- Automatically on first login (if no preferences exist yet)
- Manually from nav dropdown "Preferences"

Fields (all optional):
| Field | Type | Storage Key |
|-------|------|-------------|
| Handle | text input | `handle` |
| Avatar | image picker (grid of pre-defined avatars) | `avatar` |
| Operating System | text input or dropdown | `os` |
| Days Attending | radio: Saturday / Sunday / Both | `days_attending` |
| Skill Level | dropdown: Casual / Intermediate / Competitive | `skill_level` |
| Snack Contribution | text input | `snack_contribution` |

Submit → POST `/api/preferences` with all key-value pairs.
Same UI for first login and subsequent edits — pre-fills with existing values.

### 3.4 Footer

All pages. Contains:
- Contact info (placeholder)
- Credits
- Monospace styling consistent with terminal theme

---

## 4. Database Schema

```sql
CREATE TABLE guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    access_code_hash TEXT NOT NULL
);

CREATE TABLE guest_preferences (
    guest_id INTEGER NOT NULL,
    key TEXT NOT NULL,
    value TEXT,
    PRIMARY KEY (guest_id, key),
    FOREIGN KEY (guest_id) REFERENCES guests(id)
);

CREATE TABLE food_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_by_guest_id INTEGER NOT NULL,
    FOREIGN KEY (created_by_guest_id) REFERENCES guests(id)
);

CREATE TABLE food_votes (
    guest_id INTEGER NOT NULL,
    option_id INTEGER NOT NULL,
    rank INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 3),
    PRIMARY KEY (guest_id, rank),
    UNIQUE (guest_id, option_id),
    FOREIGN KEY (guest_id) REFERENCES guests(id),
    FOREIGN KEY (option_id) REFERENCES food_options(id)
);
```

**Notes:**
- `food_votes` PK is `(guest_id, rank)` — each user gets exactly one 1st, one 2nd, one 3rd. Upsert on re-vote (DELETE old + INSERT new, or INSERT OR REPLACE).
- `guest_preferences` PK is `(guest_id, key)` — upsert on update.
- DB starts empty. Admin inserts guests manually:
  ```sql
  -- Admin runs init_db.py which provides a helper function, or does raw SQL
  INSERT INTO guests (name, access_code_hash) VALUES ('Alice', '<hash>');
  ```
- `init_db.py` creates tables and provides a CLI helper to add guests + generate access codes.

---

## 5. API Specification

### `POST /api/login`
**Body:** `{ "name": "Alice", "access_code": "ABC1234" }`
**Success (200):** `{ "token": "<session_token>", "guest": { "id": 1, "name": "Alice" } }`
Sets HTTP-only signed session cookie.
**Failure (401):** `{ "error": "Invalid credentials" }` (after 3s delay)

### `GET /api/me`
**Auth required.**
**Success (200):** `{ "id": 1, "name": "Alice", "preferences": { "handle": "al1ce", ... } }`
**Failure (401):** `{ "error": "Not authenticated" }`

### `GET /api/guests`
**Public.**
**Response (200):**
```json
[
  {
    "id": 1,
    "handle": "al1ce",
    "avatar": "pixel-cat.png",
    "days_attending": "both",
    "snack_contribution": "Doritos and Mountain Dew"
  }
]
```
Excludes `name` and `access_code_hash`. If no `handle` preference exists, falls back to guest `name`.

### `GET /api/preferences`
**Auth required.**
**Response (200):** `{ "handle": "al1ce", "avatar": "pixel-cat.png", "os": "Arch btw", ... }`

### `POST /api/preferences`
**Auth required.**
**Body:** `{ "handle": "al1ce", "avatar": "pixel-cat.png", "os": "Arch btw", "days_attending": "both", "skill_level": "competitive", "snack_contribution": "Doritos" }`
**Response (200):** `{ "ok": true }`
Upserts all provided key-value pairs into `guest_preferences`.

### `GET /api/foods`
**Public.**
**Response (200):**
```json
[
  { "id": 1, "name": "Pizza", "suggested_by": "al1ce", "score": 8, "votes": { "1st": 2, "2nd": 1, "3rd": 0 } }
]
```

### `POST /api/foods`
**Auth required.**
**Body:** `{ "name": "Pizza" }`
**Response (201):** `{ "id": 1, "name": "Pizza" }`

### `POST /api/foods/vote`
**Auth required.**
**Body:** `{ "votes": [{ "option_id": 1, "rank": 1 }, { "option_id": 3, "rank": 2 }, { "option_id": 5, "rank": 3 }] }`
**Response (200):** `{ "ok": true }`
Deletes existing votes for user, inserts new ones (atomic transaction).

### `GET /api/foods/votes`
**Auth required.**
**Response (200):** Returns the current user's votes:
```json
[
  { "option_id": 1, "rank": 1 },
  { "option_id": 3, "rank": 2 },
  { "option_id": 5, "rank": 3 }
]
```
Empty array if user hasn't voted yet. Used to pre-fill the voting form.

### `POST /api/logout`
**Auth required.**
Clears Flask session.
**Response (200):** `{ "ok": true }`

### `GET /api/config`
**Public.**
**Response (200):** Returns contents of `event_details.json`:
```json
{
  "event_name": "SUDOBASH '26",
  "date_start": "2026-TBD",
  "date_end": "2026-TBD",
  "time_start": "09:00",
  "time_end": "22:00",
  "address": "TBD",
  "maps_link": "https://maps.google.com/?q=TBD",
  "wifi_ssid": "SUDOBASH-LAN",
  "wifi_password": "TBD"
}
```

---

## 6. Authentication Flow

```
User clicks "Login" → Modal opens
  → Enters name + access code
  → POST /api/login
  → Server: hash(access_code) == stored hash?
    → No: sleep(3), return 401
    → Yes: Flask session set (HTTP-only cookie), return token
  → Client: store token in localStorage
  → Client: GET /api/me to confirm + load preferences
  → If no preferences exist: open Preferences modal automatically
  → Update nav: show handle + avatar, hide login button
```

**Dual auth:** Flask signed session cookie is the **primary** server-side auth mechanism (HTTP-only, automatic on every request). The token returned by `/api/login` is stored in `localStorage` so client-side JS can check "am I logged in?" without hitting `/api/me` on every page load. **Server validates only the session cookie.** The localStorage token is for client-side UX convenience only.

**Logout:** POST `/api/logout` — clears Flask session. Client clears localStorage token. Nav reverts to login button.

---

## 7. Frontend File Structure

```
static/
├── css/
│   └── style.css          # Tailwind output + custom styles
├── js/
│   ├── app.mjs            # Shared: auth state, nav, modals, API client
│   ├── countdown.mjs      # Countdown timer logic
│   ├── schedule.mjs       # Schedule data + rendering + "now playing"
│   ├── guests.mjs         # Guest list fetch + render
│   ├── food.mjs           # Food suggest/vote logic
│   └── preferences.mjs    # Preferences modal logic
├── img/
│   ├── hero-bg.png        # Retro PC illustration for hero
│   └── games/             # Game cover images
└── avatars/               # Pre-defined avatar images (pixel art)
```

Each page loads `app.mjs` (shared) + its own module(s).

---

## 8. Design Implementation Notes

Per `design-kit.md`:
- Background: `#121212`, panels: `#1E1E1E`, borders: `#333333` (1px solid)
- Text: `#E0E0E0` primary, `#8A8A8A` muted
- Accents: Orange `#E95420` (CTAs), Blue `#1793D1` (links), Green `#87A556` (success/online)
- Border radius: 0-2px max. No shadows. No transparency. No blur.
- Fonts: Ubuntu Sans (headers), Roboto (body), Fira Code/Liberation Mono (data/monospace)
- Status indicators: `[ ONLINE ]` / `[ OFFLINE ]` in monospace with brackets
- Tailwind config extends with these custom colors and fonts

---

## 9. Avatars

Source ~8-12 free pixel-art or retro gaming avatars. Store as small PNGs/SVGs in `static/avatars/`. Avatar filenames hardcoded in a JS array for the preferences picker. Examples:
- Pixel cat, pixel dog, retro robot, 8-bit warrior, terminal cursor, Tux penguin (if license allows), etc.

---

## 10. Schedule Data Structure

Hardcoded in `schedule.mjs`:

```javascript
const SCHEDULE = [
  { day: "saturday", time: "09:00", title: "Doors Open", description: "Setup your rigs" },
  { day: "saturday", time: "10:00", title: "Minecraft Tournament", description: "Survival mode, last one standing" },
  { day: "saturday", time: "13:00", title: "Lunch Break", description: "Food vote winner served" },
  // ... etc
  { day: "sunday", time: "09:00", title: "Day 2 Start", description: "" },
  // ...
];
```

JS compares current system time against schedule entries to highlight "current" event and power the "Now Playing" banner.

---

## 11. Deferred / Out of Scope

Items explicitly punted to `future-TODO.md`:
- Admin UI / admin APIs (admin uses raw SQL)
- Nginx configuration
- Real event dates, address, WiFi credentials (use placeholders)
- Real game list (use mockup placeholders)
- Video loop hero background (using static image)
- Google Maps embed (using static link)
