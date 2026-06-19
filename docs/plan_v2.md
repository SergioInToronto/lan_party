# LAN Party Web App - Complete Project Plan

## Technology Stack Summary
* **Frontend:** Vanilla HTML5, CSS3, and modern JavaScript (ES Modules). No build step. **Design Philosophy:** Keep the UI intentionally minimal and "empty-looking" at first to accommodate future features.
* **Backend:** Python (FastAPI or Flask). Raw SQL queries via the native `sqlite3` module with parameterized inputs. No ORM.
* **Database:** SQLite. Schema changes handled by an initialization script (`init_db.py`). No migrations.

## Work Breakdown Structure (WBS)

### Sprint 1: Core Architecture & Authentication
* **WP 1.1: Python Backend & SQLite Setup**
    * Initialize the Python environment and install dependencies.
    * Create an `init_db.py` script:
        * `guests` (id, name, access_code_hash, status, snack_contribution)
        * `food_options` (id, name, created_by_guest_id)
        * `food_votes` (guest_id, option_id, rank)
    * Seed the database with initial guest records and generate 7-character access codes (storing hashes).
* **WP 1.2: Security & Authentication System**
    * Create a POST `/api/login` endpoint that requires **both the guest's Name and their 7-character Access Code** to authenticate. Use parameterized SQL queries.
    * Implement a 3-second delay (`time.sleep(3)`) inside the login failure block to mitigate brute-force attempts.
    * Upon success, establish the session using **both methods**: set an HTTP-only cookie AND return a token to be stored in `localStorage`.
    * Build a GET `/api/me` endpoint to validate active sessions.
* **WP 1.3: Frontend Shell**
    * Set up `index.html` using modern vanilla CSS. Keep the layout simple and barebones.
    * Establish an un-bundled JavaScript module structure (`app.js`, `auth.js`, `api.js`).
    * Implement a global navigation header containing a public guest list button and a secure login modal.

### Sprint 2: Front-Facing Content & Features
* **WP 2.1: The Landing Page (Hype & Info)**
    * Design a responsive layout featuring a hero section and a countdown timer component.
    * Hardcode static event metadata: Date, Time, Location, and the BYO checklist.
    * Build a game lineup showcase grid with direct hyperlinks to Steam store pages.
* **WP 2.2: Live Dashboard & Static Schedule**
    * Hardcode the complete 2-day event timeline (Saturday & Sunday) into a static JavaScript object.
    * Render a readable schedule view showing what happens hour-by-hour.
    * Add a dedicated card displaying the local Wi-Fi SSID and password.
* **WP 2.3: Automated "Now Playing" Banner**
    * Create a client-side JS utility that evaluates the current system clock against the static schedule.
    * Implement a global top banner that dynamically updates to display the currently scheduled game title.

### Sprint 3: Guest Interaction & Logistics
* **WP 3.1: Public Guest List & RSVP Toggles**
    * Create a GET `/api/guests` endpoint returning names, RSVP statuses, and snacks. (Exclude `access_code_hash`).
    * Render the public roster on the UI.
    * For logged-in sessions, enable UI toggles to change status (`attending`, `maybe`, `not attending`).
* **WP 3.2: Ranked Food Voting System**
    * Create GET and POST `/api/food/options` endpoints for menu items.
    * Build an interface allowing authenticated attendees to assign their 1st, 2nd, and 3rd choices.
    * Create a POST `/api/food/vote` endpoint that accepts an ordered list and updates the database.
* **WP 3.3: Snack Contribution Tracking**
    * Include an optional text input field labeled "What snacks are you bringing?".
    * Hook the input up to update the `snack_contribution` column.
    * Ensure the submitted text streams dynamically into the public guest list.

## AI Development Approach (Superpowers Methodology)
3. **Context Isolation:** Dispatch a fresh AI session for each specific task.
4. **Validation Checkpoints:** Use a secondary AI (The Inspector) to review code at critical gates:
    * *The Schema Gate* (After WP 1.1)
    * *The Security Gate* (After WP 1.2)
    * *Post-Task Reviews* (Before merging any WP branch)
