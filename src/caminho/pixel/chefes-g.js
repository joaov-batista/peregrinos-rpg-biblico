// Os cinco chefes da fase da célula, "Jesus me escolheu" (content/celula-escolheu.js): as mentiras que o estudo desmonta.
// Desenhados num quadro maior que o dos outros chefes (176×160, âncora nos pés em 88,154): mais pixels para detalhe com o
// mesmo tamanho de pixel do resto do jogo. Cada um tem silhueta que se lê de longe, luz de cima e da frente com borda fria
// do outro lado, partes que brilham (olhos, brasas, ouro), pano e partículas que se mexem sozinhos, e uma pose por golpe:
//   A REJEIÇÃO   — uma multidão de costas costurada num manto só; a máscara com o X; um halo de mãos que apontam.
//   O INTERESSEIRO — um agiota-bolsa: o corpo é um saco de moedas costurado, o coração com cadeado e etiqueta de preço.
//   A CONDENAÇÃO — o carcereiro-juiz: capuz de carrasco, olhos em brasa, o rol das acusações arrastando, correntes e o martelo.
//   A COVARDIA   — o galo de névoa fria que esconde a cara nas asas (Lc 22:60); só abre os olhos para atacar.
//   O FRACASSO   — o acusador alado: chifre partido, coroa quebrada flutuando, o rolo onde escreve "INCAPAZ", rachaduras de lava.
import { rampa as R, cor as C, TINTA } from './raster.js';
import { est } from './kit.js';

export const W = 176, H = 160, AX = 88, AY = 154;
const BR = C('#FFFFFF'), BREU = C('#07060C');
const xadrez = (s, x, y, w, h, c, f = 0) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (((x + i + y + j + f) & 1) === 0) s.px(x + i, y + j, c); };
// um pano em trapézio com dobras verticais que balançam e a barra em farrapos
function pano(s, x0, y0, l0, x1, y1, l1, Rp, Tm, o = {}) {
  const n = Math.max(1, y1 - y0), onda = o.onda ?? 1.5, dobras = o.dobras ?? 5;
  for (let y = y0; y <= y1; y++) {
    const k = (y - y0) / n, cx = x0 + (x1 - x0) * k + Math.sin(Tm * 2.2 + y * 0.09) * onda * k, l = l0 + (l1 - l0) * k;
    for (let x = Math.round(cx - l); x <= Math.round(cx + l); x++) {
      const u = (x - (cx - l)) / (2 * l), dob = Math.sin(u * Math.PI * dobras + Math.sin(Tm * 1.7 + k * 3) * 0.6);
      let v = 2 + (dob > 0.55 ? 1 : dob < -0.55 ? -1 : 0) + (u > 0.82 ? 1 : 0) - (u < 0.12 ? 1 : 0) - (k > 0.85 ? 1 : 0);
      s.px(x, y, Rp[Math.max(0, Math.min(4, v))]);
    }
    if (o.borda) { s.px(Math.round(cx + l), y, o.borda); }
  }
  if (o.farrapo !== false) for (let x = Math.round(x1 - l1); x <= x1 + l1; x++) { const h = ((x * 7 + 3) % 5 < 2 ? 3 : (x * 3) % 4 === 0 ? 2 : 0) + Math.round(Math.sin(Tm * 3 + x * 0.6)); if (h > 0) s.ret(x + Math.round(Math.sin(Tm * 2.2 + y1 * 0.09) * onda), y1 + 1, 1, h, Rp[x < x1 ? 0 : 1]); }
}
// um braço de dois segmentos com volume (sombra, base, luz) e a mão no fim
function braco(s, a, b, g, Rb, dobra = 4, sd = 1) {
  const m = { x: (a.x + b.x) / 2 + sd * dobra, y: (a.y + b.y) / 2 + Math.abs(dobra) * 0.5 };
  s.membro(a.x, a.y, m.x, m.y, g, Rb); s.membro(m.x, m.y, b.x, b.y, Math.max(2, g - 1), Rb); return m;
}
const brilho = (s, x, y, r, c1, c2) => { s.bola(x, y, r, r, [c2, c2, c1, c1, BR]); };

/* =====================================================================================================
   A REJEIÇÃO — "Ninguém te escolheu." Uma multidão de costas, costurada num manto só, e um rosto de porcelana com um X.
   ===================================================================================================== */
