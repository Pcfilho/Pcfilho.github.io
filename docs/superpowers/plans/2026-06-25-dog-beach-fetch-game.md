# Beach Fetch Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an interactive beach scene at the base of the portfolio where Paulo's dog fetches a thrown tennis ball (slingshot throw, dog chases, grabs, returns to center, drops, repeat).

**Architecture:** Pure game logic (slingshot vector, ball physics, dog state machine) lives in `dog-game.core.js` as a UMD module, unit-tested with Node's built-in test runner. The browser orchestrator `dog-game.js` owns the canvas, render loop, input, and drawing, and consumes the core. The scene mounts into `#pb-beach`, a sibling of `#app` so it survives `render()` rebuilds. Mocks (procedural canvas shapes) ship first; real sprite sheets swap in via a flag.

**Tech Stack:** Vanilla JS (no build, no framework), HTML5 Canvas 2D, Node `node:test` for unit tests. Static site on GitHub Pages.

## Global Constraints

- No build step, no framework, no external runtime dependency. Scripts are plain `<script>` files served as-is. (CLAUDE.md)
- Keep paths relative (`assets/...`, `dog-game.js`), never absolute. (CLAUDE.md)
- Bilingual EN/PT for every user-facing string, via the page's current `pb_lang`. (CLAUDE.md)
- No em-dashes (U+2014) in any user-facing copy. Use period, comma, or middot `·`. (CLAUDE.md / user hard rule)
- External links open in a new tab; in-page stays same-tab. (Not relevant here but keep in mind for any link.)
- Mobile scroll must not regress: touch capture only when a gesture starts on the ball; `touch-action: pan-y` on the canvas. Final sign-off requires a real iPhone (iOS sim does not reproduce the scroll bug). (project memory)
- Every image has a fallback so a missing file never shows a blank box (procedural draw fallback here). (CLAUDE.md)
- Physics constants live in `DogGameCore.DEFAULTS`; visual constants live in `dog-game.js` `LAYOUT`/`THEME`. Tune there.

---

## File Structure

- Create `dog-game.core.js` — pure logic. UMD: `module.exports` in Node, `window.DogGameCore` in browser. Exports `DEFAULTS, clamp, len, launchVelocity, stepBall, createDog, startThrow, stepDog`.
- Create `test/dog-game.core.test.js` — Node `node:test` unit tests for the core.
- Create `dog-game.js` — browser orchestrator. Self-mounts on DOM ready into `#pb-beach`. Owns canvas, env/layout, rAF loop, pause logic, input, drawing, sprite engine, bilingual caption + hint, and `window.DogGame` bridge.
- Create `assets/beach/SPRITES.md` — sprite sheet manifest + AI generation prompt (handed to Paulo).
- Modify `index.html` — add `#pb-beach` after `#app` (line 100), add two `<script defer>` tags before `</head>` (line 98), wire `window.DogGame.setLang/setTheme` into `render()` (lines 580-589) and `PB.toggleTheme` (lines 820-826).

Interfaces are validated in Node for the core; the orchestrator is validated visually with local headless Chrome (see CLAUDE.md "Run / preview") and, for the throw, a programmatic `window.DogGame._debugThrow()` hook plus a real-iPhone scroll check.

---

### Task 1: Core — slingshot vector + ball physics

**Files:**
- Create: `dog-game.core.js`
- Test: `test/dog-game.core.test.js`

**Interfaces:**
- Produces:
  - `DEFAULTS` (object of tuning constants).
  - `clamp(v, lo, hi) -> number`, `len(x, y) -> number`.
  - `launchVelocity(pullX, pullY, cfg?) -> { vx, vy, power }`. `pull` is the vector from the ball to the pointer; launch goes opposite, magnitude `pull*powerScale` capped to `maxPower`; below `minPower` returns `{vx:0,vy:0,power:0}`.
  - `stepBall(ball, dt, env, cfg?) -> ball'` where `ball = {x,y,vx,vy,angle,resting}` and `env = {groundY, leftBound, rightBound, radius}`. Pure (returns a new object).

- [ ] **Step 1: Write the failing test**

Create `test/dog-game.core.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const C = require('../dog-game.core.js');

const ENV = { groundY: 300, leftBound: 10, rightBound: 400, radius: 10, homeX: 200, mouthHeight: 60 };

test('launchVelocity: launches opposite the pull', () => {
  const v = C.launchVelocity(40, 0); // pull right -> launch left
  assert.ok(v.vx < 0, 'vx should be negative');
  assert.ok(Math.abs(v.vy) < 1e-6, 'vy ~ 0');
  assert.ok(v.power > 0);
});

test('launchVelocity: caps at maxPower', () => {
  const v = C.launchVelocity(1000, 0);
  assert.strictEqual(Math.round(v.power), C.DEFAULTS.maxPower);
  assert.strictEqual(Math.round(v.vx), -C.DEFAULTS.maxPower);
});

test('launchVelocity: below minPower is no throw', () => {
  const v = C.launchVelocity(5, 0);
  assert.deepStrictEqual(v, { vx: 0, vy: 0, power: 0 });
});

test('launchVelocity: pulling down launches up', () => {
  const v = C.launchVelocity(0, 40);
  assert.ok(v.vy < 0, 'vy should be negative (up)');
  assert.ok(Math.abs(v.vx) < 1e-6);
});

test('stepBall: gravity pulls a falling ball down', () => {
  const b = C.stepBall({ x: 200, y: 0, vx: 0, vy: 0, angle: 0, resting: false }, 0.1, ENV);
  assert.ok(b.y > 0, 'y increased');
  assert.ok(b.vy > 0, 'vy increased');
});

test('stepBall: bounces off the ground (vy flips)', () => {
  const b = C.stepBall({ x: 200, y: 290, vx: 0, vy: 300, angle: 0, resting: false }, 0.001, ENV);
  assert.ok(b.vy < 0, 'vy flipped upward');
  assert.ok(b.y <= ENV.groundY - ENV.radius + 1e-6, 'clamped at floor');
});

test('stepBall: reflects off the side wall', () => {
  const b = C.stepBall({ x: 15, y: 100, vx: -200, vy: 0, angle: 0, resting: false }, 0.05, ENV);
  assert.ok(b.vx > 0, 'vx reflected to positive');
  assert.strictEqual(b.x, ENV.leftBound + ENV.radius);
});

test('stepBall: a slow ball on the ground comes to rest', () => {
  const b = C.stepBall({ x: 200, y: 290, vx: 8, vy: 4, angle: 0, resting: false }, 0.001, ENV);
  assert.strictEqual(b.resting, true);
  assert.strictEqual(b.vx, 0);
  assert.strictEqual(b.vy, 0);
});

test('stepBall: a resting ball stays put', () => {
  const a = { x: 200, y: 290, vx: 0, vy: 0, angle: 1.2, resting: true };
  const b = C.stepBall(a, 0.1, ENV);
  assert.strictEqual(b.resting, true);
  assert.strictEqual(b.x, 200);
  assert.strictEqual(b.angle, 1.2);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/dog-game.core.test.js`
