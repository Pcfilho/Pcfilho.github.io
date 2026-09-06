import { t } from '../i18n.js';
import { esc } from '../dom.js';
import { profile } from '../data/profile.js';

export const id = 'hero';

const copy = {
  hi: { en: 'Hi there', pt: 'Olá' },
  iam: { en: 'I am Paulo', pt: 'Sou o Paulo' },
  since: { en: 'Shipping mobile apps since', pt: 'Publicando apps mobile desde' }
};

export function render(root) {
  root.innerHTML = `
    <div class="hero-bg" aria-hidden="true"></div>
    <div class="container hero-in">
      <h1 class="hero-h">
        <span class="line"><span class="word" style="--d:.4s">${esc(t(copy.hi))}</span></span>
        <span class="line"><span class="word" style="--d:.6s">${esc(t(copy.iam))}<span class="sq"></span></span></span>
      </h1>
      <p class="hero-sub" style="--d:2s">
        <span class="hero-sub-l">${esc(t(copy.since))} <b>${profile.since}</b></span>
        <span class="hero-sub-l">${esc(t(profile.role))}</span>
      </p>
    </div>`;
}
