// O Conselho Zelote: três guerreiros de Israel, não vilões. Manto pesado de lã, capuz fundo que deixa o rosto meio na
// sombra, olhar firme — sérios, calados, imponentes. Tons de terra da Judeia e um acento de cor em cada um.
//   Menaém — compacto, o rosto coberto por um lenço até o nariz, faixa carmesim na testa com as pontas ao vento, duas sicas.
//   Eleazar — uma torre: ombros de pele de carneiro, barba grisalha, testeira de bronze, a lança mais alta que ele.
//   Jair — o ancião largo: barba branca comprida, um olho vendado, a foice de ceifa enorme.
// Poses: parado, aviso, rasante, mergulho, parede e caído. O desenho olha para a DIREITA.
import { C, OX as ox, OY as oy, TINTA } from './kit.js';

const BR = C('#FFFFFF'), ACO = C('#E8ECF4'), ACOE = C('#9AA4B8'), BREU = C('#07060B'), OSSO = C('#D9D4C4'), OSSOE = C('#9A947F'), PALIDO = C('#C9B8A0'), PELE = C('#B98A62'), PELEE = C('#7E5A3E'), PELES = C('#4E3626'), COURO = C('#6B4A2E'), COUROE = C('#3A2A1E');
const QUEM = {
  menaem: { H: 54, W: 12, SH: 8, R: 8, m: ['#241A1C', '#3A2A2C', '#523C3A', '#7C6258'].map(C), acento: C('#B8323A'), acentoE: C('#74202A') },
  eleazar: { H: 68, W: 16, SH: 13, R: 9, m: ['#161C2C', '#232C44', '#34405E', '#5E6E90'].map(C), acento: C('#D9A441'), acentoE: C('#8A6422') },
  jair: { H: 56, W: 21, SH: 15, R: 10, m: ['#26201A', '#3C3226', '#544632', '#80704E'].map(C), acento: C('#E8E2D0'), acentoE: C('#9A947F') }
};
const lamina = (s, x0, y0, x1, y1, g = 2) => { s.linha(x0, y0, x1, y1, g + 1, ACOE); s.linha(x0, y0, x1, y1, g, ACO); s.linha(x0, y0, x1, y1, 1, BR); };