Expected: FAIL with `Cannot find module '../dog-game.core.js'`.

- [ ] **Step 3: Write minimal implementation**

Create `dog-game.core.js`:

```js
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.DogGameCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DEFAULTS = {
    gravity: 2600,        // px/s^2
    restitution: 0.52,    // vertical energy kept per bounce
    groundFriction: 0.80, // horizontal kept on each ground contact
    rollDecay: 2.6,       // 1/s horizontal velocity decay while rolling
    restSpeed: 22,        // px/s; below this on the ground => rest
    powerScale: 6.5,      // pull(px) -> launch speed
    maxPower: 1500,       // px/s cap
    minPower: 130,        // px/s; below this, no throw
    runSpeed: 540,        // dog px/s
    reachDist: 24,        // px to count as "reached"
    pickupTime: 0.30,     // s
    dropTime: 0.26        // s
  };

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
  function len(x, y) { return Math.sqrt(x * x + y * y); }

  function launchVelocity(pullX, pullY, cfg) {
    cfg = cfg || DEFAULTS;
    var pull = len(pullX, pullY);
    if (pull === 0) return { vx: 0, vy: 0, power: 0 };
    var speed = clamp(pull * cfg.powerScale, 0, cfg.maxPower);
    if (speed < cfg.minPower) return { vx: 0, vy: 0, power: 0 };
    return { vx: (-pullX / pull) * speed, vy: (-pullY / pull) * speed, power: speed };
  }

  function stepBall(ball, dt, env, cfg) {
    cfg = cfg || DEFAULTS;
    var b = { x: ball.x, y: ball.y, vx: ball.vx, vy: ball.vy, angle: ball.angle || 0, resting: !!ball.resting };
    if (b.resting) return b;
    b.vy += cfg.gravity * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.x < env.leftBound + env.radius) { b.x = env.leftBound + env.radius; b.vx = -b.vx * cfg.groundFriction; }
    if (b.x > env.rightBound - env.radius) { b.x = env.rightBound - env.radius; b.vx = -b.vx * cfg.groundFriction; }
    var floor = env.groundY - env.radius;
    if (b.y >= floor) {
      b.y = floor;
      if (b.vy > 0) { b.vy = -b.vy * cfg.restitution; b.vx *= cfg.groundFriction; }
      b.vx -= b.vx * clamp(cfg.rollDecay * dt, 0, 1);
      if (Math.abs(b.vy) < cfg.restSpeed && Math.abs(b.vx) < cfg.restSpeed) { b.vx = 0; b.vy = 0; b.resting = true; }
    }
    b.angle += (b.vx * dt) / env.radius;
    return b;
  }

  return {
    DEFAULTS: DEFAULTS, clamp: clamp, len: len,
    launchVelocity: launchVelocity, stepBall: stepBall
  };
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/dog-game.core.test.js`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add dog-game.core.js test/dog-game.core.test.js
git commit -m "feat(game): core slingshot + ball physics with tests"
```

---

### Task 2: Core — dog state machine (fetch loop)

**Files:**
- Modify: `dog-game.core.js` (add `createDog`, `startThrow`, `stepDog` to the returned API)
- Test: `test/dog-game.core.test.js` (add FSM tests)

**Interfaces:**
- Consumes: `DEFAULTS` from Task 1.
- Produces:
  - `createDog(env) -> { state:'idle', x:env.homeX, dir:1, timer:0 }`.
  - `startThrow(dog, ball, vel) -> { dog:{state:'chasing',...}, ball:{...vel, resting:false} }`.
  - `stepDog(dog, ball, env, dt, cfg?) -> { dog, ball, events }`. States: `idle -> chasing -> pickup -> returning -> dropping -> idle`. `env` adds `homeX` and `mouthHeight`. While `returning`/`dropping`, `stepDog` owns the ball (returns `ball.carried`); orchestrator must not run `stepBall` then.

- [ ] **Step 1: Write the failing test**

Append to `test/dog-game.core.test.js`:

```js
test('createDog: idle at home', () => {
  const d = C.createDog(ENV);
  assert.strictEqual(d.state, 'idle');
  assert.strictEqual(d.x, ENV.homeX);
});

