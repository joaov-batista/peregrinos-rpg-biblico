// As sombras das páginas vivas (a história do peregrino) em pixel art.
import { R, C, OX as ox, OY as oy, est, manto, braco, olhos, fiapos, TINTA } from './kit.js';

const TERRA = R('#B89A66'), SECA = R('#7A5A36'), BARRO = R('#8E6A44'), OSSO = R('#E4DFCF');
const TUNICA = [R('#6E6480'), R('#857A66'), R('#5E6E78'), R('#7A5E66'), R('#66705A')], PELE = R('#B88A64');
const FERRO = R('#4A4E5A'), ACO = R('#8A8E9A'), FERRUGEM = R('#7A4A32');
const BR = C('#FFFFFF'), AMBAR = C('#FFD23F'), BRASA = C('#FF7A3C');

export const CHEFES_C = {
  // A Escassez: um vulto magro de terra rachada, costelas à mostra, com a tigela vazia nas mãos
  escassez(s, b, Tm) {
    const E = est(b, Tm), q = E.caido ? 14 : 0, y0 = oy - 62 + E.flu + q, cx = ox;
    manto(s, cx, y0 + 18, 9, cx, oy - 2, 15, SECA, 4);
    for (let i = 0; i < 5; i++) s.ret(cx - 7, y0 + 24 + i * 5, 14, 1, TERRA[3]); // costelas
    s.linha(cx, y0 + 20, cx, y0 + 48, 1, TERRA[1]);
    for (const [x1, y1, x2, y2] of [[-6, 30, -11, 40], [5, 34, 10, 46], [-3, 44, -8, 56], [2, 26, 7, 30]]) s.linha(cx + x1, y0 + y1, cx + x2, y0 + y2, 1, TINTA); // rachaduras
    const mao = E.prep ? -10 : E.ataca ? 8 : 0;
    for (const sd of [-1, 1]) braco(s, cx + sd * 9, y0 + 20, cx + sd * (E.ataca ? 22 : 7), y0 + 40 - mao, 3, BARRO, TERRA, 4, sd);
    if (!E.ataca) { s.bola(cx, y0 + 42 - mao, 9, 4, R('#6B4A2E'), 0.3, -0.8); s.ret(cx - 7, y0 + 40 - mao, 14, 1, TINTA); } // a tigela vazia
    s.bola(cx, y0 + 9, 8, 10, TERRA, 0.4, -0.7);
    if (E.caido) { s.ret(cx - 5, y0 + 8, 3, 1, TINTA); s.ret(cx + 2, y0 + 8, 3, 1, TINTA); }
    else { s.ret(cx - 5, y0 + 6, 3, 4, TINTA); s.ret(cx + 2, y0 + 6, 3, 4, TINTA); olhos(s, cx - 4, y0 + 8, 7, E.prep && E.pisca ? BR : AMBAR); }
    s.ret(cx - 3, y0 + 14, 6, E.ataca ? 4 : 1, TINTA);
    fiapos(s, cx - 14, cx + 14, oy - 1, 4, Tm, SECA);
  },
  // O Desprezo: não é um monstro, é uma multidão de costas que se vira como um corpo só
  desprezo(s, b, Tm) {
    const E = est(b, Tm), q = E.caido ? 8 : 0, base = oy - 2;
    const gente = [[-22, 46, 3], [22, 46, 1], [-11, 54, 0], [11, 54, 2], [0, 62, 4], [-30, 36, 2], [30, 36, 0]];
    for (const [dx, alt, c] of gente) {
      const x = ox + dx, bal = Math.round(Math.sin(Tm * 3 + dx) * (E.ataca ? 2 : 1)), y = base - alt + q + (E.prep ? -2 : 0) + bal;
      manto(s, x, y + 9, 6, x, base, 9, TUNICA[c], 2);
      s.bola(x, y + 4, 5, 6, PELE, 0.4, -0.7); s.ret(x - 5, y - 2, 10, 3, TUNICA[(c + 2) % 5][1]); // o pano na cabeça
      if (E.caido) s.ret(x - 3, y + 4, 6, 1, TINTA);
      else { s.ret(x - 3, y + 3, 2, 1, TINTA); s.ret(x + 1, y + 3, 2, 1, TINTA); s.ret(x - 2, y + 6, 4, E.ataca || (E.prep && E.pisca) ? 3 : 1, TINTA); } // bocas que gritam
    }
    if (!E.caido) for (const sd of [-1, 1]) { const m = braco(s, ox + sd * 16, base - 40, ox + sd * (E.prep || E.ataca ? 40 : 30), base - (E.prep ? 58 : 34), 3, PELE, PELE, 3, sd); s.ret(m.x + sd, m.y - 1, 3, 1, PELE[4]); } // dedos apontados
  },
  // O Cárcere: as grades se dobraram num corpo; elmo de carcereiro, molho de chaves, correntes por braços
  carcere(s, b, Tm) {
    const E = est(b, Tm), q = E.caido ? 10 : 0, y0 = oy - 66 + E.flu + q, cx = ox;
    s.ret(cx - 15, y0 + 18, 30, 44, FERRO[1]);
    for (let x = -13; x <= 13; x += 5) { s.ret(cx + x, y0 + 18, 2, 44, ACO[2]); s.ret(cx + x, y0 + 18, 1, 44, ACO[4]); } // barras
    s.ret(cx - 16, y0 + 17, 32, 3, FERRO[3]); s.ret(cx - 16, y0 + 38, 32, 2, FERRO[3]); s.ret(cx - 16, y0 + 60, 32, 3, FERRO[3]);
    s.bola(cx, y0 + 30, 5, 5, R('#15161E'), 0.5, -0.5); s.ret(cx - 1, y0 + 29, 2, 5, E.prep && E.pisca ? BR : BRASA); // a fechadura acesa
    for (const sd of [-1, 1]) { let x = cx + sd * 16, y = y0 + 22; const alvoX = cx + sd * (E.ataca ? 40 : E.prep ? 30 : 22), alvoY = y0 + (E.prep ? 6 : E.ataca ? 30 : 46); for (let i = 1; i <= 6; i++) { const nx = cx + sd * 16 + (alvoX - cx - sd * 16) * i / 6, ny = y0 + 22 + (alvoY - y0 - 22) * i / 6 + Math.sin(Tm * 4 + i) * 1.5; s.bola(nx, ny, 2.4, 2.4, i % 2 ? ACO : FERRUGEM, 0.4, -0.6); x = nx; y = ny; } s.bola(x, y + 2, 4, 4, FERRO, 0.4, -0.6); } // correntes com grilhão
    s.bola(cx, y0 + 9, 10, 9, FERRO, 0.4, -0.7); s.ret(cx - 11, y0 + 10, 22, 2, ACO[3]); s.ret(cx - 1, y0 - 2, 2, 5, ACO[3]); // elmo
    if (E.caido) s.ret(cx - 6, y0 + 8, 12, 1, TINTA); else { s.ret(cx - 7, y0 + 6, 14, 3, TINTA); olhos(s, cx - 4, y0 + 7, 7, E.prep && E.pisca ? BR : BRASA); }
    for (let i = 0; i < 3; i++) s.ret(cx + 10 + i * 2, y0 + 40 + (E.t6 + i) % 2, 1, 5, AMBAR); s.bola(cx + 12, y0 + 39, 3, 2, R('#B0763A'), 0.4, -0.6); // as chaves
    s.ret(cx - 13, oy - 4, 9, 4, FERRO[2]); s.ret(cx + 4, oy - 4, 9, 4, FERRO[2]);
  }
};
