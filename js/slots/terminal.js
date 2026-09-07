export function terminalScript(data, lang) {
  const pick = v => (typeof v === 'string' ? v : (v[lang] ?? v.en));
  const term = data.terminal;
  const body = [
    ...term.intro,
    ...term.numberKeys.map(i => data.numbers[i].line),
    ...term.productLines,
    ...term.outro
  ].map(l => '✓ ' + pick(l));
  return ['> ' + term.cmd, ...body, pick(term.done)];
}

// Once the full script has typed out once (in any language), later mounts just print it:
// the type-out is a one-time introduction, not something to replay on every language switch.
let completed = false;

// Types the lines into el once it is on screen. 20ms per char, 250ms between lines.
// Returns dispose(): stops any pending IntersectionObserver and cancels in-flight typing
// so a re-render (language switch) never leaves an orphaned loop writing into detached nodes.
export function mountTerminal(el, lines) {
  const out = el.querySelector('.term-out');
  const cursor = el.querySelector('.term-cursor');
  if (!out) return () => {};

  let cancelled = false;
  let io = null;
  const finish = () => { cursor && cursor.classList.add('idle'); };
  const dispose = () => {
    cancelled = true;
    if (io) { io.disconnect(); io = null; }
  };

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || completed) {
    out.textContent = lines.join('\n');
    finish();
    completed = true;
    return dispose;
  }

  const run = async () => {
    for (const line of lines) {
      if (cancelled) return;
      const row = document.createElement('div');
      out.appendChild(row);
      for (const ch of line) {
        if (cancelled) return;
        row.textContent += ch;
        await wait(20);
      }
      if (cancelled) return;
      await wait(250);
    }
    if (cancelled) return;
    completed = true;
    finish();
  };

  if (!('IntersectionObserver' in window)) {
    run();
  } else {
    io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); io = null; run(); } }, { threshold: 0.4 });
    io.observe(el);
  }
  return dispose;
}
const wait = ms => new Promise(r => setTimeout(r, ms));
