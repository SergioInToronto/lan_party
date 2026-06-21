# Core Identity: "Root Access Nostalgia"

The design language is unapologetically technical but warmly nostalgic. It avoids modern corporate web trends (like glassmorphism and heavy shadows) in favor of sharp, high-contrast, flat design. It feels like booting up a perfectly configured machine right before a weekend-long gaming marathon.


## 1. Color Palette (The "Melting Pot" Dark Mode)

The background is heavily anchored in deep, terminal-like darks, while the accents pull vibrant, highly saturated colors from the iconic distributions to create a high-contrast environment.

    Base Background (#121212): A deep, terminal charcoal. Completely flat.

    Surface / Panels (#1E1E1E): Used for cards, modals, and the live dashboard elements. No transparency.

    Borders & Dividers (#333333): Sharp, 1px solid lines to separate content logically.

    Text (Primary) (#E0E0E0): High legibility off-white.

    Text (Secondary/Muted) (#8A8A8A): For timestamps, minor details, and inactive states.

Vibrant Accents:

    Resolute Orange (#E95420): Ubuntu-inspired. Primary call-to-action color (e.g., RSVP buttons, active tournament brackets).

    Arch Blue (#1793D1): Arch-inspired. Secondary accent for links, guest management highlights, and informational alerts.

    Mint Green (#87A556): Mint-inspired. Success states, online status indicators, and live server health pings.

## 2. Typography

A strict, clean, open-source stack that feels modern but retains a slight developer-centric edge.

    Display / Headers: Ubuntu Sans (Bold). Its slight geometric quirks give personality to page titles and massive dashboard numbers.

    Body / UI Text: Roboto or DejaVu Sans (Regular). Clean, highly readable, and unobtrusive for dense lists of attendees or long event schedules.

    Monospace / Data: Liberation Mono or Fira Code. Used exclusively for server IP addresses, SQLite query outputs in the admin panel, patch notes, and match statistics.

## 3. Design & UX Constraints (The "Rules")

    Zero Transparency: Surfaces must be 100% opaque. Do not use blur filters, Aero glass, or macOS-style liquid effects. If a modal opens, it sits on a solid dark overlay.

    Sharp Edges: Border radiuses should be practically non-existent. Use 0px or a maximum of 2px for a slightly refined edge. UI elements should feel like tiling window managers (e.g., i3 or bspwm)—snappy and geometric.

    High-Contrast Borders: Delineate sections using solid 1px borders rather than drop shadows. This mimics the stark borders found in terminal multiplexers or minimal desktop environments.

    Analog Indicators: Use absolute, binary states for UI elements. An attendee is either [ ONLINE ] (Mint Green) or [ OFFLINE ] (Secondary Gray). Use brackets and monospace formatting to give a slight CLI feel to standard web elements.
