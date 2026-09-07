# Brutalist Redesign, Round 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply Paulo's review of the first preview: dotted world and Brazil maps in the bento, pets slot, inverted stack slot, richer terminal, dark restyle of the fetch game, centred timeline logos, and a fixed scroll-progress / back-to-top button.

**Architecture:** Same static site (no build, ES modules). A one-off Node script rasterizes Natural Earth country polygons into dot-matrix SVGs committed under `assets/`; the bento renders them as `<img>` with absolutely positioned pin overlays. The fetch game keeps its physics and sprites and only changes what `drawBackground()` paints. The scroll button is a new small section module mounted on `<body>`.

**Tech Stack:** HTML, CSS tokens, ES modules, Node 24 (`node --test`), playwright-core screenshots, Natural Earth 50m GeoJSON (public domain) fetched at script time only.

**Spec:** `docs/superpowers/specs/2026-09-06-brutalist-redesign-design.md` plus the decisions recorded below (grilling round 2, 2026-09-06).

## Round 2 decisions

1. World map slot spans bento columns 1-2 on row 3; Brazil slot takes column 3 (replaces the generic dot-grid location slot). Row 4: numbers, thinker, pets. Row 5: stack, full width.
2. World map copy. EN heading `Apps in production on three continents`, caption `Brazil, Latin America, the US and Portugal. 500k+ people reached, 5 apps in the stores.` PT heading `Apps em produção em três continentes`, caption `Brasil, América Latina, EUA e Portugal. 500 mil+ pessoas alcançadas, 5 apps nas lojas.` Lit cities: Fortaleza (orange), São Paulo, Mexico City, Bogotá, Buenos Aires, Lisbon, San Francisco, New York (white).
3. Brazil slot: dotted Brazil with an orange square on Fortaleza, mono label `Fortaleza · 3.7°S 38.5°W · GMT-3`, heading `Remote from the coast` / `Remoto, do litoral`.
4. Pets slot: Bull and TimTim photos (`assets/bull.webp`, `assets/timtim.webp`), heading `My supervisors` / `Meus supervisores`, caption `Bull, French Bulldog. TimTim, rescued street cat.` / `Bull, bulldog francês. TimTim, gato de rua resgatado.`
5. Stack slot: heading and caption on top, chips below.
6. Terminal: 11 lines generated from data (`bento.numbers[].line`, `products`), 20ms per char, 250ms between lines.
7. Fetch game: black background, dot grid, ground as a 1px `--line` hairline, no palms, no sky or sea gradients, ball shadow as a subtle white ellipse, hint text in mono orange.
8. Scroll button: fixed bottom-right 48px square, 1px `--line` border, `↑` glyph, 2px orange progress stroke drawn around the square by an SVG `rect` with `stroke-dasharray`, visible after 40% of the first viewport, hides at top, click scrolls to top (smooth unless reduced motion), bilingual `aria-label`.
9. Timeline logos centred on the rail.

## Global Constraints

- No em-dash character (U+2014) anywhere. Use comma, colon, period or middot.
- Every user-facing string bilingual via `L(en, pt)` in data or section copy, resolved with `t()`.
- Colours and fonts only through tokens in `css/tokens.css` (`--bg`, `--fg`, `--fg-2`, `--fg-3`, `--line`, `--accent`, `--white`, `--grey`, `--font-text`, `--font-mono`, `--font-display`). The canvas game reads colours via `getComputedStyle(document.documentElement).getPropertyValue(...)` once at mount.
- `border-radius: 0` everywhere in these changes.
- `prefers-reduced-motion: reduce`: no smooth scroll, no typing animation, no auto-scroll, canvas frozen as before.
- Section modules export `id` and `render(root)` and dispose their own animations on re-render (language switch re-renders everything).
- Relative asset paths. `esc()` on every interpolated value.
- Work on branch `redesign-brutalist` in the worktree `.claude/worktrees/redesign-brutalist`. Plain single git commands. Never push (the controller pushes).
- `npm test` must stay green with zero warnings; `npm run shoot` must report `[smoke] ok`.

---

## File structure

