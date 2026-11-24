// Pixel smoke: a fixed, full-page WebGL background, seen only in the side gutters
// (a black band the width of the content column covers the middle). Domain-warped fBm
// clouds that rise slowly, rendered at 1/CELL resolution: hard-edged bodies shaded in four
// ember tones from the --accent token (Bayer 4x4 between tones). At the top of the page the
// clouds are fuller; scrolling thins them out.
//
// The cursor is a blade. Its recent path (a short trail of points that expire after
// TRAIL_LIFE ms) is drawn as a slash: pointed at the cursor, widest just behind it, tapering
// to nothing at the tail, wider for faster swipes. Inside the slash there is no smoke; around
// it the smoke is pushed out to both sides. As points expire the slash shrinks from the tail
// and the smoke closes behind it.
// Mounted once from js/main.js; it never re-renders on language switch.
import { CELL, TRAIL_MAX, TRAIL_LIFE, gridSize, hexToRgb, bladeWidth, pruneTrail, topness } from './smoke.core.js';

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
#define TRAIL_MAX ${TRAIL_MAX}
uniform vec2 uRes;      // grid size in smoke pixels
uniform float uTime;
uniform float uScroll;  // page scroll in smoke pixels
uniform float uTop;     // 1 at the top of the page, 0 after the first screen
uniform vec3 uTrail[TRAIL_MAX]; // blade path, oldest first: x, y in smoke pixels, half-width
uniform int uCount;
uniform vec3 uColor;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = r * p * 2.02; a *= 0.5; }
  return v;
}
// ordered dither threshold in [0,1), 4x4 Bayer built from the 2x2 one
float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }

float clouds(vec2 px) {
  vec2 uv = px / uRes.y;                       // aspect-correct, 1 = viewport height
  vec2 q = uv * 3.4 - vec2(0.0, uScroll / uRes.y * 2.0); // clouds scroll up with the page, slower
  float t = uTime;
  q.y -= t * 0.09;                             // slow rise
  vec2 w = vec2(fbm(q + vec2(0.0, t * 0.05)), fbm(q + vec2(5.2, 1.3) - t * 0.04));
  return fbm(q + 1.3 * w + vec2(t * 0.02, 0.0));
}

// slash width profile along the trail, s = 0 at the tail, 1 at the cursor:
// a long taper from the tail, widest just behind the cursor, pointed at the tip
float profile(float s) { return pow(s, 0.8) * min(1.0, (1.0 - s) * 10.0 + 0.1); }

