
# Project Plan: LAN Party Event Static Website

This document outlines the end-to-end process for designing and building a static website to promote and manage a one-time LAN Party event.

---

## 🎯 1. Project Objectives
*   **Inform:** Provide all necessary details (date, time, location, requirements).
*   **Register:** Collect participant information via an integrated form.
*   **Guide:** Provide a "Bring Your Own" (BYO) checklist for attendees.
*   **Hype:** Create excitement using a gaming-centric aesthetic.

---

## 🗺️ 2. Site Map & Content
- A small **multi-page site** is recommended
- Responsive for both desktop and mobile

### Sections/Pages:
1.  **Hero Section:**
    *   Event Name, Date, and "Register Now" Call-to-Action (CTA).
    *   High-energy background (video loop or gaming imagery).
    *   **Countdown timer** component to the event date.
2.  **Event Details:**
    *   Location/Address (with Google Maps embed).
    *   Start/End times.
    *   Entry fee (if applicable).
    *   **Wi-Fi card** displaying the local SSID and password.
3.  **The Gear List (BYO):**
    *   Hardware checklist (PC, Monitor, Keyboard, Mouse, Ethernet Cable).
    *   Software requirements (Pre-installed games, OS updates).
4.  **Game Lineup:**
    *   Showcase grid of games with direct hyperlinks to Steam store pages.
5.  **Schedule of Events:**
    *   Timeline of tournaments, food breaks, and free-play sessions.
    *   Hardcode the 2-day event timeline (Saturday & Sunday)
    *   Render a readable hour-by-hour schedule view. Computed client-side according to their system datetime.
6.  **"Now Playing" Banner:**
    *   Client-side JS utility evaluates current system clock against the static schedule.
    *   Global top banner dynamically displays the currently scheduled game title.
7.  **Guest List & RSVP:**
    *   Public roster showing names, RSVP statuses, and snack contributions.
    *   Logged-in users can toggle their status: `attending`, `maybe`, `not attending`.
7.  **Logging:**
    * Upon first login, users are asked a series of questions to record their preferences, all optional
    * Users can select between a few pre-existing avatars
    * Users can update their preferences at any time. The UI is the same as first login.
8.  **Food Voting:**
    *   Authenticated attendees can suggest menu items, and vote on which food to order
    *   Ranked voting interface: assign 1st, 2nd, and 3rd choices.
9.  **Snack Contribution Tracking:**
    *   Optional text input: "Are you bringing any snacks?"
    *   Submitted text appears dynamically in the public guest list.
10. **Rules & Code of Conduct:**
    *   Network etiquette, banned software, and behavior expectations.
11. **Footer:**
    *   Links to Contact Info and Credits.

---

## 🛠️ 3. Technical Stack

### Frontend
* No Framework. Plain HTML5, CSS3, and JavaScript.
* No bundler. Use JavaScript modules (e.g. `app.mjs`).
* No typescript, only modern vanilla JavaScript.
* Tailwind CSS: for styling (perfect for a "gamer" dark-mode aesthetic).
* Icons: use line-awesome - https://icons8.com/line-awesome

### Backend
* Language: Python
* Framework: Flask. 1 or 2 web workers max.
* Raw SQL queries via the native `sqlite3` module with parameterized inputs. **No ORM.**
* Form Handling: HTML forms. Use correct types so browser handles in-line validation where possible.
* Hosting: A dedicated VPS
* Domain: Hosted at lanparty.sergiomartins.ca. nginx routes traffic for the subdomain to our python server.

### Database
* SQLite. **No migrations.** Schema changes handled by an initialization script (`init_db.py`).
* `init_db.py` creates tables, seeds initial guest records, and generates access codes (storing hashes).

#### Schema
* **`guests`** — `id`, `name`, `access_code`
* **`guest_Preferences`** - `guest_id`, `key`, `value`
* **`food_options`** — `id`, `name`, `created_by_guest_id`
* **`food_votes`** — `guest_id`, `option_id`, `rank`

---

## 🔐 3b. Authentication & Security

*   **Access Codes:** Each guest receives a unique 7-character access code. Never exposed out of the API!
*   **Login:** POST `/api/login` requires **both** the guest's Name and their Access Code. Uses parameterized SQL.
*   **Brute-force mitigation:** 3-second delay (`time.sleep(3)`) on login failure.
*   **Session handling:** On success, establish session using **both**: an HTTP-only cookie AND a token returned for `localStorage`.
*   **Session validation:** GET `/api/me` endpoint to validate active sessions.
*   **Navigation:** Global header with a public guest list button and a login modal.

---

## 🔌 3c. API Endpoints

All static content will be served by nginx or another web server. Flask will only handle API calls.

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/login` | POST | No | Authenticate with name + access code |
| `/api/me` | GET | Yes | Validate active session |
| `/api/guests` | GET | No | Public guest list (names, statuses, snacks — excludes `access_code_hash`) |
| `/api/foods` | GET | No | List food options |
| `/api/foods` | POST | Yes | Add a food option |
| `/api/foods/vote` | POST | Yes | Submit ranked food votes (ordered list) |

---

## 🎨 4. Design & Aesthetics

See file: `design-kid.md`

---

## 🚀 5. Implementation Plan

- Our goal is to one-shot the entire website with all functionality.
- If any task is not worth solving at this exact moment, drop an entry into file `future-TODO.md` and we'll fix it later.
- Ask clarifying questions until we have a shared understanding of the work to be completed
