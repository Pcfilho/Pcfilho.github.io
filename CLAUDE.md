# CLAUDE.md

Guidance for Claude working in this repo.

## What this is

A single-page portfolio for Paulo Barroso (senior mobile engineer): black,
brutalist, developer-flavoured. Portrait hero, an interactive iPhone as
centrepiece, a "My products" section, a bento of interactive fragments, an
experience timeline, recommendations and a footer toy. There is **no build
step** and no framework: native ES modules, plain CSS, `node --test`.

## File layout

```
index.html                 skeleton: head, header mount, main with 6 section mounts, footer mount
css/tokens.css              custom properties, reset, type scale, shared utilities
css/header.css, hero.css, phone.css, products.css, bento.css, experience.css, colleagues.css, footer.css
js/i18n.js                  lang state, L(), t(), persistence
js/dom.js                   esc(), arrowSvg, EXT
js/clock.js                 pure DST-safe clock formatting
js/main.js                  boot, render all sections, reveal observer
js/data/*.js                profile, apps, products, experience, recos, bento
js/sections/*.js            header, hero, phone, products, bento, experience, colleagues, footer
js/slots/*.js                terminal, numbers bento sub-widgets
dog-game.core.js            unchanged UMD physics core
dog-game.js                 mounts the beach fetch game into the bento dog slot
scripts/portrait.mjs        builds hero-portrait webp files from the source png
scripts/shoot.mjs           serves the site and captures screenshots into shots/
test/*.test.js              node --test suite (i18n, data, bento, clock, dog-game core, no-em-dash)
```

## Conventions

- **Bilingual** EN/PT. Data modules build copy with `L(en, pt)` from
  `js/i18n.js`; renderers resolve it with `t()`. EN is the default
  (`loadLang()` falls back to `en`); the chosen language persists to
  `localStorage['pb_lang']`.
- **No em-dash** anywhere (the long dash, Unicode U+2014): not in copy, code,
  comments, commits, or docs. Use a period, comma, colon, or middot `·`.
  `test/no-emdash.test.js` guards every tracked `.html/.css/.js/.mjs/.cjs/.json/.md`
  file.
- **Tokens only.** Every colour and font comes from the custom properties in
  `css/tokens.css` (`--bg`, `--fg`, `--accent`, `--font-display`, `--font-text`,
  `--font-mono`, etc.). Do not hardcode a colour or font-family elsewhere.
- **`border-radius: 0` everywhere**, except inside the simulated iOS device:
  the phone screen, its app icons, and the in-phone push banner keep their
  rounded corners. The device frame itself is also rounded. Nothing else is.
- **No employer named for the current role.** The hero and profile copy stay
  impersonal ("Senior React Native / Mobile Engineer", PT "Engenheiro Mobile
  Sênior · React Native"), no company. Past, already-public roles (e.g.
  Collective Health) are still named in the Experience timeline.
- Keep paths **relative** (`assets/...`, `css/...`, not `/assets/...`). The
  site is served at the root `https://pcfilho.github.io/`; relative paths
  keep it portable if it ever moves to a subpath.
- **External links open in a new tab** (`target="_blank" rel="noopener
  noreferrer"`, exported as `EXT` from `js/dom.js`). `mailto:`, `tel:` and
  in-page anchors stay same tab.
- Every section module in `js/sections/*.js` exports `id` (the mount element's
  id) and `render(root)` (writes `root.innerHTML` and wires events). A module
  that starts its own animation (bento's terminal typing and numbers
  auto-scroll, the header clock interval) must dispose the previous instance
  at the top of `render()` before mounting a new one, since `render()` runs
  again on every language switch.
- `js/main.js` is the single place that knows page order and boots every
  section; a failed section import now fails the boot loudly (no silent
  `.catch(() => null)`).

## Run / verify

```bash
npm run serve     # python3 -m http.server 8000, then open http://localhost:8000
npm test          # node --test, 34 tests
npm run shoot     # headless Chrome, captures shots/{desktop,mobile}-{fold,full}.png
npm run portrait  # rebuilds the hero portrait webp files from the source png
```

For a live preview while iterating, drive local headless Chrome (via
`npm run shoot`) or the Maestri browser portal. `npm run shoot` also logs any
browser console error; the only expected line is a GoatCounter CORS/403 on
the visitor counter fetch (the dashboard is private, so the counter line
stays hidden by design). Anything else printed there is a real regression.

## Deploy

Live at https://pcfilho.github.io/ via GitHub Pages from `main` (root),
user-site repo `Pcfilho.github.io`. `.nojekyll` disables Jekyll so files
serve as-is. No build, no env vars. `main` is protected (no force-push, no
deletion).