```
scripts/maps.mjs               fetches Natural Earth 50m GeoJSON, rasterizes to dot-matrix SVGs
assets/map-world.svg           dotted world (generated, committed)
assets/map-brazil.svg          dotted Brazil (generated, committed)
js/data/bento.js               + world (heading, caption, cities), brazil, pets copy; numbers[].line; terminal lines generator input
js/slots/terminal.js           terminalScript() builds the 11-line script from data; faster cadence
js/sections/bento.js           new grid: terminal, dog, world, brazil, numbers, thinker, pets, stack
css/bento.css                  new grid areas, map slots, pets slot, stack inverted
dog-game.js                    drawBackground() restyle, palms removed, hint in mono orange, colours from tokens
js/sections/scrolltop.js       fixed button with progress stroke
css/scrolltop.css
js/main.js                     registers scrolltop; index.html gets <div id="scrolltop"></div> before the scripts and the css link
css/experience.css             logo centred on the rail
test/bento.test.js             updated expectations (terminal 11 lines, numbers unchanged)
test/maps.test.js              asserts both SVGs exist, are valid SVG, and contain the expected number of pins
```

---

### Task 1: Map assets script and SVGs

**Files:**
- Create: `scripts/maps.mjs`, `assets/map-world.svg`, `assets/map-brazil.svg`, `test/maps.test.js`
- Modify: `package.json` (add `"maps": "node scripts/maps.mjs"`)

**Interfaces:**
- Produces: two SVGs. World: `viewBox="0 0 720 360"` equirectangular, dots at 6px pitch, land dots `fill="rgba(255,255,255,0.22)"` `r=1.4`, ocean empty. Brazil: `viewBox="0 0 300 300"`, projection is a linear lon/lat fit of Brazil's bounding box (lon -74 to -34, lat -34 to 6) into the box with 1:1 aspect preserved and centred, dots at 8px pitch, `r=1.8`, same fill. No pins inside the SVGs: pins are HTML overlays positioned by the section (Task 2) using the same projection functions, exported from `js/maps.js` (created here too) as `worldXY(lon, lat)` returning percentages `{ x, y }` in 0..100 and `brazilXY(lon, lat)` likewise.

- [ ] **Step 1: Write the failing test**

`test/maps.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { worldXY, brazilXY } from '../js/maps.js';

test('map SVGs exist, are SVG, and carry land dots', () => {
  for (const f of ['assets/map-world.svg', 'assets/map-brazil.svg']) {
    assert.ok(existsSync(f), f);
    const s = readFileSync(f, 'utf8');
    assert.ok(s.startsWith('<svg'), f + ' starts with <svg');
    assert.ok((s.match(/<circle/g) || []).length > 500, f + ' has many dots');
    assert.ok(!s.includes(String.fromCharCode(0x2014)));
  }
});

test('projections: Fortaleza lands in the north-east of Brazil and in the west-central world', () => {
  const w = worldXY(-38.5, -3.7);
  assert.ok(w.x > 35 && w.x < 45, 'world x ' + w.x);
  assert.ok(w.y > 48 && w.y < 56, 'world y ' + w.y);
  const b = brazilXY(-38.5, -3.7);
  assert.ok(b.x > 75 && b.x < 95, 'brazil x ' + b.x);
  assert.ok(b.y > 15 && b.y < 35, 'brazil y ' + b.y);
});
```

Run: `npm test`. Expected: FAIL (module and files missing).

- [ ] **Step 2: Write js/maps.js**

```js
// Shared projections so HTML pins land on the same grid the SVGs were rasterized with.
export const WORLD = { w: 720, h: 360 };
export const BRAZIL = { w: 300, h: 300, lon0: -74, lon1: -34, lat0: -34, lat1: 6 };

export function worldXY(lon, lat) {
  return { x: ((lon + 180) / 360) * 100, y: ((90 - lat) / 180) * 100 };
}

// Linear fit of Brazil's bounding box into a square, aspect preserved and centred.
export function brazilXY(lon, lat) {
  const lonSpan = BRAZIL.lon1 - BRAZIL.lon0, latSpan = BRAZIL.lat1 - BRAZIL.lat0;
  const scale = Math.min(BRAZIL.w / lonSpan, BRAZIL.h / latSpan);
  const ox = (BRAZIL.w - lonSpan * scale) / 2, oy = (BRAZIL.h - latSpan * scale) / 2;
  const px = ox + (lon - BRAZIL.lon0) * scale, py = oy + (BRAZIL.lat1 - lat) * scale;
  return { x: (px / BRAZIL.w) * 100, y: (py / BRAZIL.h) * 100 };
}
```

