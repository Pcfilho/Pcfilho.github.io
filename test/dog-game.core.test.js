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

test('stepBall: reflects off the top so a high arc stays in the band', () => {
  // Ball near the top moving fast upward; the ceiling (canvas top, default 0) keeps it in view.
  const b = C.stepBall({ x: 200, y: 12, vx: 0, vy: -500, angle: 0, resting: false }, 0.01, ENV);
  assert.ok(b.vy > 0, 'vy reflected downward off the ceiling');
  assert.strictEqual(b.y, ENV.radius, 'clamped at the top edge (radius from y=0)');
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

test('createDog: idle at home', () => {
  const d = C.createDog(ENV);
  assert.strictEqual(d.state, 'idle');
  assert.strictEqual(d.x, ENV.homeX);
});

test('startThrow: dog waits (launch delay) before chasing, ball gets velocity', () => {
  const r = C.startThrow(C.createDog(ENV), { x: 200, y: 290, angle: 0 }, { vx: 300, vy: -200 });
  assert.strictEqual(r.dog.state, 'waiting');
  assert.strictEqual(r.ball.vx, 300);
  assert.strictEqual(r.ball.resting, false);
});

test('stepDog: waiting holds the dog in place, then flips to chasing after chaseDelay', () => {
  const start = { state: 'waiting', x: ENV.homeX, dir: 1, timer: 0 };
  // A short step (less than chaseDelay): dog does not move and stays waiting.
  const mid = C.stepDog(start, { x: 380, y: 290, resting: true }, ENV, C.DEFAULTS.chaseDelay * 0.5);
  assert.strictEqual(mid.dog.state, 'waiting');
  assert.strictEqual(mid.dog.x, ENV.homeX, 'dog stays put while waiting');
  // A step that exceeds chaseDelay: transitions to chasing.
  const go = C.stepDog(start, { x: 380, y: 290, resting: true }, ENV, C.DEFAULTS.chaseDelay + 0.01);
  assert.strictEqual(go.dog.state, 'chasing');
});

test('stepDog: chasing runs toward the ball', () => {
  const dog = { state: 'chasing', x: 200, dir: 1, timer: 0 };
  const r = C.stepDog(dog, { x: 380, y: 290, resting: true }, ENV, 0.1);
  assert.ok(r.dog.x > 200, 'moved right');
  assert.strictEqual(r.dog.dir, 1);
});

test('stepDog: reaching a resting ball triggers pickup', () => {
  const dog = { state: 'chasing', x: 378, dir: 1, timer: 0 };
  const r = C.stepDog(dog, { x: 380, y: 290, resting: true }, ENV, 0.016);
  assert.strictEqual(r.dog.state, 'pickup');
  assert.ok(r.events.includes('reached'));
});

test('stepDog: pickup completes into returning', () => {
  const r = C.stepDog({ state: 'pickup', x: 380, dir: 1, timer: 0 }, { x: 380, y: 290 }, ENV, 0.4);
  assert.strictEqual(r.dog.state, 'returning');
  assert.ok(r.events.includes('grabbed'));
});

test('stepDog: returning carries the ball at the mouth toward home', () => {
  const r = C.stepDog({ state: 'returning', x: 380, dir: -1, timer: 0 }, { x: 380, y: 290 }, ENV, 0.05);
  assert.ok(r.dog.x < 380, 'moved toward home');
  assert.strictEqual(r.ball.carried, true);
  assert.strictEqual(r.ball.x, r.dog.x);
  assert.strictEqual(r.ball.y, ENV.groundY - ENV.mouthHeight);
});

test('stepDog: stops a snout-width short so it grabs with the mouth (mouthDX)', () => {
  const env = Object.assign({}, ENV, { mouthDX: 30 });
  let dog = { state: 'chasing', x: 100, dir: 1, timer: 0 };
  const ball = { x: 300, y: 290, resting: true };
  for (let i = 0; i < 600 && dog.state === 'chasing'; i++) dog = C.stepDog(dog, ball, env, 1 / 60).dog;
  assert.strictEqual(dog.state, 'pickup');
  assert.ok(Math.abs(dog.x - (300 - 30)) < 1, 'dog center stops mouthDX left of the resting ball');
});

test('stepDog: dropping ends idle with the ball resting at home', () => {
  const r = C.stepDog({ state: 'dropping', x: 200, dir: -1, timer: 0 }, { x: 200, y: 240 }, ENV, 0.3);
  assert.strictEqual(r.dog.state, 'idle');
  assert.strictEqual(r.ball.resting, true);
  assert.strictEqual(r.ball.x, ENV.homeX);
  assert.ok(r.events.includes('dropped'));
});

test('stepDog: on the returning->dropping transition frame, ball.carried is not true', () => {
  // Dog is one step away from homeX=200; dt large enough to arrive this frame.
  const dt = 0.1;
  const speed = C.DEFAULTS.runSpeed; // 540 px/s
  // Place dog just close enough that one step overshoots home (200 - 540*0.1 = 146, so start at 210 to approach from right)
  // Actually: dog at homeX + 1 px, dir=-1 won't work since it's already within reachDist.
  // Use a dog approaching from the right, just outside reachDist.
  const startX = ENV.homeX + C.DEFAULTS.reachDist + 1; // 225, just beyond reach
  const dog = { state: 'returning', x: startX, dir: -1, timer: 0 };
  const ball = { x: startX, y: ENV.groundY - ENV.mouthHeight, vx: 0, vy: 0, angle: 0, resting: false, carried: true };
  const r = C.stepDog(dog, ball, ENV, dt);
  assert.strictEqual(r.dog.state, 'dropping', 'dog should be dropping');
  assert.notStrictEqual(r.ball.carried, true, 'ball.carried must not be true when dog is dropping');
});

test('integration: a throw resolves back to idle within a few seconds', () => {
  let { dog, ball } = C.startThrow(C.createDog(ENV), { x: 200, y: 290, angle: 0 }, { vx: 700, vy: -500 });
  const dt = 1 / 60;
  let idle = false;
  for (let i = 0; i < 60 * 8; i++) {
    if (dog.state === 'waiting' || dog.state === 'chasing') ball = C.stepBall(ball, dt, ENV);
    const r = C.stepDog(dog, ball, ENV, dt);
    dog = r.dog; ball = r.ball;
    if (dog.state === 'idle' && r.events.includes('dropped')) { idle = true; break; }
  }
  assert.strictEqual(idle, true, 'returned to idle');
  assert.strictEqual(Math.round(ball.x), ENV.homeX);
});
