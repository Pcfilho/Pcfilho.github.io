# Design: cena da praia com o cachorro buscador

Data: 2026-06-25
Status: aprovado (aguardando revisão do spec)

## Objetivo

Adicionar, na base do site (depois da section de contato, no lugar do footer
atual), uma cena de praia interativa onde o cachorro do Paulo busca uma bolinha
de tênis. O visitante arremessa a bola com o mouse/dedo (estilo estilingue) e o
cachorro corre, pega a bola na boca, traz de volta ao ponto inicial e larga aos
pés, pronto pra arremessar de novo (fetch clássico, loop infinito).

A primeira versão usa mocks desenhados em canvas; os sprites reais (gerados por
IA, estilo character sheet) entram depois trocando um flag.

## Decisoes fechadas

- Loop: fetch clássico. Arremessar, perseguir, pegar na boca, voltar ao ponto
  inicial, largar, repetir.
- Plataforma: interativo no desktop e no mobile. A captura de toque fica restrita
  a quando o gesto começa em cima da bola; em qualquer outro lugar o scroll da
  página passa direto.
- Visual: sprite sheet com ciclos de animação (idle, corrida, pegar, voltar
  carregando). Mocks procedurais primeiro, sprites reais depois.
- Arremesso: estilingue (Angry Birds) com linha de mira. Força pelo tamanho do
  puxão, direção oposta ao puxão.
- Física: feita na mão, sem dependência externa. O cachorro nao é um corpo de
  física, é uma máquina de estados que corre em direção à bola.
- Código: arquivo separado `dog-game.js`, carregado com `<script defer>`. Sem
  build, sem framework. Continua site estático no GitHub Pages.
- Posição inicial do cachorro: centro da areia.
- A bola sempre volta ao ponto inicial (pés do cachorro no centro).

## Arquitetura e ciclo de vida

O `render()` do `index.html` reconstrói todo o `#app` a cada mudança de estado
(idioma, tema, abrir app). Por isso a cena vive FORA do `#app`, num elemento
proprio `#pb-beach`, colocado logo depois do `#app` no `body`. Assim a cena nunca
é destruída por re-render e o estado da física sobrevive.

Toda a lógica fica em `dog-game.js`, que se auto-inicializa (em `DOMContentLoaded`
ou ao final do script) e expoe uma ponte mínima no `window`:

- `window.DogGame.setLang('pt' | 'en')`
- `window.DogGame.setTheme('light' | 'dark')`

O IIFE principal do `index.html` chama essas funcoes nos pontos onde o idioma ou
tema mudam (`PB.setPT`, `PB.setEN`, `PB.toggleTheme`, e/ou ao final de `render()`),
de forma defensiva (checar `window.DogGame` antes de chamar). Assim o texto e as
cores da cena acompanham o resto do site sem o canvas ser tocado.

Render:

- Um unico `<canvas>` dentro de `#pb-beach`, dimensionado por
  `devicePixelRatio` para nitidez (largura/altura CSS vs. buffer interno).
- Um unico loop `requestAnimationFrame` cuidando de física, animação e desenho,
  com `dt` baseado no tempo real entre frames (resistente a queda de FPS).
- O loop pausa quando a cena sai da viewport (`IntersectionObserver`) e quando a
  aba está oculta (`document.hidden`). Despausa ao voltar. Economiza CPU/bateria
  já que a cena fica no rodapé e raramente está visível.
- `ResizeObserver` (ou listener de `resize`) re-dimensiona o canvas e recalcula
  as âncoras de layout (linha do chão, ponto inicial, bordas).

## Layout da cena

Faixa full-width, altura responsiva `clamp(280px, 38vh, 420px)`. Como o card de
contato logo acima é um gradiente laranja para roxo, a cena é uma praia ao pôr do
sol (céu quente, mar, faixa de areia) para emendar a paleta. Fundo desenhado em
codigo (sem asset de fundo na v1), com variacao light/dark.

