import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const TEXT = /\.(html|css|js|mjs|cjs|json|md)$/;

test('no em-dash (U+2014) in tracked text files', () => {
  const files = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(f => TEXT.test(f));
  const offenders = files.filter(f => readFileSync(f, 'utf8').includes(String.fromCharCode(0x2014)));
  assert.deepEqual(offenders, []);
});