const CABELOS = [R('#2A1A12'), R('#4A2E1C'), R('#1A1418'), R('#6A4A2A'), R('#3A2A22')], TUNICAS = [R('#4A5272'), R('#5A4A62'), R('#3E5A5E'), R('#5E5A48'), R('#4A3E56')], PELE_M = C('#8A6A58');
const MULT = R('#4A5272'), MULTE = R('#262A40'), PORC = R('#E2DEEA'), XV = R('#D8364A'), MAOS = R('#A8AEC6'), CAPUZ = R('#30344E');
function rejeicao(s, b, Tm) {
  const E = est(b, Tm), t = E.tipo || '', grita = t === 'calaTe' && E.ataca, aponta = t === 'dedos' && !E.caido, empurra = (t === 'empurrao' || t === 'atropelo') && (E.ataca || b.corre) && !E.caido;
  const X = AX + (empurra ? 6 : 0), cai = E.caido ? 16 : 0, base = AY - 2, top = base - 118 + cai + E.resp;
  // o halo de mãos que apontam, atrás da cabeça, girando devagar
  const nM = 10, gir = Tm * (grita ? 1.4 : 0.35);
  if (!E.caido) for (let i = 0; i < nM; i++) { const a = gir + i * Math.PI * 2 / nM, r0 = 20, r1 = 34 + (E.prep ? 6 : 0) + Math.sin(Tm * 3 + i) * 2, cx = X + 2, cy = top + 22;
    const x0 = cx + Math.cos(a) * r0, y0 = cy + Math.sin(a) * r0 * 0.8, x1 = cx + Math.cos(a) * r1, y1 = cy + Math.sin(a) * r1 * 0.8;
    s.membro(x0, y0, x1, y1, 2, MAOS); s.ret(Math.round(x1) - 1, Math.round(y1) - 1, 3, 3, MAOS[3]); s.linha(x1, y1, x1 + Math.cos(a) * 5, y1 + Math.sin(a) * 4, 1, MAOS[4]); }
  // o manto-multidão: largo embaixo, com fileiras de gente de costas costuradas no pano
  pano(s, X, top + 30, 15, AX + (empurra ? -6 : 0), base, 44, MULT, Tm, { onda: empurra ? 4 : 1.5, dobras: 7 });
  for (let fila = 0; fila < 3; fila++) { const y = top + 52 + fila * 22, n = 3 + fila, larg = 18 + fila * 12;
    for (let k = 0; k < n; k++) { const x = X - larg + (k + 0.5) * (2 * larg / n) + Math.sin(Tm * 1.3 + k + fila) * 1, sacode = grita ? Math.round(Math.sin(Tm * 20 + k) * 1) : 0;
      const cab = CABELOS[(k + fila * 2) % CABELOS.length], roupa = TUNICAS[(k * 3 + fila) % TUNICAS.length];
      s.bola(x + sacode, y + 10, 9, 7, roupa, 0.3, -0.8); s.bola(x + sacode, y, 5, 5, cab, 0.3, -0.8); s.px(x + sacode - 5, y + 1, PELE_M); s.px(x + sacode + 5, y + 1, PELE_M); s.px(x + sacode + 2, y - 3, cab[4]); } } // a multidão de costas: cabelos, orelhas e ombros (ninguém olha para você)
  for (let y = top + 34; y < base - 4; y += 6) for (let x = -2; x <= 2; x++) s.px(X + x * 10 + (y % 12 ? 0 : 3), y, MULTE[0]); // os pontos da costura
  // os braços: o da frente aponta (ou empurra, ou ergue o punho no grito); o de trás segura o manto
  const ombro = { x: X + 12, y: top + 38 };
  const alvo = E.caido ? { x: ombro.x + 8, y: base - 8 } : aponta || (E.prep && t === 'dedos') ? { x: ombro.x + 44, y: top + 30 } : empurra ? { x: ombro.x + 36, y: top + 50 } : grita || E.prep ? { x: ombro.x + 10, y: top + 2 } : { x: ombro.x + 14, y: top + 66 };
  braco(s, ombro, alvo, 6, MULT, 4, 1);
  const mx = Math.round(alvo.x), my = Math.round(alvo.y);
  if (aponta || (E.prep && t === 'dedos')) { s.bola(mx, my, 5, 4, MAOS); s.membro(mx + 3, my - 1, mx + 16, my - 2, 2, MAOS); s.px(mx + 17, my - 2, MAOS[4]); s.membro(mx + 2, my - 4, mx + 4, my - 8, 2, MAOS); // o dedo da acusação e o polegar
    if (E.ataca) for (let k = 0; k < 3; k++) s.px(mx + 20 + k * 4, my - 2 + (k % 2), XV[3]); }
  else if (empurra) { for (const dy of [-5, 4]) { s.bola(mx, my + dy, 5, 5, MAOS); for (let k = -2; k <= 2; k++) s.linha(mx + 4, my + dy + k * 2, mx + 9, my + dy + k * 2 - 1, 1, MAOS[3]); } }
  else { s.bola(mx, my, 5, 5, MAOS); if (grita || E.prep) for (let k = -1; k <= 1; k++) s.linha(mx + k * 3, my - 3, mx + k * 3, my - 7, 1, MAOS[3]); }
  braco(s, { x: X - 12, y: top + 38 }, { x: X - 20, y: top + (E.caido ? 76 : 70) }, 6, MULT, -4, -1);
  // a cabeça: capuz pontudo e a máscara de porcelana grande, com o X pintado escorrendo
  const hx = X + 2, hy = top + 14 + (E.caido ? 6 : 0);
  s.poli([[hx - 15, hy + 10], [hx + 15, hy + 10], [hx + 4, hy - 22], [hx - 2, hy - 20]], CAPUZ[1]); s.bola(hx, hy + 4, 16, 16, CAPUZ, 0.4, -0.7);
  s.bola(hx + 1, hy + 4, 12, 15, PORC, 0.45, -0.7);
  if (E.caido) { s.linha(hx + 1, hy - 10, hx - 2, hy + 6, 1, BREU); s.linha(hx - 2, hy + 6, hx + 3, hy + 18, 1, BREU); } // a máscara rachou
  for (let k = -9; k <= 9; k++) { const y1 = hy + 4 + k, xa = hx + 1 + Math.round(k * 0.75); s.ret(xa - 1, y1, 3, 1, XV[2]); s.ret(hx + 1 - Math.round(k * 0.75) - 1, y1, 3, 1, XV[2]); if (k === 9) for (let d = 0; d < 4; d++) { s.px(xa, y1 + d, XV[1]); s.px(hx + 1 - Math.round(k * 0.75), y1 + d + 1, XV[1]); } } // o X, com a tinta escorrendo
  s.px(hx - 4, hy - 4, XV[4]); s.px(hx + 6, hy - 4, XV[4]);
  if (!E.caido) { const o = E.prep && E.pisca ? XV[4] : BREU; s.ret(hx - 6, hy - 1, 4, 2, o); s.ret(hx + 4, hy - 1, 4, 2, o); } // fendas dos olhos
  if (grita) { s.bola(hx + 1, hy + 11, 4, 5, R('#1A0A12')); for (let k = -3; k <= 3; k += 2) s.px(hx + 1 + k, hy + 7, PORC[4]);
    for (let k = 1; k <= 3; k++) { const r = 8 + k * 7 + (E.t6 % 2) * 2; for (let a = -0.7; a <= 0.7; a += 0.12) s.px(hx + 14 + Math.cos(a) * r, hy + 10 + Math.sin(a) * r, k === 1 ? BR : PORC[3 - k + 1]); } } // o grito que manda calar
  else for (let k = -4; k <= 4; k += 2) s.linha(hx + 1 + k, hy + 10, hx + 1 + k, hy + 13, 1, BREU); // a boca costurada
  // papéis rasgados com X girando em volta
  for (let i = 0; i < 4; i++) { const a = Tm * 0.9 + i * 1.57, x = X + Math.cos(a) * 46, y = top + 70 + Math.sin(a * 1.3) * 26, w = 5 + Math.round(Math.cos(a * 2) * 2);
    s.ret(x, y, Math.max(1, w), 6, PORC[2]); s.px(x + 1, y + 2, XV[2]); s.px(x + Math.max(1, w) - 2, y + 2, XV[2]); s.px(x + Math.floor(w / 2), y + 3, XV[2]); }
}