- [ ] **Step 3: Write scripts/maps.mjs**

```js
// Rasterizes Natural Earth 50m country polygons into dot-matrix SVGs. Run once: npm run maps.
import { writeFileSync } from 'node:fs';
import { WORLD, BRAZIL } from '../js/maps.js';

const URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson';
const res = await fetch(URL);
if (!res.ok) throw new Error('download failed ' + res.status);
const geo = await res.json();

// point-in-polygon (ray casting) over a ring of [lon, lat]
function inRing(ring, lon, lat) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function polys(feature) {
  const g = feature.geometry;
  return g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
}
// outer ring inside and not in any hole
function inFeature(feature, lon, lat) {
  for (const poly of polys(feature)) {
    if (inRing(poly[0], lon, lat)) {
      let hole = false;
      for (let k = 1; k < poly.length; k++) if (inRing(poly[k], lon, lat)) { hole = true; break; }
      if (!hole) return true;
    }
  }
  return false;
}
function inLand(features, lon, lat) { return features.some(f => inFeature(f, lon, lat)); }

function svg(w, h, dots, r) {
  const body = dots.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" fill="rgba(255,255,255,0.22)">${body}</svg>\n`;
}

// World: equirectangular, 6px pitch. Skip Antarctica for a cleaner card.
const land = geo.features.filter(f => f.properties.ADMIN !== 'Antarctica' && f.properties.NAME !== 'Antarctica');
const worldDots = [];
for (let y = 3; y < WORLD.h; y += 6) for (let x = 3; x < WORLD.w; x += 6) {
  const lon = (x / WORLD.w) * 360 - 180, lat = 90 - (y / WORLD.h) * 180;
  if (inLand(land, lon, lat)) worldDots.push([x, y]);
}
writeFileSync('assets/map-world.svg', svg(WORLD.w, WORLD.h, worldDots, 1.4));

// Brazil: bounding-box fit, 8px pitch.
const brazil = geo.features.filter(f => f.properties.ADMIN === 'Brazil' || f.properties.NAME === 'Brazil');
if (!brazil.length) throw new Error('Brazil feature not found');
const lonSpan = BRAZIL.lon1 - BRAZIL.lon0, latSpan = BRAZIL.lat1 - BRAZIL.lat0;
const scale = Math.min(BRAZIL.w / lonSpan, BRAZIL.h / latSpan);
const ox = (BRAZIL.w - lonSpan * scale) / 2, oy = (BRAZIL.h - latSpan * scale) / 2;
const brDots = [];
for (let y = 4; y < BRAZIL.h; y += 8) for (let x = 4; x < BRAZIL.w; x += 8) {
  const lon = BRAZIL.lon0 + (x - ox) / scale, lat = BRAZIL.lat1 - (y - oy) / scale;
  if (inLand(brazil, lon, lat)) brDots.push([x, y]);
}
writeFileSync('assets/map-brazil.svg', svg(BRAZIL.w, BRAZIL.h, brDots, 1.8));
console.log('world dots', worldDots.length, 'brazil dots', brDots.length);
```

Add `"maps": "node scripts/maps.mjs"` to `package.json` scripts. Run `npm run maps` (takes up to a minute: 7200 x 60 point tests against ~250 polygons; acceptable). Expected: both SVGs written, world dots roughly 3000 to 4500, Brazil dots roughly 400 to 700. Convert each to PNG for a look (`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --screenshot=/tmp/w.png --window-size=720,360 file://$PWD/assets/map-world.svg`) and Read it: continents must be recognisable, Brazil must look like Brazil with the north-east coast at top right.

- [ ] **Step 4: Run tests and commit**

