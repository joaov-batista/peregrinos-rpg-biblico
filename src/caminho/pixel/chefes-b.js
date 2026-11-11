// Chefes de Daniel 4 e os três do mundo (Golias, Beemote, Leviatã) em pixel art.
import { R, C, OX as ox, OY as oy, est, manto, braco, olhos, asa, cauda, fiapos, TINTA } from './kit.js';

const OSSO = R('#E4DFCF'), PELE = R('#B98A5E'), OURO = R('#D9A63C'), FERRO = R('#3A3F4C'), ACO = R('#7F8C9C'), BRONZE = R('#B0763A'), COBRE = R('#C2703A');
const ANIL = R('#2B3A7A'), NOITE = R('#232338'), TRONCO = R('#6B4A2E'), CASCA = R('#4A3524'), FOLHA = R('#4F8A4A'), TIJOLO = R('#A8643C'), LAPIS = R('#2F5FB0');
const PELO = R('#7A5A3A'), PENA = R('#8C7A5A'), REAL = R('#6A2C7A'), COURO = R('#5E6B52'), LAMA = R('#4E5A48'), ESCAMA = R('#1F6F7A'), VENTRE = R('#C9B88A');
const BR = C('#FFFFFF'), AMBAR = C('#FFD23F'), FOGO = C('#FF7A3C'), RUBI = C('#FF4A5A'), CIANO = C('#8FE8FF'), VERDE = C('#9BF07A');

const COROA = ['G..G..G..G', 'GG.GG.GG.G', 'GGGGGGGGGG', 'GrGGbGGrGG', 'gggggggggg'];

