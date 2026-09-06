import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatClock } from '../js/clock.js';

test('formatClock renders Fortaleza time from a UTC instant (standard-time offset)', () => {
  const d = new Date('2024-03-10T06:30:00Z');
  assert.equal(formatClock(d, 'America/Fortaleza', 'GMT-3'), '03:30 GMT-3');
});

test('formatClock stays correct across a US/EU DST transition window', () => {
  const d = new Date('2024-07-01T12:05:00Z');
  assert.equal(formatClock(d, 'America/Fortaleza', 'GMT-3'), '09:05 GMT-3');
});
