import { esc } from '../dom.js';

export function numbersRows(data, lang) {
  const pick = v => (typeof v === 'string' ? v : (v[lang] ?? v.en));
  return data.map(n => `${n.v}  ${pick(n.l)} · ${n.org}`);
}

// Vertical auto-scroll of the rows (duplicated for a seamless loop). Slows to 1/4 speed on hover.
// Returns dispose(): cancels the pending rAF and removes the hover listeners, so a re-render
// (language switch) never leaves a prior loop running against a detached track.
export function mountNumbers(el, rows) {
  const track = el.querySelector('.num-track');
  if (!track) return () => {};
  track.innerHTML = rows.concat(rows).map(r => `<div class="num-row">${esc(r)}</div>`).join('');

  let cancelled = false;
  let rafId = 0;
  let y = 0, speed = 18, target = 18, last = 0, half = 0;

  const onEnter = () => { target = 4.5; };
  const onLeave = () => { target = 18; };
  el.addEventListener('mouseenter', onEnter);
  el.addEventListener('mouseleave', onLeave);

  const dispose = () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
    el.removeEventListener('mouseenter', onEnter);
    el.removeEventListener('mouseleave', onLeave);
  };

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return dispose;

  const step = ts => {
    if (cancelled || !track.isConnected) return;
    if (!last) last = ts;
    const dt = (ts - last) / 1000; last = ts;
    speed += (target - speed) * Math.min(1, dt * 6);
    half = half || track.scrollHeight / 2;
    y = (y + speed * dt) % (half || 1);
    track.style.transform = `translateY(${-y}px)`;
    rafId = requestAnimationFrame(step);
  };
  rafId = requestAnimationFrame(step);

  return dispose;
}
