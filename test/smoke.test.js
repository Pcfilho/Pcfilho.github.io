import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CELL, gridSize, hexToRgb, bladeWidth, pruneTrail, topness } from '../js/smoke.core.js';

test('gridSize covers the viewport in CELL-sized pixels', () => {
  assert.deepEqual(gridSize(1440, 900), { w: Math.ceil(1440 / CELL), h: Math.ceil(900 / CELL) });
  assert.deepEqual(gridSize(390, 845, 4), { w: 98, h: 212 });
  assert.deepEqual(gridSize(0, 0), { w: 1, h: 1 });
});

test('hexToRgb parses the accent token and rejects junk', () => {
  assert.deepEqual(hexToRgb(' #FF6A1A '), [1, 0x6a / 255, 0x1a / 255]);
  assert.deepEqual(hexToRgb('#fff'), [1, 1, 1]);
  assert.equal(hexToRgb('rgb(1,2,3)'), null);
  assert.equal(hexToRgb(''), null);
});

test('bladeWidth: thin for a slow hover, wide but capped for a fast swipe', () => {
  assert.equal(bladeWidth(0), 1.5);
  assert.equal(bladeWidth(NaN), 1.5);
  assert.ok(bladeWidth(0.2) < bladeWidth(1));
  assert.equal(bladeWidth(50), 8);
});

test('pruneTrail drops expired points and caps the length, oldest first', () => {
  const now = 1000;
  const trail = Array.from({ length: 30 }, (_, i) => ({ x: i, y: 0, w: 1, t: now - 300 + i * 10 }));
  const kept = pruneTrail(trail, now, 320, 24);
  assert.equal(kept.length, 24);
  assert.equal(kept[kept.length - 1].x, 29);
  assert.deepEqual(pruneTrail([{ t: 0 }], 1000, 320, 24), []);
});

test('topness is full at the top and gone after one screen', () => {
  assert.equal(topness(0, 900), 1);
  assert.equal(topness(900, 900), 0);
  assert.equal(topness(5000, 900), 0);
  const mid = topness(450, 900);
  assert.ok(mid > 0.4 && mid < 0.6, String(mid));
});
