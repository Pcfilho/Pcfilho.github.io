# Assets do cachorro da praia (guia de geração)

Quando os arquivos estiverem em `assets/beach/`, eu ligo `USE_SPRITE = true` em
`dog-game.js`, calibro escala / ponto da boca / frames por estado, e a cena passa
a usar as imagens. Enquanto falta algo, cai no mock procedural (nunca quadrado em
branco).

Entregue **arquivos PNG individuais por pose** (uma imagem por frame). NAO tente
montar uma grade/sheet na IA, elas erram o alinhamento. Eu monto o sheet (ou
carrego frame a frame) a partir dos arquivos soltos.

## O que eu preciso (fases da animação)

Cada fase é um estado do cachorro no jogo. "Frames" = quantas imagens daquela
pose. Mais frames = animação mais suave, porém mais difícil manter o personagem
consistente na IA. A coluna "mínimo" já fica ótimo.

| Estado | O que o cachorro faz | Mínimo | Ideal | Obrigatório? | Arquivos |
|---|---|---|---|---|---|
| **idle** | Parado em pé, calmo, respirando, bola aos pés | 2 | 3 | Sim | `dog-idle-1.png`, `dog-idle-2.png` |
| **run** | Correndo de perfil (ciclo de corrida) | 4 | 6 | Sim | `dog-run-1.png` ... `dog-run-4.png` |
| **pickup** | Abaixando a cabeça pra pegar a bola no chão | 2 | 3 | Sim | `dog-pickup-1.png`, `dog-pickup-2.png` |
| **carry** | Correndo de volta com a bola na boca | 0 | 4 | Nao (ver abaixo) | `dog-carry-1.png` ... `dog-carry-4.png` |
| **alert** | Agachado, atento, olhando a bola voar (a "espera" antes de sair correndo) | 0 | 2 | Nao (ver abaixo) | `dog-alert-1.png` |

- **carry** é opcional: se você nao entregar, eu reuso o ciclo de **run** e desenho
  a bolinha na boca por cima (fica ótimo). Se entregar os frames dedicados (cachorro
  segurando a bola), fica ainda mais charmoso.
- **alert** é opcional: é a pose dos ~0.28s em que o cachorro vê a bola voar antes
  de disparar. Se nao entregar, ele usa a pose **idle** nesse momento.

**Pacote mínimo pra ficar lindo: 8 imagens** (idle x2, run x4, pickup x2).
**Pacote completo: ~15** (somando carry x4 e alert x1).

## Regras técnicas (valem pra TODAS as imagens)

1. **Perfil, virado pra DIREITA** em todos os frames. O código espelha sozinho pro
   lado esquerdo, entao nunca gere o cachorro virado pra esquerda.
2. **Fundo transparente** (PNG com alpha). Se sua ferramenta nao exporta
   transparência, use fundo chroma sólido (#00FF00 verde ou #FF00FF magenta) bem
   liso e me avisa, que eu removo.
3. **Mesma dimensão quadrada** em todos (recomendo 1024x1024 ou 512x512).
4. **Mesma escala e enquadramento**: o cachorro deve ocupar a MESMA área relativa
   em todos os frames (mesma distância de câmera), senao ele "pula de tamanho" na
   animação. Patas tocando uma linha de chão invisível na base (~10% de baixo).
5. **Sem sombra projetada no chão** (a cena já tem o chão). Sombrinha de contato
   suave embaixo das patas pode.
6. **Personagem consistente**: mesmas cores, proporções, orelhas, focinho em todos.

## Estratégia pra manter o MESMO cachorro em todas as poses

A IA tende a mudar o personagem entre gerações. Pra evitar:

- Se você tem **foto do seu cachorro**, use ela como imagem de referência
  (img2img / "character reference" / `--cref` no Midjourney) em TODAS as poses.
- Se for 100% inventado: gere **uma** pose primeiro (a idle), e use ela como
  referência de personagem pras outras, mantendo o texto de estilo idêntico.
- Mantenha o "prompt mestre" abaixo IGUAL em todas, mudando só a linha de ação.
- Trave a seed se a ferramenta permitir.

## Prompt mestre (cole isto, mantenha igual em todas as poses)

Troque `[SEU CACHORRO]` pela descrição do seu (raça, cor, orelhas), ou anexe a foto
dele como referência.

```
Game character sprite of [SEU CACHORRO, ex: a small tan-and-white mixed-breed dog
with floppy ears], cute friendly mascot style, full body, strict side profile
facing RIGHT, flat cel-shading with soft rounded shapes and a clean subtle
outline, warm cohesive palette, even soft lighting, no cast shadow, centered in a
square frame with even margins, standing on an invisible ground line at the bottom,
plain solid #00FF00 background, consistent character design, identical proportions
and camera distance across images, 2D, crisp clean edges.
ACTION: <coloque aqui a linha da pose>
```

### Linhas de ACTION por pose

- **idle-1:** `standing calmly at rest, weight settled, mouth closed, ears relaxed, looking ahead.`
- **idle-2:** `standing at rest mid-breath, chest slightly raised, tail up a touch (a subtle breathing variation of idle-1).`
- **run-1:** `mid-run, contact pose: front legs reaching forward, hind legs pushing back, body stretched.`
- **run-2:** `mid-run, gather pose: all four legs tucked under the body, airborne, back rounded.`
- **run-3:** `mid-run, opposite contact pose: the other front/hind legs reaching, body stretched the other way.`
- **run-4:** `mid-run, opposite gather pose: legs tucked under, airborne, between strides.`
- **(run-5 / run-6, se for fazer 6):** `two extra in-between running frames for a smoother gallop.`
- **pickup-1:** `head and neck lowering toward the ground, front legs slightly bent, about to reach down.`
- **pickup-2:** `head all the way down at ground level, mouth open just above a small ball, picking it up.`
- **carry-1..4 (opcional):** `running to the RIGHT with a green tennis ball held in its mouth, head up and proud (same 4 leg poses as the run cycle).`
- **alert-1 (opcional):** `crouched low and alert, front down, hindquarters up, eyes locked forward, ready to sprint.`

## Bola (opcional)

A bolinha verde hoje é desenhada no código e fica boa. Se quiser uma bola/brinquedo
custom, entregue `ball.png` (~128x128, fundo transparente, centralizado). A boca do
cachorro (onde a bola gruda no carry) eu calibro quando ver a arte real.

## Entrega

Joga os PNGs em `assets/beach/` com os nomes da tabela e me avisa. Eu então:
ligo `USE_SPRITE`, ajusto escala/quantidade de frames/fps por estado pra bater com
o que você mandou, calibro o ponto da boca, e testo no Chrome. Se vier menos frames
que o "ideal", sem problema, eu configuro pro número que você entregar.
