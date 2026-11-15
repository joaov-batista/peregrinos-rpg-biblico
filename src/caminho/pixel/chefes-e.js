// O Conselho Zelote: três assassinos. Massa escura de manto, capuz fundo, o rosto que não se vê — e um só acento de cor
// em cada um, mais o branco da lâmina. Nada de braço e perna fina à mostra: o corpo é o manto.
//   Menaém — compacto e curvado para a frente; dois olhos vermelhos, a faixa vermelha com as pontas ao vento, o torso
//            enfaixado, duas facas brancas seguradas ao contrário.
//   Eleazar — uma torre: ombros largos de pele de animal, máscara pálida de osso dentro do capuz, a lança mais alta que ele.
//   Jair — um monte de manto, quase redondo; um olho âmbar só (o outro vendado), dedos pálidos na barra, a foice enorme.
// Poses: parado, aviso (olhos acendem), rasante (deitado para a frente, manto esticado para trás), mergulho (manto para cima,
// lâmina para baixo), parede (encolhido, braço armado) e caído (um monte no chão). O desenho olha para a DIREITA.
import { C, OX as ox, OY as oy, TINTA } from './kit.js';

const BR = C('#FFFFFF'), ACO = C('#E8ECF4'), ACOE = C('#9AA4B8'), BREU = C('#07060B'), OSSO = C('#D9D4C4'), OSSOE = C('#9A947F'), PALIDO = C('#C9B8A0');
const QUEM = {
  menaem: { H: 40, W: 12, SH: 8, R: 8, m: ['#0F0C14', '#1B1722', '#2A2434', '#474058'].map(C), acento: C('#E0382E'), acentoE: C('#8E1E1A') },
  eleazar: { H: 56, W: 16, SH: 13, R: 9, m: ['#0C0E18', '#161A2A', '#222A40', '#465070'].map(C), acento: C('#8FB8E0'), acentoE: C('#4A6A90') },
  jair: { H: 42, W: 21, SH: 15, R: 10, m: ['#110E0A', '#1E1912', '#2E261A', '#55492E'].map(C), acento: C('#FFB03C'), acentoE: C('#A06A1C') }
};
const lamina = (s, x0, y0, x1, y1, g = 2) => { s.linha(x0, y0, x1, y1, g + 1, ACOE); s.linha(x0, y0, x1, y1, g, ACO); s.linha(x0, y0, x1, y1, 1, BR); };

