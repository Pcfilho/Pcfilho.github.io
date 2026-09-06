import { t, L } from '../i18n.js';
import { esc, arrowSvg, EXT } from '../dom.js';
import { products, manifesto } from '../data/products.js';

export const id = 'products';
const title = L('My products', 'Meus produtos');

export function render(root) {
  const cards = products.map(p => `
    <a class="card prod" href="${p.url}" ${EXT}>
      <img class="prod-icon" src="${p.icon}" alt="${esc(p.name)} icon" width="96" height="96">
      <div class="prod-body">
        <h3 class="prod-name">${esc(p.name)}</h3>
        <p class="prod-line">${esc(t(p.line))}</p>
        <div class="mono prod-status">${esc(t(p.status))}</div>
        <div class="mono">${esc(p.stack)}</div>
      </div>
      ${arrowSvg}
    </a>`).join('');
  root.innerHTML = `
    <div class="container">
      <h2 class="section-title">${esc(t(title))}<span class="sq"></span></h2>
      <p class="manifesto">${esc(t(manifesto))}</p>
      <div class="prod-grid">${cards}</div>
    </div>`;
}
