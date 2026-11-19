// As trilhas do Peregrinos: músicas compostas (não sorteadas), tocadas por um pequeno sequenciador sobre o WebAudio.
// Sem arquivos: o jogo continua leve e funciona sem internet. O som busca a nostalgia dos jogos de 16 bits:
// caixinha de música, flauta, ondas quadradas com vibrato, harpa em arpejo, baixo de triângulo e bateria de ruído.
//
// Como se escreve uma trilha:
//   tom: semitons a partir do lá (220 Hz) · esc: escala de sete notas · bpm · tempos por compasso (4 ou 3)
//   prog: o grau do acorde de cada compasso (1 = tônica)
//   mel: a melodia, uma nota por casa. "5" é o quinto grau; "1'" uma oitava acima; "6," uma abaixo; "b5" bemol;
//        "-" segura a nota anterior; "." é pausa; "|" só separa os compassos para quem lê
//   div: casas por tempo na melodia (2 = colcheias) · riff: o baixo, em semicolcheias, contado a partir da nota do acorde
//   baixo / arp / bat: o jeito do acompanhamento · voz: o timbre da melodia
const ESC = {
  maior: [0, 2, 4, 5, 7, 9, 11], menor: [0, 2, 3, 5, 7, 8, 10], dorico: [0, 2, 3, 5, 7, 9, 10], frigio: [0, 1, 3, 5, 7, 8, 10],
  hijaz: [0, 1, 4, 5, 7, 8, 10], harmonica: [0, 2, 3, 5, 7, 8, 11], lidio: [0, 2, 4, 6, 7, 9, 11], mixolidio: [0, 2, 4, 5, 7, 9, 10]
};

