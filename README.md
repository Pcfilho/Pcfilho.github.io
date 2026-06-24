# Paulo Barroso — Portfolio

A single-page, bilingual (EN/PT) developer portfolio with an interactive iPhone
mockup, a career roadmap, a toolbox, an off-duty section, and a contact CTA.

Implemented from the Claude Design source `Portfolio.dc.html`. The `.dc.html`
prototype (custom `<x-dc>` / `<sc-if>` / `<sc-for>` templating + a `DCLogic`
state class) was converted into a self-contained static site driven by vanilla
JavaScript.

## Run

No build step. It's a static file — open it directly or serve it:

```bash
# option A: just open it
open index.html

# option B: serve (recommended, matches production)
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy

Drop the folder on any static host — GitHub Pages, Netlify, Vercel, or
Cloudflare Pages. No server or environment variables required.

## Features

- **Bilingual** EN / PT, toggled in the top nav and persisted to `localStorage`.
- **Light / dark** theme, persisted to `localStorage`, smooth CSS-variable transitions.
- **Interactive iPhone mockup** — tap any app icon to open its case study
  (problem / build / impact + store links), tap *Back* to return home.
- **Journey timeline** — tap any role to expand the full CV details and tool tags.
- Responsive: columns stack on small screens; respects `prefers-reduced-motion`.

## Files

```
index.html      # the whole app (markup + styles + logic)
assets/         # images (all real, no placeholders)
  pluma.webp, collective.webp, ploomes.webp, agrolite.webp, daily.webp   # app icons
  wall.webp        # iPhone wallpaper
  portrait.webp    # head shot (phone profile card + About section)
  bull.webp        # Bull (French Bulldog) — background knocked out
  timtim.webp      # TimTim (rescued cat) — background knocked out
```

Each `<image-slot>` still has a graceful fallback (monogram / person glyph / pet
emoji) wired via `onerror`, so a missing or broken image never leaves a blank
box. To swap any image, just replace the file in `assets/` — no code changes.
