import { t, L } from '../i18n.js';
import { esc } from '../dom.js';
import { experience } from '../data/experience.js';

export const id = 'experience';
const title = L('Experience', 'Experiência');

function logo(e) {
  if (e.logo) return `<img class="xp-logo" src="${e.logo}" alt="${esc(t(e.org))} logo" width="48" height="48">`;
  return `<span class="xp-logo xp-logo-mono">${esc(String(t(e.org)).slice(0, 1))}</span>`;
}

export function render(root) {
  const rows = experience.map((e, i) => `
    <div class="xp-row ${i % 2 ? 'r' : 'l'}">
      <div class="xp-meta">
        ${logo(e)}
        <div><div class="xp-org">${esc(t(e.org))}</div><div class="mono">${esc(e.period)}</div></div>
      </div>
      <div class="card xp-card">
        <h3 class="xp-role">${esc(t(e.role))}</h3>
        <ul class="xp-list">${e.bullets.map(b => `<li>${esc(t(b))}</li>`).join('')}</ul>
        <div class="xp-tags">${e.tags.map(x => `<span class="chip mono">${esc(x)}</span>`).join('')}</div>
      </div>
    </div>`).join('');
  root.innerHTML = `
    <div class="container">
      <h2 class="section-title">${esc(t(title))}<span class="sq"></span></h2>
      <div class="xp">${rows}</div>
    </div>`;
}