/* =====================================================================================================
   O INTERESSEIRO — "Só te amo se…". O corpo é um saco de moedas costurado; no peito, o coração com cadeado e preço.
   ===================================================================================================== */
const ROXO = R('#5C3A78'), ROXOE = R('#34204A'), OURO = R('#E0A83C'), SACO = R('#8A6A4A'), PELEI = R('#D0A882'), CORA = R('#D8445E'), PAPEL = R('#F0E6CC'), ACO = R('#9AA4B4');
function moeda(s, x, y, r, f) { const w = Math.max(1, Math.round(r * Math.abs(Math.cos(f)))); s.bola(x, y, w, r, OURO, 0.5, -0.6); if (w > 2) s.ret(x - 1, y - 1, 2, 3, OURO[1]); }
function interesseiro(s, b, Tm) {
  const E = est(b, Tm), t = E.tipo || '', abre = t === 'cofre' && (E.prep || E.ataca), joga = (t === 'moedao' || t === 'preco') && E.ataca, corre = (t === 'ganancia' || b.corre) && !E.caido, esfrega = E.prep && !abre;
  const X = AX + (corre ? 8 : 0), cai = E.caido ? 10 : 0, base = AY - 2, cy = base - 46 + cai + E.resp;
  // moedas em órbita (somem quando ele cai)
  if (!E.caido) for (let i = 0; i < 7; i++) { const a = Tm * 1.6 + i * 0.9, x = X + Math.cos(a) * 56, y = cy - 20 + Math.sin(a) * 18; if (Math.sin(a) < 0) moeda(s, x, y, 3, Tm * 6 + i); }
  // pernas curtas, sapatos de fivela
  for (const [dx, lev] of [[-14, E.anda && E.passo ? -3 : 0], [12, E.anda && !E.passo ? -3 : 0]]) { s.membro(X + dx, cy + 26, X + dx + (corre ? 4 : 0), base - 5 + lev, 6, ROXOE); s.bola(X + dx + 3 + (corre ? 4 : 0), base - 3 + lev, 7, 3, R('#1E1428'), 0.5, -0.7); s.ret(X + dx + 1 + (corre ? 4 : 0), base - 5 + lev, 4, 2, OURO[3]); }
  // o corpo: um saco enorme, costurado, com a boca amarrada em cima e moedas forçando o pano
  s.bola(X, cy, 36, 32, SACO, 0.5, -0.65);
  for (let k = 0; k < 9; k++) { const a = -2.6 + k * 0.62, x = X + Math.cos(a) * 26, y = cy + 6 + Math.sin(a) * 20; s.bola(x, y, 5, 4, SACO, 0.4, -0.9); } // o volume das moedas por dentro
  for (let y = -28; y <= 28; y += 4) { const l = Math.round(Math.sqrt(Math.max(0, 1 - Math.pow(y / 32, 2))) * 35); s.px(X - l + 3, cy + y, SACO[0]); s.px(X + l - 3, cy + y, SACO[3]); }
  for (let y = -26; y <= 26; y += 3) { s.px(X - 2, cy + y, SACO[0]); s.px(X - 4, cy + y + 1, SACO[1]); s.px(X, cy + y + 1, SACO[1]); } // a costura do meio
  // a casaca roxa por cima, aberta na frente, com a gola dourada
  for (const sd of [-1, 1]) { s.poli([[X + sd * 8, cy - 30], [X + sd * 36, cy - 14], [X + sd * 34, cy + 22], [X + sd * 20, cy + 30]], ROXO[sd < 0 ? 1 : 2]); s.linha(X + sd * 8, cy - 30, X + sd * 20, cy + 30, 1, ROXO[sd < 0 ? 0 : 4]); for (let k = 0; k < 3; k++) s.bola(X + sd * 22, cy - 8 + k * 9, 2, 2, OURO); }
  s.poli([[X - 16, cy - 32], [X + 16, cy - 32], [X + 10, cy - 24], [X - 10, cy - 24]], OURO[2]); s.linha(X - 16, cy - 32, X + 16, cy - 32, 1, OURO[4]);
  // a boca do saco: no golpe do cofre ela abre como uma boca cheia de moedas-dentes
  if (abre) { s.bola(X + 4, cy + 4, 18, 12, R('#1A0E12')); for (let k = -16; k <= 16; k += 4) { moeda(s, X + 4 + k, cy - 6 + Math.abs(k) * 0.15, 2, 0); moeda(s, X + 4 + k, cy + 14 - Math.abs(k) * 0.15, 2, 0); } s.bola(X + 4, cy + 4, 4, 3, CORA); }
  else { // o coração com cadeado e a etiqueta de preço pendurada
    const bate = Math.floor(Tm * 4) % 2 && !E.caido ? 1 : 0, hx = X + 6, hy = cy - 6;
    s.bola(hx - 4, hy, 5 + bate, 5 + bate, CORA); s.bola(hx + 4, hy, 5 + bate, 5 + bate, CORA); s.poli([[hx - 9 - bate, hy + 1], [hx + 9 + bate, hy + 1], [hx, hy + 12 + bate]], CORA[2]); s.px(hx - 5, hy - 3, CORA[4]);
    s.ret(hx - 3, hy + 2, 7, 6, ACO[2]); s.ret(hx - 3, hy + 2, 7, 1, ACO[4]); s.linha(hx - 2, hy + 2, hx - 2, hy - 1, 1, ACO[3]); s.linha(hx + 2, hy + 2, hx + 2, hy - 1, 1, ACO[3]); s.ret(hx - 1, hy - 2, 3, 1, ACO[3]); s.px(hx, hy + 4, BREU); // o cadeado
    const bal = Math.round(Math.sin(Tm * 3) * 2); s.linha(hx + 8, hy - 2, hx + 18, hy + 6 + bal, 1, PAPEL[1]); s.ret(hx + 16, hy + 6 + bal, 12, 8, PAPEL[3]); s.ret(hx + 16, hy + 6 + bal, 12, 1, PAPEL[4]); s.px(hx + 18, hy + 8 + bal, OURO[1]); s.ret(hx + 20, hy + 8 + bal, 6, 1, BREU); s.ret(hx + 19, hy + 11 + bal, 7, 1, BREU); } // "R$ ∞"
  // braços longos e finos: um com a balança desequilibrada, o outro pedindo (ou esfregando as mãos)
  const pede = E.caido ? { x: X + 32, y: base - 8 } : joga ? { x: X + 40, y: cy - 56 } : esfrega ? { x: X + 10, y: cy - 34 } : corre ? { x: X + 56, y: cy - 16 } : { x: X + 44, y: cy - 6 };
  braco(s, { x: X + 28, y: cy - 22 }, pede, 5, ROXO, 5, 1); s.bola(pede.x, pede.y, 5, 4, PELEI);
  for (let k = 0; k < 4; k++) s.linha(pede.x + 2, pede.y - 2 + k, pede.x + 6, pede.y - 4 + k * 2, 1, PELEI[3]);
  if (joga) moeda(s, pede.x + 6, pede.y - 10, 7, Tm * 12); // o moedão
  if (esfrega) { braco(s, { x: X - 28, y: cy - 22 }, { x: X + 4, y: cy - 34 }, 5, ROXO, -4, -1); s.bola(X + 6, cy - 34, 5, 4, PELEI); for (let k = 0; k < 3; k++) s.px(X + 2 + ((E.t6 + k) % 6), cy - 40 - k, OURO[4]); }
  else { const bl = E.caido ? { x: X - 34, y: base - 10 } : { x: X - 50, y: cy - 40 }; braco(s, { x: X - 28, y: cy - 22 }, bl, 5, ROXO, -4, -1); s.bola(bl.x, bl.y, 4, 4, PELEI);
    if (!E.caido) { const inc = Math.sin(Tm * 1.5) * 0.15 + 0.25, px = bl.x, py = bl.y - 4; s.membro(px, py, px, py - 10, 2, OURO);
      for (const sd of [-1, 1]) { const ex = px + sd * 16, ey = py - 10 + sd * inc * 16; s.linha(px, py - 10, ex, ey, 1, OURO[3]); s.linha(ex, ey, ex - 5, ey + 9, 1, OURO[1]); s.linha(ex, ey, ex + 5, ey + 9, 1, OURO[1]); s.bola(ex, ey + 10, 7, 2, OURO, 0.5, 0.8); if (sd > 0) for (let k = 0; k < 3; k++) moeda(s, ex - 3 + k * 3, ey + 7, 2, 0); else s.bola(ex, ey + 7, 2, 2, CORA); } } } // a balança: o ouro pesa mais que o coração
  // a cabeça: rosto dourado de sorriso pintado, monóculo, cartola com faixa vermelha e moeda
  const hx2 = X - 2, hy2 = cy - 46 + (E.caido ? 8 : 0);
  s.bola(hx2, hy2, 14, 13, PELEI); s.bola(hx2 + 2, hy2 + 1, 11, 11, OURO, 0.4, -0.6);
  if (!E.caido) { s.ret(hx2 - 5, hy2 - 3, 4, 3, BREU); s.ret(hx2 + 5, hy2 - 3, 4, 3, BREU); s.px(hx2 - 4, hy2 - 3, E.prep ? C('#FFF0A0') : OURO[4]); s.px(hx2 + 6, hy2 - 3, E.prep ? C('#FFF0A0') : OURO[4]); }
  else { s.ret(hx2 - 5, hy2 - 2, 4, 1, BREU); s.ret(hx2 + 5, hy2 - 2, 4, 1, BREU); }
  s.bola(hx2 + 7, hy2 - 2, 4, 4, [ACO[1], ACO[2], C('#C8E8F8'), C('#E8F8FF'), BR]); s.linha(hx2 + 10, hy2 + 1, hx2 + 12, hy2 + 12, 1, OURO[3]); // o monóculo
  for (let k = -7; k <= 8; k++) s.px(hx2 + 1 + k, hy2 + 6 - Math.round(Math.abs(k) * 0.35) + (E.caido ? 3 : 0), BREU); if (!E.caido) for (let k = -5; k <= 6; k += 2) s.px(hx2 + 1 + k, hy2 + 5 - Math.round(Math.abs(k) * 0.35), BR); // o sorriso de vendedor
  const ch = R('#1E1428'); s.ret(hx2 - 15, hy2 - 13, 32, 4, ch[2]); s.ret(hx2 - 15, hy2 - 13, 32, 1, ch[3]); s.ret(hx2 - 9, hy2 - 34, 20, 21, ch[2]); s.ret(hx2 - 9, hy2 - 34, 2, 21, ch[3]); s.ret(hx2 + 9, hy2 - 34, 2, 21, ch[1]); s.ret(hx2 - 9, hy2 - 19, 20, 3, CORA[2]); moeda(s, hx2 + 1, hy2 - 26, 4, 0);
  // as moedas de órbita da frente
  if (!E.caido) for (let i = 0; i < 7; i++) { const a = Tm * 1.6 + i * 0.9; if (Math.sin(a) >= 0) moeda(s, X + Math.cos(a) * 56, cy - 20 + Math.sin(a) * 18, 3, Tm * 6 + i); }
}