`npm test`: PASS (36 tests).

```bash
git add scripts/maps.mjs js/maps.js assets/map-world.svg assets/map-brazil.svg test/maps.test.js package.json
git commit -m "feat(maps): dot-matrix world and Brazil SVGs from Natural Earth"
```

---

### Task 2: Bento round 2 (world, Brazil, pets, stack inverted, richer terminal)

**Files:**
- Modify: `js/data/bento.js`, `js/slots/terminal.js`, `js/sections/bento.js`, `css/bento.css`, `test/bento.test.js`

**Interfaces:**
- Consumes: `worldXY`, `brazilXY` from `js/maps.js`; `products` from `js/data/products.js`; existing `mountTerminal`, `mountNumbers`, `numbersRows`.
- Produces: `terminalScript(data, lang)` now takes `data = { cmd, intro: L[], numbers: [{ line: L }], products: [{ line: L }], outro: L[], done: L }` and returns `['> cmd', '✓ ...' x 9, done]` (11 strings).

- [ ] **Step 1: Update data**

In `js/data/bento.js`:
- Add `line` to each numbers entry: `L('Cut support tickets by 90% (Ploomes).', 'Cortei os tickets de suporte em 90% (Ploomes).')`, `L('Made deploys 70% faster (Ploomes).', 'Deploys 70% mais rápidos (Ploomes).')`, `L('Removed 91% of re-renders with React Compiler.', 'Removi 91% dos re-renders com React Compiler.')`, `L('Cut Android CI from 75 to 16 min (Collective Health).', 'CI do Android de 75 para 16 min (Collective Health).')`, `L('Reached 500k+ members.', 'Alcancei 500 mil+ membros.')`, `L('Raised app usage 22% (Agrolite).', 'Aumentei o uso do app em 22% (Agrolite).')`.
- Replace `terminal` with:
```js
terminal: {
  cmd: 'npx paulo@stack init',
  intro: [L('Loaded 6 years of React Native.', 'Carregados 6 anos de React Native.'), L('Shipped 5 apps to the stores.', 'Publicados 5 apps nas lojas.')],
  numberKeys: [0, 3, 2, 4],  // indexes into numbers: tickets, CI, re-renders, members
  productLines: [L('Built Daily Logs solo, end to end.', 'Construí o Daily Logs sozinho, de ponta a ponta.'), L('Building Nino: Expo + NestJS + Postgres.', 'Construindo o Nino: Expo + NestJS + Postgres.')],
  outro: [L('Removing imposter module.', 'Removendo módulo impostor.')],
  done: L('Success! Engineer deployed.', 'Sucesso! Engenheiro publicado.')
}
```
- Add:
```js
world: {
  h: L('Apps in production on three continents', 'Apps em produção em três continentes'),
  c: L('Brazil, Latin America, the US and Portugal. 500k+ people reached, 5 apps in the stores.', 'Brasil, América Latina, EUA e Portugal. 500 mil+ pessoas alcançadas, 5 apps nas lojas.'),
  cities: [
    { name: 'Fortaleza', lon: -38.5, lat: -3.7, home: true },
    { name: 'São Paulo', lon: -46.6, lat: -23.5 },
    { name: 'Mexico City', lon: -99.1, lat: 19.4 },
    { name: 'Bogotá', lon: -74.1, lat: 4.7 },
    { name: 'Buenos Aires', lon: -58.4, lat: -34.6 },
    { name: 'Lisbon', lon: -9.1, lat: 38.7 },
    { name: 'San Francisco', lon: -122.4, lat: 37.8 },
    { name: 'New York', lon: -74.0, lat: 40.7 }
  ]
},
brazil: { h: L('Remote from the coast', 'Remoto, do litoral'), label: 'Fortaleza · 3.7°S 38.5°W · GMT-3', lon: -38.5, lat: -3.7 },
pets: { h: L('My supervisors', 'Meus supervisores'), c: L('Bull, French Bulldog. TimTim, rescued street cat.', 'Bull, bulldog francês. TimTim, gato de rua resgatado.'), list: [{ key: 'bull', name: 'Bull' }, { key: 'timtim', name: 'TimTim' }] }
```

