# Brutalist Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the portfolio as a black, brutalist, developer-flavoured single page (reference: diegovz.com) with Paulo's portrait hero, the interactive iPhone as centrepiece, a separate "My products" section, a bento of interactive fragments, an experience timeline, recommendations and a footer toy.

**Architecture:** Static site, no build. `index.html` holds the skeleton (head, header, empty `<main>` mount points, footer mount). `js/main.js` boots: reads language, renders every section from `js/sections/*.js` (each exports `render(root)` that writes HTML and wires events), then starts observers. Copy lives in `js/data/*.js` as bilingual `L(en, pt)` values resolved by `t()` from `js/i18n.js`. CSS split per concern in `css/`. The iPhone is transplanted from the old `index.html` into `js/sections/phone.js`.

**Tech Stack:** HTML, CSS custom properties, native ES modules, Node 24 test runner (`node --test`), playwright-core + local Chrome for screenshots, `cwebp` for images. GitHub Pages from `main`.

**Spec:** `docs/superpowers/specs/2026-09-06-brutalist-redesign-design.md`

## Global Constraints

- No em-dash character (U+2014) anywhere: code, copy, comments, commits. Use comma, colon, period or middot.
- Every user-facing string exists in EN and PT via `L(en, pt)`; EN is the default.
- No employer named for the current role. Copy says `Senior React Native / Mobile Engineer` (PT `Engenheiro Mobile Sênior · React Native`). Collective Health period is `01/2026 · 2026`, never "Present".
- `border-radius: 0` on every site element. Only the phone's inner iOS UI, app icons (15px / 22px) and the phone device frame (52px / 42px) are rounded.
- Colors and fonts only through the tokens in `css/tokens.css`. Accent `#FF6A1A`. Fonts Inter Tight, Inter, JetBrains Mono from Google Fonts.
- Relative asset paths (`assets/...`), never `/assets/...`.
- External links open in a new tab with `target="_blank" rel="noopener noreferrer"`. `mailto:` and `tel:` stay same tab.
- No build step, no framework, no bundler. playwright-core is a dev-only screenshot tool.
- `prefers-reduced-motion: reduce` disables every animation (final state immediately).
- Work on branch `redesign-brutalist` in the worktree at `.claude/worktrees/redesign-brutalist`. Commit after each task. Never push to `main`.
- The old site source is available as `git show origin/main:index.html` (line numbers in this plan refer to that file) and `git show origin/main:dog-game.js`.

---

## File structure

```
index.html                     skeleton: head, header, main with 6 section mounts, footer mount, scripts
css/tokens.css                 custom properties, reset, type scale, utilities (.container, .sq, .mono, .card, .arrow, .dots, .reveal)
css/header.css                 fixed header
css/hero.css                   hero + entrance choreography
css/phone.css                  phone stage + device frame + dark skin + <640px native mode
css/products.css               my products cards
css/bento.css                  bento grid + slots
css/experience.css             timeline
css/colleagues.css             recommendations list
css/footer.css                 footer + push banner + toast
js/i18n.js                     lang state, L(), t(), persistence
js/dom.js                      esc(), el(), arrowSvg
js/main.js                     boot, render all sections, reveal observer, header clock
js/data/profile.js             name, role, since, location, links, stats
js/data/apps.js                4 professional apps (phone)
js/data/products.js            Daily Logs, Nino
js/data/experience.js          5 roles
js/data/recos.js               3 recommendations
js/data/bento.js               terminal lines, numbers, stack chips
js/sections/header.js
js/sections/hero.js
js/sections/phone.js           transplanted iPhone
js/sections/products.js
js/sections/bento.js           grid + terminal, numbers, thinker, location, stack; mounts dog game
js/sections/experience.js
js/sections/colleagues.js
js/sections/footer.js          links, goatcounter, push toy, konami + confetti + toast
dog-game.core.js               unchanged (UMD, physics)
dog-game.js                    mount target and skin changed
scripts/portrait.mjs           builds hero-portrait webp files from the source png
scripts/shoot.mjs              serves the site and captures screenshots into shots/
test/i18n.test.js
test/data.test.js
test/bento.test.js
test/no-emdash.test.js
test/dog-game.core.test.cjs    renamed from .js (CJS)
package.json                   type module, scripts: test, shoot, serve; devDependency playwright-core
```

---

### Task 1: Tooling scaffold, i18n module, em-dash guard

**Files:**
- Create: `package.json`, `js/i18n.js`, `js/dom.js`, `test/i18n.test.js`, `test/no-emdash.test.js`
- Modify: `.gitignore`
- Rename: `test/dog-game.core.test.js` to `test/dog-game.core.test.cjs`

**Interfaces:**
- Produces: `js/i18n.js` exporting `state` (`{ lang: 'en' | 'pt' }`), `L(en, pt)` returning `{ en, pt }`, `t(v)` returning `v` when string, else `v[state.lang]` falling back to `v.en`, `setLang(lang)` persisting to `localStorage['pb_lang']` and setting `document.documentElement.lang`, `loadLang()` reading it. `js/dom.js` exporting `esc(s)` (HTML escape), `arrowSvg` (string, the diagonal arrow), `h(strings, ...values)` is NOT provided; sections build strings with `+` and template literals.

- [ ] **Step 1: Create package.json and gitignore entries**

`package.json`:
```json
{
  "name": "pcfilho-portfolio",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test test/",
    "serve": "python3 -m http.server 8000",
    "shoot": "node scripts/shoot.mjs",
    "portrait": "node scripts/portrait.mjs"
  },
  "devDependencies": {
    "playwright-core": "^1.50.0"
  }
}
```

Append to `.gitignore`:
```
node_modules/
shots/
package-lock.json
```

Run: `git mv test/dog-game.core.test.js test/dog-game.core.test.cjs` and, inside that file, keep `require(...)` as is (CJS still works in a `.cjs` file with `"type": "module"`). Run `npm install` (installs playwright-core only; it uses the local Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, no browser download).

- [ ] **Step 2: Write the failing i18n test**

`test/i18n.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { L, t, state } from '../js/i18n.js';

test('L builds a bilingual value and t resolves by current lang', () => {
  const v = L('Hello', 'Olá');
  assert.deepEqual(v, { en: 'Hello', pt: 'Olá' });
  state.lang = 'en';
  assert.equal(t(v), 'Hello');
  state.lang = 'pt';
  assert.equal(t(v), 'Olá');
});

test('t passes plain strings through and falls back to en', () => {
  state.lang = 'pt';
  assert.equal(t('raw'), 'raw');
  assert.equal(t({ en: 'only en' }), 'only en');
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`
Expected: FAIL, `Cannot find module '.../js/i18n.js'`.

- [ ] **Step 4: Write js/i18n.js and js/dom.js**

`js/i18n.js`:
```js
// Bilingual copy. Data modules build values with L(en, pt); renderers resolve with t().
export const state = { lang: 'en' };

export function L(en, pt) {
  return { en, pt };
}

export function t(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return v[state.lang] ?? v.en ?? '';
}

const KEY = 'pb_lang';

export function loadLang() {
  let saved = null;
  try { saved = globalThis.localStorage?.getItem(KEY); } catch (_) { /* private mode */ }
  state.lang = saved === 'pt' ? 'pt' : 'en';
  return state.lang;
}

export function setLang(lang) {
  state.lang = lang === 'pt' ? 'pt' : 'en';
  try { globalThis.localStorage?.setItem(KEY, state.lang); } catch (_) { /* ignore */ }
  if (globalThis.document) document.documentElement.setAttribute('lang', state.lang);
  return state.lang;
}
```

`js/dom.js`:
```js
export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Diagonal "open" arrow used on every outbound card and link.
export const arrowSvg = '<svg class="arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';

export const EXT = 'target="_blank" rel="noopener noreferrer"';
```

- [ ] **Step 5: Write the em-dash guard test**

`test/no-emdash.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const TEXT = /\.(html|css|js|mjs|cjs|json|md)$/;

test('no em-dash (U+2014) in tracked text files', () => {
  const files = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(f => TEXT.test(f));
  const offenders = files.filter(f => readFileSync(f, 'utf8').includes('—'));
  assert.deepEqual(offenders, []);
});
```

- [ ] **Step 6: Run tests, expect the em-dash test to fail on the old index.html, then delete the old index.html body**

Run: `npm test`
Expected: i18n tests PASS; the em-dash test may FAIL listing `index.html` or `docs/...` files from the old site. Check the offenders. The old `index.html` will be replaced in Task 2; for now replace its content with the placeholder below so the guard passes, and fix any offending `docs/` file by replacing U+2014 with a comma.

Temporary `index.html`:
```html
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Paulo Barroso</title></head><body>rebuilding</body></html>
```

Run: `npm test`
Expected: all PASS (i18n 2, em-dash 1, dog-game core 22).

- [ ] **Step 7: Commit**

```bash
git add package.json .gitignore js/i18n.js js/dom.js test/ index.html docs/
git commit -m "chore: scaffold module layout, i18n helpers and em-dash guard"
```

---

### Task 2: Tokens, skeleton, header, boot