export const TRILHAS = {
  /* ------------------------------ lugares de paz ------------------------------ */
  // o Refúgio: a casa. Caixinha de música sobre harpa, uma frase que sobe e volta
  refugio: { tom: 5, esc: 'maior', bpm: 84, voz: 'caixa', arp: 'harpa', baixo: 'andar', pad: 1, prog: [1, 5, 6, 4, 1, 5, 4, 1],
    mel: "5 - 1' - 3' - 2' 1' | 2' - 7 - 5 - - - | 6 - 1' - 3' - 2' 1' | 6 - - 5 4 - - - | 5 - 1' - 3' - 4' 3' | 2' - 7 - 2' - 5' - | 4' - 3' 2' 1' - 6 - | 1' - - - - - . ." },
  // a tela inicial: o tema do jogo. Começa só com a harpa e o piano, como quem sai de casa ao anoitecer; a melodia sobe na
  // segunda volta (a esperança do caminho) e desce de novo para casa. Lenta, em compasso de três, para ouvir sem cansar.
  abertura: { tom: 0, esc: 'maior', bpm: 66, tempos: 3, voz: 'piano', arp: 'harpa', baixo: 'longo', pad: 2, vol: 0.85, eco: 1.7, prog: [1, 5, 6, 3, 4, 1, 4, 5, 1, 5, 6, 3, 4, 1, 5, 1],
    mel: "3' - 5' | 4' 3' 2' | 1' - 3' | 5' - - | 6' - 5' | 4' - 3' | 2' - 1' | 2' - - | 3' - 5' | 1'' - 7' | 6' - 5' | 3' - - | 4' - 6' | 5' - 3' | 2' - 2' | 1' - - " },
  // a praia do sítio: o banco, o vento, os pelicanos. Uma valsa lenta de piano e harpa, de quem lembra de algo bom
  praia: { tom: 2, esc: 'maior', bpm: 62, tempos: 3, voz: 'piano', arp: 'harpa', baixo: 'longo', pad: 2, vol: 0.8, eco: 1.6, prog: [1, 3, 4, 1, 6, 4, 5, 1],
    mel: "3' - 5' - 1'' - | 7' - - 5' - - | 6' - 4' - 1' - | 3' - - - 2' - | 1' - 3' - 6' - | 5' - - 4' 3' - | 2' - 4' - 7 - | 1' - - - - ." },
  // a chuva: piano devagar, de quem olha a janela e lembra de casa
  chuva: { tom: -3, esc: 'maior', bpm: 58, voz: 'piano', arp: 'harpa', baixo: 'longo', pad: 2, vol: 0.7, eco: 1.8, prog: [1, 6, 4, 5, 1, 3, 6, 4],
    mel: "5 - - 3' - - 2' 1' | 1' - - - 6 - - - | 4 - - 1' - 7 6 - | 5 - - - - - . . | 5 - - 3' - - 5' 4' | 3' - - - 2' - - - | 1' - - 6 - 5 4 - | 5 - - - - - . ." },
  // o Bosque do Treino e a arena: leve, de quem está começando
  bosque: { tom: 3, esc: 'maior', bpm: 104, voz: 'flauta', arp: 'harpa', baixo: 'andar', bat: 'leve', prog: [1, 4, 1, 5, 1, 4, 5, 1],
    mel: "1' . 3' . 5' - 3' - | 4' . 6' . 4' - - - | 3' . 1' . 5' - 3' - | 2' - 7 - 5 - - . | 1' . 3' . 5' - 6' - | 6' - 4' - 1' - 4' - | 2' - 4' - 7 - 2' - | 1' - - - - - . ." },
  // a Floresta Escura: poucas notas, muito eco
  floresta: { tom: 0, esc: 'dorico', bpm: 66, voz: 'caixa', baixo: 'longo', pad: 1, eco: 1.5, prog: [1, 4, 1, 7],
    mel: "1' - - 3' - - 2' - | 6 - - - 4 - - - | 5 - - 1' - - 7 - | 2' - - - 7 - - -" },
  // o jardim (Getsêmani): uma valsa lenta de flauta e harpa
  jardim: { tom: 7, esc: 'menor', bpm: 60, tempos: 3, voz: 'flauta', arp: 'harpa', baixo: 'longo', pad: 1, prog: [1, 6, 3, 7, 1, 4, 5, 1],
    mel: "5 - 1' - 3' - | 3' - 1' - 6 - | 5 - 7 - 2' - | 2' - - 7 - . | 1' - 3' - 5' - | 4' - - 1' 6 - | 5 - 7 - 2' - | 1' - - - - ." },
  // o encontro com Jesus: um hino, baixinho, por baixo das falas
  encontro: { tom: 3, esc: 'maior', bpm: 56, voz: 'caixa', arp: 'harpa', baixo: 'longo', pad: 2, vol: 0.7, eco: 1.4, prog: [1, 4, 1, 5, 6, 4, 5, 1],
    mel: "5 - 1' - 3' - - - | 4' - 3' - 1' - 6 - | 5 - 1' - 3' - 5' - | 2' - - - - - 7 - | 1' - 3' - 6' - 5' - | 4' - - 3' 1' - 6 - | 5 - 7 - 2' - 4' - | 3' - - - 1' - - -" },
  // Sardes apagada: piano grave e sozinho
  sardes: { tom: -2, esc: 'harmonica', bpm: 58, voz: 'piano', baixo: 'longo', pad: 1, eco: 1.5, prog: [1, 6, 4, 5],
    mel: "1 - - 3 - 2 1 - | 6, - - - 1 - - - | 4 - - 6 - 5 4 - | 5 - - - 2 - 7, -" },
  // Sardes acesa: a mesma frase, agora em maior
  sardes2: { tom: -2, esc: 'maior', bpm: 72, voz: 'caixa', arp: 'harpa', baixo: 'andar', pad: 1, prog: [1, 6, 4, 5],
    mel: "1' - - 3' - 2' 1' - | 6 - - - 1' - - - | 4' - - 6' - 5' 4' - | 5' - - - 2' - 7 -" },
  // o Vale da Mentira: nada aqui é o que parece
  vale: { tom: 1, esc: 'frigio', bpm: 76, voz: 'quadrada', baixo: 'longo', pad: 1, eco: 1.4, prog: [1, 2, 1, 7],
    mel: "1' - - 2' 1' - 5 - | 2' - - 4' 2' - 6 - | 1' - 3' - 5' - 4' 3' | 7 - - 2' 7 - 4 -" },
  // o Vale de Elá: os dois exércitos esperando
  ela: { tom: -7, esc: 'menor', bpm: 92, voz: 'flauta', baixo: 'andar', bat: 'marcha', pad: 1, oit: 1, prog: [1, 7, 6, 5],
    mel: "1' - 5 - 1' 2' 3' - | 7 - 4 - 7 1' 2' - | 6 - 3 - 6 7 1' - | 5 - - 7 2' - - -" },

  // as páginas vivas da história
  sarepta: { tom: 2, esc: 'hijaz', bpm: 72, voz: 'flauta', baixo: 'longo', pad: 1, eco: 1.3, prog: [1, 2, 1, 1],
    mel: "1' - - 3' 2' - 1' - | 2' - - 4' 6 - - - | 5' - 4' 3' 2' - 3' - | 1' - - - 7 - 1' -" },
  jerico: { tom: 7, esc: 'dorico', bpm: 96, voz: 'flauta', arp: 'harpa', baixo: 'andar', bat: 'leve', prog: [1, 7, 4, 1],
    mel: "1' - 3' 4' 5' - 4' 3' | 2' - 7 2' 4' - 2' - | 1' - 4' 6' 4' - 1' - | 3' - 2' 1' 1' - . ." },
  masmorra: { tom: -3, esc: 'frigio', bpm: 62, voz: 'piano', baixo: 'longo', bat: 'timpano', pad: 2, eco: 1.6, oit: 1, prog: [1, 2, 1, 6],
    mel: "1 - - 5 - - 3 - | 2 - - 6 - - 4 - | 1 - 3 - 5 - 7 - | 6 - - 3 - - 1 -" },

  /* ------------------------------ as páginas (uma por fase) ------------------------------ */
  agora: { tom: 2, esc: 'dorico', bpm: 92, voz: 'flauta', arp: 'harpa', baixo: 'andar', bat: 'leve', prog: [1, 4, 1, 7],
    mel: "1' - 2' 3' 4' - 3' 2' | 6 - 1' - 4' - 1' - | 5' - 3' 1' 3' - 5' - | 4' - 2' 7 2' - - -" },
  oficina: { tom: 5, esc: 'menor', bpm: 100, voz: 'piano', baixo: 'andar', bat: 'martelo', prog: [1, 3, 6, 7],
    mel: "1' 5 1' 3' . 3' 2' 1' | 7 5 7 2' . 2' 1' 7 | 6 3 6 1' . 1' 7 6 | 7 - 2' - 4' - 2' -" },
  sinagoga: { tom: 2, esc: 'hijaz', bpm: 70, voz: 'flauta', baixo: 'longo', pad: 1, eco: 1.3, prog: [1, 2, 1, 1],
    mel: "1' - 2' 3' - 2' 1' - | 2' - 4' - 6 - 2' - | 3' - 4' 5' - 4' 3' 2' | 1' - - - 7 1' - -" },
  casa: { tom: 8, esc: 'maior', bpm: 76, tempos: 3, voz: 'caixa', arp: 'harpa', baixo: 'longo', pad: 1, prog: [1, 6, 4, 5],
    mel: "3' - 5' - 3' - | 1' - 3' - 6 - | 6 - 1' - 4' - | 2' - 7 - 5 -" },
  tribunal: { tom: 0, esc: 'harmonica', bpm: 84, voz: 'piano', baixo: 'longo', bat: 'timpano', pad: 2, prog: [1, 5, 6, 5],
    mel: "1 - - 5 3' - 2' 1' | 7 - - 5 2' - 1' 7 | 6 - - 3 1' - 3' 1' | 5 - 7 - 2' - - -" },
  jope: { tom: 7, esc: 'mixolidio', bpm: 96, tempos: 3, voz: 'flauta', arp: 'harpa', baixo: 'valsa', prog: [1, 7, 4, 1],
    mel: "1' - 3' 5' - 3' | 7 - 2' 4' - 2' | 6 - 1' 4' - 1' | 5 - 3' 1' - -" },
  conves: { tom: 3, esc: 'menor', bpm: 132, voz: 'quadrada', baixo: 'pulso', bat: 'tempestade', pad: 1, prog: [1, 7, 6, 5],
    mel: "1' - 3' 1' 5' - 3' 1' | 7 - 2' 7 4' - 2' 7 | 6 - 1' 6 3' - 1' 6 | 5 - 7 2' 5' - - -" },
  ventre: { tom: -5, esc: 'frigio', bpm: 50, voz: 'caixa', baixo: 'longo', pad: 2, eco: 1.7, oit: 1, prog: [1, 6, 1, 2],
    mel: "1' - - - 5 - - - | 6 - - 3' - - 1' - | 1' - - 3' - - 5' - | 2' - - - 4 - - -" },
  ninive: { tom: 5, esc: 'hijaz', bpm: 108, voz: 'flauta', baixo: 'andar', bat: 'marcha', prog: [1, 2, 1, 1],
    mel: "1' 1' 2' 3' . 3' 2' 1' | 2' 2' 4' 2' . 6 2' 4' | 5' 4' 3' 2' 1' - 3' - | 1' - 5 - 1' - . ." },
  sombra: { tom: 7, esc: 'dorico', bpm: 72, voz: 'piano', baixo: 'longo', pad: 1, prog: [1, 4, 1, 5],
    mel: "5 - 1' 2' 3' - - - | 4' - 1' 6 4 - - - | 5 - 1' 2' 3' - 5' - | 2' - - 7 5 - - -" },
  palacio: { tom: 4, esc: 'harmonica', bpm: 80, voz: 'caixa', arp: 'harpa', baixo: 'longo', pad: 1, prog: [1, 6, 4, 5],
    mel: "1' - 3' - 5' - 3' - | 6 - 1' - 3' - 1' - | 4 - 6 - 1' - 6 - | 5 - 7 - 2' - 7 -" },
  arvore: { tom: 0, esc: 'lidio', bpm: 68, voz: 'flauta', arp: 'harpa', baixo: 'longo', pad: 1, prog: [1, 2, 1, 5],
    mel: "1' - - 3' 5' - 4' 3' | 2' - - 4' 6' - 4' 2' | 3' - - 5' 1' - 3' - | 2' - 7 - 5 - - -" },
  terraco: { tom: -2, esc: 'menor', bpm: 88, voz: 'serra', baixo: 'andar', bat: 'timpano', pad: 1, oit: 1, prog: [1, 6, 3, 7],
    mel: "1 - 5 - 1' - - 7 | 6 - 3 - 6 - - 1' | 3 - 7 - 3' - - 2' | 7 - 4 - 2' - - -" },
  campo: { tom: 9, esc: 'dorico', bpm: 60, voz: 'flauta', baixo: 'longo', pad: 1, eco: 1.4, prog: [1, 7, 4, 1],
    mel: "1' - - 2' 3' - 5' - | 4' - - 2' 7 - - - | 6 - - 1' 4' - 3' 2' | 1' - - - 5 - - -" },
  aurora: { tom: 10, esc: 'maior', bpm: 80, voz: 'caixa', arp: 'harpa', baixo: 'andar', pad: 2, oit: -1, prog: [1, 5, 6, 4],
    mel: "1' - 2' 3' 5' - - - | 5' - 4' 2' 7 - - - | 6 - 1' 3' 6' - 5' 3' | 4' - 3' 1' 6 - 1' -" },

  /* ------------------------------ batalhas ------------------------------ */
  // toda luta contra vícios: nas câmaras das páginas, nas ruas de Sardes
  batalha: { tom: 0, esc: 'menor', bpm: 152, voz: 'quadrada', baixo: 'pulso', arp: 'chip', bat: 'rock', luta: 1, prog: [1, 6, 7, 1, 1, 6, 7, 5],
    mel: "1' . 1' 2' 3' - 2' 1' | 6 . 6 1' 3' - 1' 6 | 7 . 7 2' 4' - 2' 7 | 1' - 5 - 1' - . . | 3' . 3' 4' 5' - 4' 3' | 6' - 5' 3' 1' - 3' - | 4' - 2' 7 2' - 4' - | 5' - 4' 2' 7 - 5 -" },
  // as provas em grupo e o Desafio das ondas: a mais rápida de todas
  raid: { tom: 2, esc: 'harmonica', bpm: 176, div: 4, voz: 'serra', riff: "1 . 1 1 8 . 1 1 5 . 1 1 8 . 7 8", arp: 'chip', bat: 'duplo', luta: 1, prog: [1, 6, 4, 5],
    mel: "1' - 5 1' 3' - 1' 3' 5' - 4' 3' 2' - 1' - | 6 - 3 6 1' - 6 1' 3' - 2' 1' 6 - 1' - | 4 - 1' 4' 6' - 4' 1' 6 - 1' 4' 6' - 4' - | 5' - 2' 7 5 - 7 2' 5' - 4' 2' 7 - 2' -" },

  /* ------------------------------ os chefes: cada um com o seu riff ------------------------------ */
  // a Raiz de Amargura: órgão e um baixo que sobe sem parar
  amargura: { tom: 1, esc: 'frigio', bpm: 168, div: 4, voz: 'orgao', riff: "1 . 1 2 1 . 1 3 1 . 1 4 5 4 3 2", arp: 'chip', bat: 'duplo', luta: 1, pad: 1, prog: [1, 1, 6, 2, 1, 1, 3, 2],
    mel: "1' - - - 2' - 1' - 5 - - - - - 3' - | 1' - - - 2' - 3' - 5' - - - 4' - 3' - | 6 - 1' - 3' - 1' - 6 - 1' - 3' - 6' - | 2' - 4' - 6 - 4' - 2' - - - 1' - - - | 1' - - - 2' - 1' - 5 - - - - - 3' - | 5' - 4' - 3' - 2' - 1' - 2' - 3' - 5' - | 3' - 5' - 7 - 5' - 3' - 5' - 7' - 5' - | 4' - 2' - 6 - 2' - 1' - - - . . . ." },
  raiz: { tom: 1, esc: 'frigio', bpm: 54, voz: 'piano', baixo: 'longo', pad: 2, eco: 1.7, oit: 1, prog: [1, 2, 1, 6],
    mel: "1 - - - 2 - 1 - | 4 - - 2 - - 6, - | 1 - 3 - 5 - 3 - | 6, - - - 1 - - -" },
  // o Conselho Zelote: a luta mais dura. Tambores de guerra, um riff que não para
  conselho: { tom: 4, esc: 'hijaz', bpm: 178, div: 4, voz: 'serra', riff: "1 1 8 1 2 1 8 1 1 1 8 1 4 3 2 1", arp: 'chip', bat: 'guerra', luta: 1, prog: [1, 1, 2, 1, 1, 1, 7, 1],
    mel: "1' - - 1' 2' - 1' - 5 - - 5 1' - - - | 3' - - 3' 4' - 3' - 1' - - 1' 3' - - - | 2' - - 2' 4' - 2' - 6 - - 6 2' - 4' - | 3' - 2' - 1' - 7 - 1' - - - . . 5 - | 1' - - 1' 2' - 1' - 5 - - 5 1' - - - | 5' - - 5' 4' - 3' - 2' - 3' - 1' - - - | 7 - 2' - 4' - 2' - 7 - 2' - 4' - 6' - | 5' - 4' - 3' - 2' - 1' - - - . . . ." },
  // as sombras das páginas vivas
  escassez: { tom: 2, esc: 'hijaz', bpm: 118, voz: 'flauta', riff: "1 . . 1 . 1 . . 1 . . 1 . 2 1 .", bat: 'tribal', luta: 1, pad: 1, prog: [1, 1, 2, 1],
    mel: "1' - - 2' 1' - 5 - | 3' - - 2' 1' - - - | 2' - 4' - 6 - 2' - | 1' - 7 - 1' . . ." },
  desprezo: { tom: 6, esc: 'menor', bpm: 146, voz: 'serra', riff: "1 1 . 1 1 . 1 1 . 1 1 . 5 . 7 .", bat: 'guerra', luta: 1, prog: [1, 6, 7, 5],
    mel: "5' . 5' . 5' - 3' - | 6' . 6' . 6' - 3' - | 7 . 7 . 2' - 4' - | 5' - 4' - 2' - 7 -" },
  carcere: { tom: -1, esc: 'harmonica', bpm: 134, voz: 'orgao', riff: "1 . 8 1 . 8 1 . 5 . 8 5 . 8 7 8", bat: 'bigorna', luta: 1, prog: [1, 4, 5, 1],
    mel: "1' - 3' - 5' - 3' 1' | 4' - 6' - 4' - 1' - | 5' - 7 - 2' - 5' - | 1' - - 5 1' - . ." },
  mamom: { tom: 0, esc: 'harmonica', bpm: 150, voz: 'quadrada', riff: "1 . 1 8 . 1 5 . 1 . 1 8 . 5 7 8", bat: 'rock', luta: 1, prog: [1, 1, 6, 5],
    mel: "1' 3' 5' 3' 1' 3' 5' - | 1' 3' 5' 3' 8' 5' 3' - | 6 1' 3' 1' 6 1' 3' - | 5 7 2' 7 5' 4' 2' 7" },
  procrastinacao: { tom: 5, esc: 'dorico', bpm: 126, voz: 'flauta', riff: "1 . 8 . 1 . 8 . 1 . 8 . 1 8 1 8", bat: 'relogio', luta: 1, prog: [1, 4, 1, 7],
    mel: "5' - - - 4' - 3' - | 4' - - - 6 - 1' - | 5' - - - 4' - 3' 1' | 2' - - 7 4 - 2' -" },
  mentira: { tom: 3, esc: 'frigio', bpm: 144, voz: 'quadrada', riff: "1 2 1 . 1 2 1 . 1 2 3 2 1 . 5, .", bat: 'rock', luta: 1, prog: [1, 2, 1, 2],
    mel: "1' 2' 3' 2' 1' 7 6 7 | 1' 7 6 7 1' 2' 3' 2' | 5' 4' 3' 4' 5' 6' 5' 4' | 4' 2' 6 2' 4' - 2' -" },
  imoralidade: { tom: 7, esc: 'hijaz', bpm: 120, voz: 'serra', riff: "1 . . 5 8 . 5 . 1 . . 5 8 . 5 .", bat: 'tango', luta: 1, prog: [1, 2, 1, 1],
    mel: "3' - 2' 1' 2' - 1' 7 | 2' - 4' 6' 4' - 2' 6 | 5' - 4' 3' 4' - 3' 2' | 1' - - - 3' 2' 1' -" },
  satanas: { tom: -3, esc: 'harmonica', bpm: 160, voz: 'orgao', riff: "1 1 8 1 1 8 1 1 b5 b5 5 b5 1 1 8 1", bat: 'duplo', luta: 1, oit: 1, prog: [1, 6, 4, 5],
    mel: "1' - - 7 1' - 3' - | 6 - 1' - 3' - 6' - | 4' - 6' - 4' 3' 2' 1' | 7 - 2' - 5' - 7' -" },
  fuga: { tom: 2, esc: 'menor', bpm: 168, voz: 'quadrada', riff: "1 3 5 8 5 3 1 3 5 8 5 3 1 5 8 5", bat: 'rock', luta: 1, prog: [1, 7, 6, 5],
    mel: "1' 2' 3' 1' 5' - 3' - | 7 1' 2' 7 4' - 2' - | 6 7 1' 6 3' - 1' - | 5 7 2' 5' 4' 2' 7 5" },
  pavor: { tom: 5, esc: 'harmonica', bpm: 138, voz: 'quadrada', riff: "1 1 1 1 1 1 1 1 b2 b2 b2 b2 1 1 1 1", bat: 'tempestade', luta: 1, prog: [1, 1, 1, 5],
    mel: "5' - - 6' 5' - - - | 5' - - 6' 7' - 5' - | 3' - - 4' 3' - - 2' | 2' - 7 - 5 . . ." },
  desespero: { tom: -5, esc: 'frigio', bpm: 96, voz: 'serra', riff: "1 . . . . . 1 . 1 . . . 5, . 6, .", bat: 'pesado', luta: 1, pad: 1, oit: 1, prog: [1, 1, 3, 2],
    mel: "1' - - - - - 2' - | 3' - - - 2' - 1' - | 5' - - - - - 4' - | 4' - 2' - 1' - - -" },
  violencia: { tom: 0, esc: 'hijaz', bpm: 156, voz: 'serra', riff: "1 . 1 1 . 1 1 . 1 . 1 1 . 2 3 2", bat: 'guerra', luta: 1, prog: [1, 2, 1, 1],
    mel: "1' - 1' - 3' 2' 1' - | 2' - 2' - 4' 3' 2' - | 5' - 5' - 4' 3' 2' 1' | 1' - . 1' 1' - . ." },
  ressentimento: { tom: 8, esc: 'dorico', bpm: 132, voz: 'piano', riff: "1 . 5 . 8 . 5 . 1 . 5 . 7 . 5 .", bat: 'rock', luta: 1, prog: [1, 4, 1, 5],
    mel: "3' - 2' 1' 5 - - - | 4' - 3' 2' 6 - - - | 3' - 2' 1' 5 - 1' 3' | 2' - 1' 7 5 - - -" },
  encantadores: { tom: 4, esc: 'hijaz', bpm: 128, voz: 'flauta', riff: "1 . 8 . 5 . 8 . 1 . 8 . 6 5 4 3", bat: 'tango', luta: 1, pad: 1, prog: [1, 1, 1, 1],
    mel: "1' 2' 3' 2' 1' 2' 3' 4' | 5' - 4' 3' 2' - 1' - | 3' 4' 5' 4' 3' 4' 5' 6' | 5' 4' 3' 2' 1' - . ." },
  jugo: { tom: -4, esc: 'menor', bpm: 110, voz: 'serra', riff: "1 . . 1 . . 1 . 1 . . 1 . 5, 7, .", bat: 'bigorna', luta: 1, oit: 1, prog: [1, 6, 7, 1],
    mel: "1' - 3' - 5' - 4' 3' | 6 - 1' - 3' - 2' 1' | 7 - 2' - 4' - 3' 2' | 1' - - - 5 - 1' -" },
  babilonia: { tom: 3, esc: 'mixolidio', bpm: 140, voz: 'serra', riff: "1 . 1 . 5 . 5 . 1 . 1 . 7, . 7, .", bat: 'guerra', luta: 1, prog: [1, 7, 1, 4],
    mel: "1' . 1' 1' 3' - 5' - | 7 . 7 7 2' - 4' - | 1' . 1' 1' 3' - 5' - | 6' - 4' - 1' - 4' -" },
  fera: { tom: 7, esc: 'menor', bpm: 164, voz: 'quadrada', riff: "1 . . 1 . . 1 . . 1 . . 3 . 4 .", bat: 'tribal', luta: 1, prog: [1, 1, 1, 7],
    mel: "5' - - - 3' - 1' - | 5' - - - 6' - 5' - | 1' 3' 5' 3' 1' 3' 5' 3' | 4' - 2' - 7 - . ." },
  soberba: { tom: 10, esc: 'harmonica', bpm: 148, voz: 'orgao', riff: "1 8 1 8 5 8 5 8 6 8 6 8 5 8 7 8", bat: 'duplo', luta: 1, oit: -1, prog: [1, 6, 4, 5],
    mel: "5' - 3' - 1' - 5 - | 6 - 1' - 3' - 6' - | 4' - 6' - 4' - 1' - | 5' - 4' - 2' - 7 -" },
  golias: { tom: -7, esc: 'menor', bpm: 100, voz: 'serra', riff: "1 . . . 1 . . . 1 . . . 1 . 1 1", bat: 'pesado', luta: 1, oit: 1, prog: [1, 7, 6, 5],
    mel: "1 - - 5 - - 1' - | 7, - - 4 - - 7 - | 6, - - 3 - - 6 - | 5, - - 2 - 5 7 -" },
  behemote: { tom: -8, esc: 'frigio', bpm: 92, voz: 'serra', riff: "1 . 1 . . . 1 . 2 . 1 . . . 5, .", bat: 'pesado', luta: 1, pad: 1, oit: 1, prog: [1, 1, 1, 2],
    mel: "1 - - - 2 - 1 - | 1 - - - 3 - 2 - | 5 - - - 4 - 3 - | 2 - 1 - - - . ." },
  leviata: { tom: 1, esc: 'menor', bpm: 150, voz: 'quadrada', riff: "1 5 8 5 1 5 8 5 1 5 8 5 1 5 8 5", bat: 'tempestade', luta: 1, pad: 1, prog: [1, 6, 7, 1],
    mel: "5' - 3' - 1' - 3' - | 6' - 3' - 1' - 3' - | 7 - 2' - 4' - 2' - | 1' - 3' - 5' - - -" }
};
// trilhas que servem a mais de um lugar
const APELIDOS = { zeloteFoice: 'conselho', zelotePunhal: 'conselho', zelotes: 'masmorra', treino: 'bosque', desafio: 'raid', getsemani: 'jardim', getsemani2: 'jardim', ermo: 'sombra', mar: 'conves', porto: 'jope', pecado: 'desespero', dragao: 'mentira', chefe: 'batalha' };
// ---- a fase da célula ("Jesus me escolheu"): uma batalha épica para cada chefe ----
Object.assign(TRILHAS, {
  // A Rejeição: mi menor, marcha larga, coro e cordas, a melodia sobe como quem não aceita o "ninguém"
  rejeicao: { tom: 7, esc: 'menor', bpm: 150, voz: 'serra', bat: 'epico', luta: 1, coro: 1, cordas: 1, metal: 1, prato: 1, riff: "1 . 1 1 . 1 1 . 1 . 1 1 . 5 7 8", prog: [1, 6, 3, 7, 1, 6, 4, 5],
    mel: "1' - - 7 1' - 3' - | 1' - 7 6 7 - 5 - | 3' - - 2' 3' - 5' - | 4' - 3' 2' 4' - 2' - | 5' - - 4' 5' - 6' - | 3' - 2' 1' 3' - 1' - | 6 - 1' - 4' - 3' 2' | 2' - 7 - 5 - 7 -" },
  // O Interesseiro: menor harmônica com balanço de tango, metais de cassino e cordas em pulso
  interesseiro: { tom: 2, esc: 'harmonica', bpm: 138, voz: 'quadrada', bat: 'marchaEpica', luta: 1, metal: 1, cordas: 2, prato: 1, riff: "1 . . 1 5 . 1 . 1 . . 1 5 . 7 .", prog: [1, 4, 5, 1, 6, 4, 5, 5],
    mel: "5' . 5' 6' 5' - 3' - | 4' . 4' 5' 4' - 1' - | 7 - 2' - 4' - 2' 7 | 1' - 3' 5' 1'' - . . | 6' . 6' 7' 6' - 4' - | 4' . 3' 4' 6' - 4' - | 2' - 4' - 7' - 5' - | 7 - 2' - 5' 4' 2' 7" },
  // A Condenação: frígio pesado, órgão e taikos, o coro grave como sentença
  condenacao: { tom: -2, esc: 'frigio', bpm: 118, voz: 'orgao', bat: 'epico2', luta: 1, coro: 1, metal: 1, prato: 1, oit: 1, riff: "1 . 1 . 1 1 . 1 2 . 1 . 1 1 2 1", prog: [1, 2, 1, 7, 1, 2, 6, 7],
    mel: "1' - - - 2' - 1' - | 3' - 2' - 1' - 7 - | 1' - - - 2' - 3' - | 2' - 1' - 7 - 6 - | 5 - 6 - 7 - 1' - | 2' - - 3' 2' - 1' - | 6 - 7 - 1' - 3' - | 2' - - - 7 - - -" },
  // A Covardia: tempestade em galope, cordas nervosas, a melodia foge e volta
  covardia: { tom: 5, esc: 'harmonica', bpm: 172, voz: 'quadrada', bat: 'galope', luta: 1, cordas: 1, coro: 1, prato: 1, riff: "1 1 8 1 1 8 1 1 b2 b2 8 b2 1 1 5 1", prog: [1, 6, 7, 1, 4, 6, 5, 5],
    mel: "5' 4' 3' 4' 5' - 1' - | 6' 5' 4' 5' 6' - 3' - | 7' 6' 5' 6' 7' - 2' - | 1'' - 7' - 5' - . . | 4' 3' 2' 3' 4' - 6 - | 3' 2' 1' 2' 3' - 6 - | 2' 3' 4' 5' 7' - 5' - | 7 - 2' - 5' - 7' -" },
  // O Fracasso: o último chefe. Órgão, coro, cordas, metais e taikos: tudo junto, e a melodia de quem não desiste
  fracasso: { tom: -3, esc: 'harmonica', bpm: 162, voz: 'orgao', bat: 'epico2', luta: 1, oit: 1, coro: 1, cordas: 2, metal: 1, prato: 1, riff: "1 1 8 1 1 8 1 1 b6 b6 8 b6 5 5 7 5", prog: [1, 6, 4, 5, 1, 6, 2, 5],
    mel: "1' - - 7 1' - 5' - | 6' - 5' 4' 3' - 1' - | 4' - - 3' 4' - 6' - | 7' - - - 5' - - - | 1'' - - 7' 1'' - 5' - | 6' - 5' 4' 3' - 4' - | 2' - 3' - 4' - 6' - | 7' - 6' - 7' - 2'' -" }
});
export const trilhaDe = id => TRILHAS[id] || TRILHAS[APELIDOS[id]] || null;

