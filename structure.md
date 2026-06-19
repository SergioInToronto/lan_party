Stack: Vanilla JS (ES Modules, .mjs), plain HTML5/CSS3, Vite dev server, Node via mise.

Structure:
my_project/
├── index.html          # Single SPA entry point
├── style.css           # All styles (dark theme, mobile-first)
├── run.sh              # npx vite dev
├── mise.toml           # node = "latest"
└── src/
    ├── main.mjs        # Controller: wires everything, navigation
    ├── salt.mjs        # Pure data parser (binary protocol)
    ├── display.mjs     # DOM rendering
    ├── highlight.mjs   # Timer-driven step highlighter
    ├── timer.mjs       # Game-speed timer engine
    └── lookup.mjs      # ID → name lookup table

Key patterns:
- No framework, no TypeScript, no package.json (just npx vite)
- No build step — Vite is dev server only
- Deployed as-is
- Uses JS modules

Pending (in todo.md): add package.json, add biome for lint/format.
