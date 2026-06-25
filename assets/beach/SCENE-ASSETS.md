# Assets do cenário da praia (parallax / efeito 3D)

Objetivo: trocar o fundo desenhado em código por camadas de imagem que se movem em
velocidades diferentes (parallax) conforme o mouse / a bola, dando uma profundidade
3D leve. Entregue **camadas separadas em PNG transparente**, eu empilho e dou o
parallax.

## Estilo (igual ao cachorro, pra casar)
Cartoon flat cel-shading, formas suaves, contorno limpo e sutil, paleta quente de
**pôr do sol** que combina com o card de contato do site (laranja -> roxo). Sem
personagens, sem texto. Nada de fotorrealismo.

Cores de referência (mesma paleta do código): céu de cima `#ffd6a5` (pêssego) ->
céu de baixo `#ff9e7d` (coral), mar `#3aa6b9` (teal), areia `#f7e3b8` -> `#e9cf95`.

## Camadas que eu preciso (de trás pra frente)

| Arquivo | Camada | O que é | Parallax | Tamanho / formato |
|---|---|---|---|---|
| `bg-sky.png` | fundo | Céu de pôr do sol + mar + linha do horizonte. Preenche tudo, SEM areia, SEM palmeiras. | mais lento (quase parado) | wide, ~2048x768, opaco |
| `bg-palms.png` | meio | 2 a 4 palmeiras espalhadas em silhueta/cor, fundo transparente, base na linha onde encosta a areia. | médio | ~2048x768, transparente |
| `bg-sand.png` | frente | Faixa de areia (primeiro plano) onde o cachorro corre, com leve textura/duna, talvez tufos de grama nas pontas. Topo reto (linha do chão), transparente acima. | mais rápido (mais perto) | wide, ~2048x420, transparente acima |
| `palm-1.png` `palm-2.png` *(opcional)* | frente-extra | 1 a 2 palmeiras isoladas e maiores pra cantos, transparentes. | mais rápido | ~700x1000, transparente |

- **Wide e sem detalhe crítico nas pontas**: o site é responsivo, as bordas podem
  ser cortadas. Mantenha o interessante no centro e deixe respiro nas laterais.
- **Linha do chão consistente**: o topo da areia (`bg-sand.png`) é onde o cachorro
  pisa. Mantenha essa linha reta e horizontal. A base das palmeiras de `bg-palms`
  deve tocar essa mesma linha.
- **Sem sombras fortes coladas**: sombrinha suave embaixo das palmeiras tudo bem.

## Prompts (cole, troca só a parte do asset)

Base de estilo (igual em todos):
```
Flat cartoon illustration, soft cel-shading, clean subtle outlines, warm sunset
palette (peach #ffd6a5 to coral #ff9e7d sky, teal #3aa6b9 sea, sandy #f7e3b8),
cute friendly mood matching a French-bulldog mascot game, no characters, no text,
wide horizontal composition, 2D.
ASSET: <abaixo>
```

- **bg-sky:** `a calm sunset beach backdrop: gradient sky from peach at top to coral near the horizon, a soft teal sea with gentle highlights, a low straight horizon line in the lower third, no sand in the foreground, no palm trees. Fills the whole frame, opaque.`
- **bg-palms:** `2 to 4 coconut palm trees of varying heights spread across a wide frame, simple stylized silhouette with warm sunset rim light, trunks meeting a flat ground line at the very bottom, everything else fully transparent (no sky, no sand). PNG with transparency.`
- **bg-sand:** `a foreground strip of warm beach sand (#f7e3b8 to #e9cf95) with a perfectly straight flat top edge (the ground line) and soft dune texture, a few small grass tufts only near the far left and right edges, everything above the sand fully transparent. Wide, short strip.`
- **palm-1 / palm-2 (opcional):** `a single large coconut palm tree, stylized, warm sunset lighting, trunk base at the bottom center, fully transparent background. PNG with transparency.`

## Entrega
Joga os PNGs em `assets/beach/` e me avisa. Eu então monto as camadas, ligo o
parallax (sky quase parado, palms médio, sand rápido, reagindo ao mouse e ao voo
da bola) e ajusto a linha do chão pra bater com onde o cachorro pisa. Se vier só o
`bg-sky` + `bg-palms`, já dá pra um parallax legal; areia e palmeiras extras
enriquecem.

## Nota técnica (o que eu faço no código)
- Hoje o fundo é gradiente em código (`drawBackground`). Vou colocar as imagens por
  baixo do cachorro/bola, cada uma com um fator de parallax, e manter o gradiente
  como fallback se uma camada faltar (nunca quadrado em branco).
- A faixa tem altura `clamp(280px, 38vh, 420px)`. As imagens serao escaladas pra
  cobrir a largura; mantenha conteúdo seguro no centro.
