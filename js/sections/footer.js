import { t, L } from '../i18n.js';
import { esc, EXT } from '../dom.js';
import { profile } from '../data/profile.js';

export const id = 'site-footer';
const c = {
  tag: L('Mobile apps, backend and this site, all by me.', 'Apps mobile, backend e este site, tudo por mim.'),
  visitor: L('You were visitor number', 'Você foi o visitante número'),
  pushH: L('Send yourself a push', 'Manda um push pra você'),
  placeholder: L('Hire Paulo?', 'Contratar o Paulo?'),
  send: L('Send', 'Enviar'),
  now: L('now', 'agora'),
  secret: L('🎉 You found the secret!', '🎉 Você achou o segredo!')
};

export function render(root) {
  root.innerHTML = `
    <div class="container ftr">
      <div class="ftr-l">
        <div class="hdr-logo"><span class="logo-sq"></span><span class="ftr-site">${esc(profile.siteName)}</span></div>
        <p class="ftr-tag">${esc(t(c.tag))}</p>
        <div class="ftr-links mono">
          <a class="ulink" href="mailto:${profile.email}">email</a><span>·</span>
          <a class="ulink" href="${profile.linkedin}" ${EXT}>linkedin</a><span>·</span>
          <a class="ulink" href="${profile.github}" ${EXT}>github</a><span>·</span>
          <a class="ulink" href="${profile.cv}" ${EXT}>cv.pdf</a>
        </div>
        <div class="mono ftr-count" id="ftr-count" hidden>${esc(t(c.visitor))} <b></b></div>
      </div>
      <form class="ftr-r" id="push-form">
        <h3 class="slot-h">${esc(t(c.pushH))}</h3>
        <div class="push-row">
          <input class="mono push-in" id="push-in" maxlength="60" placeholder="${esc(t(c.placeholder))}" aria-label="${esc(t(c.pushH))}">
          <button class="push-btn" type="submit">${esc(t(c.send))}</button>
        </div>
      </form>
    </div>`;
  root.querySelector('#push-form').addEventListener('submit', e => {
    e.preventDefault();
    const inp = root.querySelector('#push-in');
    showPush(inp.value.trim() || t(c.placeholder));
    inp.value = '';
  });
  loadCount(root.querySelector('#ftr-count'));
  wireKonami();
}

async function loadCount(el) {
  try {
    const r = await fetch('https://pcfilho.goatcounter.com/counter/TOTAL.json');
    if (!r.ok) return;
    const j = await r.json();
    if (j && (typeof j.count === 'number' || (typeof j.count === 'string' && j.count.trim()))) {
      el.querySelector('b').textContent = String(j.count).replace(/\s/g, '');
      el.hidden = false;
    }
  } catch (_) { /* counter stays hidden */ }
}

export function showPush(msg) {
  document.querySelector('.push-banner')?.remove();
  const el = document.createElement('div');
  el.className = 'push-banner';
  el.innerHTML = `<img src="${profile.avatar}" alt="" width="38" height="38"><div><div class="push-t"><b>${esc(profile.name)}</b><span class="mono">${esc(t(c.now))}</span></div><div class="push-m">${esc(msg)}</div></div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
  setTimeout(() => { el.classList.remove('in'); setTimeout(() => el.remove(), 500); }, 3000);
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast mono'; el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
  setTimeout(() => { el.classList.remove('in'); setTimeout(() => el.remove(), 300); }, 2700);
}

function confetti() {
  const colors = ['#FF6A1A', '#ffffff', '#666666'];
  for (let i = 0; i < 110; i++) {
    const d = document.createElement('div');
    const sz = 6 + Math.random() * 8;
    d.style.cssText = `position:fixed;top:-24px;left:${Math.random() * 100}vw;width:${sz}px;height:${sz * .5}px;background:${colors[i % 3]};z-index:99999;pointer-events:none;`;
    document.body.appendChild(d);
    const dur = 2200 + Math.random() * 1900;
    d.animate([{ transform: 'translateY(0) rotate(0)', opacity: 1 }, { transform: `translateY(${innerHeight + 80}px) rotate(${360 + Math.random() * 720}deg)`, opacity: .9 }], { duration: dur, easing: 'cubic-bezier(.2,.6,.4,1)' });
    setTimeout(() => d.remove(), dur);
  }
}

let konamiWired = false;
function wireKonami() {
  if (konamiWired) return; konamiWired = true;
  const SEQ = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
  let pos = 0;
  window.addEventListener('keydown', e => {
    if (e.target && e.target.closest && e.target.closest('input,textarea')) return;
    const k = (e.key || '').toLowerCase();
    if (k === SEQ[pos]) { pos++; if (pos === SEQ.length) { pos = 0; confetti(); toast(t(c.secret)); } }
    else pos = k === SEQ[0] ? 1 : 0;
  });
}
