import { loadLang, setLang, state } from './i18n.js';
import * as header from './sections/header.js';

const sections = [header];
const listeners = new Set();

// Later tasks push their modules here in page order.
export function register(mod) { sections.push(mod); }
export function onLangChange(fn) { listeners.add(fn); }

export function renderAll() {
  document.documentElement.setAttribute('lang', state.lang);
  for (const mod of sections) {
    const root = document.getElementById(mod.id);
    if (root) mod.render(root);
  }
  listeners.forEach(fn => fn(state.lang));
}

export function switchLang(lang) {
  if (lang === state.lang) return;
  setLang(lang);
  renderAll();
  observeReveals();
}

function observeReveals() {
  const nodes = document.querySelectorAll('.reveal:not(.in)');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    nodes.forEach(n => n.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }
  }, { threshold: 0.15 });
  nodes.forEach(n => io.observe(n));
}

async function boot() {
  loadLang();
  // Section modules are imported here so main.js stays the single place that knows page order.
  const mods = await Promise.all([
    import('./sections/hero.js'),
    import('./sections/phone.js'),
    import('./sections/products.js'),
    import('./sections/bento.js'),
    import('./sections/experience.js'),
    import('./sections/colleagues.js'),
    import('./sections/footer.js')
  ].map(p => p.catch(() => null)));
  mods.filter(Boolean).forEach(register);
  renderAll();
  observeReveals();
}

boot();
