import { test } from 'node:test';
import assert from 'node:assert/strict';
import { terminalScript } from '../js/slots/terminal.js';
import { numbersRows } from '../js/slots/numbers.js';
import { bento } from '../js/data/bento.js';

test('terminalScript: prompt line, check lines, done line, in the chosen language', () => {
  const en = terminalScript(bento.terminal, 'en');
  assert.equal(en[0], '> npx paulo@stack init');
  assert.equal(en.length, 2 + bento.terminal.lines.length);
  assert.ok(en[1].startsWith('✓ '));
  assert.equal(en.at(-1), 'Success! Engineer deployed.');
  const pt = terminalScript(bento.terminal, 'pt');
  assert.equal(pt.at(-1), 'Sucesso! Engenheiro publicado.');
});

test('numbersRows: "value label · org" per entry', () => {
  const rows = numbersRows(bento.numbers, 'en');
  assert.equal(rows.length, bento.numbers.length);
  assert.equal(rows[0], '90% fewer support tickets · Ploomes');
});

test('terminalScript stays pure: repeated calls return equal output, independent of mountTerminal state', () => {
  const first = terminalScript(bento.terminal, 'en');
  const second = terminalScript(bento.terminal, 'en');
  assert.deepEqual(first, second);
});
