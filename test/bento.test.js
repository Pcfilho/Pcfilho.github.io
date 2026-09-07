import { test } from 'node:test';
import assert from 'node:assert/strict';
import { terminalScript } from '../js/slots/terminal.js';
import { numbersRows } from '../js/slots/numbers.js';
import { bento } from '../js/data/bento.js';

test('terminalScript: 11 lines from intro, numbers, products, outro, done', () => {
  const en = terminalScript(bento, 'en');
  assert.equal(en.length, 11);
  assert.equal(en[0], '> npx paulo@stack init');
  assert.ok(en.slice(1, 10).every(l => l.startsWith('✓ ')));
  assert.ok(en[3].includes('90%'));
  assert.equal(en.at(-1), 'Success! Engineer deployed.');
  assert.equal(terminalScript(bento, 'pt').at(-1), 'Sucesso! Engenheiro publicado.');
});

test('numbersRows: "value label · org" per entry', () => {
  const rows = numbersRows(bento.numbers, 'en');
  assert.equal(rows.length, bento.numbers.length);
  assert.equal(rows[0], '90% fewer support tickets · Ploomes');
});

test('terminalScript stays pure: repeated calls return equal output, independent of mountTerminal state', () => {
  const first = terminalScript(bento, 'en');
  const second = terminalScript(bento, 'en');
  assert.deepEqual(first, second);
});