function zelote(s, b, Tm, nome) {
  const Q = QUEM[nome], M = Q.m, t = b.mov?.def?.fn || b.mov?.nome || '', caido = b.quebrado > 0 || b.tonto > 0, prep = !caido && (b.tele > 0 || (!!b.mov && b.mov.t < 0.3)), age = !caido && !!b.mov && !prep, pisca = Math.floor(Tm * 14) % 2;
  const mergulho = /Cadente|^bote|^giro/.test(t) && !caido, parede = !mergulho && /Parede|Rasteira|Alta|chuva/.test(t) && !caido, rasante = !mergulho && !parede && !!t && !caido, vai = rasante && (age || b.corre);
  const resp = Math.floor(Tm * 2.4) % 2, chao = oy - 2;
  // quanto o corpo se encolhe e para onde pende
  const kH = caido ? 0.5 : vai ? 0.62 : parede ? 0.72 : prep ? 0.9 : 1, kW = caido ? 1.25 : vai ? 1.15 : parede ? 1.05 : 1;
  const H = Math.round(Q.H * kH) - (resp && !t && !caido ? 0 : 0), W = Math.round(Q.W * kW), SH = Q.SH, R = Q.R;
  const base = chao - (mergulho ? 12 : parede ? 6 : 0), cx = ox, pende = vai ? 15 : caido ? -3 : mergulho ? 1 : nome === 'menaem' ? 4 : nome === 'jair' ? 3 : 1;
  const ombroY = base - H + R + 3 + resp * (t || caido ? 0 : 1), ombroX = cx + pende;
  // ---------- a cauda do manto: para trás na corrida, para cima no mergulho, pesada no chão quando parado ----------
  const vento = Math.sin(Tm * 6) * 2;
  if (vai) { s.poli([[ombroX - SH + 2, ombroY - 2], [ombroX - 2, ombroY + 8], [cx - W - 30, base - 9 + vento], [cx - W - 34, base - 17 + vento], [cx - W - 22, base - 20]], M[1]); s.poli([[ombroX - SH + 2, ombroY - 2], [cx - W - 22, base - 20], [cx - W - 34, base - 17 + vento], [cx - W - 10, base - 22]], M[2]); for (let k = 0; k < 5; k++) s.ret(cx - W - 34 - k * 2 + (k % 2) * 3, base - 17 + vento + k * 2, 5 - k, 2, M[1]); }
  if (mergulho) { s.poli([[ombroX - SH, ombroY + 2], [ombroX + SH - 2, ombroY + 2], [cx + 7 + vento, base - H - 26], [cx - 2 + vento, base - H - 34], [cx - 12, base - H - 20]], M[1]); s.poli([[ombroX - SH, ombroY + 2], [cx - 12, base - H - 20], [cx - 2 + vento, base - H - 34], [cx - 6, base - H - 12]], M[2]); for (let k = 0; k < 4; k++) s.ret(cx - 4 + vento + k * 3, base - H - 36 + (k % 2) * 3, 2, 5, M[1]); }
  // ---------- botas: só as pontas aparecem por baixo da barra ----------
  if (!mergulho && !caido) for (const [dx, lev] of vai ? [[10, 0], [-12, -2]] : parede ? [[6, -1], [-2, 0]] : [[6, 0], [-5, 0]]) { s.ret(cx + dx - 3, base - 3 + lev, 7, 4, M[0]); s.ret(cx + dx + 2, base - 1 + lev, 3, 2, M[1]); }
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
  if (nome === 'menaem') { for (let k = 0; k < 3; k++) { const y = ombroY + 7 + k * 5; s.linha(ombroX - SH + 3 + k, y, ombroX + SH - 2, y + 3, 1, PALIDO); s.linha(ombroX - SH + 4 + k, y + 1, ombroX + SH - 3, y + 4, 1, C('#8A7E70')); } s.ret(cx - W + 4, barra - 9, W * 2 - 8, 2, Q.acentoE); s.ret(cx - W + 4, barra - 9, W * 2 - 8, 1, Q.acento); } // torso enfaixado e a faixa na cintura
  if (nome === 'eleazar') { s.bola(ombroX + 2, ombroY + 4, 3, 3, { 0: C('#6A4A1C'), 1: C('#8A6A2C'), 2: C('#C9963C'), 3: C('#E8C060'), 4: C('#FFF1BE') }, 0.4, -0.7); for (let k = 0; k < 4; k++) s.ret(ombroX - 4 + k, ombroY + 14 + k * 5, 9 - k, 1, Q.acentoE); } // broche de bronze e as tiras do peitoral
  if (nome === 'jair') { for (const [dx, dy] of [[-10, 14], [6, 22], [-3, 28]]) { s.ret(cx + dx, ombroY + dy, 5, 4, M[3]); s.px(cx + dx, ombroY + dy, BREU); s.px(cx + dx + 4, ombroY + dy + 3, BREU); } for (let k = 0; k < 9; k++) s.px(cx - W + 5 + k * 4, barra - 12 + (k % 2), C('#8A7A5A')); // remendos e a corda
    if (!caido && !mergulho) for (let k = 0; k < 3; k++) s.linha(frente - 5 + k * 2, barra - 5, frente - 4 + k * 2, barra - 1, 1, PALIDO); } // dedos pálidos na barra
  // ---------- a cabeça: capuz fundo ----------
  const hx = ombroX + (vai ? 7 : caido ? -2 : 2), hy = ombroY - R + 2 + (caido ? 4 : 0) + (vai ? 3 : 0);
  s.poli([[hx - R - 2, hy + R], [hx + R + 1, hy + R], [hx + R + 2, hy - 1], [hx + 2, hy - R - 2], [hx - R + 1, hy - R - 4 - (nome === 'jair' ? 2 : 0)], [hx - R - 3, hy - 2]], M[1]);
  s.poli([[hx - R - 2, hy + R], [hx - R + 3, hy + R], [hx - R + 3, hy - R - 2], [hx - R + 1, hy - R - 4 - (nome === 'jair' ? 2 : 0)], [hx - R - 3, hy - 2]], M[0]);
  s.linha(hx + 2, hy - R - 2, hx + R + 2, hy - 1, 1, M[3]); s.linha(hx + R + 2, hy - 1, hx + R + 1, hy + R, 1, M[2]); // luz na borda do capuz
  s.bola(hx + 2, hy + 1, R - 2, R - 2, { 0: BREU, 1: BREU, 2: BREU, 3: BREU, 4: BREU }); // o vazio dentro do capuz
  const olho = caido ? null : prep && pisca ? BR : Q.acento;
  if (nome === 'menaem') { if (olho) { s.ret(hx + 1, hy, 2, 2, olho); s.ret(hx + 5, hy, 2, 2, olho); s.px(hx, hy + 1, Q.acentoE); s.px(hx + 7, hy + 2, Q.acentoE); }
    s.ret(hx - R - 2, hy - 4, R * 2 + 3, 2, Q.acentoE); s.ret(hx - R - 2, hy - 4, R * 2 + 3, 1, Q.acento); // a faixa na testa, por cima do capuz
    for (let k = 0; k < 2; k++) { let x = hx - R - 2, y = hy - 3 + k; for (let i = 1; i <= 8; i++) { const nx = hx - R - 2 - i * (vai ? 4 : 2.2), ny = hy - 3 + k * 3 + Math.sin(Tm * 7 + i * 0.7 + k * 1.3) * (1 + i * 0.35) + (vai || mergulho ? -i * (mergulho ? 2.5 : 0.2) : i * 0.9); s.linha(x, y, nx, ny, 1, k ? Q.acentoE : Q.acento); x = nx; y = ny; } } } // as pontas ao vento
  if (nome === 'eleazar') { s.bola(hx + 3, hy + 1, R - 4, R - 2, { 0: OSSOE, 1: OSSOE, 2: OSSO, 3: OSSO, 4: BR }, 0.6, -0.6); // a máscara de osso
    if (olho) { s.ret(hx + 1, hy - 1, 2, 3, BREU); s.ret(hx + 5, hy - 1, 2, 3, BREU); if (prep || b.furia > 0) { s.px(hx + 1, hy, olho); s.px(hx + 5, hy, olho); } } else { s.ret(hx + 1, hy, 2, 1, BREU); s.ret(hx + 5, hy, 2, 1, BREU); }
    for (let k = 0; k < 3; k++) s.ret(hx + 2 + k * 2, hy + 4, 1, 3, BREU); s.linha(hx + 4, hy - R + 4, hx + 3, hy - 2, 1, OSSOE); } // os riscos da boca e a trinca
  if (nome === 'jair') { if (olho) { s.ret(hx + 5, hy, 3, 3, olho); s.px(hx + 6, hy + 1, BR); s.px(hx + 4, hy + 1, Q.acentoE); } s.linha(hx - 2, hy - 3, hx + 4, hy + 3, 2, PALIDO); s.linha(hx - 2, hy - 3, hx + 4, hy + 3, 1, OSSO); // um olho só; o outro, vendado
    for (let k = 0; k < 3; k++) s.linha(hx + 1 + k * 2, hy + R - 3, hx + k * 2, hy + R + 3 + k, 1, C('#B8B2A0')); } // fios de barba branca
  // ---------- as armas: o branco que corta o escuro ----------
  const maoY = ombroY + Math.round(H * 0.42);
  if (nome === 'menaem') {
    if (mergulho) { lamina(s, cx - 3, base, cx - 4, base + 12); lamina(s, cx + 4, base - 2, cx + 6, base + 10); }
    else if (vai) { lamina(s, frente + 2, base - 12, frente + 16, base - 14); lamina(s, frente, base - 7, frente + 13, base - 5); }
    else if (parede) { lamina(s, hx + R + 3, hy - 6, hx + R + 12, hy - 15); lamina(s, frente - 2, maoY + 4, frente + 4, maoY + 13); s.ret(hx + R + 1, hy - 5, 3, 3, M[0]); }
    else if (caido) { lamina(s, frente + 1, chao - 2, frente + 12, chao - 1); lamina(s, tras - 2, chao - 1, tras - 12, chao - 2); }
    else { lamina(s, frente - 2, maoY + 2, frente + 5 + (prep ? 3 : 0), maoY + 12 - (prep ? 8 : 0)); lamina(s, tras + 4, maoY + 3, tras - 3, maoY + 12); s.ret(frente - 4, maoY, 4, 3, M[0]); s.ret(tras + 3, maoY + 1, 4, 3, M[0]); } // seguradas ao contrário
  } else if (nome === 'eleazar') {
    const [x0, y0, x1, y1] = mergulho ? [cx + 2, base - H + 6, cx + 2, base + 16] : vai ? [cx - 22, base - 16, frente + 26, base - 13] : parede ? [cx - 14, hy - 4, frente + 22, hy - 18] : caido ? [tras - 10, chao - 3, frente + 22, chao - 6] : [frente + 3, base, frente + 6 - (prep ? 5 : 0), base - Q.H - 14];
    s.linha(x0, y0, x1, y1, 2, C('#3A2A1E')); s.linha(x0, y0, x1, y1, 1, C('#6B4A2E')); const L = Math.hypot(x1 - x0, y1 - y0) || 1, ux = (x1 - x0) / L, uy = (y1 - y0) / L;
    s.poli([[x1 - uy * 3, y1 + ux * 3], [x1 + uy * 3, y1 - ux * 3], [x1 + ux * 13, y1 + uy * 13]], ACO); s.linha(x1, y1, x1 + ux * 12, y1 + uy * 12, 1, BR); s.ret(x1 - 1, y1 - 1, 3, 3, C('#C9963C')); for (let k = 0; k < 4; k++) s.px(x1 - ux * 3 - uy * (2 + k), y1 - uy * 3 + ux * (2 + k) + k, Q.acento); // a ponta, o anel e o penacho
    if (!mergulho && !caido) s.ret(vai ? frente - 2 : frente + 1, vai ? base - 16 : maoY, 4, 4, M[0]); // a luva que a segura
  } else {
    const giro = parede && age ? Tm * 15 : 0, [px, py, a] = mergulho ? [cx + 3, base - 4, Math.PI * 0.5] : vai ? [frente + 4, base - 13, 0] : parede ? [hx + R + 4, hy - 8, -1 + giro] : caido ? [frente + 2, chao - 4, 0.1] : [frente + 2, maoY, -1.25 - (prep ? 0.5 : 0)];
    const hl = parede ? 8 : 20, ex = px + Math.cos(a) * hl, ey = py + Math.sin(a) * hl; s.linha(px - Math.cos(a) * 6, py - Math.sin(a) * 6, ex, ey, 2, C('#3A2A1E')); s.linha(px, py, ex, ey, 1, C('#7A5A36'));
    for (let k = 0; k <= 14; k++) { const an = a - 0.2 + k * 0.17, rr = 13 - Math.abs(k - 7) * 0.12, qx = ex + Math.cos(an) * rr - Math.cos(a - 0.2) * 13, qy = ey + Math.sin(an) * rr - Math.sin(a - 0.2) * 13, g = k < 3 ? 1 : k > 11 ? 1 : 3; for (let j = 0; j < g; j++) s.px(qx - Math.cos(an) * j, qy - Math.sin(an) * j, j === 0 ? BR : j === 1 ? ACO : ACOE); } // a meia-lua da foice
    if (!parede) for (let k = 1; k <= 6; k++) s.px(px - 2 - k, py + 3 + Math.round(Math.sin(k * 0.8 + Tm * 4) * 1.5) + k, k % 2 ? ACOE : C('#5A5E6A')); // a corrente
    s.ret(px - 2, py - 2, 4, 4, PALIDO); s.px(px - 2, py - 2, C('#8A7E70')); // a mão pálida
  }
  // ---------- rastros ----------
  if (vai) for (let k = 0; k < 4; k++) s.ret(cx - W - 40 - k * 5, base - 22 + k * 5, 9 - k * 2, 1, k % 2 ? Q.acento : ACO);
  if (mergulho && age) for (let k = 0; k < 3; k++) s.ret(cx - 7 + k * 7, base - H - 40 - k * 4, 1, 7, Q.acento);
}

export const CHEFES_E = {
  conselho(s, b, Tm) { zelote(s, b, Tm, b.cen?.quem === 'eleazar' ? 'eleazar' : 'menaem'); },
  zeloteFoice(s, b, Tm) { zelote(s, b, Tm, 'jair'); },
  zelotePunhal(s, b, Tm) { zelote(s, b, Tm, 'menaem'); }
};
