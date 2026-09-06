import { loadLang, setLang, state } from './i18n.js';
import * as header from './sections/header.js';

const sections = [header];

// Later tasks push their modules here in page order.
export function register(mod) { sections.push(mod); }

export function renderAll() {
  document.documentElement.setAttribute('lang', state.lang);
  for (const mod of sections) {
    const root = document.getElementById(mod.id);
    if (root) mod.render(root);
  }
}

export function switchLang(lang) {
  if (lang === state.lang) return;
  setLang(lang);
  renderAll();
  observeReveals();
}

let revealObserver = null;
function observeReveals() {
  if (revealObserver) revealObserver.disconnect();
  const nodes = document.querySelectorAll('.reveal:not(.in)');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    nodes.forEach(n => n.classList.add('in'));
    return;
  }
  revealObserver = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('in'); revealObserver.unobserve(e.target); }
    }
  }, { threshold: 0.15 });
  nodes.forEach(n => revealObserver.observe(n));
}

async function boot() {
  loadLang();
  // Render the header first: a section that fails to import below still leaves a header.
  header.render(document.getElementById(header.id));
  // Section modules are imported here so main.js stays the single place that knows page order.
  const mods = await Promise.all([
    import('./sections/hero.js'),
    import('./sections/phone.js'),
    import('./sections/products.js'),
    import('./sections/bento.js'),
    import('./sections/experience.js'),
    import('./sections/colleagues.js'),
    import('./sections/footer.js')
  ]);
  mods.forEach(register);
  renderAll(); // re-renders the header too; harmless
  observeReveals();
}

boot().catch(err => console.error('[boot] site failed to render', err));
