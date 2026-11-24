// Pure helpers for the pixel smoke background (js/smoke.js). No DOM, testable under node.

// CSS px per smoke pixel. The canvas renders one texel per cell and the browser
// scales it up with `image-rendering: pixelated`, so the cost stays tiny.
export const CELL = 4;

/** Grid size (in smoke pixels) for a viewport of w x h CSS px. */
export function gridSize(w, h, cell = CELL) {
  return { w: Math.max(1, Math.ceil(w / cell)), h: Math.max(1, Math.ceil(h / cell)) };
}

/** '#FF6A1A' or '#f60' to [r, g, b] in 0..1. Returns null on anything else. */
export function hexToRgb(hex) {
  const m = String(hex).trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  let s = m[1];
  if (s.length === 3) s = s.replace(/./g, c => c + c);
  return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16) / 255);
}

// Blade trail: how many points the slash keeps, and how long (ms) a point lives.
export const TRAIL_MAX = 24;
export const TRAIL_LIFE = 320;

/**
 * Slash half-width in smoke pixels for a cursor moving at `speed` CSS px per ms:
 * a thin line for a slow hover, a wide cut for a fast swipe.
 */
export function bladeWidth(speed) {
  if (!(speed > 0)) return 1.5;
  return Math.min(8, 1.5 + speed * 4);
}

/** Drop trail points older than `life` ms and keep at most `max`, oldest first. */
export function pruneTrail(trail, now, life = TRAIL_LIFE, max = TRAIL_MAX) {
  const live = trail.filter(p => now - p.t < life);
  return live.length > max ? live.slice(live.length - max) : live;
}

/** 1 at the top of the page, easing to 0 once the first screen has scrolled away. */
export function topness(scrollY, viewportH) {
  const x = Math.min(1, Math.max(0, scrollY / Math.max(1, viewportH)));
  return 1 - x * x * (3 - 2 * x);
}
