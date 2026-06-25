(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.DogGameCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DEFAULTS = {
    gravity: 2200,        // px/s^2 (a touch floatier so the ball hangs and flies)
    restitution: 0.80,    // vertical energy kept per bounce (very bouncy: high, many bounces)
    groundFriction: 0.90, // horizontal kept on each ground/wall contact (keeps speed -> goes farther)
    rollDecay: 1.4,       // 1/s horizontal velocity decay while rolling (rolls farther)
    restSpeed: 14,        // px/s; below this on the ground => rest (keeps bouncing a bit longer)
    powerScale: 8.5,      // pull(px) -> launch speed (launches farther/higher)
    maxPower: 2500,       // px/s cap (allows big, flying throws)
    minPower: 130,        // px/s; below this, no throw
    runSpeed: 450,        // dog px/s (smoother, less frantic)
    reachDist: 24,        // px to count as "reached"
    chaseDelay: 0.28,     // s the dog waits after launch before chasing
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
    var ceil = (env.topBound != null ? env.topBound : 0) + env.radius;
    if (b.y < ceil) { b.y = ceil; if (b.vy < 0) b.vy = -b.vy * cfg.restitution; } // a high arc bounces off the top instead of leaving the band
    var floor = env.groundY - env.radius;
    if (b.y >= floor) {
      b.y = floor;
      if (b.vy > 0) {
        b.vy = -b.vy * cfg.restitution; b.vx *= cfg.groundFriction;
        if (-b.vy < cfg.gravity * dt) b.vy = 0; // rebound too weak to clear one frame of gravity -> settle (avoids infinite micro-bounce)
      }
      b.vx -= b.vx * clamp(cfg.rollDecay * dt, 0, 1);
      if (Math.abs(b.vy) < cfg.restSpeed && Math.abs(b.vx) < cfg.restSpeed) { b.vx = 0; b.vy = 0; b.resting = true; }
    }
    b.angle += (b.vx * dt) / env.radius;
    return b;
  }

  function createDog(env) { return { state: 'idle', x: env.homeX, dir: 1, timer: 0 }; }

  function startThrow(dog, ball, vel) {
    return {
      dog: { state: 'waiting', x: dog.x, dir: vel.vx >= 0 ? 1 : -1, timer: 0 },
      ball: { x: ball.x, y: ball.y, vx: vel.vx, vy: vel.vy, angle: ball.angle || 0, resting: false }
    };
  }

  function stepDog(dog, ball, env, dt, cfg) {
    cfg = cfg || DEFAULTS;
    var d = { state: dog.state, x: dog.x, dir: dog.dir, timer: dog.timer || 0 };
    var b = ball, events = [];
    if (d.state === 'waiting') {
      d.timer += dt; // dog holds at home, watching the ball fly, before giving chase
      if (d.timer >= cfg.chaseDelay) { d.state = 'chasing'; d.timer = 0; events.push('chase'); }
    } else if (d.state === 'chasing') {
      d.dir = ball.x >= d.x ? 1 : -1;
      var t = ball.x - d.dir * (env.mouthDX || 0); // stop so the snout meets the ball, not the body center
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