**Files:**
- Create: `css/tokens.css`, `css/header.css`, `js/sections/header.js`, `js/data/profile.js`, `js/main.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: `L`, `t`, `state`, `loadLang`, `setLang` from `js/i18n.js`; `esc` from `js/dom.js`.
- Produces: `js/data/profile.js` exporting `profile` (shape below). `js/main.js` exporting `renderAll()` and calling it on boot; every section module exports `render(root)` where `root` is the mount element, and may export `wire()`-free code (wiring happens inside `render`). `js/main.js` also exports `onLangChange(fn)` so sections that hold runtime state (the phone) can re-render.

`profile` shape:
```js
export const profile = {
  name: 'Paulo Barroso',
  handle: 'paulo.',
  siteName: 'pcfilho.github.io/',
  since: 2020,
  role: L('Senior React Native / Mobile Engineer', 'Engenheiro Mobile Sênior · React Native'),
  location: L('Based in Fortaleza, Brazil', 'De Fortaleza, Brasil'),
  tz: 'GMT-3',
  tzOffsetHours: -3,
  email: 'paulo.dev.85@gmail.com',
  phone: '+5585999209820',
  linkedin: 'https://www.linkedin.com/in/paulo-cesar-barroso/',
  recommendations: 'https://www.linkedin.com/in/paulo-cesar-barroso/details/recommendations/',
  github: 'https://github.com/Pcfilho',
  cv: 'assets/Paulo_Barroso_CV.pdf',
  avatar: 'assets/portrait.webp',
  stats: [
    { v: '90%', l: L('fewer tickets', 'menos tickets') },
    { v: '70%', l: L('faster deploys', 'deploys + rápidos') },
    { v: '500k+', l: L('users reached', 'usuários alcançados') }
  ]
};
```

- [ ] **Step 1: Write css/tokens.css**

```css
:root {
  --bg: #000;
  --fg: rgba(255,255,255,.90);
  --fg-2: rgba(255,255,255,.60);
  --fg-3: rgba(255,255,255,.40);
  --hair: rgba(255,255,255,.25);
  --line: rgba(255,255,255,.10);
  --fill-hover: rgba(255,255,255,.04);
  --fill-hover-2: rgba(255,255,255,.07);
  --accent: #FF6A1A;
  --font-display: 'Inter Tight', 'Inter', system-ui, sans-serif;
  --font-text: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, Menlo, monospace;
  --container: 1140px;
  --pad: 24px;
  --header-h: 60px;
  --ease-out: cubic-bezier(.15,.8,.25,1);
}
*, *::before, *::after { box-sizing: border-box; border-radius: 0; }
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
html, body { margin: 0; padding: 0; background: var(--bg); color: var(--fg); }
body { font: 400 16px/1.55 var(--font-text); overflow-x: clip; }
img { max-width: 100%; display: block; -webkit-user-drag: none; user-select: none; }
a { color: inherit; text-decoration: none; -webkit-tap-highlight-color: transparent; }
button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; }
h1, h2, h3, p { margin: 0; }
::selection { background: var(--accent); color: #000; }

.container { max-width: var(--container); margin: 0 auto; padding: 0 var(--pad); }
.section { padding: 120px 0; }
.section-title { font: 800 36px/1.1 var(--font-display); letter-spacing: -.02em; color: var(--fg); margin-bottom: 40px; }
.section-sub { font: 500 12px/1.4 var(--font-mono); letter-spacing: .02em; color: var(--fg-3); margin: -28px 0 40px; }
.sq { display: inline-block; width: .22em; height: .22em; background: var(--accent); margin-left: .08em; vertical-align: baseline; }
.mono { font: 500 12px/1.5 var(--font-mono); letter-spacing: .02em; color: var(--fg-3); }
.card { border: 1px solid var(--line); background: transparent; transition: background-color .3s ease; }
.card:hover { background: var(--fill-hover); }
.arrow { flex: none; color: var(--fg); transition: transform .2s ease; }
.card:hover .arrow, a:hover > .arrow { transform: translate(4px,-4px); }
.dots { background: radial-gradient(rgba(255,255,255,.10) 1px, transparent 1px) 0 0 / 20px 20px, rgba(255,255,255,.04); }
.ulink { border-bottom: 1.5px solid rgba(117,122,138,.4); padding-bottom: 1px; transition: border-color .2s ease; }
.ulink:hover { border-color: var(--fg); }

/* one-shot section reveal (see js/main.js) */
.reveal { opacity: 0; transform: translateY(12px); transition: opacity .6s var(--ease-out), transform .6s var(--ease-out); }
.reveal.in { opacity: 1; transform: none; }

@media (max-width: 640px) {
  :root { --pad: 16px; }
  .section { padding: 80px 0; }
  .section-title { font-size: 30px; margin-bottom: 28px; }
}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .reveal { opacity: 1; transform: none; transition: none; }
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 2: Write index.html skeleton**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Paulo Barroso · Senior Mobile Engineer</title>
<meta name="description" content="Paulo Barroso, senior React Native and mobile engineer from Fortaleza, Brazil. Shipping mobile apps since 2020. Professional apps, my own products, and the stack behind them.">
<meta name="theme-color" content="#000000">
<meta property="og:type" content="website">
<meta property="og:url" content="https://pcfilho.github.io/">
<meta property="og:title" content="Paulo Barroso · Senior Mobile Engineer">
<meta property="og:description" content="Shipping mobile apps since 2020. Senior React Native / Mobile Engineer.">
<meta property="og:image" content="https://pcfilho.github.io/assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Paulo Barroso · Senior Mobile Engineer">
<meta name="twitter:description" content="Shipping mobile apps since 2020. Senior React Native / Mobile Engineer.">
<meta name="twitter:image" content="https://pcfilho.github.io/assets/og.png">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23FF6A1A'/%3E%3Crect x='55' y='55' width='45' height='45' fill='white'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/tokens.css">
<link rel="stylesheet" href="css/header.css">
<link rel="stylesheet" href="css/hero.css">
<link rel="stylesheet" href="css/phone.css">
<link rel="stylesheet" href="css/products.css">
<link rel="stylesheet" href="css/bento.css">
<link rel="stylesheet" href="css/experience.css">
<link rel="stylesheet" href="css/colleagues.css">
<link rel="stylesheet" href="css/footer.css">
</head>
<body>
<header id="site-header"></header>
<main>
  <section id="hero" aria-label="Intro"></section>
  <section id="phone" class="section reveal"></section>
  <section id="products" class="section reveal"></section>
  <section id="bento" class="section reveal"></section>
  <section id="experience" class="section reveal"></section>
  <section id="colleagues" class="section reveal"></section>
</main>
<footer id="site-footer" class="reveal"></footer>
<script defer src="dog-game.core.js"></script>
<script defer src="dog-game.js"></script>
<script type="module" src="js/main.js"></script>
<!-- GoatCounter: privacy-friendly visitor counter (no cookies, no GDPR banner).
     Dashboard: https://pcfilho.goatcounter.com -->
<script data-goatcounter="https://pcfilho.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
</body>
</html>
```

Create the CSS files referenced above that later tasks fill (`css/hero.css`, `css/phone.css`, `css/products.css`, `css/bento.css`, `css/experience.css`, `css/colleagues.css`, `css/footer.css`) as empty files with a one-line comment `/* filled in a later task */` so the page loads without 404s.

- [ ] **Step 3: Write js/data/profile.js** (the object shown in Interfaces, with `import { L } from '../i18n.js';` at the top).

- [ ] **Step 4: Write js/main.js**

```js
import { loadLang, setLang, state } from './i18n.js';
import * as header from './sections/header.js';

const sections = [header];
const listeners = new Set();

// Later tasks push their modules here in page order.
export function register(mod) { sections.push(mod); }
export function onLangChange(fn) { listeners.add(fn); }

export function renderAll() {
  document.documentElement.setAttribute('lang', state.lang);
  for (const mod of sections) {
    const root = document.getElementById(mod.id);
    if (root) mod.render(root);
  }
  listeners.forEach(fn => fn(state.lang));
}

export function switchLang(lang) {
  if (lang === state.lang) return;
  setLang(lang);
  renderAll();
  observeReveals();
}

function observeReveals() {
  const nodes = document.querySelectorAll('.reveal:not(.in)');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    nodes.forEach(n => n.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }
  }, { threshold: 0.15 });
  nodes.forEach(n => io.observe(n));
}

async function boot() {
  loadLang();
  // Section modules are imported here so main.js stays the single place that knows page order.
  const mods = await Promise.all([
    import('./sections/hero.js'),
    import('./sections/phone.js'),
    import('./sections/products.js'),
    import('./sections/bento.js'),
    import('./sections/experience.js'),
    import('./sections/colleagues.js'),
    import('./sections/footer.js')
  ].map(p => p.catch(() => null)));
  mods.filter(Boolean).forEach(register);
  renderAll();
  observeReveals();
}

boot();
```

Note: the `.catch(() => null)` keeps the page rendering while later tasks have not created their modules yet. Task 12 removes the catch so a missing module fails loudly.

- [ ] **Step 5: Write js/sections/header.js and css/header.css**

`js/sections/header.js`:
```js
import { t, state } from '../i18n.js';
import { esc } from '../dom.js';
import { profile } from '../data/profile.js';

export const id = 'site-header';
let timer = null;

function clockText() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const local = new Date(utc + profile.tzOffsetHours * 3600000);
  const hh = String(local.getHours()).padStart(2, '0');
  const mm = String(local.getMinutes()).padStart(2, '0');
  return `${hh}:${mm} ${profile.tz}`;
}

export function render(root) {
  root.innerHTML = `
    <div class="hdr container">
      <a class="hdr-logo" href="#" aria-label="${esc(profile.name)}"><span class="logo-sq"></span><span class="hdr-name">${esc(profile.handle)}</span></a>
      <div class="hdr-right">
        <div class="hdr-loc">
          <div class="hdr-loc-l">${esc(t(profile.location))}</div>
          <div class="mono" id="hdr-clock">${clockText()}</div>
        </div>
        <div class="hdr-lang" role="group" aria-label="Language">
          <button type="button" data-lang="en" class="${state.lang === 'en' ? 'on' : ''}">EN</button>
          <button type="button" data-lang="pt" class="${state.lang === 'pt' ? 'on' : ''}">PT</button>
        </div>
      </div>
    </div>`;
  root.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', async () => {
    const { switchLang } = await import('../main.js');
    switchLang(b.dataset.lang);
  }));
  clearInterval(timer);
  timer = setInterval(() => { const el = document.getElementById('hdr-clock'); if (el) el.textContent = clockText(); }, 15000);
}
```

`css/header.css`:
```css
#site-header { position: fixed; top: 0; left: 0; right: 0; z-index: 100; height: var(--header-h); background: var(--bg); }
#site-header::after { content: ''; position: absolute; left: 0; right: 0; top: 100%; height: 24px; background: linear-gradient(var(--bg), transparent); pointer-events: none; }
.hdr { height: 100%; display: flex; align-items: center; justify-content: space-between; }
.hdr-logo { display: flex; align-items: center; gap: 10px; }
.logo-sq { position: relative; width: 24px; height: 24px; background: var(--accent); display: inline-block; }
.logo-sq::after { content: ''; position: absolute; right: -4px; bottom: -4px; width: 10px; height: 10px; background: #fff; }
.hdr-name { font: 700 16px/1 var(--font-display); color: var(--fg); }
.hdr-right { display: flex; align-items: center; gap: 24px; }
.hdr-loc { text-align: right; }
.hdr-loc-l { font: 600 13px/1.3 var(--font-text); color: var(--fg); }
.hdr-lang { display: flex; border: 1px solid var(--line); }
.hdr-lang button { font: 500 12px/1 var(--font-mono); padding: 8px 10px; color: var(--fg-3); }
.hdr-lang button + button { border-left: 1px solid var(--line); }
.hdr-lang button.on { color: var(--fg); }
@media (max-width: 640px) { .hdr-loc-l { display: none; } .hdr-right { gap: 12px; } }
```

- [ ] **Step 6: Verify in the browser**

Run: `npm run serve` in the background, then `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --user-data-dir="$(mktemp -d)" --window-size=1440,900 --screenshot=/tmp/t2.png http://localhost:8000/` and view the PNG.
Expected: black page, fixed header with orange logo square, `paulo.`, location, mono clock, EN/PT toggle. No console errors other than none (check with `--enable-logging=stderr` if needed).

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add index.html css/ js/ 
git commit -m "feat(site): black skeleton with tokens, fixed header and module boot"
```

---

### Task 3: Portrait assets and hero

**Files:**
- Create: `scripts/portrait.mjs`, `assets/hero-portrait.webp`, `assets/hero-portrait@2x.webp`, `css/hero.css`, `js/sections/hero.js`
- Delete: `assets/wall.webp`

**Interfaces:**
- Consumes: `profile` from `js/data/profile.js`, `t` from `js/i18n.js`.
- Produces: `js/sections/hero.js` exporting `id = 'hero'` and `render(root)`.

- [ ] **Step 1: Write scripts/portrait.mjs**

Uses headless Chrome through playwright-core to grayscale, crush the background and fade the source, then `cwebp` for encoding.

```js
// Builds assets/hero-portrait.webp (1000px) and @2x (2000px) from assets/hero-portrait-src.png.
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execSync } from 'node:child_process';

