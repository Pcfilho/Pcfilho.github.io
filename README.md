# Paulo Barroso · Portfolio

A black, brutalist, developer-flavoured single page: a portrait hero, an
interactive iPhone as centrepiece, a "My products" section, a bento of
interactive fragments, an experience timeline, recommendations from
colleagues, and a footer toy. Bilingual (EN/PT), no framework, no build step.

## Features

- **Portrait hero** with a staged headline entrance.
- **Interactive iPhone**, transplanted onto a full-height stage with a dark
  skin: live status-bar clock, swipeable two-page home, tappable Dynamic
  Island, per-app case studies, iOS-style edit mode (long-press to jiggle,
  drag to reorder, an in-phone push notification if you try to delete an
  app).
- **My products**: Daily Logs and Nino, with a short founder's-eye manifesto.
- **Fragments bento**: a typing terminal, the beach fetch game (drag and
  release the ball), an auto-scrolling numbers list, a thinker/builder/shipper
  slot, a world map, a Brazil map, a pets card, and the stack chips.
- **Experience rail**: alternating timeline of roles with bullets and tags.
- **Recommendations** from colleagues, and a **footer** with a push-toy demo
  and a Konami-code confetti easter egg (arrows + B + A).
- **EN/PT** toggle, persisted to `localStorage`.
- Responsive; respects `prefers-reduced-motion`.

## Run

```bash
npm run serve   # python3 -m http.server 8000, then open http://localhost:8000
```

## Verify

```bash
npm test        # node --test: i18n, data, bento, clock, dog-game core, maps, no-em-dash (36 tests)
npm run shoot   # headless Chrome, captures shots/{desktop,mobile}-{fold,full}.png
npm run maps    # regenerates assets/map-world.svg and assets/map-brazil.svg from Natural Earth (needs network)
```

## Deploy

Live at **https://pcfilho.github.io/**, served by GitHub Pages from the
`main` branch root (user-site repo `Pcfilho.github.io`). A `.nojekyll` file
disables Jekyll so every file is served as-is. No build step; all paths are
relative, so the site stays portable.

## Files

```
index.html                 skeleton: head, 7 section mounts (header, hero, phone, products, bento,
                            experience, colleagues), footer mount, scrolltop mount
css/tokens.css              custom properties, reset, type scale, shared utilities
css/header.css, hero.css, phone.css, products.css, bento.css, experience.css, colleagues.css, footer.css, scrolltop.css
js/i18n.js                  lang state, L(), t(), persistence
js/dom.js                   esc(), arrowSvg, EXT
js/clock.js                 pure DST-safe clock formatting
js/maps.js                  WORLD/BRAZIL projection constants, worldXY(), brazilXY()
js/main.js                  boot, render all sections, reveal observer
js/data/*.js                profile, apps, products, experience, recos, bento
js/sections/*.js            header, hero, phone, products, bento, experience, colleagues, footer, scrolltop
js/slots/*.js                terminal, numbers bento sub-widgets
dog-game.core.js            unchanged UMD physics core
dog-game.js                 mounts the beach fetch game into the bento dog slot
scripts/portrait.mjs        rebuilds the hero portrait webp files from the source png
scripts/shoot.mjs           serves the site and captures screenshots into shots/
scripts/maps.mjs            regenerates assets/map-world.svg and assets/map-brazil.svg from Natural Earth
test/*.test.{js,cjs}        node --test suite
CLAUDE.md                   notes for AI-assisted edits
```
