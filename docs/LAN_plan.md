
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
- Responsive for both desktop and mobile.

### Sections/Pages:
1.  **Hero Section:**
    *   Event Name, Date, and "Register Now" Call-to-Action (CTA).
    *   High-energy background (video loop or gaming imagery).
2.  **Event Details:**
    *   Location/Address (with Google Maps embed).
    *   Start/End times.
    *   Entry fee (if applicable).
3.  **The Gear List (BYO):**
    *   Hardware checklist (PC, Monitor, Keyboard, Mouse, Ethernet Cable).
    *   Software requirements (Pre-installed games, OS updates).
4.  **Schedule of Events:**
    *   Timeline of tournaments, food breaks, and free-play sessions.
5.  **Rules & Code of Conduct:**
    *   Network etiquette, banned software, and behavior expectations.
6.  **Registration Form:**
    *   Integration with a third-party form provider (since the site is static).
7.  **Footer:**
    *   Links to Contact Info and Credits.

---

## 🛠️ 3. Technical Stack

### Frontend
* No Framework. Plain HTML5, CSS3, and JavaScript.
* No bundler. Use JavaScript modules
* No typescript, only modern vanilla JavaScript
* Tailwind CSS: for styling (perfect for a "gamer" dark-mode aesthetic).
* Icons: use line-awesome - https://icons8.com/line-awesome

### Backend
* Language: Python
* Framework: TBD
* Form Handling: HTML forms. Use correct types so browser handles in-line validation where possible
* Hosting: A dedicated VPS
* Domain: Hosted at lanparty.sergiomartins.ca. nginx routes traffic for the subdomain to our python server.

### Database
* SQLite

---

## 🎨 4. Design & Aesthetics

See file: `design-kid.md`

---

## 🚀 5. Implementation Plan

- Our goal is to one-shot the entire website with all functionality.
- If any task is not worth solving at this exact moment, drop an entry into file `future-TODO.md` and we'll fix it later.
- Ask clarifying questions until we have a shared understanding of the work to be completed
