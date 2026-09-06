import { t, L, state } from '../i18n.js';
import { esc } from '../dom.js';
import { profile } from '../data/profile.js';
import { formatClock } from '../clock.js';

export const id = 'site-header';
let timer = null;

function clockText() {
  return formatClock(new Date(), profile.timeZone, profile.tz);
}

export function render(root) {
  root.innerHTML = `
    <div class="hdr container">
      <a class="hdr-logo" href="#" aria-label="${esc(profile.name)}"><span class="logo-sq"></span><span class="hdr-name">${esc(profile.handle)}</span></a>
      <div class="hdr-right">
        <div class="hdr-loc">
          <div class="hdr-loc-l">${esc(t(profile.location))}</div>
          <div class="mono" id="hdr-clock">${clockText()}</div>
        </div>
        <div class="hdr-lang" role="group" aria-label="${esc(t(L('Language', 'Idioma')))}">
          <button type="button" data-lang="en" class="${state.lang === 'en' ? 'on' : ''}">EN</button>
          <button type="button" data-lang="pt" class="${state.lang === 'pt' ? 'on' : ''}">PT</button>
        </div>
      </div>
    </div>`;
  root.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', async () => {
    const { switchLang } = await import('../main.js');
    switchLang(b.dataset.lang);
  }));
  clearInterval(timer);
  timer = setInterval(() => { const el = document.getElementById('hdr-clock'); if (el) el.textContent = clockText(); }, 15000);
}
