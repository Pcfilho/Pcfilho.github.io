import { t, L, state } from '../i18n.js';
import { esc } from '../dom.js';
import { bento } from '../data/bento.js';
import { terminalScript, mountTerminal } from '../slots/terminal.js';
import { numbersRows, mountNumbers } from '../slots/numbers.js';

export const id = 'bento';
const c = {
  title: L('Fragments of me', 'Fragmentos de mim'),
  termH: L('I ship, then I test. Then I ship again.', 'Eu publico, testo, publico de novo.'),
  dogH: L('Bull plays fetch', 'O Bull busca a bolinha'),
  dogC: L('Throw the ball. He never misses.', 'Joga a bola. Ele nunca erra.'),
  numH: L('Numbers I stand behind', 'Números que eu assino'),
  locH: L('Remote from the coast', 'Remoto, do litoral'),
  loc: L('Fortaleza · 3.7°S 38.5°W · GMT-3', 'Fortaleza · 3.7°S 38.5°W · GMT-3'),
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
        <div class="slot slot-numbers" id="slot-numbers">
          <div class="num-view"><div class="num-track mono"></div></div>
          <h3 class="slot-h">${esc(t(c.numH))}</h3>
        </div>
        <div class="slot slot-thinker"><div class="thinker"><span>thinker.</span><span>builder.</span><span>shipper.</span></div></div>
        <div class="slot slot-location">
          <div class="loc dots"><span class="loc-pin"></span><span class="mono loc-lbl">${esc(t(c.loc))}</span></div>
          <h3 class="slot-h">${esc(t(c.locH))}</h3>
        </div>
        <div class="slot slot-stack"><div class="chips">${chips}</div><h3 class="slot-h">${esc(t(c.stackH))}</h3><p class="slot-c">${esc(t(c.stackC))}</p></div>
      </div>
    </div>`;
  const disposeTerminal = mountTerminal(root.querySelector('#slot-terminal'), terminalScript(bento.terminal, state.lang));
  const disposeNumbers = mountNumbers(root.querySelector('#slot-numbers'), numbersRows(bento.numbers, state.lang));
  disposers.push(disposeTerminal, disposeNumbers);
  if (window.DogGame && window.DogGame.mount) window.DogGame.mount(root.querySelector('#slot-dog'), state.lang);
}
