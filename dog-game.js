(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  var Core = window.DogGameCore;
  if (!Core) { console.warn('[dog-game] core missing'); return; }
  var CFG = Core.DEFAULTS;

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

  var LAYOUT = { heightVH: 0.38, minH: 280, maxH: 420, groundRatio: 0.74, radiusRatio: 0.045, sideInset: 0.05, mouthRatio: 0.16 };
  var THEME = {
    light: { sky0: '#ffd6a5', sky1: '#ff9e7d', sea: '#3aa6b9', sand0: '#f7e3b8', sand1: '#e9cf95', text: 'rgba(60,40,20,.8)' },
    dark:  { sky0: '#3a2b4d', sky1: '#7a4b6b', sea: '#2a6b78', sand0: '#caa86f', sand1: '#a8854f', text: 'rgba(255,255,255,.7)' }
  };

  var host, canvas, ctx, caption, dpr = 1;
  var W = 0, H = 0, env = null;
  var lang = readLS('pb_lang', 'en'), theme = readLS('pb_theme', 'light');
  var played = readLS('pb_dog_played', '') === '1';
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hintT = 0;
  var running = false, visible = true, lastTs = 0;
  var dog = null, ball = null, thrown = false;
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

  function update(dt) {
    if (!dog) resetIdle();
    if (dog.state === 'idle') {
      ball.x = env.homeX; ball.y = env.groundY - env.radius; ball.resting = true;
      if (!reduceMotion) hintT += dt;
      return;
    }
    if (dog.state === 'chasing') ball = Core.stepBall(ball, dt, env);
    var r = Core.stepDog(dog, ball, env, dt);
    dog = r.dog; ball = r.ball;
    if (r.events.indexOf('dropped') >= 0) thrown = false;
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
    if (v.power > 0) { var r = Core.startThrow(dog, ball, v); dog = r.dog; ball = r.ball; thrown = true; markPlayed(); }
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
    host.style.position = 'relative';
    host.style.width = '100%';
    host.style.overflow = 'hidden';

    canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.touchAction = 'pan-y'; // let vertical scroll pass unless we capture on the ball
    host.appendChild(canvas);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
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
    loadSprites();
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

  window.DogGame._debugThrow = function (vx, vy) {
    if (!dog || dog.state !== 'idle') return;
    var r = Core.startThrow(dog, ball, { vx: vx, vy: vy });
    dog = r.dog; ball = r.ball; thrown = true;
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
