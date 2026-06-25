(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.DogGameCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DEFAULTS = {
    gravity: 2600,        // px/s^2
    restitution: 0.52,    // vertical energy kept per bounce
    groundFriction: 0.80, // horizontal kept on each ground contact
    rollDecay: 2.6,       // 1/s horizontal velocity decay while rolling
    restSpeed: 22,        // px/s; below this on the ground => rest
    powerScale: 6.5,      // pull(px) -> launch speed
    maxPower: 1500,       // px/s cap
    minPower: 130,        // px/s; below this, no throw
    runSpeed: 540,        // dog px/s
    reachDist: 24,        // px to count as "reached"
    pickupTime: 0.30,     // s
    dropTime: 0.26        // s
  };

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
  function len(x, y) { return Math.sqrt(x * x + y * y); }

  function launchVelocity(pullX, pullY, cfg) {
    cfg = cfg || DEFAULTS;
    var pull = len(pullX, pullY);
    if (pull === 0) return { vx: 0, vy: 0, power: 0 };
    var speed = clamp(pull * cfg.powerScale, 0, cfg.maxPower);
    if (speed < cfg.minPower) return { vx: 0, vy: 0, power: 0 };
    return { vx: (-pullX / pull) * speed, vy: (-pullY / pull) * speed, power: speed };
  }

  function stepBall(ball, dt, env, cfg) {
    cfg = cfg || DEFAULTS;
    var b = { x: ball.x, y: ball.y, vx: ball.vx, vy: ball.vy, angle: ball.angle || 0, resting: !!ball.resting };
    if (b.resting) return b;
    b.vy += cfg.gravity * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.x < env.leftBound + env.radius) { b.x = env.leftBound + env.radius; b.vx = -b.vx * cfg.groundFriction; }
    if (b.x > env.rightBound - env.radius) { b.x = env.rightBound - env.radius; b.vx = -b.vx * cfg.groundFriction; }
    var floor = env.groundY - env.radius;
    if (b.y >= floor) {
      b.y = floor;
      if (b.vy > 0) { b.vy = -b.vy * cfg.restitution; b.vx *= cfg.groundFriction; }
      b.vx -= b.vx * clamp(cfg.rollDecay * dt, 0, 1);
      if (Math.abs(b.vy) < cfg.restSpeed && Math.abs(b.vx) < cfg.restSpeed) { b.vx = 0; b.vy = 0; b.resting = true; }
    }
    b.angle += (b.vx * dt) / env.radius;
    return b;
  }

  function createDog(env) { return { state: 'idle', x: env.homeX, dir: 1, timer: 0 }; }

  function startThrow(dog, ball, vel) {
    return {
      dog: { state: 'chasing', x: dog.x, dir: vel.vx >= 0 ? 1 : -1, timer: 0 },
      ball: { x: ball.x, y: ball.y, vx: vel.vx, vy: vel.vy, angle: ball.angle || 0, resting: false }
    };
  }

  function stepDog(dog, ball, env, dt, cfg) {
    cfg = cfg || DEFAULTS;
    var d = { state: dog.state, x: dog.x, dir: dog.dir, timer: dog.timer || 0 };
    var b = ball, events = [];
    if (d.state === 'chasing') {
      var t = ball.x;
      d.dir = t >= d.x ? 1 : -1;
      d.x += d.dir * cfg.runSpeed * dt;
      if ((d.dir === 1 && d.x >= t) || (d.dir === -1 && d.x <= t)) d.x = t;
      if (Math.abs(d.x - t) <= cfg.reachDist) {
        d.x = t;
        if (ball.resting) { d.state = 'pickup'; d.timer = 0; events.push('reached'); }
      }
    } else if (d.state === 'pickup') {
      d.timer += dt;
      if (d.timer >= cfg.pickupTime) { d.state = 'returning'; d.timer = 0; events.push('grabbed'); }
    } else if (d.state === 'returning') {
      d.dir = env.homeX >= d.x ? 1 : -1;
      d.x += d.dir * cfg.runSpeed * dt;
      if ((d.dir === 1 && d.x >= env.homeX) || (d.dir === -1 && d.x <= env.homeX)) d.x = env.homeX;
      b = { x: d.x, y: env.groundY - env.mouthHeight, vx: 0, vy: 0, angle: ball.angle || 0, resting: false, carried: true };
      if (Math.abs(d.x - env.homeX) <= cfg.reachDist) { d.x = env.homeX; d.state = 'dropping'; d.timer = 0; events.push('home'); b.carried = false; }
    } else if (d.state === 'dropping') {
      d.timer += dt;
      b = { x: env.homeX, y: env.groundY - env.radius, vx: 0, vy: 0, angle: ball.angle || 0, resting: true, carried: false };
      if (d.timer >= cfg.dropTime) { d.state = 'idle'; d.timer = 0; events.push('dropped'); }
    }
    return { dog: d, ball: b, events: events };
  }

  return {
    DEFAULTS: DEFAULTS, clamp: clamp, len: len,
    launchVelocity: launchVelocity, stepBall: stepBall,
    createDog: createDog, startThrow: startThrow, stepDog: stepDog
  };
});
