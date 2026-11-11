# Reformulação artística — pixel art

Registro das fases da nova arte do Caminho. A regra de trabalho: **prova de conceito primeiro** (um personagem, um chefe, uma arena), validar consistência e desempenho, e só então converter o resto. Nenhuma mecânica muda: o renderizador novo apenas lê o estado do jogo.

Capturas da prova de conceito em `art/pixel-poc-*.png`.

## Fase 1 — Auditoria (concluída)

| Parte | Como era desenhada | Destino |
|---|---|---|
| Protagonista | vetorial procedural (`caminho/heroi.js`), curvas suavizadas, rosto dentro de um capuz | **redesenhado** (`pixel/humano.js`) |
| Vícios e chefes | vetorial procedural (`game/enemy-art.js`, `boss-art.js`, `jonas-art.js`, `daniel-art.js`) | redesenhar um a um; **Mamom pronto** |
| Cenário | retângulos, degradês e silhuetas vetoriais (`caminho/cena.js`) | **redesenhado** (`pixel/mundo.js`), vale para todas as áreas |
| Objetos | vetorial (`caminho/objetos.js`) | rolo, estação, Ebenézer, portais, vaso, segredo, sacola e NPCs **prontos**; faltam 4 peças do Refúgio |
| Efeitos | partículas circulares e arcos em degradê | **PixelFX** + partículas de 1–2 px |
| HUD | canvas vetorial com emojis | **redesenhado** em pixel, sem emojis |
| Menus, cutscenes, criação de personagem | DOM/CSS e canvas próprio | preservados por enquanto (fase 4) |

Não há imagens: tudo é procedural. O que se preserva sem alteração: física, colisão, IA, golpes e fases dos chefes, níveis, salvamento, entrada (teclado, toque, controle).

## Fase 2 — Estilo (definido)

- **Resolução-base**: 272 pixels de altura (uma sala), largura conforme a tela (483 px em 16:9).
- **Escala**: 1 pixel de arte = 2 unidades do mundo. Blocos de 16×16. O peregrino tem cerca de 30 px de altura; Mamom, 70.
- **Ampliação**: a tela pequena é ampliada por um fator inteiro sem suavização e só então ajustada ao aparelho (pixels nítidos em qualquer resolução).
- **Cor**: cada material é uma rampa de 5 tons gerada da cor-base, com sombras frias e luzes quentes (`rampa()` em `pixel/raster.js`). Contorno de tinta `#17121f` em volta de toda silhueta. Luz sempre de cima e da frente.
- **Cenário**: céu em faixas pontilhadas (Bayer 4×4), três camadas de ruínas em paralaxe com perspectiva atmosférica, miolo dos blocos quase preto e capa clara para o piso se destacar do fundo, escuridão em três degraus de luz.
- **Texto**: fonte Pixelify Sans, desenhada na resolução da tela para continuar legível.

### O protagonista

Humano, de corpo inteiro e rosto à mostra (o capuz fica caído nos ombros), montado em camadas a partir do `look` do personagem — o mesmo da tela de criação:

- pele (5), cabelo (8 cores × **12 estilos**, cada um um carimbo desenhado à mão), barba, **6 constituições**, túnica (8) e capa (6, ou sem capa);
- **7 vocações** com traje e arma próprios: couraça e espada (Guerreiro), alça de couro e funda (Pastor), túnica longa com manto e cajado (Profeta), éfode e trombeta (Levita), faixa vermelha e adaga (Zelote), couro e lança (Valente), manto e chicote (Juiz);
- as peças da Armadura de Deus aparecem no corpo (cinto dourado, placa de prata, aro na cabeça, lâmina dourada).

Como é gerado por quadro, vale para qualquer jogador: é o que o multijogador vai usar para mostrar até 4 peregrinos diferentes.

## Fase 3 — Animações (protagonista e Mamom prontos)

Quadro a quadro, com posições inteiras: respiração em 4 quadros com a capa acompanhando; corrida em 8 quadros com subida e descida do corpo; subida, queda e aterrissagem agachada; golpe com **antecipação** (braço atrás), **corte** e **recuperação**; golpes para cima e para baixo; passo pronto com rastros; deslize na parede; dano com clarão branco; oração ajoelhado; vigília com o lampião erguido; morte com dissolução.

Os tempos do combate não mudaram. Única alteração de colisão: a caixa do herói passou de 38 para 54 unidades de altura, para acompanhar as proporções humanas (toda passagem do jogo tem ao menos 64).

## Fase 4 — Efeitos (PixelFX integrada)

[PixelFX](https://pixelfx.io) é uma biblioteca JavaScript de efeitos em pixel art, licença **MIT**, sem dependências. Está copiada em `src/vendor/pixelfx/` (núcleo + 12 efeitos) com `LICENSE` e `NOTICE.md` preservados — Copyright (c) 2026 Patch e Hugo Duprez; partes adaptadas de Sprite Fusion e Hollow Crown, ambas MIT.

Cada efeito é desenhado pela biblioteca **uma vez** numa folha de sprites e depois só copiado (`pixel/efeitos.js`): corte de espada (aço, luz, curto), corte para cima, estocada, giro, faísca de impacto, crítico, defesa perfeita, baque no chão, cura, pilar de luz, sumiço e coleta.

Também: hitstop, tremor moderado (no máximo 2 px de arte), clarão branco no alvo atingido, clarão de tela na defesa perfeita e no "Está escrito", rastros de projétil, avisos de golpe pontilhados.

## Desempenho medido

| Aparelho (Chromium sem GPU) | Pixel art | Arte antiga |
|---|---|---|
| PC 1280×720 | 10 ms por quadro | 20 ms |
| Celular 844×390 @3x | 11,5 ms | 19,6 ms |

Arena do chefe, com 12 efeitos simultâneos. O modo novo desenha menos pixels e copia telas prontas.

## O que falta (ordem proposta)

1. **Validação da prova de conceito** — direção, proporções do peregrino, paleta.
2. Redesenhar os **10 vícios** e os **17 chefes restantes** no mesmo rasterizador (hoje aparecem com a arte antiga reduzida).
3. Peças do Refúgio: sicômoro, querubim, a porta e a jumenta.
4. Menus, tela de criação com prévia em pixel, cutscenes.
5. **Multijogador local por código, até 4** (WebRTC ponto a ponto, o anfitrião guarda o mundo): ainda não começou.

A arte antiga continua em *menu › Ajustes › Arte*.

## Arquivos

```
src/caminho/pixel/
  raster.js    buffer de pixels, rampas de cor, carimbos, contorno
  humano.js    o peregrino e os NPCs (poses, cabelos, trajes, armas)
  chefespx.js  chefes redesenhados (Mamom)
  mundo.js     blocos, céu, camadas de ruínas, pilares, luz
  efeitos.js   folhas de sprites da PixelFX
  render.js    o quadro: mundo, HUD, ampliação e textos
  icones.js    ícones dos botões de toque
src/vendor/pixelfx/   biblioteca PixelFX (MIT)
```
