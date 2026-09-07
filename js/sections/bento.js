import { t, L, state } from '../i18n.js';
import { esc } from '../dom.js';
import { bento } from '../data/bento.js';
import { terminalScript, mountTerminal } from '../slots/terminal.js';
import { numbersRows, mountNumbers } from '../slots/numbers.js';
import { worldXY, brazilXY } from '../maps.js';

export const id = 'bento';
const c = {
  title: L('Fragments of me', 'Fragmentos de mim'),
  termH: L('I ship, then I test. Then I ship again.', 'Eu publico, testo, publico de novo.'),
  dogH: L('Bull plays fetch', 'O Bull busca a bolinha'),
  dogC: L('Throw the ball. He never misses.', 'Joga a bola. Ele nunca erra.'),
  numH: L('Numbers I stand behind', 'Números que eu assino'),
  stackH: L('Stack', 'Stack'),
  stackC: L('What I reach for.', 'O que eu uso.')
};

// Slot animations (terminal typing, numbers auto-scroll) run outside the render() lifecycle,
// so each render must dispose the previous ones before mounting new ones on the fresh DOM.
let disposers = [];

export function render(root) {
  disposers.forEach(dispose => dispose());
  disposers = [];
  const chips = bento.stack.map(s => `<span class="chip mono">${esc(s)}</span>`).join('');
  const worldPins = bento.world.cities.map(ct => {
    const p = worldXY(ct.lon, ct.lat);
    return `<span class="pin${ct.home ? ' home' : ''}" style="left:${p.x.toFixed(2)}%;top:${p.y.toFixed(2)}%" title="${esc(ct.name)}"></span>`;
  }).join('');
  const brazilPin = brazilXY(bento.brazil.lon, bento.brazil.lat);
  root.innerHTML = `
    <div class="container">
      <h2 class="section-title">${esc(t(c.title))}<span class="sq"></span></h2>
      <div class="bento">
        <div class="slot slot-terminal" id="slot-terminal">
          <div class="term dots"><div class="term-bar"><i></i><i></i><i></i></div><pre class="term-out mono"></pre><span class="term-cursor"></span></div>
          <h3 class="slot-h">${esc(t(c.termH))}</h3>
        </div>
        <div class="slot slot-dog">
          <div id="slot-dog" class="slot-dog-host"></div>
          <h3 class="slot-h">${esc(t(c.dogH))}</h3><p class="slot-c">${esc(t(c.dogC))}</p>
        </div>
        <div class="slot slot-world">
          <div class="map"><img src="assets/map-world.svg" alt="" width="720" height="360">${worldPins}</div>
          <h3 class="slot-h">${esc(t(bento.world.h))}</h3><p class="slot-c">${esc(t(bento.world.c))}</p>
        </div>
        <div class="slot slot-brazil">
          <div class="map"><img src="assets/map-brazil.svg" alt="" width="300" height="300"><span class="pin home" style="left:${brazilPin.x.toFixed(2)}%;top:${brazilPin.y.toFixed(2)}%" title="Fortaleza"></span><span class="mono map-lbl">${esc(bento.brazil.label)}</span></div>
          <h3 class="slot-h">${esc(t(bento.brazil.h))}</h3>
        </div>
        <div class="slot slot-numbers" id="slot-numbers">
          <div class="num-view"><div class="num-track mono"></div></div>
          <h3 class="slot-h">${esc(t(c.numH))}</h3>
        </div>
        <div class="slot slot-thinker"><div class="thinker"><span>thinker.</span><span>builder.</span><span>shipper.</span></div></div>
        <div class="slot slot-pets">
          <div class="pets">${bento.pets.list.map(p => `<figure class="pet"><img src="assets/${p.key}.webp" alt="" width="96" height="96"><figcaption class="mono">${esc(p.name)}</figcaption></figure>`).join('')}</div>
          <h3 class="slot-h">${esc(t(bento.pets.h))}</h3><p class="slot-c">${esc(t(bento.pets.c))}</p>
        </div>
        <div class="slot slot-stack">
          <h3 class="slot-h top">${esc(t(c.stackH))}</h3><p class="slot-c">${esc(t(c.stackC))}</p>
          <div class="chips">${chips}</div>
        </div>
      </div>
    </div>`;
  const disposeTerminal = mountTerminal(root.querySelector('#slot-terminal'), terminalScript(bento, state.lang));
  const disposeNumbers = mountNumbers(root.querySelector('#slot-numbers'), numbersRows(bento.numbers, state.lang));
  disposers.push(disposeTerminal, disposeNumbers);
  if (window.DogGame && window.DogGame.mount) window.DogGame.mount(root.querySelector('#slot-dog'), state.lang);
}