- [ ] **Step 2: Update the terminal test, then the slot**

`test/bento.test.js` terminal case becomes:
```js
test('terminalScript: 11 lines from intro, numbers, products, outro, done', () => {
  const en = terminalScript(bento, 'en');
  assert.equal(en.length, 11);
  assert.equal(en[0], '> npx paulo@stack init');
  assert.ok(en.slice(1, 10).every(l => l.startsWith('✓ ')));
  assert.ok(en[3].includes('90%'));
  assert.equal(en.at(-1), 'Success! Engineer deployed.');
  assert.equal(terminalScript(bento, 'pt').at(-1), 'Sucesso! Engenheiro publicado.');
});
```
`terminalScript(data, lang)` in `js/slots/terminal.js` now takes the whole `bento` object:
```js
export function terminalScript(data, lang) {
  const pick = v => (typeof v === 'string' ? v : (v[lang] ?? v.en));
  const t = data.terminal;
  const body = [
    ...t.intro,
    ...t.numberKeys.map(i => data.numbers[i].line),
    ...t.productLines,
    ...t.outro
  ].map(l => '✓ ' + pick(l));
  return ['> ' + t.cmd, ...body, pick(t.done)];
}
```
Cadence: `wait(20)` per char, `wait(250)` per line. `bento.js` passes `bento` instead of `bento.terminal`.

- [ ] **Step 3: Rewrite the bento markup and CSS**

Markup order in `render`: terminal, dog, world, brazil, numbers, thinker, pets, stack.

World slot:
```js
const pins = bento.world.cities.map(ct => { const p = worldXY(ct.lon, ct.lat); return `<span class="pin${ct.home ? ' home' : ''}" style="left:${p.x.toFixed(2)}%;top:${p.y.toFixed(2)}%" title="${esc(ct.name)}"></span>`; }).join('');
`<div class="slot slot-world"><div class="map"><img src="assets/map-world.svg" alt="" width="720" height="360">${pins}</div><h3 class="slot-h">${esc(t(bento.world.h))}</h3><p class="slot-c">${esc(t(bento.world.c))}</p></div>`
```
Brazil slot: same pattern with `brazilXY`, one `.pin.home`, plus `<span class="mono map-lbl">${esc(bento.brazil.label)}</span>` inside `.map`.
Pets slot:
```js
`<div class="slot slot-pets"><div class="pets">${bento.pets.list.map(p => `<figure class="pet"><img src="assets/${p.key}.webp" alt="" width="96" height="96"><figcaption class="mono">${esc(p.name)}</figcaption></figure>`).join('')}</div><h3 class="slot-h">${esc(t(bento.pets.h))}</h3><p class="slot-c">${esc(t(bento.pets.c))}</p></div>`
```
Stack slot: `<h3 class="slot-h top">` and `<p class="slot-c">` first, then `.chips`.

CSS (`css/bento.css`), desktop:
```css
.bento { grid-template-rows: repeat(4, 200px) auto; }
.slot-terminal { grid-column: 1; grid-row: 1 / span 2; }
.slot-dog { grid-column: 2 / span 2; grid-row: 1 / span 2; }
.slot-world { grid-column: 1 / span 2; grid-row: 3; }
.slot-brazil { grid-column: 3; grid-row: 3; }
.slot-numbers { grid-column: 1; grid-row: 4; }
.slot-thinker { grid-column: 2; grid-row: 4; }
.slot-pets { grid-column: 3; grid-row: 4; }
.slot-stack { grid-column: 1 / span 3; grid-row: 5; }
.slot-h.top { margin-top: 0; }
.map { position: relative; flex: 1; min-height: 0; border: 1px solid var(--line); overflow: hidden; }
.map img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
.pin { position: absolute; width: 6px; height: 6px; background: var(--white); transform: translate(-50%, -50%); box-shadow: 0 0 8px var(--white); }
.pin.home { width: 8px; height: 8px; background: var(--accent); box-shadow: 0 0 10px var(--accent); }
.map-lbl { position: absolute; left: 12px; bottom: 10px; }
.pets { flex: 1; display: flex; align-items: center; justify-content: space-around; }
.pet { margin: 0; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.pet img { width: 96px; height: 96px; object-fit: contain; }
```
Note: `object-fit: contain` on the world image inside a 2:1-ish card keeps the equirectangular aspect; pins use percentages of the `.map` box, so the `.map` box must have the same aspect as the SVG: give `.slot-world .map { aspect-ratio: 2 / 1; flex: none; max-height: 100%; align-self: center; width: 100%; }` and `.slot-brazil .map { aspect-ratio: 1 / 1; flex: none; max-height: 100%; align-self: center; }`. Verify pins sit on land in the screenshot (Fortaleza on the north-east tip).