const SRC = 'assets/hero-portrait-src.png';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const b64 = readFileSync(SRC).toString('base64');

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.setContent('<canvas id="c"></canvas>');
const dataUrl = await page.evaluate(async (src) => {
  const img = new Image(); img.src = src; await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight;
  const c = document.getElementById('c'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, W, H); const p = d.data;
  // grayscale + contrast curve: lift the subject, push the grey studio background to black
  for (let i = 0; i < p.length; i += 4) {
    let y = 0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2];
    y = (y - 46) * 1.28; if (y < 0) y = 0; if (y > 255) y = 255;
    p[i] = p[i + 1] = p[i + 2] = y;
  }
  g.putImageData(d, 0, 0);
  // radial vignette
  const v = g.createRadialGradient(W / 2, H * 0.42, W * 0.22, W / 2, H * 0.42, W * 0.62);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,1)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  // bottom fade to transparent (destination-out) over the last 35%
  g.globalCompositeOperation = 'destination-out';
  const f = g.createLinearGradient(0, H * 0.65, 0, H);
  f.addColorStop(0, 'rgba(0,0,0,0)'); f.addColorStop(1, 'rgba(0,0,0,1)');
  g.fillStyle = f; g.fillRect(0, H * 0.65, W, H * 0.35);
  return c.toDataURL('image/png');
}, `data:image/png;base64,${b64}`);
await browser.close();

const tmp = 'assets/_hero-tmp.png';
writeFileSync(tmp, Buffer.from(dataUrl.split(',')[1], 'base64'));
execSync(`cwebp -q 82 -resize 1000 0 ${tmp} -o assets/hero-portrait.webp`, { stdio: 'inherit' });
execSync(`cwebp -q 80 -resize 2000 0 ${tmp} -o assets/hero-portrait@2x.webp`, { stdio: 'inherit' });
unlinkSync(tmp);
console.log('portrait built');
```

Run: `npm run portrait` then view `assets/hero-portrait.webp` (convert with `sips -s format png assets/hero-portrait.webp --out /tmp/hp.png` to view).
Expected: black-and-white portrait, background solid black, bottom third fading out, both files under 300KB. If the background is not fully black, raise the `46` offset in the curve to `56` and rerun.

- [ ] **Step 2: Write js/sections/hero.js**

```js
import { t } from '../i18n.js';
import { esc } from '../dom.js';
import { profile } from '../data/profile.js';

export const id = 'hero';

const copy = {
  hi: { en: 'Hi there', pt: 'Olá' },
  iam: { en: 'I am Paulo', pt: 'Sou o Paulo' },
  since: { en: 'Shipping mobile apps since', pt: 'Publicando apps mobile desde' }
};

export function render(root) {
  root.innerHTML = `
    <div class="hero-bg" aria-hidden="true"></div>
    <div class="container hero-in">
      <h1 class="hero-h">
        <span class="line"><span class="word" style="--d:.4s">${esc(t(copy.hi))}</span></span>
        <span class="line"><span class="word" style="--d:.6s">${esc(t(copy.iam))}<span class="sq"></span></span></span>
      </h1>
      <p class="hero-sub" style="--d:2s">
        <span class="hero-sub-l">${esc(t(copy.since))} <b>${profile.since}</b></span>
        <span class="hero-sub-l">${esc(t(profile.role))}</span>
      </p>
    </div>`;
}
```

- [ ] **Step 3: Write css/hero.css**

```css
#hero { position: relative; min-height: 100vh; min-height: 100svh; display: flex; align-items: flex-end; overflow: hidden; }
.hero-bg {
  position: absolute; inset: 0; z-index: 0;
  background: url('../assets/hero-portrait.webp') no-repeat top center / auto 88%;
  background-image: image-set(url('../assets/hero-portrait.webp') 1x, url('../assets/hero-portrait@2x.webp') 2x);
  opacity: 0; animation: hero-fade 1.2s var(--ease-out) forwards;
  transform: translateY(var(--header-h));
}
@keyframes hero-fade { to { opacity: 1; } }
.hero-in { position: relative; z-index: 1; width: 100%; padding-bottom: 12vh; }
.hero-h { font: 800 clamp(56px, 9vw, 120px)/0.95 var(--font-display); letter-spacing: -.03em; color: #fff; text-shadow: 0 0 40px rgba(0,0,0,.6); }
.hero-h .line { display: block; overflow: hidden; padding-bottom: .06em; }
.hero-h .word { display: inline-block; transform: translateY(110%); animation: hero-up .8s var(--ease-out) var(--d) forwards; }
@keyframes hero-up { to { transform: translateY(0); } }
.hero-sub { margin-top: 36px; display: flex; flex-direction: column; gap: 6px; font: 400 20px/1.35 var(--font-text); color: var(--fg-2); opacity: 0; animation: hero-fade .8s var(--ease-out) var(--d) forwards; }
.hero-sub b { font-weight: 500; color: var(--fg); }
.hero-sub-l:last-child { color: var(--fg); font-weight: 500; }
@media (max-width: 640px) {
  .hero-bg { background-size: 120% auto; background-position: top center; }
  .hero-h { font-size: clamp(48px, 15vw, 80px); }
  .hero-sub { font-size: 17px; }
}
@media (prefers-reduced-motion: reduce) {
  .hero-bg, .hero-sub { opacity: 1; animation: none; }
  .hero-h .word { transform: none; animation: none; }
}
```

- [ ] **Step 4: Delete the old wallpaper and verify**

Run: `git rm assets/wall.webp`
Run the headless screenshot command from Task 2 Step 6 twice: once with `--virtual-time-budget=3000` and once with `--virtual-time-budget=100` to catch the entrance state.
Expected: at 3s the portrait sits in the upper area, `Hi there / I am Paulo` with an orange square, subtitle below; at 100ms the words are hidden below their lines. Then run `npm test`.

- [ ] **Step 5: Commit**

```bash
git add scripts/portrait.mjs assets/hero-portrait.webp assets/hero-portrait@2x.webp assets/hero-portrait-src.png css/hero.css js/sections/hero.js
git commit -m "feat(hero): processed portrait with reference entrance choreography"
```

---

### Task 4: Data modules and integrity test

**Files:**
- Create: `js/data/apps.js`, `js/data/products.js`, `js/data/experience.js`, `js/data/recos.js`, `js/data/bento.js`, `test/data.test.js`, `assets/nino.webp`

**Interfaces:**
- Consumes: `L` from `js/i18n.js`.
- Produces:
  - `apps`: array of `{ key, name, short, mono, icon, domain: L, year, iconBg, cs: { problem: L, build: L, impact: L }, stores: [{ label, url }] }`. Keys: `collective`, `pluma`, `ploomes`, `agrolite`.
  - `products`: array of `{ key, name, icon, line: L, status: L, stack, url }`.
  - `experience`: array newest first of `{ key, org: L|string, logo: string|null, role: L, period: string, bullets: L[] (max 3), tags: string[] }`.
  - `recos`: array of `{ name, role, co, rel: L, quote: L }`.
  - `bento`: `{ terminal: { cmd: string, lines: L[] , done: L }, numbers: { v, l: L, org }[], stack: string[] }`.

- [ ] **Step 1: Copy the Nino icon**

Run: `cwebp -q 85 -resize 256 256 /Users/paulo/Documents/repos/personal/nino/apps/mobile/assets/images/icon-n3a.png -o assets/nino.webp`

- [ ] **Step 2: Write the failing data test**

`test/data.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apps } from '../js/data/apps.js';
import { products } from '../js/data/products.js';
import { experience } from '../js/data/experience.js';
import { recos } from '../js/data/recos.js';
import { bento } from '../js/data/bento.js';
import { existsSync } from 'node:fs';

const isL = v => v && typeof v === 'object' && typeof v.en === 'string' && typeof v.pt === 'string' && v.en.length > 0 && v.pt.length > 0;

test('apps: 4 professional apps with bilingual case studies and existing icons', () => {
  assert.deepEqual(apps.map(a => a.key), ['collective', 'pluma', 'ploomes', 'agrolite']);
  for (const a of apps) {
    assert.ok(isL(a.domain), a.key + ' domain');
    assert.ok(isL(a.cs.problem) && isL(a.cs.build) && isL(a.cs.impact), a.key + ' cs');
    assert.ok(existsSync(a.icon), a.icon);
    assert.ok(a.stores.length >= 1);
  }
});

