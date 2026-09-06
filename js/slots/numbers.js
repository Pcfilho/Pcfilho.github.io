export function numbersRows(data, lang) {
  const pick = v => (typeof v === 'string' ? v : (v[lang] ?? v.en));
  return data.map(n => `${n.v}  ${pick(n.l)} · ${n.org}`);
}

// Vertical auto-scroll of the rows (duplicated for a seamless loop). Slows to 1/4 speed on hover.
export function mountNumbers(el, rows) {
  const track = el.querySelector('.num-track');
  if (!track) return;
  track.innerHTML = rows.concat(rows).map(r => `<div class="num-row">${r.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>`).join('');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let y = 0, speed = 18, target = 18, last = 0, half = 0;
  el.addEventListener('mouseenter', () => { target = 4.5; });
  el.addEventListener('mouseleave', () => { target = 18; });
  const step = ts => {
    if (!last) last = ts;
    const dt = (ts - last) / 1000; last = ts;
    speed += (target - speed) * Math.min(1, dt * 6);
    half = half || track.scrollHeight / 2;
    y = (y + speed * dt) % (half || 1);
    track.style.transform = `translateY(${-y}px)`;
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