Tablet (<=1024px): world `grid-column: 1 / span 2; grid-row: 3`, brazil `1 / row 4`, numbers `2 / row 4`, thinker `1 / row 5`, pets `2 / row 5`, stack `1 / span 2; row 6`; `grid-template-rows: repeat(5, 220px) auto`. Mobile (<=640px): single column as before (`.slot { grid-column: 1 !important; grid-row: auto !important; }` already covers it); world slot `min-height: 280px`.

Remove the `.loc`, `.loc-pin`, `.loc-lbl`, `.slot-location` rules and the `loc`/`locH` copy.

- [ ] **Step 4: Verify and commit**

`npm test` (36 pass). Screenshot `#bento` at 1440 and 390 with playwright-core: pins on land, Fortaleza orange on both maps, pets visible, stack heading above chips, terminal types 11 lines within ~8s.

```bash
git add js/data/bento.js js/slots/terminal.js js/sections/bento.js css/bento.css test/bento.test.js
git commit -m "feat(bento): world and Brazil dot maps, pets slot, inverted stack, data-driven terminal"
```

---

### Task 3: Fetch game dark restyle

**Files:**
- Modify: `dog-game.js`

**Interfaces:**
- Consumes: CSS custom properties `--bg`, `--line`, `--accent`, `--fg`, `--font-mono` read once in `mount()` via `getComputedStyle(document.documentElement).getPropertyValue(name).trim()` into a module `PAL` object with fallbacks (`#000`, `rgba(255,255,255,.10)`, `#FF6A1A`, `rgba(255,255,255,.9)`, `'JetBrains Mono', ui-monospace, monospace`).

- [ ] **Step 1: Restyle drawBackground**

Replace the body of `drawBackground()`:
```js
function drawBackground() {
  ctx.fillStyle = PAL.bg; ctx.fillRect(0, 0, W, H);
  // dot grid, 20px pitch, same as the site's .dots panels
  ctx.fillStyle = PAL.line;
  for (var gy = 10; gy < H; gy += 20) for (var gx = 10; gx < W; gx += 20) ctx.fillRect(gx, gy, 1.5, 1.5);
  // ground: one hairline
  ctx.fillStyle = PAL.line; ctx.fillRect(0, Math.round(env.groundY) + 0.5, W, 1);
}
```
Delete `drawPalm`, the `LAYER` object and the palm loading in `loadSprites()` (`palm-1`, `palm-2` entries), `THEME` and every `t.sky*`/`t.sea*`/`t.sand*` use, `PALM_SINK`. Keep `bg-*.png` files untouched on disk but stop loading them if they are loaded anywhere (grep `bg-sky`, `bg-sand`, `bg-palms`).

- [ ] **Step 2: Shadows and hint**

Dog contact shadow (`drawDog`) and ball shadow: `ctx.fillStyle = 'rgba(255,255,255,.08)'` ellipses (white on black). Hint: `ctx.fillStyle = PAL.accent; ctx.font = '500 12px ' + PAL.mono;` and the pulse ring `ctx.strokeStyle = PAL.accent`. Aim line stays white.

- [ ] **Step 3: Verify and commit**

`npm test` (36 pass). Screenshot the bento at 1440: black card, dot grid, dog and ball on a hairline, orange hint. Throw once via playwright (`mouse.down`/`move`/`up`) and screenshot mid-run.

```bash
git add dog-game.js
git commit -m "feat(game): dark dot-grid restyle, palms removed, mono orange hint"
```

---

