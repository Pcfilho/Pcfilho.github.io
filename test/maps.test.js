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