test('startThrow: dog chases, ball gets velocity', () => {
  const r = C.startThrow(C.createDog(ENV), { x: 200, y: 290, angle: 0 }, { vx: 300, vy: -200 });
  assert.strictEqual(r.dog.state, 'chasing');
  assert.strictEqual(r.ball.vx, 300);
  assert.strictEqual(r.ball.resting, false);
});

test('stepDog: chasing runs toward the ball', () => {
  const dog = { state: 'chasing', x: 200, dir: 1, timer: 0 };
  const r = C.stepDog(dog, { x: 380, y: 290, resting: true }, ENV, 0.1);
  assert.ok(r.dog.x > 200, 'moved right');
  assert.strictEqual(r.dog.dir, 1);
});

test('stepDog: reaching a resting ball triggers pickup', () => {
  const dog = { state: 'chasing', x: 378, dir: 1, timer: 0 };
  const r = C.stepDog(dog, { x: 380, y: 290, resting: true }, ENV, 0.016);
  assert.strictEqual(r.dog.state, 'pickup');
  assert.ok(r.events.includes('reached'));
});

test('stepDog: pickup completes into returning', () => {
  const r = C.stepDog({ state: 'pickup', x: 380, dir: 1, timer: 0 }, { x: 380, y: 290 }, ENV, 0.4);
  assert.strictEqual(r.dog.state, 'returning');
  assert.ok(r.events.includes('grabbed'));
});

test('stepDog: returning carries the ball at the mouth toward home', () => {
  const r = C.stepDog({ state: 'returning', x: 380, dir: -1, timer: 0 }, { x: 380, y: 290 }, ENV, 0.05);
  assert.ok(r.dog.x < 380, 'moved toward home');
  assert.strictEqual(r.ball.carried, true);
  assert.strictEqual(r.ball.x, r.dog.x);
  assert.strictEqual(r.ball.y, ENV.groundY - ENV.mouthHeight);
});

test('stepDog: dropping ends idle with the ball resting at home', () => {
  const r = C.stepDog({ state: 'dropping', x: 200, dir: -1, timer: 0 }, { x: 200, y: 240 }, ENV, 0.3);
  assert.strictEqual(r.dog.state, 'idle');
  assert.strictEqual(r.ball.resting, true);
  assert.strictEqual(r.ball.x, ENV.homeX);
  assert.ok(r.events.includes('dropped'));
});