### Task 4: Scroll-progress button and timeline logo centring

**Files:**
- Create: `js/sections/scrolltop.js`, `css/scrolltop.css`
- Modify: `index.html` (add `<link rel="stylesheet" href="css/scrolltop.css">` and `<div id="scrolltop"></div>` right after `</footer>`), `js/main.js` (import and register the module in the dynamic import list), `css/experience.css`

**Interfaces:**
- Produces: `id = 'scrolltop'`, `render(root)`; registers one scroll listener for the page lifetime (module flag), updates the stroke and visibility with rAF throttling.

- [ ] **Step 1: Write js/sections/scrolltop.js**

```js
import { t, L } from '../i18n.js';
import { esc } from '../dom.js';

export const id = 'scrolltop';
const label = L('Back to top', 'Voltar ao topo');
const SIZE = 48, PERIM = SIZE * 4;
let wired = false, raf = 0;

export function render(root) {
  root.innerHTML = `
    <button type="button" class="stt" id="stt" aria-label="${esc(t(label))}" hidden>
      <svg class="stt-ring" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" aria-hidden="true">
        <rect x="1" y="1" width="${SIZE - 2}" height="${SIZE - 2}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="${PERIM}" stroke-dashoffset="${PERIM}"/>
      </svg>
      <span class="stt-glyph" aria-hidden="true">↑</span>
    </button>`;
  root.querySelector('#stt').addEventListener('click', () => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  });
  update();
  if (!wired) { wired = true; window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); }, { passive: true }); }
}

function update() {
  const btn = document.getElementById('stt');
  if (!btn) return;
  const max = document.documentElement.scrollHeight - innerHeight;
  const y = scrollY, p = max > 0 ? Math.min(1, y / max) : 0;
  btn.hidden = y < innerHeight * 0.4;
  const rect = btn.querySelector('rect');
  if (rect) rect.setAttribute('stroke-dashoffset', String(PERIM * (1 - p)));
}
```

`css/scrolltop.css`:
```css
.stt { position: fixed; right: 24px; bottom: 24px; width: 48px; height: 48px; border: 1px solid var(--line); background: var(--bg); color: var(--fg); z-index: 90; display: grid; place-items: center; opacity: 1; transition: opacity .3s ease; }
.stt[hidden] { display: none; }
.stt-ring { position: absolute; inset: 0; }
.stt-glyph { font: 500 16px/1 var(--font-mono); position: relative; }
.stt:hover { background: var(--fill-hover-2); }
.stt:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
@media (max-width: 640px) { .stt { right: 16px; bottom: 16px; } }
```

- [ ] **Step 2: Centre the timeline logos**

In `css/experience.css`, change `.xp-row.l .xp-meta { margin-left: -24px; }` to `margin-left: -48px;` and `.xp-row.r .xp-meta { margin-right: -24px; }` to `margin-right: -48px;` so the 48px logo is centred on the 1px rail (gap is 48px, logo width 48px). Confirm in the screenshot that the rail passes through the middle of each logo; adjust by ±1px if the border makes it 50px.

- [ ] **Step 3: Verify and commit**

`npm test` (36 pass). `npm run shoot` reports `[smoke] ok`; also add `scrolltop` to the smoke id list in `scripts/shoot.mjs`. Screenshot after scrolling to 50%: button visible with half the outline orange; at top: hidden. Experience screenshot: logos centred on the rail.

```bash
git add js/sections/scrolltop.js css/scrolltop.css index.html js/main.js css/experience.css scripts/shoot.mjs
git commit -m "feat(ui): scroll-progress back-to-top square, centre timeline logos on the rail"
```

---

## Self-review

- Coverage of the 9 decisions: 1, 2, 3, 4, 5, 6 in Task 2 (assets from Task 1); 7 in Task 3; 8 and 9 in Task 4.
- Names consistent: `worldXY`/`brazilXY` (Task 1) used in Task 2; `terminalScript(bento, lang)` signature changed in Task 2 with test updated; `PAL` local to dog-game.js; `scrolltop` id used in index.html, main.js, shoot.mjs.
- No placeholders: every step has code or exact values.