function zelote(s, b, Tm, nome) {
  const Q = QUEM[nome], M = Q.m, t = b.mov?.def?.fn || b.mov?.nome || '', caido = b.quebrado > 0 || b.tonto > 0, prep = !caido && (b.tele > 0 || (!!b.mov && b.mov.t < 0.3)), age = !caido && !!b.mov && !prep, pisca = Math.floor(Tm * 14) % 2;
  const mergulho = /Cadente|^bote|^giro|^abalo/.test(t) && !caido, parede = !mergulho && /Parede|Rasteira|Alta|chuva|^fogo|^brasas|Costas/.test(t) && !caido, rasante = !mergulho && !parede && !!t && !caido, vai = rasante && (age || b.corre);
  // o respeito, depois da luta: 1 = de pé, sereno; 2 = o gesto de cada um; 3 = o punho no peito e a cabeça baixa
  const gs = caido ? 0 : b.gesto || 0; if (gs !== b.gestoDe) { b.gestoDe = gs; b.gestoIni = Tm; } const gk = gs >= 2 ? Math.min(1, (Tm - b.gestoIni) / 0.7) : 0, ajoelha = nome === 'eleazar' ? gk : 0;
  const resp = Math.floor(Tm * 2.4) % 2, chao = oy - 2;
  // quanto o corpo se encolhe e para onde pende
  const kH = caido ? 0.5 : vai ? 0.62 : parede ? 0.72 : prep ? 0.9 : (1 - ajoelha * 0.3) * (b.sentado ? 0.84 : 1), kW = caido ? 1.25 : vai ? 1.15 : parede ? 1.05 : 1;
  const H = Math.round(Q.H * kH) - (resp && !t && !caido ? 0 : 0), W = Math.round(Q.W * kW), SH = Q.SH, R = Q.R;
  const base = chao - (mergulho ? 12 : parede ? 6 : 0), cx = ox, pende = vai ? 15 : caido ? -3 : mergulho ? 1 : nome === 'menaem' ? 4 : nome === 'jair' ? 3 : 1;
  const ombroY = base - H + R + 3 + resp * (t || caido ? 0 : 1), ombroX = cx + pende;
  // ---------- a cauda do manto: para trás na corrida, para cima no mergulho, pesada no chão quando parado ----------
  const vento = Math.sin(Tm * 6) * 2;
  if (vai) { s.poli([[ombroX - SH + 2, ombroY - 2], [ombroX - 2, ombroY + 8], [cx - W - 30, base - 9 + vento], [cx - W - 34, base - 17 + vento], [cx - W - 22, base - 20]], M[1]); s.poli([[ombroX - SH + 2, ombroY - 2], [cx - W - 22, base - 20], [cx - W - 34, base - 17 + vento], [cx - W - 10, base - 22]], M[2]); for (let k = 0; k < 5; k++) s.ret(cx - W - 34 - k * 2 + (k % 2) * 3, base - 17 + vento + k * 2, 5 - k, 2, M[1]); }
  if (mergulho) { s.poli([[ombroX - SH, ombroY + 2], [ombroX + SH - 2, ombroY + 2], [cx + 7 + vento, base - H - 26], [cx - 2 + vento, base - H - 34], [cx - 12, base - H - 20]], M[1]); s.poli([[ombroX - SH, ombroY + 2], [cx - 12, base - H - 20], [cx - 2 + vento, base - H - 34], [cx - 6, base - H - 12]], M[2]); for (let k = 0; k < 4; k++) s.ret(cx - 4 + vento + k * 3, base - H - 36 + (k % 2) * 3, 2, 5, M[1]); }
  // ---------- botas: só as pontas aparecem por baixo da barra ----------
  if (!mergulho && !caido && !b.sentado) for (const [dx, lev] of vai ? [[10, 0], [-12, -2]] : parede ? [[6, -1], [-2, 0]] : [[6, 0], [-5, 0]]) { s.ret(cx + dx - 3, base - 3 + lev, 7, 4, M[0]); s.ret(cx + dx + 2, base - 1 + lev, 3, 2, M[1]); }
  if (mergulho) { s.ret(cx - 5, base - 2, 5, 5, M[0]); s.ret(cx + 2, base - 4, 5, 5, M[0]); }
  // ---------- o manto: a massa do corpo ----------
  const tras = cx - W - (vai ? 4 : nome === 'jair' ? 3 : 2), frente = cx + W - (vai ? 0 : 3), barra = base - (mergulho ? 2 : 1);
  s.poli([[ombroX - SH, ombroY], [ombroX + SH, ombroY], [frente, barra], [tras, barra]], M[1]);
  s.poli([[ombroX - SH, ombroY], [ombroX - SH + 4, ombroY], [tras + 7, barra], [tras, barra]], M[0]); // costas na sombra
  s.poli([[ombroX + SH - 4, ombroY], [ombroX + SH, ombroY], [frente, barra], [frente - 6, barra]], M[2]); // frente pega a luz
  s.linha(ombroX + SH, ombroY, frente, barra, 1, M[3]); // o fio de luz na borda da frente
  for (let k = -2; k <= 2; k++) s.linha(ombroX + k * (SH / 3), ombroY + 3, cx + k * (W / 2.6) + (vai ? -4 : 0), barra - 1, 1, k % 2 ? M[0] : BREU); // dobras
  for (let x = tras; x <= frente; x++) { const h = (x * 13 + 700) % 7; if (h < 4) s.ret(x, barra, 1, 1 + h, (x + 3) % 5 ? M[1] : M[0]); } // barra em farrapos
  s.linha(cx - 1 + pende * 0.5, ombroY + 2, cx - 2, barra - 1, 1, BREU); // a abertura do manto
  // ---------- ombros ----------
  for (const sd of [-1, 1]) s.bola(ombroX + sd * (SH - 2), ombroY + 1, 5, 4, { 0: M[0], 1: M[1], 2: M[1], 3: M[2], 4: M[3] }, 0.5, -0.8);
  if (nome === 'eleazar') for (const sd of [-1, 1]) { s.bola(ombroX + sd * (SH - 1), ombroY - 1, 7, 5, { 0: M[0], 1: C('#2A2A30'), 2: C('#3E3E48'), 3: C('#5A5A68'), 4: C('#8A8A98') }, 0.5, -0.8); for (let k = -2; k <= 2; k++) s.linha(ombroX + sd * (SH - 1) + k * 2, ombroY + 2, ombroX + sd * (SH - 1) + k * 3, ombroY + 6 + (k % 2), 1, C('#3E3E48')); } // pele de animal nos ombros
  // ---------- o que cada um tem no corpo ----------
  if (nome === 'menaem') { for (let k = 0; k < 3; k++) { const y = ombroY + 7 + k * 5; if (k) continue; s.linha(ombroX - SH + 3, y - 3, cx + W - 6, barra - 10, 2, COUROE); s.linha(ombroX - SH + 3, y - 3, cx + W - 6, barra - 10, 1, COURO); s.linha(ombroX + SH - 3, y - 3, cx - W + 6, barra - 10, 2, COUROE); s.linha(ombroX + SH - 3, y - 3, cx - W + 6, barra - 10, 1, COURO); } s.ret(cx - W + 4, barra - 9, W * 2 - 8, 2, Q.acentoE); s.ret(cx - W + 4, barra - 9, W * 2 - 8, 1, Q.acento); } // torso enfaixado e a faixa na cintura
  if (nome === 'eleazar') { s.bola(ombroX + 2, ombroY + 4, 3, 3, { 0: C('#6A4A1C'), 1: C('#8A6A2C'), 2: C('#C9963C'), 3: C('#E8C060'), 4: C('#FFF1BE') }, 0.4, -0.7); for (let k = 0; k < 4; k++) s.ret(ombroX - 4 + k, ombroY + 14 + k * 5, 9 - k, 1, Q.acentoE); } // broche de bronze e as tiras do peitoral
  if (nome === 'jair') { for (const [dx, dy] of [[-10, 14], [6, 22], [-3, 28]]) { s.ret(cx + dx, ombroY + dy, 5, 4, M[3]); s.px(cx + dx, ombroY + dy, BREU); s.px(cx + dx + 4, ombroY + dy + 3, BREU); } for (let k = 0; k < 9; k++) s.px(cx - W + 5 + k * 4, barra - 12 + (k % 2), C('#8A7A5A')); // remendos e a corda
  }
  // ---------- a cabeça: capuz fundo ----------
  const hx = ombroX + (vai ? 7 : caido ? -2 : 2), hy = ombroY - R + 2 + (caido ? 4 : 0) + (vai ? 3 : 0) + (gs === 3 ? Math.round(gk * 3) : 0);
  s.poli([[hx - R - 2, hy + R], [hx + R + 1, hy + R], [hx + R + 2, hy - 1], [hx + 2, hy - R - 2], [hx - R + 1, hy - R - 4 - (nome === 'jair' ? 2 : 0)], [hx - R - 3, hy - 2]], M[1]);
  s.poli([[hx - R - 2, hy + R], [hx - R + 3, hy + R], [hx - R + 3, hy - R - 2], [hx - R + 1, hy - R - 4 - (nome === 'jair' ? 2 : 0)], [hx - R - 3, hy - 2]], M[0]);
  s.linha(hx + 2, hy - R - 2, hx + R + 2, hy - 1, 1, M[3]); s.linha(hx + R + 2, hy - 1, hx + R + 1, hy + R, 1, M[2]); // luz na borda do capuz
  s.bola(hx + 2, hy + 1, R - 2, R - 2, { 0: M[0], 1: M[0], 2: M[0], 3: M[0], 4: M[0] }); // o fundo do capuz
  s.bola(hx + 3, hy + 2, R - 4, R - 3, { 0: PELES, 1: PELEE, 2: PELEE, 3: PELE, 4: PELE }, 0.6, 0.7); // o rosto: a luz pega o queixo, a testa fica na sombra do capuz
  s.ret(hx - R + 5, hy - R + 4, R * 2 - 7, 3, M[0]); // a sombra do capuz sobre a testa
  const olhoY = hy, aceso = prep && pisca;
  if (!caido) { s.ret(hx + 1, olhoY, 2, 1, BREU); s.ret(hx + 5, olhoY, 2, 1, BREU); s.ret(hx, olhoY - 1, 3, 1, BREU); s.ret(hx + 5, olhoY - 1, 3, 1, BREU); if (aceso) { s.px(hx + 2, olhoY, BR); s.px(hx + 6, olhoY, BR); } } // olhar firme sob a sobrancelha cerrada
  else { s.ret(hx + 1, olhoY, 2, 1, PELES); s.ret(hx + 5, olhoY, 2, 1, PELES); }
  if (nome === 'menaem') { if (gk < 0.5) { s.poli([[hx - 2, hy + 2], [hx + R, hy + 2], [hx + R, hy + R - 1], [hx - 1, hy + R]], M[2]); s.linha(hx - 2, hy + 2, hx + R, hy + 2, 1, M[3]); s.linha(hx + 1, hy + 4, hx + 6, hy + 5, 1, M[1]); } // o lenço que cobre do nariz para baixo
    else { s.ret(hx + 2, hy + 4, 4, 1, PELES); s.ret(hx + 1, hy + 5, 6, 2, BREU); s.ret(hx - 2, hy + R - 2, R + 2, 3, M[2]); s.linha(hx - 2, hy + R - 2, hx + R, hy + R - 2, 1, M[3]); } // lenço arriado no pescoço: a boca e a barba curta
    s.ret(hx - R - 2, hy - 4, R * 2 + 3, 2, Q.acentoE); s.ret(hx - R - 2, hy - 4, R * 2 + 3, 1, Q.acento); // a faixa na testa, por cima do capuz
    for (let k = 0; k < 2; k++) { let x = hx - R - 2, y = hy - 3 + k; for (let i = 1; i <= 6; i++) { const nx = hx - R - 2 - i * (vai ? 4 : 2.2), ny = hy - 3 + k * 3 + Math.sin(Tm * 7 + i * 0.7 + k * 1.3) * (1 + i * 0.35) + (vai || mergulho ? -i * (mergulho ? 2.5 : 0.2) : i * 0.9); s.linha(x, y, nx, ny, 1, k ? Q.acentoE : Q.acento); x = nx; y = ny; } } } // as pontas ao vento
  if (nome === 'eleazar') { const G = C('#8E8E96'), GE = C('#5A5A64'); s.poli([[hx - 1, hy + 3], [hx + 7, hy + 3], [hx + 7, hy + R], [hx + 3, hy + R + 4], [hx, hy + R]], GE); s.poli([[hx + 3, hy + 3], [hx + 7, hy + 3], [hx + 7, hy + R], [hx + 4, hy + R + 3]], G); s.ret(hx + 2, hy + 4, 4, 1, BREU); // barba grisalha cheia
    s.ret(hx - 2, hy - 4, R + 3, 2, Q.acentoE); s.ret(hx - 2, hy - 4, R + 3, 1, Q.acento); s.px(hx + 3, hy - 4, BR); } // testeira de bronze
  if (nome === 'jair') { const Bb = C('#D8D4C6'), BbE = C('#9A968A'); s.poli([[hx - 2, hy + 3], [hx + 7, hy + 3], [hx + 7, hy + R + 2], [hx + 3, hy + R + 9], [hx - 1, hy + R + 3]], BbE); s.poli([[hx + 2, hy + 3], [hx + 7, hy + 3], [hx + 7, hy + R + 2], [hx + 4, hy + R + 8]], Bb); s.ret(hx + 2, hy + 4, 4, 1, BREU); // barba branca comprida
    s.linha(hx - 3, hy - 4, hx + 3, hy + 2, 2, M[3]); s.ret(hx, olhoY - 1, 3, 2, M[3]); } // a venda sobre um olho
  // ---------- as armas: o branco que corta o escuro ----------
  const maoY = ombroY + Math.round(H * 0.42);
  if (nome === 'menaem') {
    if (mergulho) { lamina(s, cx - 3, base, cx - 4, base + 12); lamina(s, cx + 4, base - 2, cx + 6, base + 10); }
    else if (vai) { lamina(s, frente + 2, base - 12, frente + 16, base - 14); lamina(s, frente, base - 7, frente + 13, base - 5); }
    else if (parede) { lamina(s, hx + R + 3, hy - 6, hx + R + 12, hy - 15); lamina(s, frente - 2, maoY + 4, frente + 4, maoY + 13); s.ret(hx + R + 1, hy - 5, 3, 3, M[0]); }
    else if (caido) { lamina(s, frente + 1, chao - 2, frente + 12, chao - 1); lamina(s, tras - 2, chao - 1, tras - 12, chao - 2); }
    else if (gs >= 2) { const ax = frente + 2 + Math.round(gk * 10); s.linha(ombroX + SH - 2, ombroY + 6, ax - 2, maoY - 4, 3, M[1]); s.ret(ax - 3, maoY - 6, 4, 4, PELE); lamina(s, ax - 4, maoY - 5, ax - 16, maoY - 3); s.ret(ax, maoY - 6, 6, 3, COURO); s.px(ax + 5, maoY - 6, COUROE); lamina(s, tras - 2, chao - 1, tras - 12, chao - 2); } // a sica oferecida pelo cabo; a outra, no chão
    else { lamina(s, frente - 2, maoY + 2, frente + 5 + (prep ? 3 : 0), maoY + 12 - (prep ? 8 : 0)); lamina(s, tras + 4, maoY + 3, tras - 3, maoY + 12); s.ret(frente - 4, maoY, 4, 3, M[0]); s.ret(tras + 3, maoY + 1, 4, 3, M[0]); } // seguradas ao contrário
  } else if (nome === 'eleazar') {
    const [x0, y0, x1, y1] = mergulho ? [cx + 2, base - H + 6, cx + 2, base + 16] : vai ? [cx - 22, base - 16, frente + 26, base - 13] : parede ? [cx - 14, hy - 4, frente + 22, hy - 18] : caido ? [tras - 10, chao - 3, frente + 22, chao - 6] : [frente + 3, base, frente + 6 - (prep ? 5 : 0), base - Q.H - 14];
    s.linha(x0, y0, x1, y1, 2, C('#3A2A1E')); s.linha(x0, y0, x1, y1, 1, C('#6B4A2E')); const L = Math.hypot(x1 - x0, y1 - y0) || 1, ux = (x1 - x0) / L, uy = (y1 - y0) / L;
    s.poli([[x1 - uy * 3, y1 + ux * 3], [x1 + uy * 3, y1 - ux * 3], [x1 + ux * 13, y1 + uy * 13]], ACO); s.linha(x1, y1, x1 + ux * 12, y1 + uy * 12, 1, BR); s.ret(x1 - 1, y1 - 1, 3, 3, C('#C9963C')); for (let k = 0; k < 4; k++) s.px(x1 - ux * 3 - uy * (2 + k), y1 - uy * 3 + ux * (2 + k) + k, Q.acento); // a ponta, o anel e o penacho
    if (!mergulho && !caido) s.ret(vai ? frente - 2 : frente + 1, vai ? base - 16 : maoY, 4, 4, M[0]); // a luva que a segura
  } else {
    const giro = parede && age ? Tm * 15 : 0, [px, py, a] = mergulho ? [cx + 3, base - 4, Math.PI * 0.5] : vai ? [frente + 4, base - 13, 0] : parede ? [hx + R + 4, hy - 8, -1 + giro] : caido || gs >= 2 ? [frente + 2, chao - 4, 0.1] : [frente + 2, maoY, -1.25 - (prep ? 0.5 : 0)];
    const hl = parede ? 8 : 20, ex = px + Math.cos(a) * hl, ey = py + Math.sin(a) * hl; s.linha(px - Math.cos(a) * 6, py - Math.sin(a) * 6, ex, ey, 2, C('#3A2A1E')); s.linha(px, py, ex, ey, 1, C('#7A5A36'));
    for (let k = 0; k <= 14; k++) { const an = a - 0.2 + k * 0.17, rr = 13 - Math.abs(k - 7) * 0.12, qx = ex + Math.cos(an) * rr - Math.cos(a - 0.2) * 13, qy = ey + Math.sin(an) * rr - Math.sin(a - 0.2) * 13, g = k < 3 ? 1 : k > 11 ? 1 : 3; for (let j = 0; j < g; j++) s.px(qx - Math.cos(an) * j, qy - Math.sin(an) * j, j === 0 ? BR : j === 1 ? ACO : ACOE); } // a meia-lua da foice
    if (!parede) for (let k = 1; k <= 6; k++) s.px(px - 2 - k, py + 3 + Math.round(Math.sin(k * 0.8 + Tm * 4) * 1.5) + k, k % 2 ? ACOE : C('#5A5E6A')); // a corrente
    if (gs < 2) { s.ret(px - 2, py - 2, 4, 4, PELE); s.px(px - 2, py - 2, PELEE); } // a mão
  }
  if (nome === 'jair' && /^fogo|^brasas/.test(t)) { const fx = hx + 12, fy = hy - 14 + Math.round(Math.sin(Tm * 9) * 2), F1 = C('#FF9A3C'), F2 = C('#FFD27A'); s.linha(ombroX + 6, ombroY + 4, fx, fy + 6, 3, M[1]); s.ret(fx - 2, fy + 4, 4, 4, PELE); s.bola(fx, fy, 5 + pisca, 6 + pisca, { 0: C('#A8431C'), 1: F1, 2: F1, 3: F2, 4: BR }, 0, 0.6); s.px(fx - 4, fy - 8 - pisca * 2, F1); s.px(fx + 3, fy - 10 + pisca, F2); s.px(fx, fy - 12 - pisca, F1); } // a mão erguida com o fogo do zelo
  // ---------- os gestos de respeito ----------
  if (gs >= 2 && nome === 'jair' && gs === 2) { const bx = hx + 13, by = hy - 4 - Math.round(gk * 8); s.linha(ombroX + 6, ombroY + 5, bx, by + 5, 3, M[1]); s.ret(bx - 2, by, 5, 5, PELE); s.ret(bx - 2, by - 2, 1, 2, PELE); s.ret(bx, by - 3, 1, 3, PELE); s.ret(bx + 2, by - 2, 1, 2, PELE); if (gk >= 1) for (let k = 0; k < 4; k++) s.px(bx + 6 + k * 3, by + 8 + k * 4 + pisca, k % 2 ? C('#FFE9A8') : BR); } // a mão aberta que abençoa
  if ((gs === 3 || (gs === 2 && nome === 'eleazar')) && gk > 0.4) { s.linha(ombroX + SH - 3, ombroY + 5, ombroX + 3, ombroY + 11, 3, M[2]); s.ret(ombroX, ombroY + 9, 5, 5, PELE); s.px(ombroX, ombroY + 9, PELEE); s.px(ombroX + 4, ombroY + 13, PELEE); } // o punho fechado no peito
  // ---------- rastros ----------
  if (vai) for (let k = 0; k < 4; k++) s.ret(cx - W - 40 - k * 5, base - 22 + k * 5, 9 - k * 2, 1, k % 2 ? Q.acento : ACO);
  if (mergulho && age) for (let k = 0; k < 3; k++) s.ret(cx - 7 + k * 7, base - H - 40 - k * 4, 1, 7, Q.acento);
}

export const CHEFES_E = {
  conselho(s, b, Tm) { zelote(s, b, Tm, b.cen?.quem === 'eleazar' ? 'eleazar' : 'menaem'); },
  zeloteFoice(s, b, Tm) { zelote(s, b, Tm, 'jair'); },
  zelotePunhal(s, b, Tm) { zelote(s, b, Tm, 'menaem'); }
};