// batidas: k = bumbo, s = caixa, h = chimbal, t = tímpano, m = metal; em semicolcheias (16 por compasso de quatro tempos)
const BATIDAS = {
  leve: 'k...h...k...h.h.', marcha: 'k.h.s.h.k.hhs.h.', martelo: 'm...h...m...h.m.', timpano: 't...........t.t.', tempestade: 'k.hhk.hhk.hhkshh',
  rock: 'k.h.s.h.k.k.s.h.', duplo: 'khkhshkhkhkhshkh', relogio: 'h...m...h...m...', tango: 'k..hs.h.k..hs.hh', pesado: 'k.......s.....k.',
  guerra: 'k.kks.k.k.kks.ss', bigorna: 'k...m...k.k.m...', tribal: 'k..k..k..k..s.s.',
  // épicas (a fase da célula): T = taiko, c = prato no começo do compasso
  epico: 'T.kTs.k.T.kTs.ks', epico2: 'TkkTs.kkTkkTsTss', marchaEpica: 'T...s..kT.k.s.ss', galope: 'TkkskkTkkskksTss'
};

function ler(mel, esc) { // "5 - 1' ." → [{ casa, st, dur }]
  const casas = mel.split(/\s+/).filter(t => t && t !== '|'), notas = []; let ult = null;
  casas.forEach((tk, i) => {
    if (tk === '-') { if (ult) ult.dur++; return; }
    if (tk === '.') { ult = null; return; }
    const m = /^([b#]?)(\d)([',]*)$/.exec(tk); if (!m) { ult = null; return; }
    const g = +m[2] - 1, oit = Math.floor(g / 7) + (m[3].split("'").length - 1) - (m[3].split(',').length - 1);
    notas.push(ult = { casa: i, g, st: esc[g % 7] + 12 * oit + (m[1] === 'b' ? -1 : m[1] === '#' ? 1 : 0), dur: 1 });
  });
  return { notas, casas: casas.length };
}

// Toca uma trilha em laço. Devolve { parar() }. Com "ate" (segundos), agenda tudo de uma vez e não repete: serve para gravar num OfflineAudioContext.
export function tocar(AC, saida, eco, id, ate) {
  const tr = trilhaDe(id); if (!tr) return null;
  const esc = ESC[tr.esc] || ESC.menor, tempos = tr.tempos || 4, div = tr.div || 2, beat = 60 / tr.bpm, vol = tr.vol || 1;
  const mel = ler(tr.mel, esc), casasComp = tempos * div, comps = Math.round(mel.casas / casasComp), semi = beat / 4, semisComp = tempos * 4;
  const riff = tr.riff ? ler(tr.riff, esc) : null, bat = BATIDAS[tr.bat] || null;
  const hz = st => 220 * Math.pow(2, (tr.tom + st) / 12);
  const grau = (g, oit = 0) => esc[((g % 7) + 7) % 7] + 12 * (Math.floor(g / 7) + oit); // grau (0 = tônica) → semitons
  const melOit = tr.oit || 0;
  let baixoOit = -2; while (hz(12 * baixoOit) < 48) baixoOit++; while (hz(12 * baixoOit) > 110) baixoOit--;
  const mandaEco = (g, k = 1) => { if (eco) { const e = AC.createGain(); e.gain.value = 0.5 * (tr.eco || 1) * k; g.connect(e); e.connect(eco); } };
  const env = (t, dur, v, ataque = 0.006, solta = 0.08, cai = 1) => { const g = AC.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + ataque); if (cai < 1) g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v * cai), t + Math.max(ataque + 0.01, dur)); else g.gain.setValueAtTime(v, t + Math.max(ataque, dur - 0.01)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + solta); g.connect(saida); return g; };
  const osc = (tipo, f, t, fim, dest, des = 0, vib = 0) => { const o = AC.createOscillator(); o.type = tipo; o.frequency.setValueAtTime(f, t); o.detune.value = des; if (vib) { const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = 5.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(vib, t + 0.22); l.connect(lg); lg.connect(o.detune); l.start(t); l.stop(fim); } o.connect(dest); o.start(t); o.stop(fim); return o; };
  const filtro = (tipo, f, dest, q = 0.6) => { const b = AC.createBiquadFilter(); b.type = tipo; b.frequency.value = f; b.Q.value = q; b.connect(dest); return b; };
  // ---- timbres ----
  const VOZES = {
    caixa(f, t, dur, v) { const d = Math.max(dur, 0.9), g = env(t, d, v, 0.004, 0.3, 0.04); osc('sine', f, t, t + d + 0.4, g); const h = AC.createGain(); h.gain.value = 0.22; h.connect(g); osc('sine', f * 4, t, t + 0.5, h); const h2 = AC.createGain(); h2.gain.value = 0.3; h2.connect(g); osc('triangle', f * 2, t, t + d + 0.4, h2); mandaEco(g); },
    piano(f, t, dur, v) { const d = Math.max(dur, 1.1), g = env(t, d, v * 1.1, 0.008, 0.4, 0.06); osc('sine', f, t, t + d + 0.5, g); const h = AC.createGain(); h.gain.value = 0.3; h.connect(g); osc('sine', f * 2, t, t + d + 0.5, h); const h2 = AC.createGain(); h2.gain.value = 0.08; h2.connect(g); osc('triangle', f * 3, t, t + d + 0.5, h2); mandaEco(g); },
    flauta(f, t, dur, v) { const g = env(t, dur, v * 0.9, 0.05, 0.14); osc('triangle', f, t, t + dur + 0.2, g, 0, 9); const h = AC.createGain(); h.gain.value = 0.35; h.connect(g); osc('sine', f * 2, t, t + dur + 0.2, h, 0, 9); mandaEco(g); },
    quadrada(f, t, dur, v) { const g = env(t, dur, v * 0.34, 0.006, 0.07, 0.6), lp = filtro('lowpass', 2600, g); osc('square', f, t, t + dur + 0.1, lp, 0, 10); mandaEco(g, 0.7); },
    serra(f, t, dur, v) { const g = env(t, dur, v * 0.32, 0.02, 0.1, 0.75), lp = filtro('lowpass', 1700, g, 1.2); osc('sawtooth', f, t, t + dur + 0.15, lp, -7, 6); osc('sawtooth', f, t, t + dur + 0.15, lp, 7, 6); mandaEco(g, 0.6); },
    orgao(f, t, dur, v) { const g = env(t, dur, v * 0.3, 0.015, 0.12), lp = filtro('lowpass', 2200, g); for (const [m, k] of [[1, 1], [2, 0.6], [3, 0.3], [4, 0.2]]) { const x = AC.createGain(); x.gain.value = k; x.connect(lp); osc('sine', f * m, t, t + dur + 0.15, x); } osc('square', f / 2, t, t + dur + 0.15, lp); mandaEco(g, 0.8); }
  };
  // camadas épicas: coro ("ah", serras num filtro de vogal), cordas curtas em ostinato e metais que marcam o acorde
  const coro = (sts, t, d, v) => { for (const st of sts) for (const des of [-9, 0, 9]) { const g = AC.createGain(), bp = filtro('bandpass', 760, g, 1.4), bp2 = filtro('bandpass', 1180, g, 2); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + d * 0.25); g.gain.linearRampToValueAtTime(v * 0.85, t + d * 0.8); g.gain.linearRampToValueAtTime(0.0001, t + d * 1.05); g.connect(saida); mandaEco(g, 1.2); const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = hz(st); o.detune.value = des; o.connect(bp); o.connect(bp2); o.start(t); o.stop(t + d * 1.1); } };
  const corda = (f, t, d, v) => { const g = env(t, d, v * 0.5, 0.004, 0.05, 0.35), lp = filtro('lowpass', 2400, g, 0.9); osc('sawtooth', f, t, t + d + 0.06, lp, -5); osc('sawtooth', f, t, t + d + 0.06, lp, 6); };
  const metal = (sts, t, d, v) => { for (const st of sts) { const g = env(t, d, v * 0.3, 0.03, 0.12, 0.6), lp = filtro('lowpass', 1500, g, 1.6); osc('sawtooth', hz(st), t, t + d + 0.15, lp, -4); osc('square', hz(st), t, t + d + 0.15, lp, 5); mandaEco(g, 0.6); } };
  const harpa = (f, t, v) => { const g = env(t, 0.7, v, 0.004, 0.2, 0.05); osc('triangle', f, t, t + 1, g); mandaEco(g, 0.8); };
  const chip = (f, t, d, v) => { const g = env(t, d, v * 0.3, 0.003, 0.02, 0.5); osc('square', f, t, t + d + 0.03, g); };
  const baixo = (f, t, d, v, sujo) => { const g = env(t, d, v, 0.008, 0.06, 0.7); osc('triangle', f, t, t + d + 0.08, g); if (sujo) { const s = AC.createGain(); s.gain.value = 0.28; const lp = filtro('lowpass', 520, g); s.connect(lp); osc('sawtooth', f, t, t + d + 0.08, s); } };
  const tapete = (sts, t, d, v) => { const g = AC.createGain(), lp = filtro('lowpass', 780, g, 0.4); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + d * 0.3); g.gain.linearRampToValueAtTime(v * 0.8, t + d * 0.75); g.gain.linearRampToValueAtTime(0.0001, t + d * 1.12); g.connect(saida); for (const st of sts) for (const des of [-6, 6]) osc('sawtooth', hz(st), t, t + d * 1.15, lp, des); mandaEco(g, 0.6); };
  let ruido = null;
  const chiado = (t, d, v, tipo, f) => { if (!ruido) { ruido = AC.createBuffer(1, AC.sampleRate * 0.4, AC.sampleRate); const dd = ruido.getChannelData(0); for (let i = 0; i < dd.length; i++) dd[i] = Math.random() * 2 - 1; } const n = AC.createBufferSource(); n.buffer = ruido; const g = AC.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); const fl = filtro(tipo, f, g, 0.8); n.connect(fl); g.connect(saida); n.start(t, Math.random() * 0.2); n.stop(t + d + 0.02); };
  const bumbo = (t, v, grave = 1) => { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(120 * grave, t); o.frequency.exponentialRampToValueAtTime(40 * grave, t + 0.16); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3 / grave); o.connect(g); g.connect(saida); o.start(t); o.stop(t + 0.35 / grave); };
  const bateria = (ch, t, forte) => {
    if (ch === 'k') bumbo(t, 0.34 * (tr.luta ? 1 : 0.5)); else if (ch === 's') { chiado(t, 0.16, 0.16, 'bandpass', 1800); bumbo(t, 0.1, 1.6); }
    else if (ch === 'h') chiado(t, 0.04, forte ? 0.07 : 0.045, 'highpass', 7000); else if (ch === 't') { bumbo(t, 0.3, 0.7); chiado(t, 0.25, 0.03, 'lowpass', 300); }
    else if (ch === 'm') { const g = env(t, 0.08, 0.05, 0.002, 0.1, 0.1); osc('square', 1870, t, t + 0.2, g); osc('square', 2810, t, t + 0.2, g); }
    else if (ch === 'T') { bumbo(t, 0.42, 0.55); chiado(t, 0.3, 0.05, 'lowpass', 220); } // taiko: grave e com corpo
    else if (ch === 'c') { chiado(t, 1.1, 0.07, 'highpass', 5200); chiado(t, 0.5, 0.05, 'bandpass', 3200); } // prato
  };

  // ---- o que toca em cada semicolcheia ----
  let pos = 0, quando = AC.currentTime + 0.08, vivo = true;
  const passo = (n, t) => {
    const volta = Math.floor(n / (comps * semisComp)), s = n % (comps * semisComp), comp = Math.floor(s / semisComp), noComp = s % semisComp, ac = (tr.prog[comp % tr.prog.length] || 1) - 1;
    const calmo = !tr.luta, jeito = volta % 4; // em cada volta o arranjo muda um pouco: a música respira
    // tapete de cordas, um acorde por compasso
    if (noComp === 0 && tr.pad) tapete([grau(ac, baixoOit + 1), grau(ac + 2, baixoOit + 2), grau(ac + 4, baixoOit + 2)].concat(tr.pad > 1 ? [grau(ac, baixoOit + 3)] : []), t, semisComp * semi, 0.02 * vol * (tr.luta ? 0.8 : 1));
    // camadas épicas (tr.epico): coro no acorde do compasso, cordas em semicolcheias, metais no começo e na "puxada"
    if (tr.coro && noComp === 0 && (volta > 0 || comp > 1)) coro([grau(ac, 0), grau(ac + 2, 0), grau(ac + 4, 0)], t, semisComp * semi, 0.018 * vol);
    if (tr.cordas) { const pad = tr.cordas === 2 ? [0, 0, 7, 0, 0, 7, 0, 4, 0, 0, 7, 0, 4, 7, 9, 7] : [0, 7, 0, 7, 0, 7, 0, 7, 4, 7, 4, 7, 2, 7, 4, 7], g = pad[noComp % 16]; corda(hz(grau(ac, -1) + (g === 7 ? 7 : g === 4 ? esc[2] : g === 9 ? 12 : g === 2 ? esc[1] : 0)), t, semi * 0.8, 0.09 * vol); }
    if (tr.metal && (noComp === 0 || (noComp === 12 && comp % 2 === 1) || (noComp === 14 && comp % 2 === 1))) metal([grau(ac, 0), grau(ac + 4, 0), grau(ac, 1)], t, noComp === 0 ? semi * 6 : semi * 1.6, 0.12 * vol);
    if (tr.prato && noComp === 0 && comp % 4 === 0) bateria('c', t);
    // baixo
    if (riff) { for (const nt of riff.notas) if (nt.casa === noComp % riff.casas) baixo(hz(grau(ac + nt.g, baixoOit) + (nt.st - esc[nt.g % 7] - 12 * Math.floor(nt.g / 7)) + 12 * Math.floor(nt.g / 7)), t, nt.dur * semi * 0.9, 0.2 * vol, true); }
    else if (tr.baixo === 'longo') { if (noComp === 0) baixo(hz(grau(ac, baixoOit)), t, semisComp * semi * 0.95, 0.15 * vol); }
    else if (tr.baixo === 'andar') { if (noComp % 8 === 0) baixo(hz(grau(ac + (noComp % 16 === 8 ? 4 : 0), baixoOit)), t, semi * 7, 0.16 * vol); }
    else if (tr.baixo === 'valsa') { if (noComp === 0) baixo(hz(grau(ac, baixoOit)), t, semi * 4, 0.17 * vol); else if (noComp % 4 === 0) { harpa(hz(grau(ac + 2, baixoOit + 2)), t, 0.05 * vol); harpa(hz(grau(ac + 4, baixoOit + 2)), t, 0.05 * vol); } }
    else if (tr.baixo === 'pulso') { if (noComp % 2 === 0) baixo(hz(grau(ac, baixoOit) + (noComp % 8 === 6 ? 12 : 0)), t, semi * 1.7, 0.18 * vol, true); }
    // arpejo
    if (tr.arp === 'harpa' && noComp % 2 === 0 && (calmo ? jeito !== 0 || noComp % 4 === 0 : true)) { const ordem = [0, 2, 4, 7, 4, 2, 4, 7], g = ordem[(noComp / 2) % ordem.length]; harpa(hz(grau(ac + g, baixoOit + 2)), t, 0.055 * vol); }
    if (tr.arp === 'chip') { const g = [0, 2, 4, 7][noComp % 4]; chip(hz(grau(ac + g, baixoOit + 3)), t, semi * 0.9, (volta % 2 ? 0.1 : 0.07) * vol); }
    // bateria
    if (bat) { const ch = bat[noComp % bat.length]; if (ch !== '.') bateria(ch, t, noComp % 4 === 2); if (tr.luta && volta % 2 === 1 && noComp % 2 === 1 && ch === '.') bateria('h', t); }
    // melodia (num lugar calmo, a quarta volta fica sem ela: só o acompanhamento, para a frase fazer falta)
    const casaMel = s * div / 4; if (Number.isInteger(casaMel) && !(calmo && jeito === 3 && comps <= 4)) for (const nt of mel.notas) if (nt.casa === casaMel) {
      const f = hz(nt.st + 12 * melOit + (tr.luta && volta % 2 === 1 && !tr.oit ? 12 : 0)), d = nt.dur * beat / div;
      (VOZES[tr.voz] || VOZES.caixa)(f, t, d * 0.94, 0.17 * vol);
      if (calmo && jeito === 2 && nt.dur >= 2) VOZES.caixa(hz(nt.st + 12 * melOit + 12), t + 0.02, d, 0.05 * vol); // na terceira volta, um brilho uma oitava acima
    }
  };
  const agenda = () => {
    if (!vivo) return; const agora = AC.currentTime;
    if (quando < agora - 0.3) quando = agora + 0.05; // a aba ficou em segundo plano: retoma daqui, sem despejar as notas atrasadas
    while (quando < agora + 0.4) { passo(pos++, quando); quando += semi; }
  };
  if (ate) { while (quando < ate) { passo(pos++, quando); quando += semi; } return { parar() {} }; }
  agenda(); const timer = setInterval(agenda, 110);
  return { parar() { vivo = false; clearInterval(timer); } };
}
