// Ícones em pixel art para os botões de toque e o menu (no lugar dos emojis).
import { Sprite, cor, TINTA } from './raster.js';
const O = cor('#FFE08A'), o = cor('#C9862B'), W = cor('#FFFBE6'), B = cor('#E8E2CF'), b = cor('#9FB0C0'), R = cor('#FF9A3C');
const DESENHOS = {
  pular: ['.....WW.....', '....WWWW....', '...WWWWWW...', '..WWWWWWWW..', '.....WW.....', '.....WW.....', '.....WW.....', '.....BB.....', '............', '..BBBBBBBB..'],
  passo: ['............', '.W...W...W..', '..W...W...W.', '...W...W...W', '..W...W...W.', '.W...W...W..', '............'],
  lampada: ['.....R......', '....RO......', '....OW......', '.....O......', '..ooooooo...', '.oOOOOOOOoo.', 'oOOOOOOOOOoo', '.oOOOOOOoo.o', '..ooooooo...', '...oooo.....'],
  orar: ['.....WW.....', '.....WW.....', '....WBBW....', '....WBBW....', '...WWBBWW...', '...WBBBBW...', '...WBBBBW...', '....WBBW....', '....bBBb....', '...bb..bb...'],
  menu: ['WWWWWWWWWW', 'BBBBBBBBBB', '..........', 'WWWWWWWWWW', 'BBBBBBBBBB', '..........', 'WWWWWWWWWW', 'BBBBBBBBBB']
};
export function iconePx(nome, tam = 30) {
  const d = DESENHOS[nome]; if (!d) return document.createTextNode('');
  const s = new Sprite(d[0].length + 2, d.length + 2); s.carimbo(d, 1, 1, { W, B, b, O, o, R }); s.contorno(TINTA);
  const cv = s.tela(); cv.style.cssText = `width:${tam}px;height:${Math.round(tam * cv.height / cv.width)}px;image-rendering:pixelated;pointer-events:none`;
  return cv;
}
