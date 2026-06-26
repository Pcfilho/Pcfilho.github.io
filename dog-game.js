(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  var Core = window.DogGameCore;
  if (!Core) { console.warn('[dog-game] core missing'); return; }
  var CFG = Core.DEFAULTS;

  var USE_SPRITE = true; // individual transparent PNG frames in assets/beach/ (else procedural mock)
  var SPRITES = {
    hRatio: 0.46,  // dog BODY height (its opaque bbox) as a fraction of the screen height
    mouthDX: 0.30, // snout offset from the dog's center, fraction of dog body height (grabs with the mouth)
    ballScale: 1.5, // ball.png size relative to physics diameter
    states: {
      idle:      { files: ['dog-idle-1', 'dog-idle-2'], fps: 2.5 },
      waiting:   { files: ['dog-alert-1'], fps: 1 },
      chasing:   { files: ['dog-run-1', 'dog-run-2', 'dog-run-3', 'dog-run-4'], fps: 8 },
      pickup:    { files: ['dog-pickup-1', 'dog-pickup-2'], fps: 6 },
      returning: { files: ['dog-carry-1', 'dog-carry-2', 'dog-carry-3', 'dog-carry-4'], fps: 8 },
      dropping:  { files: ['dog-pickup-2', 'dog-idle-1'], fps: 6 }
    }
  };
  var cache = {}, ballImg = null;          // fileName -> {img, cx, top, bottom} (bbox fractions)
  var refBH = 0;                            // reference body height (idle bbox) so the dog keeps ONE size across poses
  var LAYER = { p1: null, p2: null }; // corner palms
  var DOG_SINK = 0.055, BALL_SINK = 0.035, PALM_SINK = 0.05; // sink into the sand (fraction of band height)

  // Opaque bounding box of a frame, so any pose (even an airborne carry frame with
  // no planted feet) is anchored by its real feet and center, not the padded frame.
  function measureBox(img) {
    try {
      var n = 220, c = document.createElement('canvas'); c.width = n; c.height = n;
      var g = c.getContext('2d'); g.drawImage(img, 0, 0, n, n);
      var d = g.getImageData(0, 0, n, n).data;
      var minX = n, maxX = -1, minY = n, maxY = -1;
      for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
        if (d[(y * n + x) * 4 + 3] > 24) {
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
      if (maxX < 0) return { cx: 0.5, top: 0.12, bottom: 0.88 };
      return { cx: ((minX + maxX) / 2) / n, top: minY / n, bottom: (maxY + 1) / n };
    } catch (e) { return { cx: 0.5, top: 0.12, bottom: 0.88 }; }
  }

  function loadSprites() {
    if (!USE_SPRITE) return;
    var names = {};
    for (var k in SPRITES.states) SPRITES.states[k].files.forEach(function (f) { names[f] = 1; });
    Object.keys(names).forEach(function (f) {
      var im = new Image();
      im.onload = (function (key) { return function () { var b = measureBox(this); cache[key] = { img: this, cx: b.cx, top: b.top, bottom: b.bottom }; if (key === 'dog-idle-1') refBH = b.bottom - b.top; }; })(f);
      im.onerror = function () { cache[f] = null; }; // missing frame -> mock fallback for that state
      im.src = 'assets/beach/' + f + '.png';
    });
    var b = new Image();
    b.onload = function () { ballImg = b; };
    b.onerror = function () { ballImg = null; };
    b.src = 'assets/beach/ball.png';
    [['p1', 'palm-1'], ['p2', 'palm-2']].forEach(function (p) {
      var im = new Image();
      im.onload = function () { LAYER[p[0]] = im; };
      im.onerror = function () { LAYER[p[0]] = null; }; // missing -> gradient fallback
      im.src = 'assets/beach/' + p[1] + '.png';
    });
  }

  var LAYOUT = { heightVH: 0.38, minH: 280, maxH: 420, groundRatio: 0.74, radiusRatio: 0.045, sideInset: 0.05, mouthRatio: 0.16 };
  var THEME = {
    light: { sky0: '#ffe3bd', sky1: '#ffb38f', seaTop: '#ff9e86', sea1: '#5fa6ad', sand0: '#f7e3b8', sand1: '#e9cf95', text: 'rgba(60,40,20,.8)' },
    dark:  { sky0: '#33263f', sky1: '#7a4b6b', seaTop: '#6b4b66', sea1: '#2e6b73', sand0: '#caa86f', sand1: '#a8854f', text: 'rgba(255,255,255,.7)' }
  };

  var host, phoneEl, screenEl, canvas, ctx, caption, headEl, subEl, dpr = 1;
  var PHONE = { maxW: 880, bezel: 14, aspect: 19.5 / 9 }; // landscape iPhone: screen w:h ratio
  var W = 0, H = 0, env = null;
  var lang = readLS('pb_lang', 'en'), theme = readLS('pb_theme', 'light');
  var played = readLS('pb_dog_played', '') === '1';
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hintT = 0;
  var running = false, visible = true, lastTs = 0;
  var dog = null, ball = null;
  var aiming = false, aimPtr = null, aimStart = null, aimCur = null;

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
      mouthHeight: H * LAYOUT.mouthRatio,
      mouthDX: H * SPRITES.hRatio * SPRITES.mouthDX // horizontal snout reach, so the dog stops with its mouth on the ball
    };
  }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    var outer = Math.min(PHONE.maxW, host.clientWidth - 32); // phone outer width, with page margin
    W = Math.round(outer - 2 * PHONE.bezel);                 // screen (= canvas) width
    H = Math.round(W / PHONE.aspect);                        // landscape screen height
    screenEl.style.width = W + 'px';
    screenEl.style.height = H + 'px';
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    env = computeEnv();
    onResize();
  }

  function resetIdle() {
    dog = Core.createDog(env);
    ball = { x: env.homeX, y: env.groundY - env.radius, vx: 0, vy: 0, angle: 0, resting: true };
  }

  function onResize() {
    if (!dog) { resetIdle(); return; }
    // keep dog/ball in bounds after a resize
    if (dog.state === 'idle') resetIdle();
  }

  function drawPalm(img, side, hFrac) { // corner palm; side -1 = left, +1 = right
    var dh = H * hFrac, scale = dh / img.height, dw = img.width * scale;
    var ox = side < 0 ? -dw * 0.16 : W - dw * 0.84;        // hug the edge, trunk slightly off-screen
    var oy = (env.groundY + H * PALM_SINK) - 0.97 * dh;    // trunk base sunk into the sand
    if (side > 0) { ctx.save(); ctx.translate(ox + dw, oy); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, dw, dh); ctx.restore(); }
    else ctx.drawImage(img, ox, oy, dw, dh);
  }

  function drawBackground() {
    var t = THEME[theme] || THEME.light;
    var horizonY = env.groundY - H * 0.17;
    // sky gradient (warm, ties the site's cream/coral above)
    var sky = ctx.createLinearGradient(0, 0, 0, horizonY);
    sky.addColorStop(0, t.sky0); sky.addColorStop(1, t.sky1);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, horizonY + 1);
    // sea gradient (a soft sunset reflection: warm at the horizon into a muted teal)
    var sea = ctx.createLinearGradient(0, horizonY, 0, env.groundY);
    sea.addColorStop(0, t.seaTop); sea.addColorStop(1, t.sea1);
    ctx.fillStyle = sea; ctx.fillRect(0, horizonY, W, env.groundY - horizonY + 2);
    // corner palms (behind the sand so their sunk trunk bases get hidden)
    if (LAYER.p1) drawPalm(LAYER.p1, -1, 0.85); // left corner
    if (LAYER.p2) drawPalm(LAYER.p2, 1, 0.95);  // right corner
    // sand gradient, last, so it occludes the buried palm bases
    var sand = ctx.createLinearGradient(0, env.groundY - H * 0.04, 0, H);
    sand.addColorStop(0, t.sand0); sand.addColorStop(1, t.sand1);
    ctx.fillStyle = sand; ctx.fillRect(0, env.groundY, W, H - env.groundY);
  }

  function update(dt) {
    if (!dog) resetIdle();
    if (dog.state === 'idle') {
      ball.x = env.homeX; ball.y = env.groundY - env.radius; ball.resting = true;
      if (!reduceMotion) hintT += dt;
      return;
    }
    if (dog.state === 'waiting' || dog.state === 'chasing') ball = Core.stepBall(ball, dt, env);
    var r = Core.stepDog(dog, ball, env, dt);
    dog = r.dog; ball = r.ball;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    drawScene(); // hook for later tasks
  }

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

  function spriteFor(stateKey) {
    var s = SPRITES.states[stateKey] || SPRITES.states.idle;
    var i = Math.floor((Date.now() / 1000) * s.fps) % s.files.length;
    return cache[s.files[i]] || null; // null while loading or on error -> mock fallback
  }

  function drawDog() {
    var key = SPRITES.states[dog.state] ? dog.state : 'idle';
    var rec = USE_SPRITE ? spriteFor(key) : null;
    if (rec && rec.img) {
      var S = (H * SPRITES.hRatio) / (refBH || 0.66); // ONE scale for all poses (idle bbox = reference), so the dog never grows/shrinks between frames
      var fy = env.groundY + H * DOG_SINK; // feet sit a touch into the sand
      ctx.save(); // soft contact shadow for grounding
      ctx.fillStyle = 'rgba(60,40,20,.18)';
      ctx.beginPath(); ctx.ellipse(dog.x, fy, S * 0.22, H * 0.022, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.translate(dog.x, fy);
      ctx.scale(dog.dir, 1);
      ctx.drawImage(rec.img, -rec.cx * S, -rec.bottom * S, S, S); // bbox center -> dog.x, bbox feet -> sand
      ctx.restore();
    } else {
      drawDogMock();
    }
  }

  function drawBall() {
    if (USE_SPRITE && ballImg) {
      if (ball.carried) return; // the carry frames already hold the ball in the mouth
      var d = env.radius * 2 * SPRITES.ballScale;
      var by = ball.y + (ball.resting ? H * BALL_SINK : 0); // nestle into the sand at rest
      ctx.save();
      ctx.translate(ball.x, by); ctx.rotate(ball.angle || 0);
      ctx.drawImage(ballImg, -d / 2, -d / 2, d, d);
      ctx.restore();
    } else {
      drawBallMock();
    }
  }

  function drawScene() {
    if (!ball || !dog) return;
    drawDog();
    drawBall();
    drawAim();
    drawHint();
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
    var now = Date.now();
    var phase = run ? Math.sin(now / 70) : 0; // mock leg/body bob
    ctx.save();
    ctx.translate(bx, by);
    ctx.scale(dog.dir, 1);              // face direction
    // legs
    ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = s * 0.12; ctx.lineCap = 'round';
    [-0.5, -0.2, 0.2, 0.5].forEach(function (o, i) {
      var swing = run ? Math.sin(now / 70 + i) * s * 0.18 : 0;
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

  function loop(ts) {
    if (!running) return;
    var dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0;
    lastTs = ts;
    if (visible && !document.hidden) { update(dt); draw(); }
    requestAnimationFrame(loop);
  }

  function start() { if (running) return; running = true; lastTs = 0; requestAnimationFrame(loop); }

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
    if (v.power > 0) { var r = Core.startThrow(dog, ball, v); dog = r.dog; ball = r.ball; markPlayed(); }
  }
  function markPlayed() {
    if (played) return;
    played = true;
    try { localStorage.setItem('pb_dog_played', '1'); } catch (e) {}
  }

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

  function mount() {
    host = document.getElementById('pb-beach');
    if (!host) return;
    // section: cream page bg, centers the phone, credit below it
    // -webkit-touch-callout/user-select:none so dragging the ball doesn't trigger iOS text/image selection
    host.style.cssText = 'position:relative;width:100%;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;padding:36px 16px 52px;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;';

    // section header (same language as the other section titles, ties it to the page)
    headEl = document.createElement('h2');
    headEl.style.cssText = "font-family:'Bricolage Grotesque',sans-serif;font-size:clamp(26px,4vw,38px);font-weight:800;letter-spacing:-1px;margin:0 0 6px;text-align:center;color:var(--text);";
    host.appendChild(headEl);
    subEl = document.createElement('p');
    subEl.style.cssText = 'color:var(--dim);font-size:15px;margin:0 0 22px;text-align:center;max-width:520px;';
    host.appendChild(subEl);

    // landscape iPhone body (bezel)
    phoneEl = document.createElement('div');
    phoneEl.style.cssText = 'position:relative;display:inline-block;background:linear-gradient(150deg,#3a3a3f,#0d0d10);' +
      'padding:' + PHONE.bezel + 'px;border-radius:46px;box-sizing:border-box;' +
      'box-shadow:0 26px 50px -18px rgba(40,20,10,.45), 0 0 0 2px rgba(255,255,255,.05) inset, 0 1px 2px rgba(255,255,255,.15);';
    host.appendChild(phoneEl);

    // screen (clips the game)
    screenEl = document.createElement('div');
    screenEl.style.cssText = 'position:relative;border-radius:32px;overflow:hidden;background:#000;display:block;';
    phoneEl.appendChild(screenEl);

    canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;touch-action:pan-y;'; // pan-y keeps page scroll unless we grab the ball
    screenEl.appendChild(canvas);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    ctx = canvas.getContext('2d');

    // landscape Dynamic Island (left short edge) + home indicator (right)
    var island = document.createElement('div');
    island.style.cssText = 'position:absolute;left:9px;top:50%;transform:translateY(-50%);width:10px;height:62px;background:#000;border-radius:6px;z-index:6;pointer-events:none;';
    screenEl.appendChild(island);
    var homebar = document.createElement('div');
    homebar.style.cssText = 'position:absolute;right:7px;top:50%;transform:translateY(-50%);width:4px;height:82px;background:rgba(255,255,255,.55);border-radius:3px;z-index:6;pointer-events:none;';
    screenEl.appendChild(homebar);

    // credit, on the cream below the phone
    caption = document.createElement('div');
    caption.style.cssText = 'margin-top:16px;text-align:center;font:600 12.5px Manrope,system-ui,sans-serif;';
    host.appendChild(caption);

    resize();
    updateCaption();
    window.addEventListener('resize', resize);
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(host);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.01 }).observe(host);
    }
    loadSprites();
    start();
  }

  function updateCaption() {
    var t = THEME[theme] || THEME.light;
    var pt = lang === 'pt';
    if (headEl) headEl.textContent = pt ? 'Hora do recreio 🎾' : 'Playtime 🎾';
    if (subEl) subEl.textContent = pt
      ? 'Experimente brincar com o Bull na praia!'
      : 'Come play fetch with Bull on the beach!';
    caption.textContent = captionText();
    caption.style.color = t.text;
  }

  window.DogGame = {
    setLang: function (l) { lang = l; updateCaption(); },
    setTheme: function (th) { theme = th; updateCaption(); }
  };

  window.DogGame._debugThrow = function (vx, vy) {
    if (!dog || dog.state !== 'idle') return;
    var r = Core.startThrow(dog, ball, { vx: vx, vy: vy });
    dog = r.dog; ball = r.ball;
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
