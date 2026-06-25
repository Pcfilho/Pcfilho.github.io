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