/* =====================================================================================================
   A CONDENAÇÃO — "Você nunca vai mudar." O carcereiro-juiz: capuz de carrasco, olhos em brasa, correntes e o rol.
   ===================================================================================================== */
const TOGA = R('#3E2C36'), TOGAE = R('#1E141A'), FERRO = R('#6E6A76'), FERRUG = R('#A8604A'), ROL = R('#DCCCA4'), BRASA = C('#FF5A3C'), BRASA2 = C('#FFB070'), MADE = R('#6A4632');
function corrente(s, x0, y0, x1, y1, Tm, cai = 0) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 3));
  for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * cai, el = (i + Math.floor(Tm * 6)) % 2;
    if (el) { s.ret(x - 1, y - 1, 3, 2, FERRUG[3]); s.px(x - 1, y, FERRUG[1]); } else { s.ret(x - 1, y - 1, 2, 3, FERRUG[2]); s.px(x, y + 1, FERRUG[0]); } }
}
function condenacao(s, b, Tm) {
  const E = est(b, Tm), t = E.tipo || '', chicote = t === 'chicote' && E.ataca, ergue = (t === 'tijolos' || t === 'cangalha') && (E.prep || E.ataca), amarra = t === 'amarras' && !E.caido, bate = (t === 'tijolos' || t === 'cangalha') && E.ataca;
  const X = AX, cai = E.caido ? 18 : 0, base = AY - 2, top = base - 132 + cai + E.resp;
  // a toga larga até o chão, pesada (balança pouco)
  pano(s, X, top + 34, 22, X - 2, base, 40, TOGA, Tm, { onda: 0.6, dobras: 6 });
  for (let y = top + 40; y < base - 4; y += 5) s.px(X - 1, y, TOGAE[2]);
  // o rol das acusações: preso no cinto, arrasta pelo chão e se desenrola até o pé, com marcas vermelhas
  const rx = X + 10, ry = top + 70; s.ret(rx, ry, 12, 6, ROL[2]); s.ret(rx, ry, 12, 1, ROL[4]);
  for (let k = 0; k < 9; k++) { const y = ry + 6 + k * 7, ox = Math.round(Math.sin(Tm * 1.2 + k * 0.6) * (k * 0.5)); if (y > base) break; s.ret(rx + 1 + ox, y, 10, 7, ROL[k % 2 ? 2 : 3]); s.ret(rx + 3 + ox, y + 2, 6, 1, C('#8A1A1A')); s.ret(rx + 3 + ox, y + 4, 4, 1, ROL[0]); }
  s.ret(rx - 2, base - 4, 22, 4, ROL[2]); s.ret(rx + 18, base - 6, 4, 6, ROL[1]); // o rolo no chão
  // as correntes cruzando o corpo, a bola de ferro arrastada
  corrente(s, X - 22, top + 40, X + 22, top + 80, Tm); corrente(s, X + 22, top + 42, X - 24, top + 86, Tm);
  corrente(s, X - 26, top + 86, X - 48, base - 6, Tm, 4); s.bola(X - 52, base - 8, 8, 8, FERRO, 0.5, -0.7); s.px(X - 55, base - 12, FERRO[4]);
  // ombreiras de ferro com rebites e o colar de ferro
  for (const sd of [-1, 1]) { s.bola(X + sd * 22, top + 34, 11, 8, FERRO, 0.5, -0.7); for (let k = -1; k <= 1; k++) s.px(X + sd * 22 + k * 5, top + 31, FERRO[4]); }
  s.ret(X - 12, top + 26, 24, 6, FERRO[2]); s.ret(X - 12, top + 26, 24, 1, FERRO[4]); s.ret(X - 12, top + 31, 24, 1, FERRO[0]);
  // braço da corrente (chicote): gira em cima no aviso, estala para a frente no golpe; braço do martelo de juiz
  const mc = E.caido ? { x: X + 30, y: base - 10 } : chicote ? { x: X + 46, y: top + 50 } : E.prep && t === 'chicote' ? { x: X + 30, y: top + 6 } : amarra ? { x: X + 40, y: top + 40 } : { x: X + 34, y: top + 74 };
  braco(s, { x: X + 24, y: top + 40 }, mc, 8, TOGA, 4, 1); s.bola(mc.x, mc.y, 6, 5, R('#8A6A5A'));
  if (chicote) corrente(s, mc.x, mc.y, mc.x + 60, mc.y + 22, Tm, -6);
  else if (E.prep && t === 'chicote') for (let k = 0; k < 14; k++) { const a = Tm * 14 + k * 0.45, r = 14; s.ret(mc.x + Math.cos(a) * r, mc.y - 6 + Math.sin(a) * r * 0.4, 2, 2, FERRUG[k % 2 ? 2 : 3]); }
  else if (amarra) { corrente(s, mc.x, mc.y, mc.x + 40, mc.y + 30, Tm, 8); for (let k = 0; k < 3; k++) s.bola(mc.x + 40, mc.y + 30, 6 - k, 4 - k, FERRUG); }
  else if (!E.caido) corrente(s, mc.x, mc.y, mc.x + 4, mc.y + 22 + Math.round(Math.sin(Tm * 4) * 2), Tm);
  const mm = E.caido ? { x: X - 30, y: base - 12 } : ergue && !bate ? { x: X - 18, y: top - 8 } : bate ? { x: X + 20, y: top + 60 } : { x: X - 34, y: top + 66 };
  braco(s, { x: X - 24, y: top + 40 }, mm, 8, TOGA, -4, -1); s.bola(mm.x, mm.y, 6, 5, R('#8A6A5A'));
  { const ang = ergue && !bate ? -1.4 : bate ? 0.2 : -2.0, cx = mm.x + Math.cos(ang) * 24, cy = mm.y + Math.sin(ang) * 24; s.membro(mm.x, mm.y, cx, cy, 3, MADE);
    const px = -Math.sin(ang), py = Math.cos(ang); s.poli([[cx + px * 12 - Math.cos(ang) * 4, cy + py * 12 - Math.sin(ang) * 4], [cx - px * 12 - Math.cos(ang) * 4, cy - py * 12 - Math.sin(ang) * 4], [cx - px * 12 + Math.cos(ang) * 6, cy - py * 12 + Math.sin(ang) * 6], [cx + px * 12 + Math.cos(ang) * 6, cy + py * 12 + Math.sin(ang) * 6]], MADE[2]);
    s.linha(cx + px * 12 - Math.cos(ang) * 4, cy + py * 12 - Math.sin(ang) * 4, cx - px * 12 - Math.cos(ang) * 4, cy - py * 12 - Math.sin(ang) * 4, 1, MADE[4]); for (const k of [-9, 9]) s.ret(cx + px * k - 1, cy + py * k - 1, 3, 3, FERRO[3]);
    if (bate) for (let k = 0; k < 6; k++) s.px(cx + (k - 3) * 6, cy + 10 + (k % 2) * 3, BRASA2); } // o martelo de juiz, cravejado
  // o capuz pontudo de carrasco com olhos em brasa (e fumaça subindo da ponta)
  const hx = X, hy = top + 12 + (E.caido ? 6 : 0);
  s.poli([[hx - 15, hy + 16], [hx + 15, hy + 16], [hx + 13, hy - 4], [hx + 3, hy - 26], [hx - 4, hy - 26], [hx - 13, hy - 4]], TOGAE[2]); s.bola(hx, hy + 4, 15, 14, TOGAE, 0.45, -0.75); s.linha(hx + 3, hy - 26, hx + 14, hy, 1, TOGA[3]);
  const olho = E.caido ? TOGAE[3] : E.prep || E.pisca ? BRASA : BRASA2;
  for (const sd of [-1, 1]) { s.ret(hx + sd * 6 - 2, hy + 1, 5, 3, BREU); s.ret(hx + sd * 6 - 1, hy + 2, 3, 1, olho); if (!E.caido) s.px(hx + sd * 6, hy + 1, BR); }
  if (amarra && !E.caido) for (let k = 0; k < 7; k++) s.px(hx - 9 + k * 3, hy + 10, BRASA);
  for (let i = 0; i < 4; i++) { const k = (Tm * 0.5 + i / 4) % 1; s.px(hx + Math.sin(Tm * 2 + i) * 2 + k * 6, hy - 28 - k * 18, k < 0.5 ? TOGA[3] : TOGA[2]); }
}

