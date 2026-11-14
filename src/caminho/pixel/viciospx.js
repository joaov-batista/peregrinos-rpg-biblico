// Os dez vícios em pixel art. São pequenos (16 a 24 pixels): cada um precisa ser reconhecido pela silhueta.
import { Sprite, BRANCO } from './raster.js';
import { R, C, cauda, asa, TINTA } from './kit.js';

const quadro = new Sprite(56, 52), ox = 28, oy = 46;
const OSSO = R('#E4DFCF'), FERRO = R('#3A3F4C'), ACO = R('#8A93A8'), OURO = R('#D9A63C');
const BR = C('#FFFFFF'), AMBAR = C('#FFD23F'), RUBI = C('#FF4A5A');

const PINTA = {
  // Preguiça: uma lesma com um travesseiro por casa
  preguica(s, e, Tm, E) {
    const est = Math.round(Math.sin(Tm * 2) * 2), V = R('#7FB069');
    s.bola(ox - 1, oy - 4, 11 + est, 4, V, 0.4, -0.7); s.bola(ox + 8 + est, oy - 8, 4, 5, V);
    s.bola(ox - 3, oy - 10, 8, 6, R('#C9B8D6'), 0.4, -0.7); s.ret(ox - 8, oy - 10, 11, 1, R('#C9B8D6')[1]); s.px(ox - 3, oy - 13, R('#C9B8D6')[4]);
    for (const dx of [7, 10]) { s.linha(ox + dx + est, oy - 12, ox + dx + est + 1, oy - 16, 1, V[1]); s.px(ox + dx + est + 1, oy - 17, E.prep ? BR : TINTA); }
    if (!E.tonto) s.ret(ox + 9 + est, oy - 8, 2, 1, TINTA);
  },
  // Distração: uma mariposa de olhos enormes, sempre fora do lugar
  distracao(s, e, Tm, E) {
    const V = R('#F06FB4'), bat = Math.floor(Tm * 16) % 2, y = oy - 14;
    for (const sd of [-1, 1]) { s.poli([[ox, y], [ox + sd * 11, y - (bat ? 9 : 3)], [ox + sd * 9, y + (bat ? 1 : 6)]], V[bat ? 3 : 2]); s.px(ox + sd * 7, y - (bat ? 4 : 0), BR); }
    s.bola(ox, y + 1, 4, 5, R('#5A3A6E')); for (const sd of [-1, 1]) { s.bola(ox + sd * 2 + 1, y - 2, 2, 2, OSSO); s.px(ox + sd * 2 + 1 + Math.round(Math.sin(Tm * 9 + sd)), y - 2, E.prep ? RUBI : TINTA); }
    s.linha(ox - 1, y - 5, ox - 3, y - 9, 1, V[1]); s.linha(ox + 2, y - 5, ox + 4, y - 9, 1, V[1]);
    for (let i = 0; i < 3; i++) s.px(ox - 8 + i * 8 + Math.sin(Tm * 5 + i) * 2, y + 8 + ((Tm * 12 + i * 3) % 6), AMBAR);
  },
  // Desânimo: um vulto murcho debaixo da própria nuvem; encolhe antes do bote
  desanimo(s, e, Tm, E) {
    const V = R('#8E98BE'), agacha = E.prep ? 4 : 0, bote = e.estado === 'bote';
    s.bola(ox + (bote ? 3 : 0), oy - 8 + agacha / 2, 8 + (bote ? 3 : 0), 8 - agacha / 2, V, 0.4, -0.7);
    for (let x = -6; x <= 6; x += 3) s.ret(ox + x, oy - 2, 2, 2 + (x % 2 ? 1 : 0), V[1]);
    if (E.tonto) s.ret(ox + 1, oy - 9, 5, 1, TINTA); else { s.ret(ox + 1, oy - 10 + agacha / 2, 2, 3, TINTA); s.ret(ox + 5, oy - 10 + agacha / 2, 2, 3, TINTA); if (E.prep) { s.px(ox + 1, oy - 9 + agacha / 2, RUBI); s.px(ox + 5, oy - 9 + agacha / 2, RUBI); } }
    s.linha(ox, oy - 4 + agacha / 2, ox + 6, oy - 5 + agacha / 2, 1, TINTA);
    if (!bote) { s.bola(ox - 3, oy - 22, 5, 3, R('#5C6784')); s.bola(ox + 3, oy - 23, 5, 3, R('#5C6784')); for (let i = 0; i < 3; i++) s.px(ox - 5 + i * 4, oy - 18 + ((Tm * 10 + i * 2) % 5), C('#8FB6D6')); }
  },
  // Inveja: um sapo de um olho só, que só olha para o que é dos outros
  inveja(s, e, Tm, E) {
    const V = R('#6CCB5F'), ar = e.estado === 'ar', ag = E.prep ? 3 : 0;
    for (const sd of [-1, 1]) { s.membro(ox + sd * 6, oy - 5 + ag, ox + sd * (ar ? 12 : 10), oy - (ar ? 0 : 1), 3, V); s.ret(ox + sd * (ar ? 12 : 10) - 2, oy - (ar ? 1 : 2), 5, 2, V[1]); }
    s.bola(ox, oy - 8 + ag, 9, 7 - ag / 2, V, 0.4, -0.7); s.bola(ox, oy - 4 + ag, 6, 3, R('#D9E8A8'));
    s.bola(ox + 2, oy - 15 + ag, 5, 5, V); s.bola(ox + 3, oy - 15 + ag, 3.5, 3.5, OSSO); s.ret(ox + 4, oy - 16 + ag, 2, 3, E.prep ? RUBI : TINTA);
    s.linha(ox - 4, oy - 6 + ag, ox + 7, oy - 6 + ag, 1, V[0]);
  },
  // Ganância: um rato corcunda com o saco às costas; depois de roubar, corre com ele cheio
  ganancia(s, e, Tm, E) {
    const V = R('#7A6A52'), corre = Math.abs(e.vx) > 60, p = corre ? Math.floor(Tm * 12) % 2 : 0, cheio = e.fugindo > 0 ? 2 : 0;
    cauda(s, ox - 7, oy - 4, 5, -1, Tm, 2, R('#C99A8A'), 2, 6);
    for (const [dx, a] of [[-3, p ? 3 : -2], [4, p ? -2 : 3]]) s.membro(ox + dx, oy - 6, ox + dx + a, oy - 1, 2, V);
    s.bola(ox - 5, oy - 14, 6 + cheio, 6 + cheio, OURO, 0.4, -0.7); s.ret(ox - 6, oy - 20 - cheio, 3, 2, OURO[1]); s.px(ox - 5, oy - 14, OURO[4]);
    s.bola(ox + 1, oy - 9, 6, 5, V, 0.4, -0.7); s.bola(ox + 7, oy - 12, 4, 4, V); s.poli([[ox + 9, oy - 13], [ox + 15, oy - 10], [ox + 9, oy - 9]], V[3]); s.px(ox + 15, oy - 10, C('#FF8FB8'));
    s.bola(ox + 5, oy - 16, 2.5, 2.5, R('#C99A8A')); s.px(ox + 9, oy - 13, E.prep ? RUBI : AMBAR);
  },
  // Dúvida: uma chama fria em forma de pergunta, com um olho que nunca se decide
  duvida(s, e, Tm, E) {
    const V = R('#8B6AD6'), y = oy - 14, bal = Math.round(Math.sin(Tm * 3) * 1.5);
    s.bola(ox + bal, y - 3, 7, 7, V, 0.4, -0.7); s.bola(ox + bal, y - 3, 3.5, 3.5, OSSO); s.px(ox + bal + Math.round(Math.sin(Tm * 6) * 2), y - 3, E.prep ? RUBI : TINTA);
    s.linha(ox + bal, y + 4, ox - 2, y + 9, 3, V[2]); s.linha(ox - 2, y + 9, ox + 1 - bal, y + 13, 2, V[1]); s.bola(ox + 1 - bal, y + 17, 1.6, 1.6, V);
    s.linha(ox + 4 + bal, y - 9, ox + 7 + bal, y - 14, 2, V[3]); s.px(ox + 8 + bal, y - 15, V[4]);
    if (E.prep) for (let a = 0; a < 6; a++) s.px(ox + bal + Math.cos(a + Tm * 8) * 10, y - 3 + Math.sin(a + Tm * 8) * 10, C('#C79BFF'));
  },
  // Ira: um javali de brasa; abaixa a cabeça e solta fumaça antes de investir
  ira(s, e, Tm, E) {
    const V = R('#B03A2E'), carga = e.estado === 'carga' || Math.abs(e.vx) > 150, p = Math.floor(Tm * (carga ? 14 : 6)) % 2, b = E.prep ? 2 : 0;
    for (const [dx, a] of [[-7, p ? 2 : -2], [-2, p ? -2 : 2], [5, p ? 2 : -2], [9, p ? -2 : 2]]) s.ret(ox + dx + (carga ? a : 0), oy - 5, 3, 5, V[0]);
    s.bola(ox - 1, oy - 10, 11, 7, V, 0.4, -0.7); s.bola(ox + 8, oy - 9 + b, 6, 6, V, 0.5, -0.7);
    for (let i = 0; i < 5; i++) { const x = ox - 8 + i * 4; s.linha(x, oy - 16, x - 2 - (carga ? 2 : 0), oy - 20 - (i % 2) * 2 - Math.floor(Tm * 10 + i) % 2, 2, C(i % 2 ? '#FF7A3C' : '#FFD23F')); }
    s.poli([[ox + 12, oy - 7 + b], [ox + 17, oy - 9 + b], [ox + 13, oy - 4 + b]], OSSO[3]); s.ret(ox + 9, oy - 11 + b, 2, 2, E.prep || carga ? BR : AMBAR);
    if (E.prep) for (let i = 0; i < 3; i++) s.ret(ox + 15 + i * 2, oy - 12 - i * 3 - Math.floor(Tm * 8) % 2, 2, 2, C('#C9C2B8'));
  },
  // Medo: só os olhos são certos; o resto é sombra que se desfaz
  medo(s, e, Tm, E) {
    const V = R('#3A3D5C'), y = oy - 14;
    for (let i = -2; i <= 2; i++) cauda(s, ox + i * 3, y + 6, 4, i < 0 ? -1 : 1, Tm + i, 2, V, 2, 4, 1.2);
    s.bola(ox, y, 9, 10, V, 0.3, -0.7); s.poli([[ox - 8, y - 4], [ox - 12, y - 14], [ox - 3, y - 8]], V[1]); s.poli([[ox + 8, y - 4], [ox + 12, y - 14], [ox + 3, y - 8]], V[1]);
    for (const dx of [-5, 2]) { s.ret(ox + dx, y - 3, 4, E.prep ? 4 : 2, BR); s.px(ox + dx + 2, y - 2, TINTA); }
    if (E.prep) s.poli([[ox - 4, y + 4], [ox + 4, y + 4], [ox, y + 9]], TINTA);
  },
  // Orgulho: o cavaleirinho de penacho alto atrás de um escudo maior que ele; só cai pelas costas
  orgulho(s, e, Tm, E) {
    const V = R('#8A6FC2'), p = Math.abs(e.vx) > 5 ? Math.floor(Tm * 6) % 2 : 0, aberto = e.aberto > 0 || E.tonto;
    for (const [dx, a] of [[-4, p ? -2 : 0], [4, p ? 0 : -2]]) { s.ret(ox + dx - 2, oy - 8, 4, 6 + a, ACO[1]); s.ret(ox + dx - 2, oy - 2 + a, 6, 2, FERRO[2]); }
    s.bola(ox, oy - 15, 8, 9, ACO, 0.5, -0.7); s.ret(ox - 7, oy - 12, 14, 2, V[2]); s.poli([[ox - 8, oy - 20], [ox - 14, oy - 6], [ox - 6, oy - 8]], V[1]);
    s.bola(ox + 1, oy - 26, 6, 6, ACO, 0.5, -0.7); s.ret(ox + 1, oy - 27, 6, 2, TINTA); s.px(ox + 4, oy - 27, E.prep ? RUBI : AMBAR);
    for (let i = 0; i < 5; i++) s.ret(ox - 3 + i, oy - 34 - (i < 3 ? i : 4 - i) * 2, 2, 4 + (i < 3 ? i : 4 - i) * 2, V[i % 2 ? 3 : 2]);
    if (aberto) { s.bola(ox - 8, oy - 6, 6, 3, FERRO); } // escudo no chão
    else { s.bola(ox + 10, oy - 14, 6, 12, V, 0.5, -0.7); s.bola(ox + 10, oy - 14, 4, 9, FERRO, 0.5, -0.7); s.ret(ox + 9, oy - 21, 2, 14, OURO[3]); s.ret(ox + 6, oy - 15, 8, 2, OURO[3]); }
  },
  // Vaidade: um espelho de mão que voa admirando o próprio reflexo
  vaidade(s, e, Tm, E) {
    const V = R('#9FE6F0'), y = oy - 18, bal = Math.round(Math.sin(Tm * 3) * 1.5);
    for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) s.poli([[ox + sd * 6, y + bal], [ox + sd * (13 + i * 2), y + bal - 8 + i * 6 - Math.floor(Tm * 8) % 2 * 2], [ox + sd * 8, y + bal + 3]], R('#2F8A6A')[i % 2 ? 2 : 3]);
    s.ret(ox - 1, y + 7 + bal, 3, 10, OURO[2]); s.ret(ox - 2, y + 15 + bal, 5, 2, OURO[1]);
    s.bola(ox, y + bal, 8, 9, OURO, 0.5, -0.7); s.bola(ox, y + bal, 6, 7, V, 0.6, -0.6); s.linha(ox - 3, y + bal + 3, ox + 1, y + bal - 4, 1, BR);
    if (E.tonto) s.ret(ox - 2, y + bal, 5, 1, TINTA); else { s.ret(ox - 3, y + bal - 1, 2, 2, E.prep ? RUBI : TINTA); s.ret(ox + 2, y + bal - 1, 2, 2, E.prep ? RUBI : TINTA); s.linha(ox - 2, y + bal + 3, ox + 2, y + bal + 3, 1, TINTA); s.px(ox + 3, y + bal + 2, TINTA); }
    for (let a = 0; a < 3; a++) s.px(ox + Math.cos(Tm * 2 + a * 2.1) * 11, y + bal + Math.sin(Tm * 2 + a * 2.1) * 12, BR);
  },
  // ---- o Vale da Mentira: criaturas que não existem ----
  // Serpente de duas cabeças: o corpo ondula rente ao chão e as duas cabeças falam ao mesmo tempo
  serpente(s, e, Tm, E) {
    const V = R('#6FBF8A'), B = R('#D9E8A8'), corre = e.estado === 'carga' || Math.abs(e.vx) > 60, ond = corre ? 10 : 4;
    let px = ox - 16, py = oy - 3;
    for (let i = 0; i <= 12; i++) { const k = i / 12, nx = ox - 16 + i * 2.6, ny = oy - 3 - Math.sin(Tm * ond - i * 0.7) * 2 * (1 - k) - k * 5; s.membro(px, py, nx, ny, Math.round(5 - k * 1.5), V, i % 2 === 0); px = nx; py = ny; }
    for (const [dx, dy, ph] of [[0, -11, 0], [5, -5, 1.6]]) { // as duas cabeças, cada uma num pescoço
      const hx = px + dx + Math.round(Math.sin(Tm * 4 + ph) * 1.5), hy = py + dy + Math.round(Math.cos(Tm * 3 + ph));
      s.membro(px, py, hx - 2, hy + 2, 3, V); s.bola(hx, hy, 4.5, 3.2, V, 0.4, -0.7); s.ret(hx - 1, hy + 1, 5, 1, B[2]);
      s.px(hx + 1, hy - 1, E.prep ? RUBI : AMBAR); if (Math.floor(Tm * 6 + ph * 3) % 3 === 0) { s.px(hx + 5, hy + 1, RUBI); s.px(hx + 6, hy, RUBI); s.px(hx + 6, hy + 2, RUBI); }
    }
    for (let x = -14; x < 12; x += 4) s.px(ox + x, oy - 4 - Math.round(Math.sin(Tm * ond - (x + 16) / 2.6 * 0.7) * 2), V[4]);
  },
  // Quimera: corpo de leão, cabeça de bode nas costas e cauda de serpente — feita de pedaços que não combinam
  quimera(s, e, Tm, E) {
    const L = R('#D9A65A'), J = R('#B07A3A'), G2 = R('#9A9488'), V = R('#6FBF8A'), ar = e.estado === 'ar', ag = E.prep ? 2 : 0, p = Math.floor(Tm * 8) % 2;
    cauda(s, ox - 12, oy - 12 + ag, 6, -1, Tm, 2, V, 3, 4, -0.6); s.bola(ox - 24, oy - 18 + ag, 2.5, 2, V); s.px(ox - 25, oy - 18 + ag, RUBI);
    for (const [dx, a] of [[-8, ar ? -3 : p ? 2 : -1], [-3, ar ? -2 : p ? -1 : 2], [6, ar ? 3 : p ? 2 : -1], [10, ar ? 4 : p ? -1 : 2]]) s.membro(ox + dx, oy - 9 + ag, ox + dx + a, oy - 1, 2, J);
    s.bola(ox, oy - 12 + ag, 12, 6.5, L, 0.4, -0.7);
    s.membro(ox - 4, oy - 17 + ag, ox - 6, oy - 23 + ag, 2, G2); s.bola(ox - 6, oy - 25 + ag, 3, 2.5, G2); s.linha(ox - 8, oy - 27 + ag, ox - 11, oy - 31 + ag, 1, G2[3]); s.linha(ox - 5, oy - 27 + ag, ox - 4, oy - 31 + ag, 1, G2[3]); s.px(ox - 7, oy - 25 + ag, TINTA);
    s.bola(ox + 12, oy - 16 + ag, 6.5, 6.5, J, 0.4, -0.7); s.bola(ox + 13, oy - 15 + ag, 4.5, 4, L);
    s.ret(ox + 14, oy - 17 + ag, 2, 2, E.prep ? RUBI : AMBAR); s.ret(ox + 15, oy - 12 + ag, 3, 1, TINTA); if (E.prep) { s.px(ox + 19, oy - 12 + ag, C('#FF8A3C')); s.px(ox + 20, oy - 13 + ag, C('#FFD23F')); }
  },
  // Grifo: cabeça e asas de águia num corpo de leão; mergulha do alto
  grifo(s, e, Tm, E) {
    const P = R('#C9B88A'), L = R('#B08A4A'), bat = Math.floor(Tm * 10) % 2, y = oy - 18, mergulha = E.prep || e.vy > 120;
    asa(s, ox - 2, y - 2, -1, 17, bat ? 1 : 0.2, P, 4, true);
    s.bola(ox - 2, y + 3, 10, 5, L, 0.4, -0.7); cauda(s, ox - 11, y + 3, 5, -1, Tm, 1, L, 2, 3, 0.4);
    for (const dx of [-6, 3]) s.membro(ox + dx, y + 6, ox + dx + (mergulha ? 3 : 1), y + 11, 2, L);
    s.bola(ox + 8, y - 3, 4.5, 4.5, R('#E9E4D4'), 0.4, -0.7); s.poli([[ox + 12, y - 4], [ox + 17, y - 1], [ox + 12, y]], C('#E8B030')); s.px(ox + 9, y - 4, E.prep ? RUBI : TINTA);
    asa(s, ox + 1, y - 3, 1, 15, bat ? 0.1 : 1, P, 4, true);
  },
  // Basilisco: lagarto de crista e coroa, com um olho que dizem petrificar; só cai pelas costas
  basilisco(s, e, Tm, E) {
    const V = R('#8FA05A'), B = R('#C9D08A'), p = Math.abs(e.vx) > 10 ? Math.floor(Tm * 6) % 2 : 0;
    cauda(s, ox - 10, oy - 6, 7, -1, Tm, 3, V, 1.5, 2, -0.2);
    for (const [dx, a] of [[-6, p ? 2 : -1], [6, p ? -1 : 2]]) s.membro(ox + dx, oy - 7, ox + dx + a, oy - 1, 3, V);
    s.bola(ox, oy - 10, 11, 6, V, 0.4, -0.7); s.bola(ox, oy - 7, 8, 2.5, B);
    for (let x = -8; x <= 6; x += 4) s.poli([[ox + x, oy - 15], [ox + x + 2, oy - 20 - (x === -4 ? 2 : 0)], [ox + x + 4, oy - 15]], C('#B03A3A'));
    s.bola(ox + 12, oy - 14, 6, 5, V, 0.4, -0.7); s.poli([[ox + 9, oy - 19], [ox + 11, oy - 24], [ox + 13, oy - 20], [ox + 15, oy - 25], [ox + 16, oy - 19]], OURO[3]);
    const brilho = E.prep || Math.floor(Tm * 2) % 4 === 0; s.bola(ox + 14, oy - 15, 2.5, 2.5, brilho ? R('#FFF07A') : R('#E8C24A')); s.px(ox + 15, oy - 15, TINTA);
    s.ret(ox + 13, oy - 11, 5, 1, TINTA);
  },
  // Dragão de mentira: asas de morcego, escamas vermelhas e uma boca de brasa; cospe três bolas de fogo
  dragao(s, e, Tm, E) {
    const V = R('#E2463C'), B = R('#F2C08A'), A = R('#7A1E1A'), bat = Math.floor(Tm * 7) % 2, y = oy - 18;
    asa(s, ox - 3, y - 4, -1, 20, bat ? 1 : 0.15, A, 5);
    cauda(s, ox - 12, y + 4, 8, -1, Tm, 3, V, 3, 2, 0.4); s.poli([[ox - 29, y + 6], [ox - 34, y + 3], [ox - 32, y + 9]], A[3]);
    s.bola(ox - 2, y + 4, 12, 6.5, V, 0.4, -0.7); s.bola(ox - 1, y + 7, 9, 3, B);
    for (const dx of [-7, 4]) { s.membro(ox + dx, y + 8, ox + dx + 2, y + 13, 2, V); s.px(ox + dx + 3, y + 13, OSSO[4]); }
    s.membro(ox + 8, y + 1, ox + 13, y - 6, 4, V); s.bola(ox + 16, y - 8, 6, 4.5, V, 0.4, -0.7); s.bola(ox + 20, y - 6, 3.5, 2.5, V);
    s.linha(ox + 13, y - 12, ox + 10, y - 17, 1, OSSO[3]); s.linha(ox + 16, y - 12, ox + 16, y - 17, 1, OSSO[3]);
    s.px(ox + 17, y - 9, E.prep ? BR : AMBAR); s.ret(ox + 18, y - 5, 5, 1, TINTA);
    if (E.prep) for (let i = 0; i < 4; i++) s.px(ox + 24 + i, y - 6 + Math.round(Math.sin(Tm * 20 + i) * 1.5), i % 2 ? C('#FFD23F') : C('#FF8A3C'));
    asa(s, ox, y - 5, 1, 17, bat ? 0.1 : 1, A, 5);
  }
};

// Quadro pronto de um vício (ou null se o tipo não tem desenho)
export function quadroVicio(e, Tm) {
  const p = PINTA[e.type]; if (!p) return null;
  const s = quadro.limpa(), E = { prep: e.tele > 0 || e.estado === 'prep', tonto: e.stun > 0.25 };
  p(s, e, Tm + (e.art?.ph || 0), E);
  if (e.flash > 0) s.tinge(BRANCO);
  s.contorno(TINTA);
  return { s, ax: ox, ay: oy };
}
