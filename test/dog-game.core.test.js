const test = require('node:test');
const assert = require('node:assert');
const C = require('../dog-game.core.js');

const ENV = { groundY: 300, leftBound: 10, rightBound: 400, radius: 10, homeX: 200, mouthHeight: 60 };

test('launchVelocity: launches opposite the pull', () => {
  const v = C.launchVelocity(40, 0); // pull right -> launch left
  assert.ok(v.vx < 0, 'vx should be negative');
  assert.ok(Math.abs(v.vy) < 1e-6, 'vy ~ 0');
  assert.ok(v.power > 0);
});

test('launchVelocity: caps at maxPower', () => {
  const v = C.launchVelocity(1000, 0);
  assert.strictEqual(Math.round(v.power), C.DEFAULTS.maxPower);
  assert.strictEqual(Math.round(v.vx), -C.DEFAULTS.maxPower);
});

test('launchVelocity: below minPower is no throw', () => {
  const v = C.launchVelocity(5, 0);
  assert.deepStrictEqual(v, { vx: 0, vy: 0, power: 0 });
});

test('launchVelocity: pulling down launches up', () => {
  const v = C.launchVelocity(0, 40);
  assert.ok(v.vy < 0, 'vy should be negative (up)');
  assert.ok(Math.abs(v.vx) < 1e-6);
});

test('stepBall: gravity pulls a falling ball down', () => {
  const b = C.stepBall({ x: 200, y: 0, vx: 0, vy: 0, angle: 0, resting: false }, 0.1, ENV);
  assert.ok(b.y > 0, 'y increased');
  assert.ok(b.vy > 0, 'vy increased');
});

test('stepBall: bounces off the ground (vy flips)', () => {
  const b = C.stepBall({ x: 200, y: 290, vx: 0, vy: 300, angle: 0, resting: false }, 0.001, ENV);
  assert.ok(b.vy < 0, 'vy flipped upward');
  assert.ok(b.y <= ENV.groundY - ENV.radius + 1e-6, 'clamped at floor');
});

test('stepBall: reflects off the side wall', () => {
  const b = C.stepBall({ x: 15, y: 100, vx: -200, vy: 0, angle: 0, resting: false }, 0.05, ENV);
  assert.ok(b.vx > 0, 'vx reflected to positive');
  assert.strictEqual(b.x, ENV.leftBound + ENV.radius);
});

test('stepBall: a slow ball on the ground comes to rest', () => {
  const b = C.stepBall({ x: 200, y: 290, vx: 8, vy: 4, angle: 0, resting: false }, 0.001, ENV);
  assert.strictEqual(b.resting, true);
  assert.strictEqual(b.vx, 0);
  assert.strictEqual(b.vy, 0);
});

test('stepBall: a resting ball stays put', () => {
  const a = { x: 200, y: 290, vx: 0, vy: 0, angle: 1.2, resting: true };
  const b = C.stepBall(a, 0.1, ENV);
  assert.strictEqual(b.resting, true);
  assert.strictEqual(b.x, 200);
  assert.strictEqual(b.angle, 1.2);
});
