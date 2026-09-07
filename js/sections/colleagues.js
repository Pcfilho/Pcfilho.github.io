import { t, L } from '../i18n.js';
import { esc, arrowSvg, EXT } from '../dom.js';
import { recos } from '../data/recos.js';
import { profile } from '../data/profile.js';

export const id = 'colleagues';
const title = L('What colleagues say', 'O que dizem sobre mim');

export function render(root) {
  const rows = recos.map(r => `
    <div class="reco">
      <p class="reco-q">“${esc(t(r.quote))}”</p>
      <div class="reco-meta">
        <span class="mono">${esc(r.name)} · ${esc(r.role)} · ${esc(r.co)} · ${esc(t(r.rel))}</span>
        <a class="mono reco-link" href="${profile.recommendations}" ${EXT}>LinkedIn ${arrowSvg}</a>
      </div>
    </div>`).join('');
  root.innerHTML = `<div class="container"><h2 class="section-title">${esc(t(title))}<span class="sq"></span></h2><div class="recos">${rows}</div></div>`;
}
