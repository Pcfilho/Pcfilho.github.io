# Paulo Barroso · Portfolio

An interactive, bilingual (EN/PT) developer portfolio with a fully playable
iPhone mockup, a career roadmap, a toolbox, an off-duty section, and a contact
call to action.

Implemented from the Claude Design source `Portfolio.dc.html` and converted into
a self-contained static site driven by vanilla JavaScript. No framework, no
build step.

## Features

- **Bilingual** EN / PT, toggled in the top nav and persisted to `localStorage`.
- **Light / dark** theme, persisted, with smooth CSS-variable transitions.
- **Interactive iPhone**
  - Live status-bar clock.
  - Swipeable two-page home (apps + "off the clock" widgets) with page dots.
  - Tappable Dynamic Island.
  - Tap an app icon to open its case study (problem / build / impact + store
    links); tap Back to return.
  - **iOS-style edit mode:** long-press to jiggle, drag to rearrange the apps
    (order is persisted), an in-phone push notification if you try to delete
    one, and a frosted "OK" pill to finish.
- **Journey timeline** with expandable roles and tool tags.
- A **Konami-code** confetti easter egg (arrows + B + A).
- Responsive; respects `prefers-reduced-motion`.

## Run

```bash
# just open it
open index.html

# or serve (matches production)
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Deploy (GitHub Pages)

Live at **https://pcfilho.github.io/** — served by GitHub Pages from the `main`
branch root. This is the user-site repo (`Pcfilho.github.io`). A `.nojekyll`
file disables Jekyll so every file is served as-is. No build step. All paths are
relative, so the site stays portable.

## Files

```
index.html      # the whole app (markup + styles + logic)
assets/         # images: app icons, wallpaper, portrait, pet cutouts
.nojekyll       # disable Jekyll on GitHub Pages
CLAUDE.md       # notes for AI-assisted edits
```

Every image has an `onerror` fallback (monogram / person glyph), so a missing
file never leaves a blank box. To swap any image, replace the file in `assets/`.
