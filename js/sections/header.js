import { t, state } from '../i18n.js';
import { esc } from '../dom.js';
import { profile } from '../data/profile.js';

export const id = 'site-header';
let timer = null;

function clockText() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const local = new Date(utc + profile.tzOffsetHours * 3600000);
  const hh = String(local.getHours()).padStart(2, '0');
  const mm = String(local.getMinutes()).padStart(2, '0');
  return `${hh}:${mm} ${profile.tz}`;
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
        <div class="hdr-lang" role="group" aria-label="Language">
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