/* =====================================================================================================
   A COVARDIA — "Homem, não sei do que você está falando!" (Lc 22:60). O galo de névoa fria que esconde a cara nas asas.
   ===================================================================================================== */
const NEV = R('#86AACE'), NEVE = R('#3E5476'), CRIS = R('#DC3A3A'), BICO = R('#E8B03A'), PENA = R('#5A6E9A'), GELO = R('#CDEBFF');
function covardia(s, b, Tm) {
  const E = est(b, Tm), t = E.tipo || '', raio = t === 'relampago' && (E.ataca || E.prep), sopra = (t === 'rajada' || t === 'vagalhao') && E.ataca, granizo = t === 'granizo' && E.ataca, revela = raio || sopra || E.prep;
  const treme = E.caido ? 0 : Math.round(Math.sin(Tm * 34) * (revela ? 0.5 : 1.2)), X = AX + treme, cy = AY - 64 + E.flu * 2 + (E.caido ? 28 : 0);
  // a cauda de névoa que se desfaz embaixo (ela flutua) e as penas longas da cauda de galo, em azul frio
  for (let k = 0; k < 9; k++) { const y = cy + 26 + k * 5, w = 26 - k * 2.6, a = Math.sin(Tm * 2.6 + k * 0.8) * (2 + k * 0.4); for (let x = Math.round(-w); x <= w; x++) { const v = (x + a) / w; s.px(X + x + a, y, NEV[v > 0.5 ? 3 : v < -0.5 ? 1 : 2]); if (k > 5 && (x + k + E.t6) % 3 === 0) s.px(X + x + a, y + 2, NEV[1]); } }
  for (let k = 0; k < 5; k++) { const a0 = -2.3 - k * 0.22 + Math.sin(Tm * 2 + k) * 0.06, L = 34 + k * 4; let px = X - 18, py = cy + 10; for (let i = 1; i <= L; i += 2) { const u = i / L, nx = X - 18 + Math.cos(a0 + u * 1.1) * i, ny = cy + 10 + Math.sin(a0 + u * 1.1) * i; s.membro(px, py, nx, ny, Math.max(1, Math.round(4 * (1 - u))), k % 2 ? PENA : R('#7A5AA8'), false); px = nx; py = ny; } s.px(px, py, GELO[3]); }
  // o corpo: um peito de penas arrepiadas, encolhido
  s.bola(X, cy, 26, 28, NEV, 0.45, -0.7);
  for (let k = 0; k < 16; k++) { const a = k * 0.4 + 0.3, r = 14 + (k % 3) * 4, x = X + Math.cos(a) * r * 0.9, y = cy + 4 + Math.sin(a) * r * 0.7; s.linha(x, y, x + 2, y + 4, 1, NEV[1]); s.px(x, y - 1, NEV[4]); } // as penas do peito, arrepiadas de frio
  // as asas: fechadas na frente do rosto (escondendo) ou abertas de susto no golpe
  for (const sd of [-1, 1]) {
    if (revela) { const ab = E.prep ? 0.8 : 1, x0 = X + sd * 16, y0 = cy - 12; // as asas abertas de susto, uma para cada lado
      for (let i = 0; i < 6; i++) { const a = (0.35 - i * 0.3) * ab, L = 34 + i * 3, x1 = x0 + sd * Math.cos(a) * L, y1 = y0 + Math.sin(a) * L * 0.8; s.membro(x0, y0, x1, y1, 4, i % 2 ? PENA : NEVE); s.px(x1, y1, GELO[4]); s.px(x1 + sd, y1, GELO[3]); } }
    else { s.poli([[X + sd * 26, cy - 22], [X + sd * 6, cy - 50], [X - sd * 4, cy - 42], [X - sd * 2, cy - 6], [X + sd * 22, cy + 8]], (sd < 0 ? NEVE : PENA)[2]);
      for (let k = 0; k < 5; k++) s.linha(X + sd * (24 - k * 4), cy - 20 - k * 4, X + sd * (4 - k), cy - 40 + k * 7, 1, (sd < 0 ? NEVE : PENA)[k % 2 ? 1 : 3]); }
  }
  // a cabeça: crista vermelha, barbela, o bico; os olhos só aparecem quando ela abre as asas para atacar
  const hx = X + 4, hy = cy - 34 + (E.caido ? 6 : 0);
  if (revela || E.caido) { s.bola(hx, hy, 13, 13, NEV, 0.4, -0.7);
    const o = E.caido ? NEVE[1] : raio && E.pisca ? C('#FFFFA0') : BR; s.bola(hx - 4, hy - 2, 4, 4, [o, o, o, o, o]); s.bola(hx + 6, hy - 2, 4, 4, [o, o, o, o, o]); if (!E.caido) { s.ret(hx - 4, hy - 2, 2, 2, BREU); s.ret(hx + 6, hy - 2, 2, 2, BREU); }
    s.poli([[hx + 9, hy + 2], [hx + 22, hy + 5], [hx + 9, hy + 9]], BICO[2]); s.linha(hx + 9, hy + 5, hx + 20, hy + 5, 1, BICO[0]); if (raio || sopra) s.poli([[hx + 9, hy + 6], [hx + 18, hy + 10], [hx + 9, hy + 12]], BICO[1]); // o bico aberto: "cocoricó"
    s.bola(hx + 9, hy + 13, 3, 5, CRIS); }
  else { s.poli([[hx + 7, hy + 6], [hx + 15, hy + 8], [hx + 7, hy + 11]], BICO[2]); } // só a ponta do bico aparece entre as asas
  for (let k = 0; k < 5; k++) s.bola(hx - 8 + k * 4, hy - 13 - (k % 2) * 3 - (k === 2 ? 2 : 0), 3, 4, CRIS, 0.4, -0.8);
  // o gelo que cai dela (granizo) e o raio que ela solta
  if (granizo) for (let k = 0; k < 6; k++) { const x = X - 30 + k * 12, y = cy + 40 + ((Tm * 80 + k * 17) % 30); s.ret(x, y, 2, 3, GELO[3]); s.px(x, y, BR); }
  if (raio && E.ataca) { let x = hx + 10, y = hy - 10; for (let k = 0; k < 8; k++) { const nx = x + (k % 2 ? 6 : -3), ny = y - 8; s.linha(x, y, nx, ny, 2, k % 2 ? GELO[4] : BR); x = nx; y = ny; } }
  if (!E.caido && !revela) for (let k = 0; k < 4; k++) { const tt = (Tm * 1.3 + k / 4) % 1; s.px(X - 30 - k * 3, cy - 10 + tt * 30, GELO[3]); s.px(X + 30 + k * 3, cy - 6 + tt * 26, GELO[3]); } // gotas de suor frio
}