export const CHEFES_B = {
  // Os Encantadores: o mago caldeu de chapéu alto, com a carta dos astros e os signos girando — e nenhuma resposta.
  encantadores(s, b, Tm) {
    const E = est(b, Tm), y0 = oy - 6 + E.flu, cx = ox, hy = y0 - 56 + (E.caido ? 7 : 0);
    if (!E.caido) for (let i = 0; i < 6; i++) { const a = Tm * (E.prep ? 3 : 1.1) + i * 1.047, z = Math.sin(a), x = cx + Math.cos(a) * 32, y = y0 - 30 + z * 9; if (z < 0) { s.bola(x, y, 3, 3, i % 2 ? LAPIS : OURO); s.px(x, y, BR); } }
    manto(s, cx, y0 - 46, 9, cx - 2, y0, 16, ANIL, 4);
    for (let i = 0; i < 9; i++) { const x = cx - 10 + (i * 7) % 22, y = y0 - 40 + (i * 11) % 36; s.px(x, y, OURO[4]); if (i % 3 === 0) { s.px(x - 1, y, OURO[2]); s.px(x + 1, y, OURO[2]); s.px(x, y - 1, OURO[2]); s.px(x, y + 1, OURO[2]); } }
    s.ret(cx - 9, y0 - 24, 18, 2, OURO[2]);
    s.bola(cx + 1, hy, 6, 6, PELE); s.poli([[cx - 3, hy + 3], [cx + 7, hy + 3], [cx + 5, hy + 16], [cx, hy + 18]], OSSO[2]); for (let y = 5; y < 16; y += 2) s.px(cx + 2, hy + y, OSSO[0]);
    s.poli([[cx - 7, hy - 3], [cx + 8, hy - 3], [cx + 4, hy - 22], [cx - 2, hy - 22]], ANIL[1]); s.ret(cx - 7, hy - 4, 16, 2, OURO[3]); s.px(cx + 1, hy - 14, OURO[4]); s.bola(cx + 1, hy - 24, 2.5, 2.5, OURO);
    if (!E.caido) olhos(s, cx + 1, hy - 1, 3, E.prep ? BR : CIANO);
    // a carta dos astros numa mão, o cajado na outra
    const m = braco(s, cx + 8, y0 - 40, cx + 19, y0 - 36 - (E.prep ? 10 : 0), 3, ANIL, PELE, 2);
    s.ret(m.x - 1, m.y - 8, 9, 10, OSSO[3]); s.ret(m.x - 1, m.y - 8, 9, 1, OSSO[4]); for (const [dx, dy] of [[1, -6], [5, -4], [3, -1], [6, 0]]) s.px(m.x + dx, m.y + dy, LAPIS[2]); s.linha(m.x + 1, m.y - 6, m.x + 5, m.y - 4, 1, LAPIS[3]);
    const g = braco(s, cx - 8, y0 - 40, cx - 16, y0 - 26 - (E.ataca ? 12 : 0), 3, ANIL, PELE, -2);
    s.linha(g.x, g.y + 22, g.x + (E.ataca ? 6 : 0), g.y - 26, 2, TRONCO[2]); const tx = g.x + (E.ataca ? 6 : 0), ty = g.y - 30;
    for (let a = 0; a < 5; a++) s.linha(tx, ty, tx + Math.cos(a * 1.257 + Tm) * 5, ty + Math.sin(a * 1.257 + Tm) * 5, 1, E.prep && E.pisca ? BR : OURO[4]);
  },

  // O Jugo: o toco da grande árvore, cingido de ferro e de bronze (Dn 4:15), que anda arrastando as correntes.
  jugo(s, b, Tm) {
    const E = est(b, Tm), baixo = E.caido ? 6 : E.resp, cx = ox + (E.ataca ? 4 : 0), topo = oy - 56 + baixo;
    for (const [dx, lev, sd] of [[-12, E.anda && E.passo ? -3 : 0, -1], [12, E.anda && !E.passo ? -3 : 0, 1]]) { s.membro(ox + dx, oy - 16, ox + dx + sd * 4, oy - 3 + lev, 7, CASCA); for (let d = -1; d <= 1; d++) s.linha(ox + dx + sd * 4, oy - 3 + lev, ox + dx + sd * 4 + d * 5 + sd * 2, oy - 1 + lev, 2, CASCA[1]); }
    s.poli([[cx - 17, topo + 4], [cx + 17, topo + 4], [cx + 21, oy - 12], [cx - 21, oy - 12]], TRONCO[2]);
    for (let x = -19; x <= 19; x += 3) for (let y = topo + 6; y < oy - 12; y += 2) if ((x * 5 + y * 3) % 7 < 3) s.px(cx + x + Math.sin(y * 0.3) * 1.5, y, x < -8 ? TRONCO[0] : x > 10 ? TRONCO[3] : TRONCO[1]);
    // o corte de cima, com os anéis da árvore, e o broto que sobrou
    s.bola(cx, topo + 4, 17, 5, R('#C9A878'), 0.3, -0.6); s.bola(cx, topo + 4, 10, 3, R('#B08A5A')); s.bola(cx, topo + 4, 4, 1.5, TRONCO);
    s.linha(cx + 9, topo + 2, cx + 13, topo - 9 - E.resp, 1, FOLHA[1]); s.poli([[cx + 13, topo - 9 - E.resp], [cx + 19, topo - 12 - E.resp], [cx + 16, topo - 6 - E.resp]], FOLHA[3]);
    // as cintas: ferro em cima, bronze embaixo
    for (const [y, Cc] of [[topo + 14, FERRO], [oy - 24, BRONZE]]) { s.ret(cx - 20, y, 40, 5, Cc[2]); s.ret(cx - 20, y, 40, 1, Cc[4]); s.ret(cx - 20, y + 4, 40, 1, Cc[0]); for (let x = -17; x <= 17; x += 7) s.px(cx + x, y + 2, Cc[4]); }
    // o rosto entalhado na casca
    const ey = topo + 26;
    if (E.caido) { s.ret(cx - 8, ey, 5, 1, TINTA); s.ret(cx + 5, ey, 5, 1, TINTA); } else for (const dx of [-8, 5]) { s.ret(cx + dx, ey - 2, 5, 4, TINTA); s.ret(cx + dx + 1, ey - 1, 2, 2, E.prep ? BR : VERDE); }
    s.poli([[cx - 7, ey + 7], [cx + 8, ey + 7], [cx + 5, ey + 11 + (E.prep ? 3 : 0)], [cx - 4, ey + 11 + (E.prep ? 3 : 0)]], TINTA);
    // braços de galho com as correntes penduradas
    for (const sd of [-1, 1]) {
      const m = braco(s, cx + sd * 18, topo + 16, cx + sd * (E.ataca && sd > 0 ? 40 : 30), E.prep ? topo - 6 : E.caido ? oy - 6 : topo + 32 + (sd > 0 && E.ataca ? -14 : 0), 5, CASCA, TRONCO, 4, sd);
      s.ret(m.x - 3, m.y - 3, 7, 4, FERRO[2]); s.ret(m.x - 3, m.y - 3, 7, 1, FERRO[4]);
      const bal = Math.round(E.onda(3 + sd) * 3) - (E.ataca ? sd * 8 : 0); for (let k = 1; k <= 9; k++) s.ret(m.x + bal * k / 9 - 1, m.y + k * 2, 2, 2, k % 2 ? FERRO[3] : FERRO[1]); s.bola(m.x + bal, m.y + 21, 3.5, 3.5, FERRO);
    }
  },

  // Babilônia, a Grande: um busto colossal do rei com o zigurate por coroa e os jardins nos ombros. "Não é esta a grande Babilônia que EU edifiquei?"
  babilonia(s, b, Tm) {
    const E = est(b, Tm), baixo = E.caido ? 5 : 0, cx = ox, topo = oy - 84 + baixo;
    // os ombros: muralhas de tijolo com ameias e as portas azuis de Ishtar
    s.poli([[cx - 34, oy], [cx - 30, oy - 34 + baixo], [cx + 30, oy - 34 + baixo], [cx + 34, oy]], TIJOLO[2]);
    for (let y = oy - 32 + baixo; y < oy; y += 4) for (let x = -32 + ((y >> 2) & 1) * 4; x < 32; x += 8) { s.ret(cx + x, y, 7, 1, TIJOLO[1]); s.px(cx + x, y + 1, TIJOLO[3]); }
    for (let x = -30; x <= 26; x += 8) s.ret(cx + x, oy - 38 + baixo, 5, 4, TIJOLO[x > 0 ? 3 : 2]);
    s.poli([[cx - 9, oy], [cx - 9, oy - 18], [cx - 5, oy - 24], [cx + 5, oy - 24], [cx + 9, oy - 18], [cx + 9, oy]], LAPIS[2]); s.ret(cx - 6, oy - 16, 12, 16, TINTA); for (let y = oy - 22; y < oy; y += 5) { s.px(cx - 8, y, OURO[4]); s.px(cx + 8, y, OURO[4]); }
    // os jardins suspensos
    for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) { const x = cx + sd * (16 + i * 5), y = oy - 39 + baixo - (i % 2) * 2; s.bola(x, y, 4, 3, FOLHA, 0.5, -0.7); s.linha(x, y + 2, x + sd, y + 9 + Math.round(E.onda(2 + i)), 1, FOLHA[1]); }
    // a cabeça de estátua: ouro, barba em cachos, olhos vazios
    const hy = topo + 30;
    s.ret(cx - 8, hy + 10, 16, 8, OURO[1]);
    s.bola(cx, hy, 13, 14, OURO, 0.5, -0.7);
    s.poli([[cx - 11, hy + 4], [cx + 12, hy + 4], [cx + 8, hy + 22], [cx - 7, hy + 22]], BRONZE[1]); for (let y = 7; y < 22; y += 3) for (let x = -8 + ((y / 3) & 1) * 2; x < 9; x += 4) { s.px(cx + x, hy + y, BRONZE[3]); s.px(cx + x + 1, hy + y + 1, BRONZE[0]); }
    for (const dx of [-7, 3]) { s.ret(cx + dx, hy - 3, 5, 3, TINTA); if (!E.caido) s.ret(cx + dx + 1, hy - 2, 3, 1, E.prep ? BR : E.f2 ? RUBI : AMBAR); }
    s.ret(cx - 1, hy - 1, 3, 6, OURO[1]); s.ret(cx - 4, hy + 8, 9, E.prep || E.ataca ? 4 : 1, TINTA);
    if (E.f2) { for (const [dx, dy] of [[6, -12], [5, -10], [7, -8], [6, -6], [8, -4], [9, -1]]) s.px(cx + dx, hy + dy, TINTA); s.px(cx - 9, hy + 2, TINTA); s.px(cx - 10, hy + 4, TINTA); }
    // o zigurate por coroa, com a chama no topo
    for (let i = 0; i < 4; i++) { const l = 15 - i * 3.5, y = hy - 15 - i * 6; s.ret(cx - l, y, l * 2, 6, TIJOLO[i % 2 ? 2 : 3]); s.ret(cx - l, y, l * 2, 1, TIJOLO[4]); s.ret(cx - 1, y + 2, 2, 4, TINTA); }
    if (!E.caido) fiapos(s, cx - 2, cx + 2, hy - 34, E.prep ? 9 : 5, Tm, R('#FFB05A'), 2);
    // as mãos que saem das muralhas
    for (const sd of [-1, 1]) { const m = braco(s, cx + sd * 28, oy - 30 + baixo, cx + sd * (E.ataca ? 44 : 38), E.prep ? oy - 60 : E.ataca ? oy - 26 : oy - 10, 6, OURO, OURO, 4, sd); s.bola(m.x, m.y, 5, 4, OURO); for (let d = -2; d <= 2; d += 2) s.linha(m.x, m.y, m.x + sd * 2 + d, m.y + (E.prep ? -6 : 6), 1, OURO[4]); }
  },

  // A Fera: o rei de quatro, cabelo como penas de águia e unhas como as das aves (Dn 4:33), ainda com um trapo de púrpura.
  fera(s, b, Tm) {
    const E = est(b, Tm), corre = E.anda || (E.ataca && !b.voa), baixo = E.caido ? 6 : E.prep ? 3 : E.resp, cy = oy - 26 + baixo, gal = corre ? (E.passo ? 5 : -5) : 0;
    cauda(s, ox - 22, cy - 2, 6, -1, Tm, 3, REAL, 3, 4, 0.8); // o resto do manto arrastado
    // patas: traseiras e dianteiras, em galope
    for (const [dx, av, tras] of [[-18, -gal, 1], [-12, gal, 1], [14, gal, 0], [20, -gal, 0]]) { const px = ox + dx + av, py = oy - 2 - (corre && av > 0 ? 3 : 0); s.membro(ox + dx, cy + 4, px - (tras ? 3 : -1), cy + 13, 5, PELO); s.membro(px - (tras ? 3 : -1), cy + 13, px, py, 3, PELE); for (let d = 0; d < 3; d++) s.linha(px, py, px + 3 + d, py + 1 - d, 1, OSSO[3]); }
    s.bola(ox - 4, cy, 22, 12, PELO, 0.5, -0.7); s.bola(ox + 12, cy - 4 - (E.prep ? -3 : 0), 13, 12, PELO, 0.5, -0.7);
    s.poli([[ox - 22, cy - 9], [ox - 2, cy - 12], [ox - 6, cy + 3], [ox - 24, cy + 6]], REAL[2]); s.linha(ox - 22, cy - 9, ox - 2, cy - 12, 1, OURO[3]); for (let x = -22; x < -6; x += 3) s.ret(ox + x, cy + 5, 1, 2 + (x % 2), REAL[1]);
    // juba de penas ao longo das costas
    for (let i = 0; i < 9; i++) { const x = ox - 14 + i * 4, y = cy - 13 - (i > 5 ? (i - 5) * 3 : 0); s.poli([[x, y + 4], [x + 3, y + 4], [x - 4 - (corre ? 3 : 0), y - 7 - (i % 2) * 2]], PENA[i % 2 ? 2 : 1]); s.px(x - 2, y - 3, PENA[4]); }
    // a cabeça baixa, de olhos sem razão
    const hx = ox + 24 + (E.ataca ? 4 : 0), hy = cy - 10 + (E.caido ? 10 : E.prep ? 6 : 0);
    s.bola(hx, hy, 8, 8, PELE); fiapos(s, hx - 8, hx + 2, hy - 4, 8, Tm * 0.3, PENA, 3); s.poli([[hx - 2, hy + 3], [hx + 8, hy + 3], [hx + 4, hy + 13], [hx - 1, hy + 11]], PENA[1]);
    if (E.caido) s.ret(hx + 2, hy - 1, 4, 1, TINTA); else { s.ret(hx + 2, hy - 2, 3, 3, BR); s.px(hx + 4, hy - 1, E.prep ? RUBI : TINTA); }
    if (E.prep || E.ataca) { s.poli([[hx + 2, hy + 4], [hx + 9, hy + 3], [hx + 6, hy + 9]], TINTA); s.px(hx + 4, hy + 5, OSSO[4]); s.px(hx + 7, hy + 5, OSSO[4]); }
    if (!E.f2) s.carimbo(COROA, hx - 14, hy - 20 + (E.passo && corre ? 1 : 0), { G: OURO[3], g: OURO[1], r: RUBI, b: LAPIS[3] }, 1, -0.6); // a coroa ainda presa, torta, até a segunda fase
    if (E.t6 % 5 === 0 && corre) for (let i = 0; i < 3; i++) s.px(ox - 26 - i * 4, oy - 2 - i * 2, C('#C9B88A'));
  },

  // A Soberba: uma coroa viva sobre um manto de olhos, com asas de pavão; no lugar do rosto, um espelho.
  soberba(s, b, Tm) {
    const E = est(b, Tm), y0 = oy - 6 + E.flu, cx = ox, hy = y0 - 58 + (E.caido ? 8 : 0), abre = E.caido ? 0.15 : E.prep ? 1 : 0.7;
    // leque de penas com olhos
    for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.3 * abre, l = 40 - Math.abs(i - 4) * 2, x = cx + Math.cos(a) * l, y = y0 - 40 + Math.sin(a) * l * (E.caido ? 0.5 : 1); s.linha(cx, y0 - 38, x, y, 2, ESCAMA[i % 2 ? 1 : 2]); s.bola(x, y, 4, 4, R('#2F8A6A')); s.bola(x, y, 2, 2, OURO); s.px(x, y, E.prep && E.pisca ? BR : LAPIS[2]); }
    manto(s, cx, y0 - 46, 10, cx - 2, y0, 17, REAL, 5);
    for (let i = 0; i < 6; i++) { const x = cx - 9 + (i * 9) % 20, y = y0 - 36 + (i * 13) % 32; s.ret(x - 1, y, 3, 1, OURO[3]); s.px(x, y, (E.t6 + i) % 7 ? TINTA : OURO[4]); }
    s.poli([[cx - 11, y0 - 46], [cx + 11, y0 - 46], [cx + 14, y0 - 38], [cx - 14, y0 - 38]], OSSO[3]); for (let x = -12; x <= 12; x += 4) s.px(cx + x, y0 - 41, TINTA); // gola de arminho
    // o espelho no lugar do rosto
    s.bola(cx, hy, 8, 9, OURO); s.bola(cx, hy, 6, 7, R('#BFE3F0'), 0.6, -0.6); s.linha(cx - 3, hy + 3, cx + 2, hy - 4, 1, BR);
    if (E.f2) { s.linha(cx - 4, hy - 5, cx + 1, hy, 1, TINTA); s.linha(cx + 1, hy, cx - 1, hy + 6, 1, TINTA); s.linha(cx + 1, hy, cx + 5, hy + 2, 1, TINTA); }
    if (!E.caido && E.prep) olhos(s, cx - 2, hy - 1, 4, RUBI, 2);
    const cb = E.caido ? 6 : Math.round(E.onda(2.4) * 1.5) - 2; s.carimbo(COROA, cx - 5, hy - 15 + cb, { G: OURO[3], g: OURO[1], r: RUBI, b: LAPIS[3] }, 1, E.caido ? 0.6 : 0);
    if (!E.caido) for (let a = 0; a < 10; a++) s.px(cx + Math.cos(a * 0.628 + Tm) * 14, hy - 2 + Math.sin(a * 0.628 + Tm) * 15, AMBAR);
    // cetro numa mão; a outra aponta para si
    const m = braco(s, cx + 9, y0 - 40, cx + 21, y0 - 34 - (E.prep ? 12 : 0), 3, REAL, OSSO, 2); s.linha(m.x, m.y + 14, m.x + (E.ataca ? 10 : 0), m.y - 18, 2, OURO[2]); s.bola(m.x + (E.ataca ? 10 : 0), m.y - 20, 3, 3, R(E.prep && E.pisca ? '#FFFFFF' : '#FF4A5A'));
    braco(s, cx - 9, y0 - 40, cx - 4, y0 - 30, 3, REAL, OSSO, -4);
  },

  // Golias de Gate: seis côvados e um palmo, couraça de escamas de bronze, lança como eixo de tecelão (1Sm 17:4-7). A testa fica à mostra.
  golias(s, b, Tm) {
    const E = est(b, Tm), baixo = E.caido ? 9 : E.resp, incl = E.ataca ? 5 : E.prep ? -3 : 0, cx = ox + incl, topo = oy - 76 + baixo;
    for (const [dx, lev] of [[-10, E.anda && E.passo ? -3 : 0], [10, E.anda && !E.passo ? -3 : 0]]) { s.membro(ox + dx, oy - 30 + baixo, ox + dx + (E.ataca ? 3 : 0), oy - 7 + lev, 8, PELE); s.ret(ox + dx - 5, oy - 20 + lev, 10, 13, BRONZE[2]); s.ret(ox + dx - 5, oy - 20 + lev, 2, 13, BRONZE[4]); s.ret(ox + dx - 6 + (E.ataca ? 3 : 0), oy - 6 + lev, 13, 6, COBRE[1]); }
    s.poli([[cx - 17, topo + 40], [cx + 17, topo + 40], [ox + 16, oy - 26 + baixo], [ox - 16, oy - 26 + baixo]], R('#7A2E2E')[2]); for (let x = -14; x <= 14; x += 5) s.ret(ox + x, oy - 34 + baixo, 4, 8, COBRE[2]);
    s.bola(cx, topo + 28, 20, 16, BRONZE, 0.5, -0.7);
    for (let y = -11; y <= 11; y += 3) for (let x = -16 + ((Math.round(y / 3)) & 1) * 2; x <= 16; x += 4) if (x * x / 400 + y * y / 256 < 0.9) { s.px(cx + x, topo + 28 + y, BRONZE[x > 6 ? 4 : 3]); s.px(cx + x, topo + 29 + y, BRONZE[0]); }
    for (const sd of [-1, 1]) s.bola(cx + sd * 19, topo + 17, 7, 6, COBRE, 0.5, -0.7);
    // cabeça: elmo de bronze com crista, mas a testa descoberta
    const hx = cx + 2, hy = topo + 7;
    s.bola(hx, hy, 8, 8, PELE); s.poli([[hx - 5, hy + 3], [hx + 8, hy + 3], [hx + 5, hy + 12], [hx - 2, hy + 11]], CASCA[1]);
    s.poli([[hx - 9, hy - 2], [hx - 7, hy - 10], [hx + 3, hy - 11], [hx + 4, hy - 7], [hx - 3, hy - 6], [hx - 4, hy + 4], [hx - 9, hy + 4]], BRONZE[2]); s.linha(hx - 7, hy - 10, hx + 3, hy - 11, 1, BRONZE[4]);
    for (let i = 0; i < 6; i++) s.ret(hx - 8 + i * 2, hy - 14 - (i < 4 ? i : 6 - i), 2, 4, C(i % 2 ? '#C24058' : '#8E2B45'));
    if (b.exposto > 0 && E.pisca) s.ret(hx + 2, hy - 6, 5, 3, BR);
    if (E.caido) s.ret(hx + 2, hy - 1, 4, 1, TINTA); else olhos(s, hx + 2, hy - 1, 3, E.prep ? BR : TINTA);
    // escudo às costas e a lança
    s.bola(cx - 19, topo + 34 + (E.caido ? 6 : 0), 8, 14, FERRO, 0.4, -0.7); s.bola(cx - 19, topo + 34 + (E.caido ? 6 : 0), 2.5, 2.5, BRONZE);
    const ang = E.caido ? 1.2 : E.prep ? -0.5 : E.ataca ? 0.05 : -1.1, m = braco(s, cx + 17, topo + 20, cx + 17 + (E.ataca ? 12 : E.prep ? -8 : 6), topo + (E.caido ? 44 : E.prep ? 14 : 32), 6, PELE, PELE, 3);
    const c = Math.cos(ang), d = Math.sin(ang), L = 34, T2 = 16; s.linha(m.x - c * T2, m.y - d * T2, m.x + c * L, m.y + d * L, 2, TRONCO[2]);
    s.poli([[m.x + c * L - d * 3, m.y + d * L + c * 3], [m.x + c * L + d * 3, m.y + d * L - c * 3], [m.x + c * (L + 10), m.y + d * (L + 10)]], ACO[E.prep && E.pisca ? 4 : 3]);
    braco(s, cx - 15, topo + 20, cx - 20, topo + 36, 6, PELE, PELE, -3);
  },

  // Beemote: "seus ossos são como tubos de bronze" (Jó 40:18). Um colosso de couro e lama, de cauda como cedro.
  behemote(s, b, Tm) {
    const E = est(b, Tm), inv = E.ataca && E.corre, baixo = E.caido ? 8 : E.prep ? 3 : E.resp + E.pouso, cy = oy - 34 + baixo, av = E.anda ? (E.passo ? 3 : -3) : 0;
    cauda(s, ox - 30, cy - 4, 7, -1, Tm * 0.6, 7, COURO, 3, 2, -0.4);
    for (const [dx, a] of [[-22, av], [-10, -av], [12, av], [24, -av]]) { s.membro(ox + dx, cy + 8, ox + dx + a, oy - 5, 10, LAMA); s.ret(ox + dx + a - 6, oy - 6, 13, 6, LAMA[1]); for (let k = -4; k <= 4; k += 4) s.ret(ox + dx + a + k, oy - 3, 2, 3, OSSO[2]); }
    s.bola(ox - 4, cy, 31, 21, COURO, 0.45, -0.7);
    for (let i = 0; i < 12; i++) { const x = ox - 28 + (i * 13) % 50, y = cy - 12 + (i * 7) % 24; s.ret(x, y, 3, 1, COURO[1]); s.px(x + 3, y + 1, COURO[0]); } // rugas do couro
    for (let i = -3; i <= 3; i++) s.bola(ox - 4 + i * 8, cy - 20 + Math.abs(i) * 2, 3, 2.5, BRONZE, 0.5, -0.7); // a espinha de bronze
    s.bola(ox + 4, cy + 14, 22, 7, VENTRE, 0.3, -0.5);
    // cabeça enorme e baixa, presas e narinas que soltam vapor
    const hx = ox + 30 + (inv ? 6 : 0), hy = cy + 2 + (E.caido ? 10 : E.prep ? -8 : inv ? 8 : 0), abre = E.prep ? 6 : E.ataca ? 3 : 0;
    s.bola(hx - 6, hy - 6, 13, 12, COURO, 0.5, -0.7); s.bola(hx + 5, hy, 13, 9, COURO, 0.5, -0.7); s.bola(hx + 6, hy + 6 + abre, 11, 5, LAMA, 0.4, -0.5);
    if (abre) { s.ret(hx - 3, hy + 5, 18, abre, C('#5A1E26')); }
    for (const dx of [0, 12]) { s.poli([[hx + dx, hy + 4], [hx + dx + 4, hy + 4], [hx + dx + 2, hy - 4 - (dx ? 0 : 2)]], OSSO[3]); }
    for (const sd of [-1, 1]) s.poli([[hx - 12, hy - 15], [hx - 8, hy - 16], [hx - 11 + sd * 2, hy - 22]], COURO[1]);
    if (E.caido) s.ret(hx - 5, hy - 8, 5, 1, TINTA); else { s.ret(hx - 5, hy - 9, 4, 3, TINTA); s.px(hx - 3, hy - 8, E.prep ? BR : AMBAR); }
    s.px(hx + 14, hy - 3, TINTA); s.px(hx + 11, hy - 4, TINTA);
    if (E.prep || inv) for (let i = 0; i < 4; i++) { const k = (Tm * 1.5 + i / 4) % 1; s.ret(hx + 16 + k * 10, hy - 5 - k * 6 + i, 2, 2, C('#D9E3E0')); }
    for (let x = -30; x < 20; x += 6) s.ret(ox + x, cy + 16 + (x % 4), 2, 3, LAMA[0]); // lama pingando
  },

  // Leviatã: "do seu nariz sai fumaça… suas escamas são seu orgulho" (Jó 41). A serpente do mar em laçadas, coroada de barbatanas.
  leviata(s, b, Tm) {
    const E = est(b, Tm), y0 = oy - 30, n = 15, pts = [];
    for (let i = 0; i <= n; i++) { const k = i / n, x = ox + 28 - k * 70, y = y0 + Math.sin(Tm * 2.6 - k * 7) * (5 + k * 9) + (E.caido ? k * 14 : 0) - (E.prep ? (1 - k) * 8 : 0); pts.push([x, y, 11 - k * 8.5]); }
    for (let i = n; i >= 1; i--) { const [x, y, r] = pts[i]; if (i % 2 === 0 && i < n - 1) s.poli([[x - 3, y - r + 1], [x + 4, y - r + 1], [x - 2, y - r - 6 - (i % 4 ? 0 : 2)]], R('#C24058')[i % 4 ? 2 : 1]); s.bola(x, y, r, r, ESCAMA, 0.4, -0.75); s.bola(x, y + r * 0.5, r * 0.8, r * 0.45, VENTRE, 0.2, -0.3); if (r > 4) { s.px(x - 2, y - 2, ESCAMA[4]); s.px(x + 2, y - r * 0.4, ESCAMA[0]); } }
    const [tx, ty] = pts[n]; s.poli([[tx, ty], [tx - 8, ty - 7], [tx - 5, ty], [tx - 8, ty + 7]], R('#C24058')[2]);
    for (const i of [3, 7]) { const [x, y, r] = pts[i]; s.poli([[x, y + r - 2], [x + 5, y + r + 9 + E.bat * 2], [x - 6, y + r + 5]], R('#C24058')[1]); }
    // cabeça de dragão: focinho longo, chifres para trás, a goela acesa
    const [hx, hy0] = pts[0], hy = hy0 + (E.caido ? 4 : 0), abre = E.prep ? 7 : E.ataca ? 5 : 1;
    s.bola(hx + 2, hy - 2, 12, 10, ESCAMA, 0.5, -0.7);
    s.poli([[hx + 6, hy - 9], [hx + 26, hy - 3 - abre * 0.4], [hx + 26, hy + 1 - abre * 0.4], [hx + 6, hy + 1]], ESCAMA[2]); s.linha(hx + 8, hy - 8, hx + 25, hy - 3 - abre * 0.4, 1, ESCAMA[4]);
    s.poli([[hx + 4, hy + 2], [hx + 23, hy + 2 + abre], [hx + 20, hy + 5 + abre], [hx + 4, hy + 8]], VENTRE[1]);
    if (abre > 2) { s.poli([[hx + 6, hy + 1], [hx + 24, hy - 1], [hx + 22, hy + 2 + abre], [hx + 6, hy + 3]], E.prep && E.pisca ? AMBAR : FOGO); }
    for (let x = 9; x < 25; x += 4) { s.px(hx + x, hy + 1, OSSO[4]); s.px(hx + x, hy + 2, OSSO[3]); if (abre > 2) s.px(hx + x - 1, hy + 1 + abre, OSSO[3]); }
    for (const dy of [-10, -7]) s.linha(hx - 2, hy + dy, hx - 16, hy + dy - 8, 2, OSSO[dy < -8 ? 3 : 1]);
    if (E.caido) s.ret(hx + 6, hy - 5, 4, 1, TINTA); else { s.ret(hx + 6, hy - 6, 4, 3, TINTA); s.px(hx + 8, hy - 5, E.prep ? BR : AMBAR); s.px(hx + 7, hy - 5, AMBAR); }
    for (let i = 0; i < 4; i++) { const k = (Tm * 0.9 + i / 4) % 1; s.ret(hx + 24 + k * 6, hy - 6 - k * 12, 2, 2, C(i % 2 ? '#8A93A8' : '#C9D2E0')); } // a fumaça das narinas
  }
};