void main() {
  vec2 px = gl_FragCoord.xy;

  // nearest point on the blade path, and how wide the slash is there
  float best = 1e9, bw = 0.0;
  vec2 away = vec2(0.0);
  float last = float(uCount - 1);
  for (int i = 0; i < TRAIL_MAX - 1; i++) {
    if (i >= uCount - 1) break;
    vec3 A = uTrail[i], B = uTrail[i + 1];
    vec2 ab = B.xy - A.xy;
    float h = clamp(dot(px - A.xy, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0);
    vec2 to = px - (A.xy + ab * h);
    float w = max(0.0, mix(A.z, B.z, h) * profile((float(i) + h) / last) - 0.4); // sub-pixel tail ends clean, not dotted
    float d = length(to) - w;                  // signed: < 0 inside the slash
    if (d < best) { best = d; bw = w; away = to / max(length(to), 1e-3); }
  }

  // part the smoke: sample from nearer the blade, so the clouds look pushed out to both sides
  float push = bw * 1.6 * (1.0 - smoothstep(0.0, bw * 3.0 + 4.0, best)) * step(0.0, best);
  float n = clouds(px - away * push);
  n += uTop * 0.12 * smoothstep(0.65, 0.0, px.y / uRes.y); // first screen: a cloud bank rises from the bottom on both sides

  // solid cloud bodies: a hard edge with a one-pixel dithered fringe, so no pixel floats alone;
  // inside, the tone steps through four ember shades, dithered between neighbours
  float b = bayer4(px);
  float th = mix(0.56, 0.46, uTop);            // fuller clouds at the top of the page
  float on = step(th + (b - 0.5) * 0.03, n) * step(0.0, best); // nothing inside the slash
  float tone = clamp((n - th) / 0.2, 0.0, 1.0);
  float lvl = min(floor(tone * 3.0 + b), 3.0);
  vec3 ember = lvl < 0.5 ? uColor * 0.32 : lvl < 1.5 ? uColor * 0.6 : lvl < 2.5 ? uColor : mix(uColor, vec3(1.0, 0.84, 0.62), 0.45);
  gl_FragColor = vec4(ember * on, on);
}`;

let mounted = false;

export function mountSmoke() {
  if (mounted) return;
  mounted = true;
  const canvas = document.createElement('canvas');
  canvas.className = 'smoke';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'low-power' });
  if (!gl) return; // no WebGL: the page just stays black
  const prog = link(gl);
  if (!prog) return;
  // the band paints after the canvas at the same z-index, so the smoke drifts behind it
  const band = document.createElement('div');
  band.className = 'smoke-band';
  band.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  canvas.after(band);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  gl.useProgram(prog);
  const u = n => gl.getUniformLocation(prog, n);
  const uRes = u('uRes'), uTime = u('uTime'), uScroll = u('uScroll'), uTop = u('uTop'), uTrail = u('uTrail'), uCount = u('uCount'), uColor = u('uColor');

  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent');
  gl.uniform3fv(uColor, hexToRgb(accent) || [1, 0.42, 0.1]);

  let grid = { w: 1, h: 1 };
  function resize() {
    grid = gridSize(innerWidth, innerHeight);
    canvas.width = grid.w; canvas.height = grid.h;
    gl.viewport(0, 0, grid.w, grid.h);
    gl.uniform2f(uRes, grid.w, grid.h);
  }
  resize();

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // blade path in CSS px: { x, y, w (half-width in smoke px), t }
  let trail = [];
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || reduced.matches) return;
    const now = performance.now(), prev = trail[trail.length - 1];
    if (prev && Math.hypot(e.clientX - prev.x, e.clientY - prev.y) < 6) return; // keep segments meaningful
    const speed = prev ? Math.hypot(e.clientX - prev.x, e.clientY - prev.y) / Math.max(1, now - prev.t) : 0;
    trail.push({ x: e.clientX, y: e.clientY, w: bladeWidth(speed), t: now });
    if (trail.length > TRAIL_MAX) trail.shift();
  }, { passive: true });
  document.addEventListener('pointerleave', () => { trail = []; });

  const packed = new Float32Array(TRAIL_MAX * 3);
  function draw(now) {
    trail = pruneTrail(trail, performance.now());
    const t0 = performance.now();
    trail.forEach((p, i) => {
      packed[i * 3] = p.x / CELL;
      packed[i * 3 + 1] = grid.h - p.y / CELL;
      packed[i * 3 + 2] = p.w * (1 - (t0 - p.t) / TRAIL_LIFE); // the slash closes as it ages
    });
    gl.uniform3fv(uTrail, packed);
    gl.uniform1i(uCount, trail.length);
    gl.uniform1f(uTime, now / 1000);
    gl.uniform1f(uScroll, scrollY / CELL);
    gl.uniform1f(uTop, topness(scrollY, innerHeight));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  let raf = 0, prev = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (now - prev < 1000 / 31) return; // ~30 fps is plenty for drifting smoke
    prev = now;
    draw(now);
  }
  const still = () => draw(20000); // reduced motion: one static frame, no blade
  function start() {
    cancelAnimationFrame(raf);
    if (reduced.matches) still(); else raf = requestAnimationFrame(loop);
  }
  addEventListener('resize', () => { resize(); if (reduced.matches) still(); });
  addEventListener('scroll', () => { if (reduced.matches) still(); }, { passive: true });
  reduced.addEventListener?.('change', start);
  start();
}

function link(gl) {
  const sh = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error('[smoke]', gl.getShaderInfoLog(s)); return null; }
    return s;
  };
  const v = sh(gl.VERTEX_SHADER, VERT), f = sh(gl.FRAGMENT_SHADER, FRAG);
  if (!v || !f) return null;
  const p = gl.createProgram();
  gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.error('[smoke]', gl.getProgramInfoLog(p)); return null; }
  return p;
}
