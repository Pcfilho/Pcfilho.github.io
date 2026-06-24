# CLAUDE.md

Guidance for Claude working in this repo.

## What this is

A single-page portfolio for Paulo Barroso (senior mobile engineer). It was
converted from a Claude Design prototype (`Portfolio.dc.html`) into a
self-contained static site. There is **no build step** and no framework.

## Architecture

Everything lives in `index.html`:

- **Markup + inline CSS** in `<head>`/`<style>`, plus a small set of utility
  classes for hover/animation/edit-mode.
- **One IIFE of vanilla JS** at the bottom holds all logic:
  - `state` object (`lang`, `theme`, `page`, `openApp`, `journeyOpen`,
    `editMode`, `appOrder`), persisted to `localStorage` (`pb_*` keys).
  - `model()` builds the bilingual data via `L(en, pt)`.
  - View functions return HTML strings (`heroView`, `phoneHomeView`,
    `page0Apps`, `page1Widgets`, `journeyView`, etc.).
  - `render()` rebuilds `#app` from state, then re-wires the pager and app grid.
  - `window.PB` exposes the inline `onclick` handlers (survives re-render).
- `assets/` holds all images (webp/png). Each `<img>` has an `onerror`
  fallback so a missing file never shows a blank box.

Interactive pieces: live status-bar clock, swipeable two-page home (apps +
widgets) with page dots, tappable Dynamic Island, per-app case-study modals,
iOS-style edit mode (long-press jiggle, drag to reorder, in-phone push
notifications, frosted "OK" pill), and a Konami-code confetti easter egg
(arrows + B + A).

## Conventions

- **Bilingual** EN/PT through `L(en, pt)`. Add both languages for any new copy.
- **No em-dashes** in user-facing copy (the long dash, Unicode U+2014). Use a
  period, comma, or middot "·". Paulo treats that dash as a sign of AI-written
  text.
- Keep paths **relative** (`assets/...`, not `/assets/...`). The site is served
  at the root `https://pcfilho.github.io/` (user-site repo `Pcfilho.github.io`);
  relative paths also keep it portable if it ever moves to a subpath.
- **External links and documents open in a new tab** (`target="_blank"
  rel="noopener noreferrer"`) so a visitor never loses the portfolio. In-page
  anchors (`#about`, `#contact`, `#roadmap`) and `mailto:` / `tel:` stay
  same-tab (they do not navigate away).
- Match the existing inline-style approach; do not introduce a framework or
  build tooling without asking.

## Run / preview

```bash
python3 -m http.server 8000   # then open http://localhost:8000
# or just: open index.html
```

For visual verification, render with **local headless Chrome** (the
claude-in-chrome browser tool drives a different machine here):

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --user-data-dir="$(mktemp -d)" \
  --window-size=1280,1080 --screenshot=/tmp/shot.png \
  http://localhost:8000/index.html
```

Interaction-heavy changes (drag, long-press, taps) are best verified by driving
Chrome over the DevTools Protocol (`--remote-debugging-port`) and dispatching
`Input.dispatchMouseEvent`. Note: for held drags, `mouseMoved` must use
`button:"none"` with `buttons:1`.

## Deploy

Live at https://pcfilho.github.io/ — GitHub Pages from `main` (root), user-site
repo `Pcfilho.github.io`. `.nojekyll` disables Jekyll so files serve as-is. No
build, no env vars. `main` is protected (no force-push, no deletion).
