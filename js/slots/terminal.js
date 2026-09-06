export function terminalScript(data, lang) {
  const pick = v => (typeof v === 'string' ? v : (v[lang] ?? v.en));
  return ['> ' + data.cmd, ...data.lines.map(l => '✓ ' + pick(l)), pick(data.done)];
}

// Types the lines into el once it is on screen. 30ms per char, 350ms between lines.
export function mountTerminal(el, lines) {
  const out = el.querySelector('.term-out');
  const cursor = el.querySelector('.term-cursor');
  if (!out) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let started = false;
  const run = async () => {
    if (started) return; started = true;
    if (reduced) { out.textContent = lines.join('\n'); return; }
    for (const line of lines) {
      const row = document.createElement('div');
      out.appendChild(row);
      for (const ch of line) { row.textContent += ch; await wait(30); }
      await wait(350);
    }
    cursor && cursor.classList.add('idle');
  };
  if (!('IntersectionObserver' in window)) { run(); return; }
  const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); run(); } }, { threshold: 0.4 });
  io.observe(el);
}
const wait = ms => new Promise(r => setTimeout(r, ms));