O texto de crédito atual do footer ("Feito em Fortaleza, Ceará 🌴 · supervisionado
por 2 pets" / versão EN) migra para cá como legenda HTML sobreposta ao canvas
(nitida, selecionável, bilingue), posicionada discretamente (ex. canto inferior).
A praia passa a ser o footer de fato. A legenda atualiza via `setLang`.

Pontos de layout (recalculados no resize):

- `groundY`: linha da areia onde a bola repousa/quica.
- `homeX`: ponto inicial, centro horizontal da areia. Posicao de repouso do
  cachorro e destino de retorno da bola.
- `leftBound` / `rightBound`: limites laterais jogáveis. A bola nunca sai da cena.

## O cachorro: máquina de estados

Estados e transicoes:

1. `idle`: sentado/parado em `homeX`, ciclo de respiração. Bola em repouso aos
   pés. Dica de descoberta ativa (ver secao de arremesso). Unico estado em que a
   bola é agarrável.
2. `aiming`: enquanto o usuario puxa a bola. Cachorro observa (pode reusar idle
   ou um quadro de alerta). Linha de mira visivel.
3. `chasing`: apos soltar. Corre na direção da bola (retarget por frame para a
   posição atual da bola), sprite espelhado conforme o lado. Velocidade de
   corrida fixa e legivel.
4. `pickup`: ao alcancar a bola em repouso. Curta animacao de abocanhar. A bola
   passa a estar "presa" (física desliga).
5. `returning`: corre de volta a `homeX` com a bola ancorada na boca.
6. `dropping`: em `homeX`, larga a bola, que repousa aos pés. Volta a `idle`.

Guardas:

- A bola so é agarrável em `idle` (em repouso). Durante chase/pickup/return/drop
  ela nao responde a toque, entao o loop nao quebra.
- O cachorro espelha horizontalmente para encarar a direção do movimento.

## Física da bola (na mão)

Estado: posicao (x, y) e velocidade (vx, vy). Integracao por frame com `dt`.

- Lançamento: `v = pull * powerScale`, sentido oposto ao puxão (estilingue), com
  teto de força (`maxPower`).
- Gravidade `g` aplicada a `vy`.
- Quica no chao: ao cruzar `groundY`, `vy = -vy * restitution` (~0.5) e
  `vx *= groundFriction` a cada quique; abaixo de um limiar de energia, para
  (entra em repouso).
- Rolagem: atrito horizontal enquanto encosta no chão até `vx ~ 0`.
- Bordas: ao cruzar `leftBound`/`rightBound`, inverte `vx` com amortecimento.
  Garante "cai sempre no terreno da praia".
- Giro visual: a bola rotaciona proporcional à distância percorrida enquanto se
  move.
- Quando carregada (`returning`): física desliga, a bola segue a âncora da boca.

## Arremesso e toque (desktop + mobile)

Eventos de ponteiro (`pointerdown`/`move`/`up`) unificam mouse e toque.

- `pointerdown` em cima da bola (com folga de toque generosa no mobile) e estado
  `idle`: `setPointerCapture`, `preventDefault`, entra em `aiming`. Mostra a linha
  de mira tracejada (direção e força pelo tamanho do puxão; opcional: alguns
  pontos prevendo o arco).
- `pointermove`: atualiza vetor de puxão e a linha de mira.
- `pointerup`: dispara a bola (estado `chasing`), some a linha de mira.
- `pointerdown` fora da bola: NAO chama `preventDefault`, NAO captura. O scroll da
  pagina passa direto. Combinado com `touch-action: pan-y` no canvas, é o padrão
  robusto para nao regredir o scroll do iOS.

Descoberta (CTA): na primeira visita, a bola pulsa/balança com uma dica curta
("puxe e solte" / "drag & release") que some apos o primeiro arremesso. Flag
`pb_dog_played` no `localStorage`. Bilingue.

## Fronteira dos assets (entrega futura)

Manifesto exato para que a troca seja apenas dropar arquivo:

- `assets/beach/dog.png`: sprite sheet em grade, célula fixa (proposto 256x256),
  fundo transparente, uma linha por estado:
  - linha 0: idle (4 quadros)
  - linha 1: corrida (6 quadros)
  - linha 2: pegar (3 quadros)
  - linha 3: voltar carregando (6 quadros)
  Inclui ponto de ancoragem da boca (offset x,y na célula) para grudar a bola.
- `assets/beach/ball.png`: bolinha de tênis (proposto 64x64), transparente.
- Fundo (céu/mar/areia): desenhado em código na v1, sem asset.

No topo de `dog-game.js`, um bloco de config descreve a grade (célula, linhas,
quadros por estado, fps) e a âncora da boca. O Paulo gera o sheet por IA seguindo
esse molde (sera fornecido um prompt pronto). Antes da entrega real:

- Mocks: cachorro e bola desenhados com formas no canvas, rodando a MESMA máquina
  de estados e física. Bola verde com costura, corpo com patas que animam.
- Troca: flag `USE_SPRITE`. Com `true` e os arquivos presentes, usa os sprites.
- Fallback: seguindo a convenção do site (`onerror` nos `<img>`), se a imagem do
  sheet falhar no load, cai de volta no desenho procedural. Nunca um quadro em
  branco.

## Transversais

- Bilingue: textos (dica, legenda do footer) leem o idioma atual via `setLang`.
- Tema: paletas light/dark de céu/mar/areia via `setTheme`.
- `prefers-reduced-motion`: mata o movimento ambiente (respiração, balanço da
  dica, autoplay). O arremesso por intenção continua funcionando.
- Acessibilidade: `aria-label` no canvas (cena decorativa). Nao vira armadilha de
  teclado.
- Performance: um canvas só, sem mexer no DOM por frame. Loop pausado fora da tela
  e com aba oculta. Canvas ciente de `devicePixelRatio`.

## Fases de implementação

1. Esqueleto: `#pb-beach`, canvas, loop rAF, fundo da praia, bola parada,
   cachorro idle (mock). Verificar: aparece abaixo do contato, sobrevive à troca
   de idioma/tema, nao trava scroll no mobile.
2. Arremesso: estilingue, linha de mira, física da bola (quica, rola, para,
   bordas).
3. Máquina de estados do cachorro: perseguir, pegar, voltar, largar, loop (mock).
4. Motor de sprite: carregar sheet, tocar quadros por estado, espelhar, ancorar
   bola na boca, fallback procedural. Entregar o manifesto de assets + prompt de
   geracao.
5. Polish: dica/CTA com flag, reduced-motion, pausas de performance, pontes
   idioma/tema, teste num iPhone real para o scroll.

## Fora de escopo (YAGNI)

- Multiplos brinquedos ou objetos de física interagindo.
- Placar, niveis, sons.
- Engine de física de terceiros (matter.js). Reavaliar so se surgir necessidade
  de muitos corpos interagindo.
- Editor/customizacao da cena.

## Itens em aberto (dependem do Paulo)

- Sprites reais do cachorro (sprite sheet seguindo o molde) e da bola.
- Confirmacao do tamanho de célula final (256x256 é proposta) apos ver a arte.

## Verificacao

- Render local com headless Chrome (ver CLAUDE.md) para o visual e os estados.
- Drive por DevTools Protocol (`--remote-debugging-port`) para simular o arremesso
  por arrasto (`mouseMoved` com `button:"none"`, `buttons:1` em held drags).
- Teste obrigatorio num iPhone real para confirmar que o scroll nao trava (a
  claude-in-chrome roda em outra maquina; usar Chrome headless local e device
  fisico).