test('products: Daily Logs and Nino with status, stack and icon', () => {
  assert.deepEqual(products.map(p => p.key), ['daily', 'nino']);
  for (const p of products) {
    assert.ok(isL(p.line) && isL(p.status), p.key);
    assert.ok(existsSync(p.icon), p.icon);
    assert.match(p.url, /^https:\/\//);
  }
});

test('experience: newest first, max 3 bullets, no Present, no employer beyond the list', () => {
  assert.equal(experience[0].key, 'collective');
  assert.equal(experience[0].period, '01/2026 · 2026');
  for (const e of experience) {
    assert.ok(e.bullets.length >= 1 && e.bullets.length <= 3, e.key + ' bullets');
    e.bullets.forEach(b => assert.ok(isL(b)));
    assert.ok(!/present|atual/i.test(e.period), e.key + ' period');
    assert.ok(isL(e.role));
  }
  const all = JSON.stringify([apps, products, experience, recos, bento]);
  assert.ok(!/feeld/i.test(all), 'employer must not be named');
});

test('recos and bento are bilingual', () => {
  assert.equal(recos.length, 3);
  recos.forEach(r => assert.ok(isL(r.quote) && isL(r.rel)));
  assert.ok(bento.terminal.lines.length >= 4);
  bento.terminal.lines.forEach(l => assert.ok(isL(l)));
  assert.ok(bento.numbers.length >= 5);
  bento.numbers.forEach(n => assert.ok(isL(n.l) && typeof n.v === 'string'));
  assert.ok(bento.stack.length >= 20);
});
```

Run: `npm test`
Expected: FAIL, modules not found.

- [ ] **Step 3: Write js/data/apps.js**

Port the four entries from `git show origin/main:index.html` lines 232 to 262 (keys `collective`, `pluma`, `ploomes`, `agrolite`), keeping every string verbatim, converting `L(...)` calls to the imported `L`, and dropping `live`, `mono` stays. Shape:

```js
import { L } from '../i18n.js';
const mk = (ios, android) => { const a = []; if (ios) a.push({ label: 'App Store', url: ios }); if (android) a.push({ label: 'Google Play', url: android }); return a; };
export const apps = [
  { key: 'collective', name: 'Collective Health', short: 'Collective', mono: 'C', icon: 'assets/collective.webp', domain: L('Health', 'Saúde'), year: '2026', iconBg: 'linear-gradient(135deg,#2dd4bf,#0ea5a3)',
    cs: { problem: L('...verbatim EN...', '...verbatim PT...'), build: L('...', '...'), impact: L('...', '...') },
    stores: mk('https://apps.apple.com/app/id1032100065', 'https://play.google.com/store/apps/details?id=com.collectivehealth.member') },
  // pluma, ploomes, agrolite: same treatment, copied verbatim from the old file
];
```

- [ ] **Step 4: Write js/data/products.js**

```js
import { L } from '../i18n.js';
export const products = [
  { key: 'daily', name: 'Daily Logs', icon: 'assets/daily.webp',
    line: L('Offline workout tracker. Free, no ads, Live Activities and widgets in Swift.', 'Treinos offline. Grátis, sem anúncios, Live Activities e widgets em Swift.'),
    status: L('LIVE · App Store + Web', 'NO AR · App Store + Web'),
    stack: 'Expo · SQLite · Drizzle · Swift',
    url: 'https://apps.apple.com/us/app/daily-logs-offline-workouts/id6757203084' },
  { key: 'nino', name: 'Nino', icon: 'assets/nino.webp',
    line: L('Digital pet companion: AI cartoon of your pet, vaccine wallet, and an AI vet.', 'Companheiro digital do pet: cartoon por IA, carteira de vacinas e um veterinário IA.'),
    status: L('BUILDING · 600+ PRs in', 'EM CONSTRUÇÃO · 600+ PRs'),
    stack: 'Expo · NestJS · Postgres · Turborepo',
    url: 'https://github.com/Pcfilho' }
];
export const manifesto = L(
  "I also build my own. Not for the side income: to feel the whole cycle. Backend, store review, analytics, support tickets at 11pm. It makes me a better engineer on someone else's product.",
  'Também construo os meus. Não pela renda extra: pra sentir o ciclo inteiro. Backend, review da loja, analytics, ticket de suporte às 23h. Isso me faz um engenheiro melhor no produto dos outros.'
);
```

- [ ] **Step 5: Write js/data/experience.js**

Source: `git show origin/main:index.html` lines 264 to 310 (`journey`). Reorder newest first, keep the first 3 `details` of each as `bullets` (verbatim), rename `tools` to `tags`, set periods as below, add `logo`.

```js
import { L } from '../i18n.js';
export const experience = [
  { key: 'collective', org: 'Collective Health', logo: 'assets/collective.webp', role: L('Senior React Native Engineer', 'Engenheiro React Native Sênior'), period: '01/2026 · 2026', bullets: [ /* first 3 details verbatim */ ], tags: ['React Native', 'TypeScript', 'Maestro', 'Fabric', 'TurboModules', 'React Compiler', 'GitHub Actions'] },
  { key: 'pluma', org: L('Fintech Freelance', 'Fintech Freelance'), logo: 'assets/pluma.webp', role: L('Fullstack Developer', 'Desenvolvedor Fullstack'), period: '03/2026 · 2026', bullets: [ /* 3 verbatim */ ], tags: ['React Native', 'Expo', 'EAS', 'Supabase', 'RevenueCat', 'Sentry'] },
  { key: 'ploomes', org: 'Ploomes', logo: 'assets/ploomes.webp', role: L('Mobile Developer', 'Desenvolvedor Mobile'), period: '05/2023 · 01/2026', bullets: [ /* 3 verbatim */ ], tags: ['React Native', 'TypeScript', 'RealmDB', 'Jest', 'Maestro', 'Bitrise', 'CodePush'] },
  { key: 'agrolite', org: 'Agrolite', logo: 'assets/agrolite.webp', role: L('Mobile Developer', 'Desenvolvedor Mobile'), period: '01/2021 · 05/2023', bullets: [ /* 3 verbatim */ ], tags: ['React Native', 'Kotlin', 'Reanimated', 'Firebase', 'AWS'] },
  { key: 'freelance', org: 'Freelance', logo: null, role: L('Fullstack Developer', 'Desenvolvedor Fullstack'), period: '06/2020 · 01/2021', bullets: [ /* 3 verbatim */ ], tags: ['React Native', 'TypeScript', 'Expo', 'Node', 'Firebase', 'CodePush'] }
];
```

- [ ] **Step 6: Write js/data/recos.js**

Port lines 331 to 341 of the old file verbatim (three entries), shape `{ name, role, co, rel: L, quote: L }` (drop `initials`).

- [ ] **Step 7: Write js/data/bento.js**

```js
import { L } from '../i18n.js';
export const bento = {
  terminal: {
    cmd: 'npx paulo@stack init',
    lines: [
      L('Loaded 6 years of React Native.', 'Carregados 6 anos de React Native.'),
      L('Shipped 4 apps to the stores.', 'Publicados 4 apps nas lojas.'),
      L('Wrote the E2E suite nobody had.', 'Escrita a suíte E2E que ninguém tinha.'),
      L('Removing imposter module.', 'Removendo módulo impostor.')
    ],
    done: L('Success! Engineer deployed.', 'Sucesso! Engenheiro publicado.')
  },
  numbers: [
    { v: '90%', l: L('fewer support tickets', 'menos tickets de suporte'), org: 'Ploomes' },
    { v: '70%', l: L('faster deploys', 'deploys mais rápidos'), org: 'Ploomes' },
    { v: '91%', l: L('fewer re-renders', 'menos re-renders'), org: 'Collective Health' },
    { v: '75 to 16 min', l: L('Android CI', 'CI do Android'), org: 'Collective Health' },
    { v: '500k+', l: L('members served', 'membros atendidos'), org: 'Collective Health' },
    { v: '22%', l: L('more app usage', 'mais uso do app'), org: 'Agrolite' }
  ],
  stack: ['React Native', 'TypeScript', 'Expo', 'EAS', 'Swift', 'Kotlin', 'Fabric', 'TurboModules', 'React Compiler', 'Reanimated', 'Zustand', 'TanStack Query', 'RealmDB', 'SQLite', 'Drizzle', 'Jest', 'Maestro', 'GitHub Actions', 'Bitrise', 'Firebase', 'Supabase', 'Sentry', 'RevenueCat', 'NestJS', 'Postgres']
};
```

- [ ] **Step 8: Run tests, then commit**

Run: `npm test`
Expected: PASS (all suites).

```bash
git add js/data/ test/data.test.js assets/nino.webp
git commit -m "feat(data): bilingual data modules for apps, products, experience, recos and bento"
```

---

### Task 5: Phone stage (transplant)

**Files:**
- Create: `js/sections/phone.js`, `css/phone.css`

**Interfaces:**
- Consumes: `apps` from `js/data/apps.js`; `profile`; `t`, `state` from `js/i18n.js`; `esc` from `js/dom.js`; `onLangChange` from `js/main.js` is not needed because `main.js` calls `render(root)` again on language change.
- Produces: `id = 'phone'`, `render(root)`, and `phoneNotify(msg)` exported for reuse (the footer push toy uses the fixed banner instead, so this is only internal). Global `window.PB` keeps the inline `onclick` handlers (`openApp`, `closeApp`, `goPage`, `enterEdit`, `exitEdit`, `tryDelete`, `poke`, `goAbout` becomes a no-op scroll to `#experience`).

- [ ] **Step 1: Transplant the phone code**

Create `js/sections/phone.js` by copying these blocks from `git show origin/main:index.html`, in order, inside the module (drop the outer IIFE, keep `var`-style code as is):

1. Lines 176 to 186 (`state`, `read`, `save` helpers): keep `page`, `openApp`, `editMode`, `appOrder`, `hinted`; drop `lang` and `theme` (language comes from `js/i18n.js`).
2. Line 342 (`PERSON_SVG`) is not needed; skip.
3. Lines 357 to 542: `orderedApps`, `statusBarView`, `page0Apps`, `page1Widgets`, `dotsView`, `dockView`, `phoneHomeView`, `phoneAppView`.
4. Lines 737 to 894: `tickClock`, `setPage`, `wirePager`, `wireAppGrid`.
5. Lines 913 to 941: `toast`, `phoneNotify`.
6. Lines 957 to 995: the `window.PB` controller minus `setEN`, `setPT`, `toggleTheme`, `toggleJourney`.

Then adapt:
- Replace every `m.L(a, b)` with `t(L(a, b))` and every `m.t.xxx` with a local `copy` object of bilingual values resolved via `t()` (`back`, `lblProblem`, `lblBuild`, `lblImpact`, `shippedApps`, `roleShort` = `profile.role`, `annot` = `L('go on, tap an app', 'vai, toca num app')`).
- `m.apps` becomes `apps`; `m.heroStats` becomes `profile.stats`; `m.exp` becomes `new Date().getFullYear() - profile.since`.
- Remove the `state.lang === 'pt'` checks in favour of `state.lang` imported from `js/i18n.js` (rename the local phone state to `ps` to avoid the clash).
- Every `render()` call inside the phone code becomes `renderPhone()` which re-renders only the phone root (kept in a module variable `rootEl`).
- `PB.goAbout` scrolls to `#experience`.
- `page1Widgets`: keep weather, coding and pets widgets, but swap CSS variables: `var(--panel2)` to `rgba(255,255,255,.08)`, `var(--border)` to `rgba(255,255,255,.14)`, `var(--panel)` to `rgba(255,255,255,.06)`, `var(--text)` to `#fff`, `var(--dim)` to `rgba(255,255,255,.6)`, `var(--accent-soft)` to `rgba(255,106,26,.18)`, `var(--shadow)` to `rgba(0,0,0,.4)`.
- `phoneAppView`: background `#0a0a0a`, text colours `var(--fg)`/`var(--fg-2)`, label style `font:500 10px/1 var(--font-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--fg-3)`, impact block `border-left:2px solid var(--accent);padding-left:12px;background:none`, store buttons `background:#fff;color:#000;border-radius:11px`.
- Dock icons: flat colours instead of gradients: email `#FF6A1A`, LinkedIn `#1f6fe0`, phone `#27a34a`, GitHub `#2a2a2a`.
- Profile card: `background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:24px` (inside the phone, iOS radius allowed).

`render(root)`:
```js
export const id = 'phone';
let rootEl = null;
const copy = {
  title: L('Tap an app', 'Toca num app'),
  sub: L('4 apps shipped to the stores · pro work', '4 apps publicados nas lojas · trabalho'),
  // ...the labels listed above
};
export function render(root) {
  rootEl = root;
  root.innerHTML = `
    <div class="container">
      <h2 class="section-title">${esc(t(copy.title))}<span class="sq"></span></h2>
      <p class="section-sub">${esc(t(copy.sub))}</p>
      <div class="phone-stage">${frameView()}</div>
    </div>`;
  afterRender();
}
function renderPhone() { const s = rootEl && rootEl.querySelector('.phone-stage'); if (s) { s.innerHTML = frameView(); afterRender(); } }
function afterRender() { tickClock(); if (!ps.openApp) { wirePager(); wireAppGrid(); } }
function frameView() {
  const screen = ps.openApp ? phoneAppView() : phoneHomeView();
  return '<div class="phone-wrap">'
    + (ps.hinted ? '' : '<button onclick="PB.openApp(\'collective\')" class="phone-annot mono">' + esc(t(copy.annot)) + ' ↓</button>')
    + '<div class="phone-device">'
    +   '<button onclick="PB.poke(event)" aria-label="Dynamic Island" class="phone-island"></button>'
    +   '<div id="pb-screen" class="phone-screen">' + screen + '</div>'
    + '</div></div>';
}
setInterval(tickClock, 15000);
```

The Konami/Escape/document click listeners from lines 943 to 955: keep only the Escape and the "tap empty space exits edit mode" listeners here; Konami moves to the footer task.

- [ ] **Step 2: Write css/phone.css**

```css
#phone { min-height: 100vh; }
.phone-stage { display: flex; justify-content: center; }
.phone-wrap { position: relative; display: flex; flex-direction: column; align-items: center; gap: 14px; }
.phone-annot { color: var(--accent); font-size: 12px; }
.phone-device { width: 360px; height: 740px; background: #0b0b0d; border-radius: 52px; padding: 11px; border: 1px solid var(--line); position: relative; }
.phone-island { position: absolute; top: 22px; left: 50%; transform: translateX(-50%); width: 118px; height: 30px; background: #0b0b0d; border-radius: 999px; z-index: 7; }
.phone-screen { width: 100%; height: 100%; border-radius: 42px; overflow: hidden; position: relative;
  background: radial-gradient(rgba(255,255,255,.08) 1px, transparent 1px) 0 0 / 24px 24px, radial-gradient(circle at 30% 20%, #1a1a1a, #000 70%); }
.phone-screen, .phone-screen * { font-family: var(--font-text); }
.pb-app { transition: transform .18s ease; touch-action: manipulation; }
.pb-app:hover { transform: translateY(-4px) scale(1.05); }
.pb-dock { transition: transform .18s ease; touch-action: manipulation; }
.pb-dock:hover { transform: translateY(-4px) scale(1.06); }
.pb-appicon, .pb-dock { -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
.pb-appicon img { pointer-events: none; }
.pb-dot { transition: width .3s ease, opacity .3s ease; }
@keyframes pb-fade { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
@keyframes pb-spin { to { transform: rotate(360deg); } }
@keyframes pb-eq { 0%, 100% { transform: scaleY(.28); } 50% { transform: scaleY(1); } }
@keyframes pb-tapring { 0% { transform: scale(.5); opacity: 0; } 18% { opacity: .9; } 100% { transform: scale(1.75); opacity: 0; } }
@keyframes pb-poke-dl { 0%, 52%, 100% { transform: translate(0,0) scale(1); } 60% { transform: translate(4px,-5px) scale(.84); } 70% { transform: translate(0,0) scale(1); } }
.pb-taphint { position: absolute; inset: 0; pointer-events: none; z-index: 5; }
.pb-taphint .ring { position: absolute; inset: -5px; border-radius: 19px; border: 2.5px solid #fff; animation: pb-tapring 1.7s ease-out infinite; }
.pb-taphint .poke { position: absolute; }
.pb-taphint .pk { display: inline-block; animation-duration: 1.7s; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
.pb-taphint .pk-emoji { display: block; font-size: 30px; line-height: 1; }
@keyframes pb-jigA { 0%, 100% { transform: rotate(-1.6deg); } 50% { transform: rotate(1.7deg); } }
@keyframes pb-jigB { 0%, 100% { transform: rotate(1.5deg); } 50% { transform: rotate(-1.8deg); } }
.pb-jig { animation: pb-jigA .3s ease-in-out infinite; }
.pb-appicon:nth-child(2n) .pb-jig { animation-name: pb-jigB; animation-duration: .34s; }
.pb-appicon:nth-child(3n) .pb-jig { animation-duration: .27s; }
.pb-appicon { transition: transform .2s cubic-bezier(.2,.8,.2,1); }
@keyframes pb-deny { 0%, 100% { transform: translateX(0); } 15% { transform: translateX(-5px); } 30% { transform: translateX(5px); } 45% { transform: translateX(-4px); } 60% { transform: translateX(4px); } 75% { transform: translateX(-2px); } }
.pb-deny { animation: pb-deny .42s ease; }
/* under 640px the device disappears and the screen becomes a native block */
@media (max-width: 640px) {
  #phone { min-height: 0; }
  .phone-device { width: 100%; height: auto; min-height: 720px; padding: 0; border-radius: 0; border: 1px solid var(--line); background: #000; }
  .phone-island { display: none; }
  .phone-screen { border-radius: 0; min-height: 720px; }
}
```

The `#pb-screen` inner views use `position:absolute; inset:0`, so under 640px `.phone-screen` needs an explicit height; `min-height: 720px` covers it.

- [ ] **Step 3: Verify interactively**

Run `npm run serve` and open http://localhost:8000/ in the Maestri browser portal (or headless screenshots at 1440 and 390). Check: clock ticks; tap Collective opens the case study; Back returns; swipe to page 2 shows widgets; long-press an icon enters jiggle mode, drag reorders, the `−` button shows the deny push; Escape exits; Dynamic Island shows the pill; EN/PT toggle re-renders the phone with the app still open. Under 390px the frame is gone and the grid is full width.

- [ ] **Step 4: Commit**

```bash
git add js/sections/phone.js css/phone.css
git commit -m "feat(phone): transplant the interactive iPhone onto the dark stage"
```

---

### Task 6: My products

**Files:**
- Create: `js/sections/products.js`, `css/products.css`

**Interfaces:**
- Consumes: `products`, `manifesto` from `js/data/products.js`; `t`; `esc`, `arrowSvg`, `EXT`.
- Produces: `id = 'products'`, `render(root)`.

- [ ] **Step 1: Write js/sections/products.js**

```js
import { t, L } from '../i18n.js';
import { esc, arrowSvg, EXT } from '../dom.js';
import { products, manifesto } from '../data/products.js';

export const id = 'products';
const title = L('My products', 'Meus produtos');

export function render(root) {
  const cards = products.map(p => `
    <a class="card prod" href="${p.url}" ${EXT}>
      <img class="prod-icon" src="${p.icon}" alt="${esc(p.name)} icon" width="96" height="96">
      <div class="prod-body">
        <h3 class="prod-name">${esc(p.name)}</h3>
        <p class="prod-line">${esc(t(p.line))}</p>
        <div class="mono prod-status">${esc(t(p.status))}</div>
        <div class="mono">${esc(p.stack)}</div>
      </div>
      ${arrowSvg}
    </a>`).join('');
  root.innerHTML = `
    <div class="container">
      <h2 class="section-title">${esc(t(title))}<span class="sq"></span></h2>
      <p class="manifesto">${esc(t(manifesto))}</p>
      <div class="prod-grid">${cards}</div>
    </div>`;
}
```

- [ ] **Step 2: Write css/products.css**

```css
.manifesto { max-width: 640px; font: 400 20px/1.45 var(--font-text); color: var(--fg); margin-bottom: 40px; }
.prod-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
.prod { position: relative; display: flex; gap: 24px; padding: 24px; min-height: 220px; }
.prod-icon { width: 96px; height: 96px; border-radius: 22px; flex: none; }
.prod-body { display: flex; flex-direction: column; gap: 8px; padding-right: 32px; }
.prod-name { font: 700 22px/1.2 var(--font-display); color: var(--fg); }
.prod-line { color: var(--fg-2); }
.prod-status { color: var(--accent); }
.prod .arrow { position: absolute; top: 24px; right: 24px; }
@media (max-width: 640px) { .prod-grid { grid-template-columns: 1fr; } .prod { flex-direction: column; } }
```

- [ ] **Step 3: Verify and commit**

Headless screenshot at 1440 scrolled to `#products` (use `--window-size=1440,3200` full page) and check two cards with icons, orange status line, arrows. `npm test` passes.

```bash
git add js/sections/products.js css/products.css
git commit -m "feat(products): my products section with founder manifesto"
```

---

### Task 7: Bento grid with terminal, numbers, thinker, location, stack

**Files:**
- Create: `js/sections/bento.js`, `js/slots/terminal.js`, `js/slots/numbers.js`, `css/bento.css`, `test/bento.test.js`

**Interfaces:**
- Consumes: `bento` from `js/data/bento.js`; `t`, `L`, `state`; `esc`.
- Produces: `id = 'bento'`, `render(root)`. `js/slots/terminal.js` exports `terminalScript(data, lang)` returning `string[]` (pure: the lines to type, in order) and `mountTerminal(el, lines)` (types them). `js/slots/numbers.js` exports `numbersRows(data, lang)` returning `string[]` (pure) and `mountNumbers(el, rows)` (auto-scroll). The dog slot host is `<div id="slot-dog" class="slot-dog-host"></div>`; Task 8 mounts into it.

- [ ] **Step 1: Write the failing slot tests**

`test/bento.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { terminalScript } from '../js/slots/terminal.js';
import { numbersRows } from '../js/slots/numbers.js';
import { bento } from '../js/data/bento.js';

test('terminalScript: prompt line, check lines, done line, in the chosen language', () => {
  const en = terminalScript(bento.terminal, 'en');
  assert.equal(en[0], '> npx paulo@stack init');
  assert.equal(en.length, 2 + bento.terminal.lines.length);
  assert.ok(en[1].startsWith('✓ '));
  assert.equal(en.at(-1), 'Success! Engineer deployed.');
  const pt = terminalScript(bento.terminal, 'pt');
  assert.equal(pt.at(-1), 'Sucesso! Engenheiro publicado.');
});

test('numbersRows: "value  label · org" per entry', () => {
  const rows = numbersRows(bento.numbers, 'en');
  assert.equal(rows.length, bento.numbers.length);
  assert.equal(rows[0], '90%  fewer support tickets · Ploomes');
});
```

Run: `npm test`
Expected: FAIL, modules not found.

- [ ] **Step 2: Write js/slots/terminal.js**

```js
export function terminalScript(data, lang) {
  const pick = v => (typeof v === 'string' ? v : (v[lang] ?? v.en));
  return ['> ' + data.cmd, ...data.lines.map(l => '✓ ' + pick(l)), pick(data.done)];
}

// Types the lines into el once it is on screen. 30ms per char, 350ms between lines.
export function mountTerminal(el, lines) {
  const out = el.querySelector('.term-out');
  const cursor = el.querySelector('.term-cursor');
  if (!out) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let started = false;
  const run = async () => {
    if (started) return; started = true;
    if (reduced) { out.textContent = lines.join('\n'); return; }
    for (const line of lines) {
      const row = document.createElement('div');
      out.appendChild(row);
      for (const ch of line) { row.textContent += ch; await wait(30); }
      await wait(350);
    }
    cursor && cursor.classList.add('idle');
  };
  if (!('IntersectionObserver' in window)) { run(); return; }
  const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); run(); } }, { threshold: 0.4 });
  io.observe(el);
}
const wait = ms => new Promise(r => setTimeout(r, ms));
```

- [ ] **Step 3: Write js/slots/numbers.js**

```js
export function numbersRows(data, lang) {
  const pick = v => (typeof v === 'string' ? v : (v[lang] ?? v.en));
  return data.map(n => `${n.v}  ${pick(n.l)} · ${n.org}`);
}

// Vertical auto-scroll of the rows (duplicated for a seamless loop). Slows to 1/4 speed on hover.
export function mountNumbers(el, rows) {
  const track = el.querySelector('.num-track');
  if (!track) return;
  track.innerHTML = rows.concat(rows).map(r => `<div class="num-row">${r.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>`).join('');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let y = 0, speed = 18, target = 18, last = 0, half = 0;
  el.addEventListener('mouseenter', () => { target = 4.5; });
  el.addEventListener('mouseleave', () => { target = 18; });
  const step = ts => {
    if (!last) last = ts;
    const dt = (ts - last) / 1000; last = ts;
    speed += (target - speed) * Math.min(1, dt * 6);
    half = half || track.scrollHeight / 2;
    y = (y + speed * dt) % (half || 1);
    track.style.transform = `translateY(${-y}px)`;
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Write js/sections/bento.js**

```js
import { t, L, state } from '../i18n.js';
import { esc } from '../dom.js';
import { bento } from '../data/bento.js';
import { terminalScript, mountTerminal } from '../slots/terminal.js';
import { numbersRows, mountNumbers } from '../slots/numbers.js';

export const id = 'bento';
const c = {
  title: L('Fragments of me', 'Fragmentos de mim'),
  termH: L('I ship, then I test. Then I ship again.', 'Eu publico, testo, publico de novo.'),
  dogH: L('Bull plays fetch', 'O Bull busca a bolinha'),
  dogC: L('Throw the ball. He never misses.', 'Joga a bola. Ele nunca erra.'),
  numH: L('Numbers I stand behind', 'Números que eu assino'),
  locH: L('Remote from the coast', 'Remoto, do litoral'),
  stackH: L('Stack', 'Stack'),
  stackC: L('What I reach for.', 'O que eu uso.')
};

export function render(root) {
  const chips = bento.stack.map(s => `<span class="chip mono">${esc(s)}</span>`).join('');
  root.innerHTML = `
    <div class="container">
      <h2 class="section-title">${esc(t(c.title))}<span class="sq"></span></h2>
      <div class="bento">
        <div class="slot slot-terminal" id="slot-terminal">
          <div class="term dots"><div class="term-bar"><i></i><i></i><i></i></div><pre class="term-out mono"></pre><span class="term-cursor"></span></div>
          <h3 class="slot-h">${esc(t(c.termH))}</h3>
        </div>
        <div class="slot slot-dog">
          <div id="slot-dog" class="slot-dog-host"></div>
          <h3 class="slot-h">${esc(t(c.dogH))}</h3><p class="slot-c">${esc(t(c.dogC))}</p>
        </div>
        <div class="slot slot-numbers" id="slot-numbers">
          <div class="num-view"><div class="num-track mono"></div></div>
          <h3 class="slot-h">${esc(t(c.numH))}</h3>
        </div>
        <div class="slot slot-thinker"><div class="thinker"><span>thinker.</span><span>builder.</span><span>shipper.</span></div></div>
        <div class="slot slot-location">
          <div class="loc dots"><span class="loc-pin"></span><span class="mono loc-lbl">Fortaleza · 3.7°S 38.5°W · GMT-3</span></div>
          <h3 class="slot-h">${esc(t(c.locH))}</h3>
        </div>
        <div class="slot slot-stack"><div class="chips">${chips}</div><h3 class="slot-h">${esc(t(c.stackH))}</h3><p class="slot-c">${esc(t(c.stackC))}</p></div>
      </div>
    </div>`;
  mountTerminal(root.querySelector('#slot-terminal'), terminalScript(bento.terminal, state.lang));
  mountNumbers(root.querySelector('#slot-numbers'), numbersRows(bento.numbers, state.lang));
  if (window.DogGame && window.DogGame.mount) window.DogGame.mount(root.querySelector('#slot-dog'), state.lang);
}
```

- [ ] **Step 6: Write css/bento.css**

```css
.bento { display: grid; grid-template-columns: repeat(3, 1fr); grid-auto-rows: 200px; gap: 24px; }
.slot { border: 1px solid var(--line); padding: 24px; display: flex; flex-direction: column; gap: 12px; min-width: 0; overflow: hidden; }
.slot-h { font: 600 18px/1.3 var(--font-text); color: var(--fg); margin-top: auto; }
.slot-c { font-size: 15px; color: var(--fg-2); }
.slot-terminal { grid-column: 1; grid-row: 1 / span 2; }
.slot-dog { grid-column: 2 / span 2; grid-row: 1 / span 2; }
.slot-numbers { grid-column: 1; grid-row: 3; }
.slot-thinker { grid-column: 2; grid-row: 3; }
.slot-location { grid-column: 3; grid-row: 3; }
.slot-stack { grid-column: 1 / span 3; grid-row: 4; grid-auto-rows: auto; }
.term { flex: 1; position: relative; border: 1px solid var(--line); padding: 12px; min-height: 0; }
.term-bar { display: flex; gap: 6px; margin-bottom: 12px; }
.term-bar i { width: 8px; height: 8px; background: var(--fg-3); display: block; }
.term-out { margin: 0; white-space: pre-wrap; color: var(--fg-2); font-size: 12px; line-height: 1.6; }
.term-out div:first-child { color: var(--fg); }
.term-cursor { display: inline-block; width: 7px; height: 14px; background: var(--fg); animation: blink 1s steps(2) infinite; margin-left: 2px; }
.term-cursor.idle { animation-duration: 1.6s; }
@keyframes blink { to { opacity: 0; } }
.slot-dog-host { flex: 1; min-height: 0; position: relative; }
.num-view { flex: 1; overflow: hidden; -webkit-mask-image: linear-gradient(transparent, #000 15%, #000 85%, transparent); mask-image: linear-gradient(transparent, #000 15%, #000 85%, transparent); }
.num-track { will-change: transform; }
.num-row { padding: 6px 0; border-bottom: 1px solid var(--line); color: var(--fg-2); white-space: nowrap; }
.thinker { margin: auto; display: flex; flex-direction: column; align-items: center; font: 600 28px/1.25 var(--font-display); }
.thinker span:nth-child(1) { color: var(--fg-3); } .thinker span:nth-child(2) { color: var(--fg-2); } .thinker span:nth-child(3) { color: var(--fg); }
.loc { flex: 1; position: relative; border: 1px solid var(--line); }
.loc-pin { position: absolute; left: 62%; top: 48%; width: 8px; height: 8px; background: var(--accent); transform: translate(-50%, -50%); }
.loc-lbl { position: absolute; left: 12px; bottom: 10px; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { border: 1px solid var(--line); padding: 6px 10px; color: var(--fg-2); }
@media (max-width: 1024px) {
  .bento { grid-template-columns: repeat(2, 1fr); grid-auto-rows: 220px; }
  .slot-terminal { grid-column: 1; grid-row: 1 / span 2; }
  .slot-dog { grid-column: 2; grid-row: 1 / span 2; }
  .slot-numbers { grid-column: 1; grid-row: 3; } .slot-thinker { grid-column: 2; grid-row: 3; }
  .slot-location { grid-column: 1; grid-row: 4; } .slot-stack { grid-column: 1 / span 2; grid-row: 5; }
}
@media (max-width: 640px) {
  .bento { grid-template-columns: 1fr; grid-auto-rows: auto; }
  .slot { grid-column: 1 !important; grid-row: auto !important; min-height: 240px; }
  .slot-dog { min-height: 300px; }
}
```

- [ ] **Step 7: Verify and commit**

Screenshot at 1440 and 390. Expected: 3-column bento, terminal typing on scroll, numbers scrolling, thinker text, location panel with orange pin, chips row. The dog slot is an empty bordered box until Task 8.

```bash
git add js/sections/bento.js js/slots/ css/bento.css test/bento.test.js
git commit -m "feat(bento): fragments grid with terminal, numbers, thinker, location and stack slots"
```

---

### Task 8: Dog game as a bento slot

**Files:**
- Modify: `dog-game.js` (function `mount`, `updateCaption`, `THEME`, `PHONE`, `resize`, the `window.DogGame` export and the `DOMContentLoaded` hook)

**Interfaces:**
- Consumes: `#slot-dog` host from Task 7 (`.slot-dog-host`, flex child with `position: relative`).
- Produces: `window.DogGame.mount(hostEl, lang)` (idempotent: a second call with the same host only updates the language), `window.DogGame.setLang(lang)`. `setTheme` is removed.

- [ ] **Step 1: Rework mount**

In `dog-game.js`:
- Replace the auto-mount at the bottom (`if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();`) with nothing; mounting is explicit.
- Change `mount()` to `mount(hostEl, initialLang)`: `host = hostEl; lang = initialLang || 'en';` and return early if `canvas` already exists (idempotent). Remove `headEl`, `subEl` and `phoneEl` creation and the section header. Append the `canvas` directly to `host` with `canvas.style.cssText = 'display:block;touch-action:pan-y;position:absolute;inset:0;'`. Keep the pointer listeners, `ResizeObserver`, `IntersectionObserver`, `loadSprites()` and `start()`.
- `resize()`: use the host box instead of the phone maths: `W = Math.max(200, Math.round(host.clientWidth)); H = Math.max(120, Math.round(host.clientHeight));` then the existing canvas sizing lines and `env = computeEnv(); onResize();`.
- `updateCaption()`: keep only `caption` if it still exists; simplest is to delete the caption element creation and make `updateCaption` a no-op that only sets `lang`.
- `THEME`: keep only the dark entry (sky/sand colours are painted by the sprites, so the theme only affected text; delete `setTheme`).
- Export: `window.DogGame = { mount: mount, setLang: function (l) { lang = l; } };` keep `_debugThrow`.

- [ ] **Step 2: Verify**

Run: `npm test` (core tests still pass; `dog-game.js` has no tests). Serve and screenshot the bento at 1440: the dog slot shows the beach scene filling the slot above the heading. In the Maestri portal (or headless CDP), drag from the ball and release: the dog fetches. Resize the window: the canvas follows the slot.

- [ ] **Step 3: Commit**

```bash
git add dog-game.js
git commit -m "feat(bento): mount the beach fetch game into the dog slot"
```

---

### Task 9: Experience timeline

**Files:**
- Create: `js/sections/experience.js`, `css/experience.css`

**Interfaces:**
- Consumes: `experience` from `js/data/experience.js`; `t`, `L`; `esc`.
- Produces: `id = 'experience'`, `render(root)`.

- [ ] **Step 1: Write js/sections/experience.js**

```js
import { t, L } from '../i18n.js';
import { esc } from '../dom.js';
import { experience } from '../data/experience.js';

export const id = 'experience';
const title = L('Experience', 'Experiência');

function logo(e) {
  if (e.logo) return `<img class="xp-logo" src="${e.logo}" alt="${esc(t(e.org))} logo" width="48" height="48">`;
  return `<span class="xp-logo xp-logo-mono">${esc(String(t(e.org)).slice(0, 1))}</span>`;
}

export function render(root) {
  const rows = experience.map((e, i) => `
    <div class="xp-row ${i % 2 ? 'r' : 'l'}">
      <div class="xp-meta">
        ${logo(e)}
        <div><div class="xp-org">${esc(t(e.org))}</div><div class="mono">${esc(e.period)}</div></div>
      </div>
      <div class="card xp-card">
        <h3 class="xp-role">${esc(t(e.role))}</h3>
        <ul class="xp-list">${e.bullets.map(b => `<li>${esc(t(b))}</li>`).join('')}</ul>
        <div class="xp-tags">${e.tags.map(x => `<span class="chip mono">${esc(x)}</span>`).join('')}</div>
      </div>
    </div>`).join('');
  root.innerHTML = `
    <div class="container">
      <h2 class="section-title">${esc(t(title))}<span class="sq"></span></h2>
      <div class="xp">${rows}</div>
    </div>`;
}
```

- [ ] **Step 2: Write css/experience.css**

```css
.xp { position: relative; display: flex; flex-direction: column; gap: 48px; }
.xp::before { content: ''; position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: var(--line); }
.xp-row { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: start; }
.xp-row.l .xp-card { grid-column: 1; grid-row: 1; }
.xp-row.l .xp-meta { grid-column: 2; grid-row: 1; justify-content: flex-start; }
.xp-row.r .xp-card { grid-column: 2; grid-row: 1; }
.xp-row.r .xp-meta { grid-column: 1; grid-row: 1; justify-content: flex-end; text-align: right; flex-direction: row-reverse; }
.xp-meta { display: flex; align-items: center; gap: 16px; position: relative; padding-top: 24px; }
.xp-row.l .xp-meta { margin-left: -24px; }
.xp-row.r .xp-meta { margin-right: -24px; }
.xp-logo { width: 48px; height: 48px; border: 1px solid var(--line); background: #000; object-fit: cover; flex: none; }
.xp-logo-mono { display: flex; align-items: center; justify-content: center; font: 700 18px/1 var(--font-display); color: var(--fg); }
.xp-org { font: 600 16px/1.3 var(--font-text); color: var(--fg); }
.xp-card { padding: 24px; }
.xp-role { font: 600 18px/1.3 var(--font-text); color: var(--fg); margin-bottom: 16px; }
.xp-list { list-style: none; margin: 0 0 16px; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.xp-list li { position: relative; padding-left: 18px; font-size: 15px; color: var(--fg-2); }
.xp-list li::before { content: ''; position: absolute; left: 0; top: .55em; width: 5px; height: 5px; background: var(--fg-3); }
.xp-tags { display: flex; flex-wrap: wrap; gap: 8px; }
@media (max-width: 1024px) {
  .xp::before { display: none; }
  .xp { gap: 32px; }
  .xp-row { grid-template-columns: 1fr; gap: 12px; }
  .xp-row .xp-meta, .xp-row .xp-card { grid-column: 1; }
  .xp-row .xp-meta { grid-row: 1; padding-top: 0; margin: 0; justify-content: flex-start; text-align: left; flex-direction: row; }
  .xp-row .xp-card { grid-row: 2; }
}
```

- [ ] **Step 3: Verify and commit**

Screenshot at 1440 and 900 widths. Expected: rail centred, cards alternating, logos on the rail side, `01/2026 · 2026` on the first entry; under 1024 a single column.

```bash
git add js/sections/experience.js css/experience.css
git commit -m "feat(experience): rail timeline with open cards and mono tags"
```

---

### Task 10: What colleagues say

**Files:**
- Create: `js/sections/colleagues.js`, `css/colleagues.css`

**Interfaces:**
- Consumes: `recos` from `js/data/recos.js`; `profile.recommendations`; `t`, `L`; `esc`, `arrowSvg`, `EXT`.
- Produces: `id = 'colleagues'`, `render(root)`.

- [ ] **Step 1: Write js/sections/colleagues.js**

```js
import { t, L } from '../i18n.js';
import { esc, arrowSvg, EXT } from '../dom.js';
import { recos } from '../data/recos.js';
import { profile } from '../data/profile.js';

export const id = 'colleagues';
const title = L('What colleagues say', 'O que dizem sobre mim');

export function render(root) {
  const rows = recos.map(r => `
    <div class="reco">
      <p class="reco-q">“${esc(t(r.quote))}”</p>
      <div class="reco-meta">
        <span class="mono">${esc(r.name)} · ${esc(r.role)} · ${esc(r.co)} · ${esc(t(r.rel))}</span>
        <a class="mono reco-link" href="${profile.recommendations}" ${EXT}>LinkedIn ${arrowSvg}</a>
      </div>
    </div>`).join('');
  root.innerHTML = `<div class="container"><h2 class="section-title">${esc(t(title))}<span class="sq"></span></h2><div class="recos">${rows}</div></div>`;
}
```

- [ ] **Step 2: Write css/colleagues.css**

```css
.recos { display: flex; flex-direction: column; }
.reco { padding: 32px 0; border-top: 1px solid var(--hair); }
.reco:last-child { border-bottom: 1px solid var(--hair); }
.reco-q { font: 400 18px/1.5 var(--font-text); color: var(--fg); max-width: 880px; margin-bottom: 16px; }
.reco-meta { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.reco-link { display: inline-flex; align-items: center; gap: 4px; color: var(--fg-2); }
.reco-link .arrow { width: 14px; height: 14px; }
```

- [ ] **Step 3: Verify and commit**

Screenshot shows three quotes separated by hairlines with mono attribution and a LinkedIn arrow link.

```bash
git add js/sections/colleagues.js css/colleagues.css
git commit -m "feat(colleagues): recommendations as a hairline list"
```

---

### Task 11: Footer with links, visitor count, push toy, Konami

**Files:**
- Create: `js/sections/footer.js`, `css/footer.css`

**Interfaces:**
- Consumes: `profile`; `t`, `L`, `state`; `esc`, `arrowSvg`, `EXT`.
- Produces: `id = 'site-footer'`, `render(root)`. Internal: `showPush(msg)`, `toast(msg)`, `confetti()`.

- [ ] **Step 1: Write js/sections/footer.js**

```js
import { t, L, state } from '../i18n.js';
import { esc, EXT } from '../dom.js';
import { profile } from '../data/profile.js';

export const id = 'site-footer';
const c = {
  tag: L('Mobile apps, backend and this site, all by me.', 'Apps mobile, backend e este site, tudo por mim.'),
  visitor: L('You were visitor number', 'Você foi o visitante número'),
  pushH: L('Send yourself a push', 'Manda um push pra você'),
  placeholder: L('Hire Paulo?', 'Contratar o Paulo?'),
  send: L('Send', 'Enviar'),
  now: L('now', 'agora'),
  secret: L('🎉 You found the secret!', '🎉 Você achou o segredo!')
};

export function render(root) {
  root.innerHTML = `
    <div class="container ftr">
      <div class="ftr-l">
        <div class="hdr-logo"><span class="logo-sq"></span><span class="ftr-site">${esc(profile.siteName)}</span></div>
        <p class="ftr-tag">${esc(t(c.tag))}</p>
        <div class="ftr-links mono">
          <a href="mailto:${profile.email}">email</a><span>·</span>
          <a href="${profile.linkedin}" ${EXT}>linkedin</a><span>·</span>
          <a href="${profile.github}" ${EXT}>github</a><span>·</span>
          <a href="${profile.cv}" ${EXT}>cv.pdf</a>
        </div>
        <div class="mono ftr-count" id="ftr-count" hidden>${esc(t(c.visitor))} <b></b></div>
      </div>
      <form class="ftr-r" id="push-form">
        <h3 class="slot-h">${esc(t(c.pushH))}</h3>
        <div class="push-row">
          <input class="mono push-in" id="push-in" maxlength="60" placeholder="${esc(t(c.placeholder))}" aria-label="${esc(t(c.pushH))}">
          <button class="push-btn" type="submit">${esc(t(c.send))}</button>
        </div>
      </form>
    </div>`;
  root.querySelector('#push-form').addEventListener('submit', e => {
    e.preventDefault();
    const inp = root.querySelector('#push-in');
    showPush(inp.value.trim() || t(c.placeholder));
    inp.value = '';
  });
  loadCount(root.querySelector('#ftr-count'));
  wireKonami();
}

async function loadCount(el) {
  try {
    const r = await fetch('https://pcfilho.goatcounter.com/counter/TOTAL.json');
    if (!r.ok) return;
    const j = await r.json();
    if (j && j.count) { el.querySelector('b').textContent = String(j.count).replace(/\s/g, ''); el.hidden = false; }
  } catch (_) { /* counter stays hidden */ }
}

export function showPush(msg) {
  document.querySelector('.push-banner')?.remove();
  const el = document.createElement('div');
  el.className = 'push-banner';
  el.innerHTML = `<img src="${profile.avatar}" alt="" width="38" height="38"><div><div class="push-t"><b>${esc(profile.name)}</b><span class="mono">${esc(t(c.now))}</span></div><div class="push-m">${esc(msg)}</div></div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
  setTimeout(() => { el.classList.remove('in'); setTimeout(() => el.remove(), 500); }, 3000);
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast mono'; el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
  setTimeout(() => { el.classList.remove('in'); setTimeout(() => el.remove(), 300); }, 2700);
}

function confetti() {
  const colors = ['#FF6A1A', '#ffffff', '#666666'];
  for (let i = 0; i < 110; i++) {
    const d = document.createElement('div');
    const sz = 6 + Math.random() * 8;
    d.style.cssText = `position:fixed;top:-24px;left:${Math.random() * 100}vw;width:${sz}px;height:${sz * .5}px;background:${colors[i % 3]};z-index:99999;pointer-events:none;`;
    document.body.appendChild(d);
    const dur = 2200 + Math.random() * 1900;
    d.animate([{ transform: 'translateY(0) rotate(0)', opacity: 1 }, { transform: `translateY(${innerHeight + 80}px) rotate(${360 + Math.random() * 720}deg)`, opacity: .9 }], { duration: dur, easing: 'cubic-bezier(.2,.6,.4,1)' });
    setTimeout(() => d.remove(), dur);
  }
}

let konamiWired = false;
function wireKonami() {
  if (konamiWired) return; konamiWired = true;
  const SEQ = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
  let pos = 0;
  window.addEventListener('keydown', e => {
    const k = (e.key || '').toLowerCase();
    if (k === SEQ[pos]) { pos++; if (pos === SEQ.length) { pos = 0; confetti(); toast(t(c.secret)); } }
    else pos = k === SEQ[0] ? 1 : 0;
  });
}
```

- [ ] **Step 2: Write css/footer.css**

```css
#site-footer { border-top: 1px solid var(--line); padding: 80px 0 96px; }
.ftr { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }
.ftr-l { display: flex; flex-direction: column; gap: 14px; }
.ftr-site { font: 700 18px/1 var(--font-display); color: var(--fg); }
.ftr-tag { color: var(--fg-2); }
.ftr-links { display: flex; gap: 10px; color: var(--fg-2); }
.ftr-links a { color: var(--fg); border-bottom: 1.5px solid rgba(117,122,138,.4); }
.ftr-links a:hover { border-color: var(--fg); }
.ftr-count b { color: var(--fg); font-weight: 500; }
.ftr-r { display: flex; flex-direction: column; gap: 14px; }
.ftr-r .slot-h { margin-top: 0; }
.push-row { display: flex; gap: 8px; }
.push-in { flex: 1; background: #000; border: 1px solid var(--line); color: var(--fg); padding: 12px 14px; outline: none; }
.push-in:focus { border-color: var(--fg-3); }
.push-btn { background: var(--accent); color: #000; font: 600 14px/1 var(--font-text); padding: 0 18px; }
.push-banner { position: fixed; top: 12px; left: 50%; transform: translate(-50%, -140%); width: min(380px, calc(100vw - 24px)); z-index: 9999;
  display: flex; gap: 10px; align-items: center; padding: 11px 12px; background: rgba(31,31,31,.85); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,.14); border-radius: 20px; transition: transform .5s cubic-bezier(.2,.9,.3,1.2); }
.push-banner.in { transform: translate(-50%, 0); }
.push-banner img { width: 38px; height: 38px; border-radius: 10px; object-fit: cover; }
.push-t { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font-size: 12px; color: #fff; }
.push-m { font-size: 12.5px; line-height: 1.35; color: rgba(255,255,255,.9); }
.toast { position: fixed; top: 60px; left: 50%; transform: translateX(-50%); z-index: 9999; background: #fff; color: #000; padding: 10px 18px; opacity: 0; transition: opacity .25s ease, top .25s ease; }
.toast.in { opacity: 1; top: 72px; }
@media (max-width: 640px) { .ftr { grid-template-columns: 1fr; } }
```

The push banner is an iOS notification rendered over the site, so its 20px radius is allowed as a simulated device element.

- [ ] **Step 3: Verify and commit**

Serve, submit the push form: the banner slides in from the top and leaves after 3s. Type the Konami sequence: confetti and toast. `npm test` passes.

```bash
git add js/sections/footer.js css/footer.css
git commit -m "feat(footer): links, visitor count, push toy and Konami"
```

---

### Task 12: Screenshot script, hard-fail imports, docs, cleanup

**Files:**
- Create: `scripts/shoot.mjs`
- Modify: `js/main.js` (remove the `.catch(() => null)`), `README.md`, `CLAUDE.md`
- Delete: `docs/superpowers/plans/2026-06-25-dog-beach-fetch-game.md` stays (history); nothing else deleted. Confirm `assets/wall.webp` is gone and `assets/beach/` is still used.

- [ ] **Step 1: Write scripts/shoot.mjs**

```js
// Serves the site on :8123 and captures desktop/mobile fold + full-page screenshots into shots/.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
mkdirSync('shots', { recursive: true });
const server = spawn('python3', ['-m', 'http.server', '8123'], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 800));
try {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  for (const [name, w, h] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
    const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
    await page.goto('http://localhost:8123/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `shots/${name}-fold.png` });
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += h * 0.8) { await page.evaluate(v => scrollTo(0, v), y); await page.waitForTimeout(250); }
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(500);
    await page.screenshot({ path: `shots/${name}-full.png`, fullPage: true });
    console.log(name, 'done, height', total);
  }
  await browser.close();
} finally { server.kill(); }
```

Run: `npm run shoot` and view all four PNGs. Fix any layout defect found (overflow, overlapping rail, unreadable text) in the owning CSS file before continuing.

- [ ] **Step 2: Make missing modules fail loudly**

In `js/main.js` replace `].map(p => p.catch(() => null)));` with `]);` and `mods.filter(Boolean).forEach(register);` with `mods.forEach(register);`.

- [ ] **Step 3: Rewrite CLAUDE.md**

Replace the Architecture, Conventions, Run and Deploy sections to describe: file layout (the tree at the top of this plan), `L(en, pt)`/`t()` copy rule, tokens-only styling, `border-radius: 0` outside the phone, no employer named, no em-dash, `npm test`, `npm run serve`, `npm run shoot`, `npm run portrait`, GitHub Pages deploy unchanged, `main` protected. Keep the file under 120 lines.

- [ ] **Step 4: Rewrite README.md**

Sections: what it is (one paragraph), features (hero choreography, interactive iPhone, my products, bento with fetch game and terminal, experience rail, push toy, Konami, EN/PT), run (`npm run serve`), verify (`npm test`, `npm run shoot`), deploy (GitHub Pages from `main`), files (the tree).

- [ ] **Step 5: Full check and commit**

Run: `npm test` (all pass) and `npm run shoot` (four screenshots, no console errors: add `page.on('console', m => m.type() === 'error' && console.error(m.text()))` temporarily if unsure).

```bash
git add scripts/shoot.mjs js/main.js README.md CLAUDE.md
git commit -m "chore: screenshot script, strict module boot and refreshed docs"
```

- [ ] **Step 6: Open the PR**

```bash
git push -u origin redesign-brutalist
gh pr create --title "Brutalist redesign: black canvas, portrait hero, phone stage, products, bento" --body-file /dev/stdin <<'EOF'
## Summary
Full rewrite of the portfolio following the design spec in docs/superpowers/specs/2026-09-06-brutalist-redesign-design.md.

- Black brutalist system (Inter Tight / Inter / JetBrains Mono, orange accent, radius 0, 1px hairlines)
- Portrait hero with staged headline entrance
- Interactive iPhone transplanted onto a full-height stage, dark skin
- My products: Daily Logs and Nino with founder manifesto
- Fragments bento: terminal, fetch game, numbers, thinker, location, stack
- Experience rail, recommendations list, footer with push toy and Konami
- EN/PT kept, light theme removed, no employer named

## Screenshots
(attach shots/desktop-fold.png, desktop-full.png, mobile-fold.png, mobile-full.png)

## Verification
- npm test: pass
- npm run shoot: reviewed at 1440 and 390
- Manual: phone swipe, long-press reorder, push toy, Konami
EOF
```

Do not merge. Paulo reviews on the preview first.

---

## Self-review

- Spec coverage: header (T2), hero and portrait (T3), phone (T5), products (T6), bento six slots (T7 + T8), experience (T9), colleagues (T10), footer with push, count, Konami (T11), responsive rules (each CSS task plus T12 check), bilingual and no-employer guard (T4 test), em-dash guard (T1), motion and reduced-motion (T2 tokens, T3 hero, T7 slots), assets added and removed (T3, T4), docs (T12).
- Placeholders: Task 4 tells the implementer to copy strings verbatim from the old file by line range rather than reprinting 3KB of copy; the line ranges are exact. Task 5 does the same for the phone code with an explicit adaptation list.
- Names: `render(root)` and `id` on every section; `t`, `L`, `state` from `js/i18n.js`; `esc`, `arrowSvg`, `EXT` from `js/dom.js`; `terminalScript`, `mountTerminal`, `numbersRows`, `mountNumbers`; `window.DogGame.mount(hostEl, lang)`; `.slot-h`, `.chip`, `.mono`, `.card`, `.sq`, `.hdr-logo`, `.logo-sq` shared across tasks.
