import { t, L } from '../i18n.js';
import { esc } from '../dom.js';

export const id = 'scrolltop';
const label = L('Back to top', 'Voltar ao topo');
const SIZE = 48, PERIM = 4 * (SIZE - 2);
let wired = false, raf = 0;
let max = 0; // scrollHeight - innerHeight, recomputed on resize/load so update() never re-measures layout

export function render(root) {
  root.innerHTML = `
    <button type="button" class="stt" id="stt" aria-label="${esc(t(label))}" hidden>
      <svg class="stt-ring" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" aria-hidden="true">
        <rect x="1" y="1" width="${SIZE - 2}" height="${SIZE - 2}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="${PERIM}" stroke-dashoffset="${PERIM}"/>
      </svg>
      <span class="stt-glyph" aria-hidden="true">↑</span>
    </button>`;
  root.querySelector('#stt').addEventListener('click', () => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('site-header')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  });
  updateMax();
  update();
  if (!wired) {
    wired = true;
    window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); }, { passive: true });
    window.addEventListener('resize', () => { updateMax(); update(); });
    window.addEventListener('load', () => { updateMax(); update(); });
  }
}

function updateMax() {
  max = document.documentElement.scrollHeight - innerHeight;
}

function update() {
  const btn = document.getElementById('stt');
  if (!btn) return;
  const y = scrollY, p = max > 0 ? Math.min(1, y / max) : 0;
  btn.hidden = y < innerHeight * 0.4;
  const rect = btn.querySelector('rect');
  if (rect) rect.setAttribute('stroke-dashoffset', String(PERIM * (1 - p)));
}