/* =====================================================================================================
   O FRACASSO — "Deus errou com você." O acusador alado, com o rolo do INCAPAZ e o troféu rachado; arde por dentro.
   ===================================================================================================== */
const CARNE = R('#6A1E30'), CARNEE = R('#3A0E1A'), ASA = R('#40142A'), LAVA = R('#FF7A2A'), CHIFRE = R('#4A3A2E'), TROF = R('#C8A858'), PERG = R('#DCCCA8');
function fracasso(s, b, Tm) {
  const E = est(b, Tm), t = E.tipo || '', acusa = t === 'acusacao' && !E.caido, leao = t === 'leao' && (E.ataca || b.corre) && !E.caido, dardos = t === 'dardos' && (E.prep || E.ataca), abismo = t === 'abismo' && (E.prep || E.ataca), cadeias = t === 'cadeias' && E.ataca;
  const X = AX + (leao ? 8 : 0), cy = AY - 70 + E.flu * 2 + (E.caido ? 26 : 0), f3 = b.hp < b.max * 0.33;
  // a coroa quebrada que flutua acima (ele quer o seu trono)
  if (!E.caido) { const cx = X + 2, cyc = cy - 76 + Math.sin(Tm * 2) * 3; for (let k = -3; k <= 3; k++) { if (k === 1) continue; s.ret(cx + k * 5 - 2, cyc, 4, 6 + (k % 2 ? 0 : 3), TROF[k < 0 ? 2 : 3]); s.px(cx + k * 5, cyc - 1 - (k % 2 ? 0 : 3), C('#FF4A4A')); } s.ret(cx - 17, cyc + 6, 34, 3, TROF[1]); s.linha(cx + 4, cyc + 2, cx + 7, cyc + 9, 1, BREU); }
  // as asas de morcego, membrana rasgada, abertas no abismo e nos dardos
  const ab = E.caido ? 0.1 : leao ? 0.25 : abismo || dardos ? 1 : 0.55 + Math.sin(Tm * 3.4) * 0.2;
  for (const sd of [-1, 1]) { const ox = X + sd * 12, oy = cy - 26, dedos = [];
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + 0.25 + i * 0.32 * (0.5 + ab * 0.7), L = 46 + i * 6 - (i === 4 ? 10 : 0); dedos.push([ox + sd * Math.cos(a) * L, oy + Math.sin(a) * L * 0.85 + i * 4]); }
    const pts = dedos.map(([x, y]) => [x, y]);
    for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i], mx = (ax + bx) / 2, my = (ay + by) / 2 + 8; s.poli([[ox, oy], [ax, ay], [mx, my], [bx, by]], ASA[i % 2 ? 1 : 2]); if (i === 2) { s.poli([[mx - 3, my - 6], [mx + 4, my - 4], [mx, my + 2]], BREU); } } // a membrana, com um rasgo
    for (const [x, y] of pts) { s.membro(ox, oy, x, y, 2, CARNEE); s.px(x, y, CHIFRE[3]); }
  }
  // o corpo: torso magro de carne escura com rachaduras de lava que pulsam
  s.poli([[X - 18, cy - 30], [X + 18, cy - 30], [X + 12, cy + 18], [X - 12, cy + 18]], CARNE[2]); s.bola(X, cy - 14, 18, 20, CARNE, 0.5, -0.7);
  for (let k = 0; k < 3; k++) s.linha(X - 10 + k * 2, cy - 22 + k * 7, X + 9 - k * 2, cy - 20 + k * 7, 1, CARNE[1]);
  const pul = (Math.sin(Tm * 5) + 1) / 2, lv = LAVA[pul > 0.5 ? 4 : 3];
  for (const [x0, y0, x1, y1] of [[-6, -26, -2, -12], [-2, -12, -7, 2], [5, -22, 3, -6], [3, -6, 8, 10], [0, 4, -2, 16]]) s.linha(X + x0, cy + y0, X + x1, cy + y1, 1, f3 ? LAVA[4] : lv);
  // a capa em farrapos, e a cauda
  pano(s, X, cy + 10, 12, X - (leao ? 8 : 0), AY - 2, 24, R('#2A0A16'), Tm, { onda: 2.5, dobras: 4 });
  { let px = X - 10, py = AY - 10; for (let i = 1; i < 16; i++) { const nx = X - 10 - i * 3, ny = AY - 10 - Math.sin(Tm * 3 - i * 0.5) * 4 - i * 0.6; s.membro(px, py, nx, ny, Math.max(1, Math.round(3 - i * 0.15)), CARNEE, false); px = nx; py = ny; } s.poli([[px, py - 3], [px - 6, py], [px, py + 3]], CARNEE[3]); }
  // braço do rolo: escreve INCAPAZ; na acusação, desenrola e mostra
  const ma = acusa ? { x: X - 34, y: cy - 40 } : E.caido ? { x: X - 26, y: AY - 10 } : { x: X - 30, y: cy + 4 };
  braco(s, { x: X - 16, y: cy - 24 }, ma, 5, CARNE, -4, -1);
  const comp = acusa && !E.prep ? 46 : 14; s.ret(ma.x - 6, ma.y - 2, 12, comp, PERG[3]); s.ret(ma.x - 7, ma.y - 4, 14, 3, PERG[1]); s.ret(ma.x - 7, ma.y + comp - 1, 14, 3, PERG[1]); s.ret(ma.x - 6, ma.y - 2, 1, comp, PERG[1]);
  if (comp > 20) { const L = ['I', 'N', 'C', 'A', 'P', 'A', 'Z']; L.forEach((_, i) => { s.ret(ma.x - 2, ma.y + 3 + i * 6, 4, 4, C('#8A1A1A')); s.px(ma.x - 1, ma.y + 4 + i * 6, PERG[3]); }); }
  // o outro braço: o troféu rachado que ele diz que você nunca vai ganhar, ou a mão em brasa dos dardos, ou a garra do leão
  const mb = dardos ? { x: X + 38, y: cy - 44 } : leao ? { x: X + 42, y: cy - 6 } : cadeias ? { x: X + 36, y: cy - 24 } : E.caido ? { x: X + 28, y: AY - 10 } : { x: X + 30, y: cy + 2 };
  braco(s, { x: X + 16, y: cy - 24 }, mb, 5, CARNE, 4, 1);
  if (dardos) { s.bola(mb.x, mb.y, 6, 6, LAVA); for (let k = 0; k < 8; k++) { const a = Tm * 6 + k * 0.8, r = 8 + (k % 3) * 2; s.px(mb.x + Math.cos(a) * r, mb.y + Math.sin(a) * r, k % 2 ? LAVA[4] : LAVA[2]); } }
  else if (leao) { for (let k = -2; k <= 2; k++) { s.linha(mb.x, mb.y + k * 3, mb.x + 10, mb.y + k * 4 + 2, 2, CHIFRE[3]); s.px(mb.x + 10, mb.y + k * 4 + 2, BR); } }
  else if (cadeias) { for (let k = 0; k < 10; k++) s.ret(mb.x + k * 4, mb.y + Math.sin(k + Tm * 8) * 2, 3, 3, k % 2 ? R('#7A7A84')[3] : R('#7A7A84')[1]); }
  else if (!E.caido) { s.ret(mb.x - 1, mb.y - 2, 3, 8, TROF[1]); s.poli([[mb.x - 8, mb.y - 16], [mb.x + 8, mb.y - 16], [mb.x + 4, mb.y - 4], [mb.x - 4, mb.y - 4]], TROF[3]); s.linha(mb.x - 8, mb.y - 16, mb.x + 8, mb.y - 16, 1, TROF[4]); s.linha(mb.x + 1, mb.y - 16, mb.x - 2, mb.y - 6, 1, BREU); s.ret(mb.x - 5, mb.y + 6, 11, 3, TROF[2]); }
  // a cabeça: chifre inteiro e chifre partido; no golpe do leão, a juba de fogo de quem "anda em derredor, como leão" (1Pe 5:8)
  const hx = X + 2 + (leao ? 6 : 0), hy = cy - 46 + (E.caido ? 6 : 0);
  if (leao) for (let k = 0; k < 14; k++) { const a = k * 0.45, r = 18 + Math.sin(Tm * 12 + k) * 3; s.linha(hx, hy, hx + Math.cos(a) * r, hy + Math.sin(a) * r, 3, k % 2 ? LAVA[3] : LAVA[2]); }
  s.bola(hx, hy, 13, 14, CARNE, 0.45, -0.7);
  s.membro(hx - 8, hy - 8, hx - 18, hy - 24, 4, CHIFRE); s.membro(hx - 18, hy - 24, hx - 14, hy - 34, 2, CHIFRE); // o chifre inteiro
  s.membro(hx + 8, hy - 8, hx + 15, hy - 18, 4, CHIFRE); s.ret(hx + 13, hy - 20, 5, 2, CHIFRE[4]); // o partido
  const olho = E.caido ? CARNE[1] : E.prep ? C('#FFF6B0') : LAVA[4];
  s.poli([[hx - 9, hy - 2], [hx - 2, hy], [hx - 9, hy + 2]], olho); s.poli([[hx + 9, hy - 2], [hx + 2, hy], [hx + 9, hy + 2]], olho);
  if (acusa || leao) { s.bola(hx, hy + 8, 6, 4, BREU); for (let k = -4; k <= 4; k += 2) { s.px(hx + k, hy + 5, BR); s.px(hx + k + 1, hy + 11, BR); } }
  else for (let k = -5; k <= 6; k++) s.px(hx + k, hy + 8 - (k > 0 ? Math.round(k * 0.3) : 0), BREU);
  if (f3 && !E.caido) for (let k = 0; k < 8; k++) { const tt = (Tm * 1.2 + k / 8) % 1; s.px(hx - 10 + k * 3 + Math.sin(Tm * 4 + k) * 2, hy - 14 - tt * 16, tt < 0.5 ? LAVA[4] : LAVA[2]); } // na última fase, a cabeça arde
}

export const CHEFES_G = { rejeicao, interesseiro, condenacao, covardia, fracasso };
export const GRANDES = Object.fromEntries(Object.entries(CHEFES_G).map(([k, f]) => [k, { ax: AX, ay: AY, w: W, h: H, pinta: f }]));