test('integration: a throw resolves back to idle within a few seconds', () => {
  let { dog, ball } = C.startThrow(C.createDog(ENV), { x: 200, y: 290, angle: 0 }, { vx: 700, vy: -500 });
  const dt = 1 / 60;
  let idle = false;
  for (let i = 0; i < 60 * 8; i++) {
    if (dog.state === 'chasing') ball = C.stepBall(ball, dt, ENV);
    const r = C.stepDog(dog, ball, ENV, dt);
    dog = r.dog; ball = r.ball;
    if (dog.state === 'idle' && r.events.includes('dropped')) { idle = true; break; }
  }
  assert.strictEqual(idle, true, 'returned to idle');
  assert.strictEqual(Math.round(ball.x), ENV.homeX);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/dog-game.core.test.js`
Expected: FAIL with `C.createDog is not a function`.

- [ ] **Step 3: Write minimal implementation**

In `dog-game.core.js`, add these functions before the `return`:

```js
  function createDog(env) { return { state: 'idle', x: env.homeX, dir: 1, timer: 0 }; }

  function startThrow(dog, ball, vel) {
    return {
      dog: { state: 'chasing', x: dog.x, dir: vel.vx >= 0 ? 1 : -1, timer: 0 },
      ball: { x: ball.x, y: ball.y, vx: vel.vx, vy: vel.vy, angle: ball.angle || 0, resting: false }
    };
  }

  function stepDog(dog, ball, env, dt, cfg) {
    cfg = cfg || DEFAULTS;
    var d = { state: dog.state, x: dog.x, dir: dog.dir, timer: dog.timer || 0 };
    var b = ball, events = [];
    if (d.state === 'chasing') {
      var t = ball.x;
      d.dir = t >= d.x ? 1 : -1;
      d.x += d.dir * cfg.runSpeed * dt;
      if ((d.dir === 1 && d.x >= t) || (d.dir === -1 && d.x <= t)) d.x = t;
      if (Math.abs(d.x - t) <= cfg.reachDist) {
        d.x = t;
        if (ball.resting) { d.state = 'pickup'; d.timer = 0; events.push('reached'); }
      }
    } else if (d.state === 'pickup') {
      d.timer += dt;
      if (d.timer >= cfg.pickupTime) { d.state = 'returning'; d.timer = 0; events.push('grabbed'); }
    } else if (d.state === 'returning') {
      d.dir = env.homeX >= d.x ? 1 : -1;
      d.x += d.dir * cfg.runSpeed * dt;
      if ((d.dir === 1 && d.x >= env.homeX) || (d.dir === -1 && d.x <= env.homeX)) d.x = env.homeX;
      b = { x: d.x, y: env.groundY - env.mouthHeight, vx: 0, vy: 0, angle: ball.angle || 0, resting: false, carried: true };
      if (Math.abs(d.x - env.homeX) <= cfg.reachDist) { d.x = env.homeX; d.state = 'dropping'; d.timer = 0; events.push('home'); }
    } else if (d.state === 'dropping') {
      d.timer += dt;
      b = { x: env.homeX, y: env.groundY - env.radius, vx: 0, vy: 0, angle: ball.angle || 0, resting: true, carried: false };
      if (d.timer >= cfg.dropTime) { d.state = 'idle'; d.timer = 0; events.push('dropped'); }
    }
    return { dog: d, ball: b, events: events };
  }
```

Then extend the returned object to include them:

```js
  return {
    DEFAULTS: DEFAULTS, clamp: clamp, len: len,
    launchVelocity: launchVelocity, stepBall: stepBall,
    createDog: createDog, startThrow: startThrow, stepDog: stepDog
  };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/dog-game.core.test.js`
Expected: PASS, 16 tests total.

- [ ] **Step 5: Commit**

```bash
git add dog-game.core.js test/dog-game.core.test.js
git commit -m "feat(game): dog fetch state machine with tests"
```

---

### Task 3: Browser scaffold — host, canvas, loop, beach background

**Files:**
- Create: `dog-game.js`
- Modify: `index.html` (add `#pb-beach` after line 100; add two `<script defer>` before line 98)

**Interfaces:**
- Consumes: `window.DogGameCore` (Task 1-2).
- Produces: `window.DogGame = { setLang(lang), setTheme(theme) }` (more added later). Self-mounts into `#pb-beach`. `computeEnv()` returns `{ groundY, homeX, leftBound, rightBound, radius, mouthHeight }`.

- [ ] **Step 1: Add the host element and scripts to `index.html`**

After `index.html:100` (`<div id="app"></div>`) insert:

```html
<div id="pb-beach" aria-label="Beach scene with a dog fetching a ball" role="img"></div>
```

Before `index.html:98` (`</head>`) insert:

```html
  <script defer src="dog-game.core.js"></script>
  <script defer src="dog-game.js"></script>
```

- [ ] **Step 2: Create `dog-game.js` scaffold**

Create `dog-game.js`:

```js
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  var Core = window.DogGameCore;
  if (!Core) { console.warn('[dog-game] core missing'); return; }
  var CFG = Core.DEFAULTS;

  var LAYOUT = { heightVH: 0.38, minH: 280, maxH: 420, groundRatio: 0.74, radiusRatio: 0.045, sideInset: 0.05, mouthRatio: 0.16 };
  var THEME = {
    light: { sky0: '#ffd6a5', sky1: '#ff9e7d', sea: '#3aa6b9', sand0: '#f7e3b8', sand1: '#e9cf95', text: 'rgba(60,40,20,.8)' },
    dark:  { sky0: '#3a2b4d', sky1: '#7a4b6b', sea: '#2a6b78', sand0: '#caa86f', sand1: '#a8854f', text: 'rgba(255,255,255,.7)' }
  };

  var host, canvas, ctx, caption, dpr = 1;
  var W = 0, H = 0, env = null;
  var lang = readLS('pb_lang', 'en'), theme = readLS('pb_theme', 'light');
  var running = false, visible = true, lastTs = 0;

  function readLS(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } }

  function captionText() {
    return lang === 'pt'
      ? 'Feito em Fortaleza, Ceará 🌴 · supervisionado por 2 pets'
      : 'Built in Fortaleza, Ceará 🌴 · supervised by 2 pets';
  }

  function computeEnv() {
    var groundY = H * LAYOUT.groundRatio;
    return {
      groundY: groundY,
      homeX: W / 2,
      leftBound: W * LAYOUT.sideInset,
      rightBound: W * (1 - LAYOUT.sideInset),
      radius: Math.max(9, H * LAYOUT.radiusRatio),
      mouthHeight: H * LAYOUT.mouthRatio
    };
  }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = host.clientWidth;
    H = Math.max(LAYOUT.minH, Math.min(LAYOUT.maxH, window.innerHeight * LAYOUT.heightVH));
    host.style.height = H + 'px';
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    env = computeEnv();
    onResize(); // hook for later tasks
  }

  function onResize() {} // overridden in later tasks

  function drawBackground() {
    var t = THEME[theme] || THEME.light;
    var sky = ctx.createLinearGradient(0, 0, 0, env.groundY);
    sky.addColorStop(0, t.sky0); sky.addColorStop(1, t.sky1);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, env.groundY + 4);
    // sea strip
    ctx.fillStyle = t.sea; ctx.fillRect(0, env.groundY - H * 0.10, W, H * 0.10);
    // sand
    var sand = ctx.createLinearGradient(0, env.groundY - H * 0.04, 0, H);
    sand.addColorStop(0, t.sand0); sand.addColorStop(1, t.sand1);
    ctx.fillStyle = sand; ctx.fillRect(0, env.groundY, W, H - env.groundY);
  }

  function update(dt) {} // overridden in later tasks

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    drawScene(); // hook for later tasks
  }

  function drawScene() {} // overridden in later tasks

  function loop(ts) {
    if (!running) return;
    var dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0;
    lastTs = ts;
    if (visible && !document.hidden) { update(dt); draw(); }
    requestAnimationFrame(loop);
  }

  function start() { if (running) return; running = true; lastTs = 0; requestAnimationFrame(loop); }

  function mount() {
    host = document.getElementById('pb-beach');
    if (!host) return;
    host.style.position = 'relative';
    host.style.width = '100%';
    host.style.overflow = 'hidden';

    canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.touchAction = 'pan-y'; // let vertical scroll pass unless we capture on the ball
    host.appendChild(canvas);
    ctx = canvas.getContext('2d');

    caption = document.createElement('div');
    caption.style.cssText = 'position:absolute;left:0;right:0;bottom:10px;text-align:center;font:600 12.5px Manrope,system-ui,sans-serif;pointer-events:none;';
    host.appendChild(caption);

    resize();
    updateCaption();
    window.addEventListener('resize', resize);
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(host);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.01 }).observe(host);
    }
    start();
  }

  function updateCaption() {
    var t = THEME[theme] || THEME.light;
    caption.textContent = captionText();
    caption.style.color = t.text;
  }

  window.DogGame = {
    setLang: function (l) { lang = l; updateCaption(); },
    setTheme: function (th) { theme = th; updateCaption(); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
```

- [ ] **Step 3: Verify the scene renders below contact**

Run:
```bash
python3 -m http.server 8000 >/tmp/srv.log 2>&1 &
sleep 1
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --user-data-dir="$(mktemp -d)" \
  --window-size=1280,2400 --screenshot=/tmp/beach.png \
  http://localhost:8000/index.html
```
Open `/tmp/beach.png`. Expected: a sunset beach band (sky, sea strip, sand) at the very bottom of the page, below the contact card, with the credit caption centered on the sand.

- [ ] **Step 4: Verify it survives a language toggle**

In the running page (or via a second screenshot after clicking the PT/EN toggle), confirm the beach band is still present after `render()` rebuilds `#app` (it is a sibling, so it must persist). Spot-check that `window.DogGame.setLang('pt')` in the console updates the caption to the PT string.

- [ ] **Step 5: Commit**

```bash
git add dog-game.js index.html
git commit -m "feat(game): beach scaffold (host, canvas, loop, background, caption)"
```

---

### Task 4: Mock ball + dog wired to the core loop

**Files:**
- Modify: `dog-game.js` (state init, `update`, `drawScene`, mock draw helpers, `_debugThrow`)

**Interfaces:**
- Consumes: `Core.createDog/stepBall/stepDog`, `env`.
- Produces: `window.DogGame._debugThrow(vx, vy)` to start a throw programmatically (verification hook). Internal `dog`, `ball` state; `resetIdle()`.

- [ ] **Step 1: Add game state + update wired to the core**

In `dog-game.js`, add state vars near the other `var` declarations:

```js
  var dog = null, ball = null, thrown = false;
```

Replace the empty `onResize` and `update` hooks with:

```js
  function resetIdle() {
    dog = Core.createDog(env);
    ball = { x: env.homeX, y: env.groundY - env.radius, vx: 0, vy: 0, angle: 0, resting: true };
    thrown = false;
  }

  function onResize() {
    if (!dog) { resetIdle(); return; }
    // keep dog/ball in bounds after a resize
    if (dog.state === 'idle') resetIdle();
  }

  function update(dt) {
    if (!dog) resetIdle();
    if (dog.state === 'idle') {
      ball.x = env.homeX; ball.y = env.groundY - env.radius; ball.resting = true;
      return;
    }
    if (dog.state === 'chasing') ball = Core.stepBall(ball, dt, env);
    var r = Core.stepDog(dog, ball, env, dt);
    dog = r.dog; ball = r.ball;
    if (r.events.indexOf('dropped') >= 0) thrown = false;
  }
```

- [ ] **Step 2: Add mock drawing**

Replace the empty `drawScene` hook with:

```js
  function drawScene() {
    if (!ball || !dog) return;
    drawDogMock();
    drawBallMock();
  }

  function drawBallMock() {
    var r = env.radius;
    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.angle || 0);
    ctx.fillStyle = '#b6e034';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = Math.max(1, r * 0.18);
    ctx.beginPath(); ctx.arc(-r * 0.2, 0, r * 1.1, -0.9, 0.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(r * 1.2, 0, r * 1.1, Math.PI - 0.9, Math.PI + 0.9); ctx.stroke();
    ctx.restore();
  }

  function drawDogMock() {
    var s = env.mouthHeight;            // body scale ~ mouth height
    var bx = dog.x, by = env.groundY;   // feet on the ground
    var run = (dog.state === 'chasing' || dog.state === 'returning');
    var phase = run ? Math.sin(Date.now() / 70) : 0; // mock leg/body bob
    ctx.save();
    ctx.translate(bx, by);
    ctx.scale(dog.dir, 1);              // face direction
    // legs
    ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = s * 0.12; ctx.lineCap = 'round';
    [-0.5, -0.2, 0.2, 0.5].forEach(function (o, i) {
      var swing = run ? Math.sin(Date.now() / 70 + i) * s * 0.18 : 0;
      ctx.beginPath(); ctx.moveTo(o * s, -s * 0.55); ctx.lineTo(o * s + swing, 0); ctx.stroke();
    });
    // body
    ctx.fillStyle = '#a9712f';
    ctx.beginPath(); ctx.ellipse(0, -s * 0.7 + phase * 2, s * 0.7, s * 0.42, 0, 0, Math.PI * 2); ctx.fill();
    // head
    ctx.beginPath(); ctx.ellipse(s * 0.62, -s * 0.95, s * 0.32, s * 0.30, 0, 0, Math.PI * 2); ctx.fill();
    // ear + tail
    ctx.fillStyle = '#8a5a2b';
    ctx.beginPath(); ctx.ellipse(s * 0.5, -s * 1.1, s * 0.12, s * 0.22, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-s * 0.72, -s * 0.95, s * 0.1, s * 0.22, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
```

- [ ] **Step 3: Add the debug throw hook**

Extend the `window.DogGame` object:

```js
  window.DogGame._debugThrow = function (vx, vy) {
    if (!dog || dog.state !== 'idle') return;
    var r = Core.startThrow(dog, ball, { vx: vx, vy: vy });
    dog = r.dog; ball = r.ball; thrown = true;
  };
```

(Add the line after `window.DogGame = { ... }` is defined, e.g. `window.DogGame._debugThrow = ...`.)

- [ ] **Step 4: Verify resting scene + a thrown fetch**

Run the server + screenshot as in Task 3 (`/tmp/beach.png`) and confirm: ball resting at center, dog idle at center.

Then drive a throw via the DevTools Protocol or by adding a temporary `setTimeout(function(){ window.DogGame._debugThrow(700,-520); }, 500)` at the end of `mount()`, screenshot at ~1s and ~2.5s, and confirm: ball arcs and bounces to one side, dog runs after it, grabs, and returns to center. Remove the temporary line after verifying.

- [ ] **Step 5: Commit**

```bash
git add dog-game.js
git commit -m "feat(game): mock dog + ball driven by the core fetch loop"
```

---

### Task 5: Slingshot input + aim line (desktop + mobile safe)

**Files:**
- Modify: `dog-game.js` (pointer handlers, aim state, `drawAim`, wire into `drawScene`)

**Interfaces:**
- Consumes: `Core.launchVelocity/startThrow`, `env`, `dog`, `ball`.
- Produces: pointer-driven throwing. No new public API.

- [ ] **Step 1: Add aim state + pointer handlers**

In `dog-game.js`, add aim state near the other `var`s:

```js
  var aiming = false, aimPtr = null, aimStart = null, aimCur = null;
```

Add these handlers and attach them in `mount()` (after creating `canvas`):

```js
  function localPoint(e) {
    var rc = canvas.getBoundingClientRect();
    return { x: e.clientX - rc.left, y: e.clientY - rc.top };
  }
  function onBall(p) {
    if (!ball) return false;
    var pad = (window.matchMedia && matchMedia('(pointer:coarse)').matches) ? env.radius * 1.6 : env.radius * 0.6;
    return Core.len(p.x - ball.x, p.y - ball.y) <= env.radius + pad;
  }
  function onPointerDown(e) {
    if (!dog || dog.state !== 'idle') return;
    var p = localPoint(e);
    if (!onBall(p)) return;            // not on the ball -> let the page scroll
    aiming = true; aimPtr = e.pointerId; aimStart = { x: ball.x, y: ball.y }; aimCur = p;
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
  }
  function onPointerMove(e) {
    if (!aiming || e.pointerId !== aimPtr) return;
    aimCur = localPoint(e);
    e.preventDefault();
  }
  function onPointerUp(e) {
    if (!aiming || e.pointerId !== aimPtr) return;
    aiming = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
    var pullX = aimCur.x - aimStart.x, pullY = aimCur.y - aimStart.y;
    var v = Core.launchVelocity(pullX, pullY);
    aimStart = aimCur = null;
    if (v.power > 0) { var r = Core.startThrow(dog, ball, v); dog = r.dog; ball = r.ball; thrown = true; markPlayed(); }
  }
  function markPlayed() {} // overridden in Task 6
```

In `mount()`, after `host.appendChild(canvas);` add:

```js
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
```

- [ ] **Step 2: Draw the aim line**

Add `drawAim` and call it from `drawScene` (after `drawBallMock()`):

```js
  function drawAim() {
    if (!aiming || !aimStart || !aimCur) return;
    var pullX = aimCur.x - aimStart.x, pullY = aimCur.y - aimStart.y;
    var v = Core.launchVelocity(pullX, pullY);
    var power = Math.min(1, v.power / CFG.maxPower);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.35 + 0.5 * power) + ')';
    ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(ball.x, ball.y);
    ctx.lineTo(ball.x - pullX, ball.y - pullY); // launch direction (opposite the pull)
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.beginPath(); ctx.arc(ball.x - pullX, ball.y - pullY, 4 + 3 * power, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
```

Update `drawScene`:

```js
  function drawScene() {
    if (!ball || !dog) return;
    drawDogMock();
    drawBallMock();
    drawAim();
  }
```

- [ ] **Step 3: Verify throwing with the mouse**

Reload the page. With the dev server running, drag from the resting ball and release: the aim line should appear (dashed, pointing the launch way, opposite the drag), and on release the ball launches and the fetch loop runs. Use a GIF or two screenshots to confirm the aim line renders during the drag.

- [ ] **Step 4: Verify mobile scroll is not trapped**

Confirm `canvas.style.touchAction === 'pan-y'` and that `preventDefault` only fires inside `onPointerDown` when `onBall(p)` is true. A drag that starts off the ball must scroll the page normally. (Full sign-off happens on a real iPhone in Task 8; this step is the code-level guard check.)

- [ ] **Step 5: Commit**

```bash
git add dog-game.js
git commit -m "feat(game): slingshot throw with aim line, touch-safe input"
```

---

### Task 6: Discovery hint, bilingual + theme bridges, reduced motion

**Files:**
- Modify: `dog-game.js` (hint, first-visit flag, reduced-motion guard, `markPlayed`)
- Modify: `index.html` (call the bridges from `render()` and `PB.toggleTheme`)

**Interfaces:**
- Consumes: `lang`, `theme`, `ball`, `env`.
- Produces: hint rendering, `pb_dog_played` persistence, `prefers-reduced-motion` respected. Bridges driven by the page.

- [ ] **Step 1: Add hint state + reduced-motion guard**

In `dog-game.js`, add near the other `var`s:

```js
  var played = readLS('pb_dog_played', '') === '1';
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hintT = 0;
```

Replace the placeholder `markPlayed` with:

```js
  function markPlayed() {
    if (played) return;
    played = true;
    try { localStorage.setItem('pb_dog_played', '1'); } catch (e) {}
  }
```

Add hint strings + draw, and call it from `drawScene` when idle and not played:

```js
  function hintText() {
    return lang === 'pt' ? 'puxe e solte a bolinha' : 'drag & release the ball';
  }
  function drawHint() {
    if (played || !ball || dog.state !== 'idle') return;
    var pulse = reduceMotion ? 1 : (0.6 + 0.4 * Math.abs(Math.sin(hintT * 2)));
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(ball.x, ball.y, env.radius + 8 + (reduceMotion ? 0 : pulse * 4), 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    ctx.font = '600 13px Manrope, system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(hintText(), ball.x, ball.y - env.radius - 16);
    ctx.restore();
  }
```

Update `update(dt)` to advance the hint timer (only when not reduced):

```js
    if (dog.state === 'idle') {
      ball.x = env.homeX; ball.y = env.groundY - env.radius; ball.resting = true;
      if (!reduceMotion) hintT += dt;
      return;
    }
```

Update `drawScene`:

```js
  function drawScene() {
    if (!ball || !dog) return;
    drawDogMock();
    drawBallMock();
    drawAim();
    drawHint();
  }
```

Also make `setLang` refresh the hint immediately (it already re-renders each frame, so no extra work; just ensure `setLang`/`setTheme` keep updating the caption, which they do).

- [ ] **Step 2: Wire the bridges in `index.html`**

In `index.html`, in `render()` (lines 580-589), add before the closing `}` of the function (after `if(!state.openApp){ wirePager(); wireAppGrid(); }`):

```js
    if (window.DogGame) { window.DogGame.setLang(state.lang); window.DogGame.setTheme(state.theme); }
```

In `PB.toggleTheme` (lines 820-826), add after `document.documentElement.setAttribute('data-theme', state.theme);`:

```js
      if (window.DogGame) window.DogGame.setTheme(state.theme);
```

- [ ] **Step 3: Verify bilingual + theme + reduced motion**

- Toggle PT/EN: caption and hint text switch language; the beach persists.
- Toggle light/dark via the theme button: sky/sea/sand palette switches without destroying the canvas.
- With OS "Reduce Motion" on (or temporarily forcing `reduceMotion = true`), confirm the hint pulse and dog idle bob stop, but throwing still works.

Screenshot each in `/tmp/beach-pt.png`, `/tmp/beach-dark.png`.

- [ ] **Step 4: Verify the hint disappears after first throw**

Throw once, reload: the hint should be gone (flag `pb_dog_played=1`). Clear it with `localStorage.removeItem('pb_dog_played')` to re-test.

- [ ] **Step 5: Commit**

```bash
git add dog-game.js index.html
git commit -m "feat(game): discovery hint, bilingual/theme bridges, reduced-motion"
```

---

### Task 7: Sprite engine + asset manifest (mock fallback preserved)

**Files:**
- Modify: `dog-game.js` (sprite loading, frame playback, `USE_SPRITE` flag, fallback)
- Create: `assets/beach/SPRITES.md`

**Interfaces:**
- Consumes: `dog.state`, `ball`, `env`.
- Produces: sprite-based drawing when `USE_SPRITE` is true and images load; otherwise the existing mock draw. No public API change.

- [ ] **Step 1: Add the sprite config + loader**

In `dog-game.js`, add near the top config:

```js
  var USE_SPRITE = false; // flip to true once assets/beach/dog.png + ball.png exist
  var SPRITES = {
    cell: 256,
    rows: { idle: { row: 0, frames: 4, fps: 6 }, chasing: { row: 1, frames: 6, fps: 12 },
            pickup: { row: 2, frames: 3, fps: 12 }, returning: { row: 3, frames: 6, fps: 12 } },
    mouth: { x: 196, y: 150 } // mouth anchor within a 256x256 cell (where the ball sits)
  };
  var img = { dog: null, ball: null, ready: false };

  function loadSprites() {
    if (!USE_SPRITE) return;
    var d = new Image(), b = new Image(), n = 0;
    function done() { if (++n === 2) img.ready = true; }
    d.onload = function () { img.dog = d; done(); };
    b.onload = function () { img.ball = b; done(); };
    d.onerror = function () { img.dog = null; }; // fall back to mock
    b.onerror = function () { img.ball = null; };
    d.src = 'assets/beach/dog.png'; b.src = 'assets/beach/ball.png';
  }
```

Call `loadSprites()` inside `mount()` (before `start()`).

- [ ] **Step 2: Draw sprites when available, else mock**

Add a sprite frame helper and branch the draw functions:

```js
  function frameOf(stateKey) {
    var r = SPRITES.rows[stateKey] || SPRITES.rows.idle;
    var i = Math.floor((Date.now() / 1000) * r.fps) % r.frames;
    return { sx: i * SPRITES.cell, sy: r.row * SPRITES.cell, n: SPRITES.cell };
  }

  function drawDog() {
    if (USE_SPRITE && img.dog) {
      var stateKey = (dog.state === 'pickup') ? 'pickup'
        : (dog.state === 'returning') ? 'returning'
        : (dog.state === 'chasing') ? 'chasing' : 'idle';
      var f = frameOf(stateKey);
      var size = env.mouthHeight * 2.6;
      ctx.save();
      ctx.translate(dog.x, env.groundY - size * 0.5);
      ctx.scale(dog.dir, 1);
      ctx.drawImage(img.dog, f.sx, f.sy, f.n, f.n, -size / 2, -size / 2, size, size);
      ctx.restore();
    } else {
      drawDogMock();
    }
  }

  function drawBall() {
    if (USE_SPRITE && img.ball) {
      var d = env.radius * 2;
      ctx.save();
      ctx.translate(ball.x, ball.y); ctx.rotate(ball.angle || 0);
      ctx.drawImage(img.ball, -env.radius, -env.radius, d, d);
      ctx.restore();
    } else {
      drawBallMock();
    }
  }
```

Update `drawScene` to call `drawDog()`/`drawBall()` instead of the `*Mock` directly:

```js
  function drawScene() {
    if (!ball || !dog) return;
    drawDog();
    drawBall();
    drawAim();
    drawHint();
  }
```

- [ ] **Step 3: Write the asset manifest**

Create `assets/beach/SPRITES.md`:

```markdown
# Beach scene sprites

Drop two files here. The game uses them automatically once `USE_SPRITE = true`
in `dog-game.js`. If a file is missing or fails to load, the game falls back to
the procedural mock (never a blank box).

## dog.png (sprite sheet)
- Grid of 256x256 cells, transparent background (PNG).
- One state per row, frames left to right:
  - Row 0: idle, 4 frames (gentle breathing, sitting/standing at rest)
  - Row 1: run, 6 frames (full run cycle, facing RIGHT; code mirrors for left)
  - Row 2: pickup, 3 frames (lowering head, grabbing the ball)
  - Row 3: carry/return, 6 frames (running RIGHT with the ball in the mouth)
- The dog must face RIGHT in every frame. The engine flips horizontally for the
  left direction.
- Mouth anchor (where the ball sits when carried): about x=196, y=150 inside a
  256x256 cell. Keep the mouth near that point across the carry frames, or tell
  me the real anchor and I will update `SPRITES.mouth` in `dog-game.js`.

## ball.png
- A single tennis ball, ~64x64, transparent background, centered.

## AI generation prompt (starting point)
"A cute cartoon dog character sheet, side view facing right, flat soft shading,
transparent background, consistent character across frames. Produce a 4-row
sprite sheet on a 256x256 grid: row 1 idle breathing (4 frames), row 2 running
cycle (6 frames), row 3 lowering head to grab a ball (3 frames), row 4 running
while carrying a green tennis ball in the mouth (6 frames). Even spacing, each
pose centered in its cell, feet on the cell baseline."
```

- [ ] **Step 4: Verify both paths**

- With `USE_SPRITE = false` (default), the mock still renders and plays the full loop (screenshot as before).
- Temporarily set `USE_SPRITE = true` and drop any placeholder `dog.png` (4x4 grid) + `ball.png` into `assets/beach/` to confirm frames advance per state and the ball draws from the image. Then set `USE_SPRITE = false` again (real assets arrive later) and confirm the fallback still works if the files are absent.

- [ ] **Step 5: Commit**

```bash
git add dog-game.js assets/beach/SPRITES.md
git commit -m "feat(game): sprite engine + asset manifest, procedural fallback"
```

---

### Task 8: Integration polish + real-device verification

**Files:**
- Modify: `dog-game.js` (only if integration surfaces issues)

**Interfaces:** none new.

- [ ] **Step 1: Full desktop pass**

Serve the site, scroll to the beach, and verify the complete loop several times: rest -> aim line -> throw left and right -> dog chases, grabs, returns to center, drops -> rest. Confirm the ball never leaves the sand (side bounds) and always settles on the ground. Toggle language and theme mid-play; the scene must persist and stay in sync.

- [ ] **Step 2: Performance pause check**

Scroll the beach out of view and confirm the loop pauses (no work while off-screen via `IntersectionObserver`), and that switching browser tabs pauses it (`document.hidden`). Confirm it resumes on return.

- [ ] **Step 3: Real iPhone scroll check (required)**

On a real iPhone (Safari), open the deployed/preview URL, scroll the page through the beach band: vertical scrolling must work normally when the touch starts anywhere except the ball. Starting a drag on the ball must aim/throw without scrolling. The iOS simulator does not reproduce these scroll bugs, so a physical device is required (project memory). If scroll regresses, revisit the `touch-action` + conditional `preventDefault` in Task 5.

- [ ] **Step 4: Run the unit suite once more**

Run: `node --test` (auto-discovery; `node --test test/` mis-handles the directory arg on Node 22, use the no-arg form or `node --test 'test/*.test.js'`)
Expected: PASS, 18 tests.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "chore(game): integration polish + verification"
```

---

## Self-Review

**Spec coverage:**
- Architecture/lifecycle (canvas outside `#app`, bridges) -> Task 3 (host + bridges), Task 6 (wired into `render`/`toggleTheme`).
- Scene layout + footer caption migration -> Task 3.
- Dog state machine -> Task 2 (logic) + Task 4 (render).
- Ball physics (gravity, bounce, roll, rest, bounds, spin) -> Task 1.
- Slingshot + aim line + touch safety -> Task 5.
- Discovery hint + first-visit flag, bilingual, theme, reduced motion -> Task 6.
- Sprite sheet boundary + mock fallback + manifest -> Task 7.
- Performance pauses + real-iPhone scroll -> Task 3 (observers) + Task 8 (verification).
- Out of scope (matter.js, multiple toys, sound, score) -> not implemented. Good.

**Placeholder scan:** The `onResize`/`update`/`drawScene`/`markPlayed` "hooks" in Task 3/5 are intentionally empty stubs that later tasks replace with full code shown inline. No `TBD`/`TODO` remain.

**Type consistency:** `env` shape `{groundY,homeX,leftBound,rightBound,radius,mouthHeight}` is consistent across `computeEnv`, the core tests' `ENV`, and `stepDog`/`stepBall` usage. `ball` shape `{x,y,vx,vy,angle,resting[,carried]}` consistent. `dog` shape `{state,x,dir,timer}` consistent. Core API names (`launchVelocity`, `stepBall`, `createDog`, `startThrow`, `stepDog`) match between Tasks 1-2 and their consumers in Tasks 4-7.
