import { test } from 'node:test';
import assert from 'node:assert/strict';
import { L, t, state } from '../js/i18n.js';

test('L builds a bilingual value and t resolves by current lang', () => {
  const v = L('Hello', 'Olá');
  assert.deepEqual(v, { en: 'Hello', pt: 'Olá' });
  state.lang = 'en';
  assert.equal(t(v), 'Hello');
  state.lang = 'pt';
  assert.equal(t(v), 'Olá');
});

test('t passes plain strings through and falls back to en', () => {
  state.lang = 'pt';
  assert.equal(t('raw'), 'raw');
  assert.equal(t({ en: 'only en' }), 'only en');
});
