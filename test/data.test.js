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

test('experience: newest first, max 3 bullets, explicit periods', () => {
  assert.equal(experience[0].key, 'collective');
  assert.equal(experience[0].period, '01/2026 · 2026');
  for (const e of experience) {
    assert.ok(e.bullets.length >= 1 && e.bullets.length <= 3, e.key + ' bullets');
    e.bullets.forEach(b => assert.ok(isL(b)));
    assert.ok(!/present|atual/i.test(e.period), e.key + ' period');
    assert.ok(isL(e.role));
  }
});

test('recos and bento are bilingual', () => {
  assert.equal(recos.length, 3);
  recos.forEach(r => assert.ok(isL(r.quote) && isL(r.rel)));
  assert.ok(bento.terminal.intro.length >= 2);
  bento.terminal.intro.forEach(l => assert.ok(isL(l)));
  bento.terminal.productLines.forEach(l => assert.ok(isL(l)));
  bento.terminal.outro.forEach(l => assert.ok(isL(l)));
  bento.terminal.numberKeys.forEach(i => assert.ok(i < bento.numbers.length, 'numberKeys index ' + i + ' out of range'));
  assert.ok(bento.numbers.length >= 5);
  bento.numbers.forEach(n => assert.ok(isL(n.l) && typeof n.v === 'string' && isL(n.line)));
  assert.ok(bento.stack.length >= 20);
  assert.ok(isL(bento.world.h) && isL(bento.world.c));
  assert.ok(isL(bento.brazil.h));
  assert.ok(isL(bento.pets.h) && isL(bento.pets.c));
});
