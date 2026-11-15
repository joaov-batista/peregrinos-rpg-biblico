// O Conselho Zelote. Três silhuetas que não se confundem:
//   Menaém — o menor: lenço vermelho no rosto, faixa na testa com as pontas ao vento, bandoleira de facas, duas sicas curvas.
//   Eleazar — o mais alto: ombreira e peitoral de bronze, barba cheia, aro de bronze sobre o capuz, lança com penacho vermelho.
//   Jair — curvado: manto de ceifeiro remendado, um olho vendado, cabelo branco escapando do capuz, foice grande presa a uma corrente.
// Cada tipo de golpe tem a sua pose: rasante (corpo deitado para a frente), mergulho (arma apontada para baixo) e parede (agachado, braço armado).
import { R, C, OX as ox, OY as oy, est, TINTA } from './kit.js';

const QUEM = {
  menaem: { capa: R('#5A2A2A'), tunica: R('#6E5A48'), faixa: R('#C2362E'), olho: C('#FFD23F'), alt: -2, larg: 7, arma: 'sicas' },
  eleazar: { capa: R('#34446A'), tunica: R('#5E6070'), faixa: R('#C9963C'), olho: C('#BFE6F2'), alt: 8, larg: 9, arma: 'lanca' },
  jair: { capa: R('#7A6830'), tunica: R('#5E4E3A'), faixa: R('#8A7A5A'), olho: C('#FF8A3C'), alt: 1, larg: 8, arma: 'foice' }
};
const PELE = R('#A9744C'), ACO = R('#C9D2E0'), MADEIRA = R('#7A5A36'), BRONZE = R('#C9963C'), COURO = R('#4A3424'), BARBA = R('#3A2A20'), BRANCO = R('#D9D4C8'), FAIXA = R('#E4DFCF');
const BREU = C('#100A0E'), BR = C('#FFFFFF'), SANGUE = C('#C2362E');

// lâmina curva (a sica): do punho, sai e dobra
function sica(s, x, y, dx, dy, comp = 12) { const nx = -dy, ny = dx; for (let k = 0; k <= comp; k++) { const t = k / comp, c = Math.sin(t * Math.PI * 0.5) * 3.2, px = x + dx * k + nx * c * t, py = y + dy * k + ny * c * t; s.px(px, py, ACO[4]); if (k < comp - 1) s.px(px - nx, py - ny, ACO[2]); } s.ret(x - 1, y - 1, 3, 3, BRONZE[2]); }
function lanca(s, x, y, dx, dy, tras = 16, frente = 40) { const x0 = x - dx * tras, y0 = y - dy * tras, x1 = x + dx * frente, y1 = y + dy * frente, nx = -dy, ny = dx; s.linha(x0, y0, x1, y1, 2, MADEIRA[2]); s.linha(x0, y0, x1, y1, 1, MADEIRA[4]); s.poli([[x1 + nx * 3, y1 + ny * 3], [x1 - nx * 3, y1 - ny * 3], [x1 + dx * 12, y1 + dy * 12]], ACO[3]); s.linha(x1, y1, x1 + dx * 11, y1 + dy * 11, 1, ACO[4]); s.ret(x1 - dx * 2 - 1, y1 - dy * 2 - 1, 3, 3, BRONZE[3]); for (let k = 0; k < 4; k++) s.px(x1 - dx * 3 + nx * (2 + k), y1 - dy * 3 + ny * (2 + k) + k, SANGUE); s.bola(x0, y0, 1.6, 1.6, BRONZE); }
function foiceGrande(s, x, y, a, r = 13) { const hx = x + Math.cos(a) * 9, hy = y + Math.sin(a) * 9; s.linha(x, y, hx, hy, 2, MADEIRA[2]); s.linha(x, y, hx, hy, 1, MADEIRA[4]); for (let k = 0; k <= 12; k++) { const an = a + 1.1 + k * 0.2, rr = r - k * 0.25; const px = hx + Math.cos(an) * rr - Math.cos(a + 1.1) * r, py = hy + Math.sin(an) * rr - Math.sin(a + 1.1) * r; s.px(px, py, ACO[4]); s.px(px - Math.cos(an), py - Math.sin(an), ACO[3]); if (k < 9) s.px(px - Math.cos(an) * 2, py - Math.sin(an) * 2, ACO[1]); } }

function zelote(s, b, Tm, nome) {
  const Q = QUEM[nome], E = est(b, Tm), t = E.tipo || '', cai = E.caido ? 9 : 0, W = Q.larg;
  const mergulho = /Cadente|^bote|^giro/.test(t) && !E.caido, parede = !mergulho && /arede|oiceR|oiceA|chuva/.test(t) && !E.caido, rasante = !mergulho && !parede && !!t && !E.caido, vai = rasante && (E.ataca || b.corre);
  const curva = nome === 'jair' ? 4 : 0, cx = ox + (vai ? -5 : 0), chao = oy - 2, quadril = chao - 26 + cai - (mergulho ? 10 : 0) - (parede ? 5 : 0) + (vai ? 4 : 0);
  const ombro = quadril - 24 - Q.alt + (vai ? 9 : 0) + curva, incl = vai ? -12 : parede ? 5 : -curva, sx = cx + incl;
  // ---------- a capa, atrás (o desenho olha para a esquerda) ----------
  const bal = vai ? 20 : mergulho ? 4 : Math.round(Math.sin(Tm * 3) * 2) + 3, sobe = mergulho ? -30 : vai ? -10 : 0, longa = nome === 'eleazar' ? 6 : nome === 'jair' ? 3 : -4;
  const p0 = [sx - W + 2, ombro - 1], p1 = [sx + W + 1, ombro - 1], p2 = [cx + W + 8 + bal, quadril + 18 + longa + sobe], p3 = [cx - 2 + bal * 0.5, quadril + 21 + longa + sobe];
  s.poli([p0, p1, p2, p3], Q.capa[1]); s.poli([[sx + 3, ombro], p1, p2, [cx + W + 2 + bal, quadril + 14 + longa + sobe]], Q.capa[3]);
  for (let k = 0; k < 3; k++) s.linha(sx + k * 3, ombro + 2, cx + 2 + k * 4 + bal * (0.5 + k * 0.2), quadril + 17 + longa + sobe, 1, Q.capa[0]);
  for (let k = 0; k < 6; k++) { const x = p3[0] + (p2[0] - p3[0]) * k / 5, y = p3[1] + (p2[1] - p3[1]) * k / 5; s.ret(x, y, 2, 2 + ((k * 3) % 3), Q.capa[k % 2 ? 1 : 2]); } // barra em farrapos
  if (nome === 'jair') for (const [dx, dy] of [[4, 8], [8, 14]]) { s.ret(sx + dx + bal * 0.3, ombro + dy, 4, 3, R('#9A8A50')[2]); s.px(sx + dx + bal * 0.3, ombro + dy, TINTA); s.px(sx + dx + 3 + bal * 0.3, ombro + dy + 2, TINTA); } // remendos
  // ---------- pernas: joelho, canela enfaixada, sandália ----------
  const pes = mergulho ? [[cx + 5, quadril + 11], [cx + 10, quadril + 6]] : parede ? [[cx + 11, quadril + 12], [cx + 12, quadril + 2]] : vai ? [[cx - 17, chao], [cx + 17, chao - 2]] : E.caido ? [[cx - 9, chao], [cx + 10, chao]] : [[cx - 5 - (E.anda && E.passo ? 3 : 0), chao], [cx + 5 + (E.anda && !E.passo ? 3 : 0), chao]];
  pes.forEach(([px, py], i) => { const jx = (cx + px) / 2 + (i ? 3 : -3) * (vai ? 2 : 1), jy = (quadril + py) / 2 - (vai ? 3 : 1); s.membro(cx + (i ? 3 : -3), quadril, jx, jy, 4, Q.tunica); s.membro(jx, jy, px, py - 1, 3, PELE);
    for (let k = 1; k <= 3; k++) { const x = jx + (px - jx) * k / 4, y = jy + (py - jy) * k / 4; s.ret(x - 1, y, 3, 1, FAIXA[k % 2 ? 3 : 2]); }
    s.ret(px - (i ? 2 : 4), py - 1, 6, 3, COURO[2]); s.ret(px - (i ? 2 : 4), py - 1, 6, 1, COURO[4]); });
  // ---------- tronco ----------
  s.poli([[sx - W, ombro], [sx + W, ombro], [cx + W - 2, quadril + 6], [cx - W + 1, quadril + 6]], Q.tunica[2]); s.poli([[sx - W, ombro], [sx - W + 4, ombro], [cx - W + 5, quadril + 6], [cx - W + 1, quadril + 6]], Q.tunica[1]); s.poli([[sx + W - 3, ombro], [sx + W, ombro], [cx + W - 2, quadril + 6], [cx + W - 5, quadril + 6]], Q.tunica[3]);
  for (let k = -1; k <= 1; k++) s.ret(cx + k * 3 + incl * 0.2, quadril + 6, 2, 3 + (k ? 1 : 2), Q.tunica[1]); // barra da túnica
  const fx = cx + incl * 0.25; s.ret(fx - W + 1, quadril - 4, W * 2 - 2, 4, Q.faixa[2]); s.ret(fx - W + 1, quadril - 4, W * 2 - 2, 1, Q.faixa[4]); s.ret(fx - 2, quadril - 5, 4, 6, BRONZE[3]); s.px(fx - 1, quadril - 3, BRONZE[4]);
  s.linha(fx + W - 2, quadril - 2, fx + W + 3 + (vai ? 9 : 0), quadril + 9, 2, Q.faixa[3]); s.linha(fx + W - 3, quadril - 2, fx + W + (vai ? 6 : 0), quadril + 11, 1, Q.faixa[1]); // as pontas da faixa
  if (nome === 'menaem') { s.linha(sx - W + 1, ombro + 2, cx + W - 3, quadril - 5, 2, COURO[2]); for (let k = 1; k <= 3; k++) { const x = sx - W + 1 + (cx + W - 4 - sx + W) * k / 4, y = ombro + 2 + (quadril - 7 - ombro) * k / 4; s.ret(x, y - 2, 1, 4, ACO[4]); s.px(x, y + 2, BRONZE[3]); } } // bandoleira de facas
  if (nome === 'eleazar') { s.poli([[sx - W + 1, ombro + 2], [sx + W - 1, ombro + 2], [sx + W - 3, ombro + 12], [sx - W + 3, ombro + 12]], BRONZE[2]); s.ret(sx - W + 1, ombro + 2, W * 2 - 2, 1, BRONZE[4]); s.ret(sx - 1, ombro + 3, 2, 8, BRONZE[1]); for (const dx of [-4, 3]) s.px(sx + dx, ombro + 5, BRONZE[4]); for (let k = 0; k < 3; k++) s.ret(sx - W + 2 + k * 2, ombro + 13 + k * 2, W * 2 - 4 - k * 4, 1, COURO[3]); } // peitoral e saiote de tiras
  if (nome === 'jair') { for (let k = 0; k < 6; k++) s.px(fx - W + 2 + k * 2, quadril - 5 + (k % 2), R('#C9B48A')[3]); s.ret(sx - 4, ombro + 6, 4, 4, R('#7A5A8A')[2]); s.px(sx - 4, ombro + 6, TINTA); } // corda na cintura e um remendo
  // ---------- braços ----------
  const frente = { x: sx - W + 1, y: ombro + 3 }, tras = { x: sx + W - 2, y: ombro + 3 };
  let mf, mt;
  if (E.caido) { mf = { x: cx - 12, y: chao - 3 }; mt = { x: cx + 12, y: chao - 4 }; }
  else if (mergulho) { mf = { x: sx - 4, y: ombro + 20 }; mt = { x: sx + 4, y: ombro + 19 }; }
  else if (parede) { mf = { x: sx - 18, y: ombro - 12 - (E.pisca && E.prep ? 1 : 0) }; mt = { x: sx + 12, y: ombro + 9 }; }
  else if (rasante) { mf = vai ? { x: sx - 24, y: ombro + 9 } : { x: sx - 6, y: ombro + 16 }; mt = vai ? { x: sx - 15, y: ombro + 13 } : { x: sx + 14, y: ombro + 1 - (E.pisca ? 1 : 0) }; }
  else { mf = { x: sx - W - 3, y: ombro + 19 + E.resp }; mt = { x: sx + W + 2, y: ombro + 19 + E.resp }; }
  const braco = (o, m, atras) => { const c = { x: (o.x + m.x) / 2 + (atras ? 2 : -1), y: (o.y + m.y) / 2 + 3 }; s.membro(o.x, o.y, c.x, c.y, 4, nome === 'menaem' ? PELE : Q.tunica); s.membro(c.x, c.y, m.x, m.y, 3, PELE);
    if (nome === 'menaem') for (let k = 1; k <= 3; k++) s.ret(c.x + (m.x - c.x) * k / 4 - 1, c.y + (m.y - c.y) * k / 4, 3, 1, FAIXA[3]); // antebraços enfaixados
    if (nome === 'eleazar') { const x = c.x + (m.x - c.x) * 0.55, y = c.y + (m.y - c.y) * 0.55; s.ret(x - 2, y - 1, 4, 4, BRONZE[2]); s.px(x - 2, y - 1, BRONZE[4]); }
    s.bola(m.x, m.y, 2, 2, PELE, 0.4, -0.6); };
  braco(tras, mt, true);
  // arma de trás (só Menaém tem duas)
  if (Q.arma === 'sicas') { const d = mergulho ? [0.15, 1] : vai ? [-1, 0.25] : parede ? [0.5, 0.86] : E.caido ? [1, 0] : rasante ? [0.6, -0.8] : [0.35, 0.94]; sica(s, mt.x, mt.y, d[0], d[1], 12); }
  if (nome === 'eleazar') { s.bola(sx - W + 1, ombro + 1, 5.5, 4.5, BRONZE, 0.45, -0.7); s.ret(sx - W - 3, ombro + 3, 9, 1, BRONZE[1]); s.px(sx - W + 1, ombro - 1, BRONZE[4]); } // ombreira
  braco(frente, mf, false);
  // arma da frente
  if (Q.arma === 'sicas') { const d = mergulho ? [-0.15, 1] : vai ? [-1, -0.1] : parede ? [-0.7, -0.7] : E.caido ? [-1, 0] : rasante ? [-0.5, 0.86] : [-0.35, 0.94]; sica(s, mf.x, mf.y, d[0], d[1], 13); }
  else if (Q.arma === 'lanca') { const d = mergulho ? [0, 1] : vai || rasante ? [-1, 0.05] : parede ? [-0.92, 0.38] : E.caido ? [-1, 0.05] : [-0.1, -1]; lanca(s, mf.x, mf.y, d[0], d[1], mergulho ? 22 : 18, mergulho ? 26 : 36); }
  else { const a = parede ? Tm * 16 : vai ? Math.PI * 1.02 : mergulho ? Math.PI * 0.55 : E.caido ? Math.PI : Math.PI * 1.3; foiceGrande(s, mf.x, mf.y, a, parede ? 14 : 13); let x = mt.x, y = mt.y; for (let k = 1; k <= 7; k++) { const nx = mt.x + (mf.x - mt.x) * k / 7, ny = mt.y + (mf.y - mt.y) * k / 7 + Math.sin(k / 7 * Math.PI) * (vai ? 2 : 7); s.px(nx, ny, k % 2 ? ACO[3] : ACO[1]); x = nx; y = ny; } s.bola(mt.x + 1, mt.y + 4, 2.4, 2.4, ACO, 0.4, -0.6); } // a corrente e o peso
  // ---------- cabeça ----------
  const hx = sx - 1 + (vai ? -4 : 0), hy = ombro - 10 + (E.caido ? 4 : 0) + (mergulho ? 2 : 0);
  s.ret(hx - 2, hy + 6, 5, 4, PELE[1]); // pescoço
  // capuz: cai sobre os ombros e termina em ponta atrás
  s.poli([[hx - 8, hy + 8], [hx + 9, hy + 8], [hx + 12 + (vai ? 6 : 0), hy - 1], [hx + 5, hy - 11], [hx - 5, hy - 9], [hx - 8, hy - 2]], Q.capa[2]);
  s.poli([[hx - 8, hy + 8], [hx - 4, hy + 8], [hx - 3, hy - 8], [hx - 5, hy - 9], [hx - 8, hy - 2]], Q.capa[1]); s.poli([[hx + 6, hy + 8], [hx + 9, hy + 8], [hx + 12 + (vai ? 6 : 0), hy - 1], [hx + 8, hy - 6]], Q.capa[3]);
  s.linha(hx - 3, hy - 9, hx + 5, hy - 11, 1, Q.capa[4]);
  // o rosto: sombra por baixo do capuz, e o que cada um deixa ver
  s.poli([[hx - 6, hy + 6], [hx + 3, hy + 6], [hx + 3, hy - 5], [hx - 5, hy - 6]], BREU);
  s.poli([[hx - 5, hy + 5], [hx + 1, hy + 5], [hx + 1, hy], [hx - 5, hy - 1]], PELE[2]); s.ret(hx - 5, hy, 1, 5, PELE[4]); s.px(hx - 6, hy + 1, PELE[3]); // nariz e maçã do rosto
  if (nome === 'menaem') { s.poli([[hx - 6, hy + 2], [hx + 2, hy + 1], [hx + 2, hy + 7], [hx - 5, hy + 7]], Q.faixa[2]); s.ret(hx - 6, hy + 2, 8, 1, Q.faixa[4]); s.linha(hx - 4, hy + 4, hx + 1, hy + 5, 1, Q.faixa[0]); // o lenço cobre a boca
    s.ret(hx - 6, hy - 5, 10, 2, Q.faixa[3]); s.ret(hx - 6, hy - 5, 10, 1, Q.faixa[4]); for (let k = 0; k < 2; k++) { let x = hx + 4, y = hy - 4; for (let i = 1; i <= 7; i++) { const nx = hx + 4 + i * 2.4 + (vai ? i * 1.5 : 0), ny = hy - 4 + k * 3 + Math.sin(Tm * 7 + i * 0.8 + k) * (1 + i * 0.3) + (vai ? -i * 0.3 : i * 0.7); s.linha(x, y, nx, ny, 1, Q.faixa[k ? 2 : 4]); x = nx; y = ny; } } // as pontas da faixa ao vento
    s.linha(hx - 4, hy - 3, hx - 2, hy + 1, 1, C('#7A1A16')); } // a cicatriz
  if (nome === 'eleazar') { s.poli([[hx - 6, hy + 3], [hx + 2, hy + 3], [hx + 1, hy + 9], [hx - 2, hy + 12], [hx - 5, hy + 9]], BARBA[2]); s.linha(hx - 5, hy + 4, hx - 4, hy + 9, 1, BARBA[4]); s.linha(hx - 2, hy + 5, hx - 2, hy + 11, 1, BARBA[1]); s.ret(hx - 4, hy + 5, 4, 1, BREU); // barba cheia e a boca fechada
    s.ret(hx - 7, hy - 7, 14, 2, BRONZE[3]); s.ret(hx - 7, hy - 7, 14, 1, BRONZE[4]); s.poli([[hx - 2, hy - 7], [hx + 2, hy - 7], [hx, hy - 12]], BRONZE[4]); } // o aro de bronze com a ponta
  if (nome === 'jair') { s.ret(hx - 5, hy + 4, 5, 1, BREU); s.px(hx - 4, hy + 4, BRANCO[4]); s.px(hx - 2, hy + 4, BRANCO[4]); // um meio sorriso torto
    for (let k = 0; k < 4; k++) s.linha(hx - 5 + k, hy - 4, hx - 8 + k - (vai ? 0 : 1), hy + 9 + k * 2 + Math.round(Math.sin(Tm * 3 + k)), 1, BRANCO[k % 2 ? 2 : 4]); // cabelo branco escapando
    s.poli([[hx - 2, hy - 6], [hx + 3, hy - 4], [hx + 3, hy], [hx - 2, hy - 2]], FAIXA[3]); s.linha(hx - 6, hy - 7, hx + 3, hy - 3, 2, FAIXA[3]); s.linha(hx - 6, hy - 7, hx + 3, hy - 3, 1, FAIXA[4]); } // a venda
  const o = E.caido ? null : E.prep && E.pisca ? BR : Q.olho;
  if (o) { s.ret(hx - 4, hy - 2, 2, 2, o); if (nome !== 'jair') s.ret(hx, hy - 2, 2, 2, o); if (E.prep) { s.px(hx - 5, hy - 2, o); s.px(hx - 6, hy - 3, o); } }
  else { s.ret(hx - 4, hy - 1, 2, 1, TINTA); if (nome !== 'jair') s.ret(hx, hy - 1, 2, 1, TINTA); }
  // ---------- o rastro do golpe ----------
  if (vai) for (let k = 0; k < 5; k++) s.ret(cx + 24 + k * 6, quadril - 16 + k * 5, 9 - k, 1, k % 2 ? Q.olho : Q.faixa[4]);
  if (mergulho && E.ataca) for (let k = 0; k < 4; k++) s.ret(cx - 8 + k * 5, ombro - 26 - k * 5, 1, 8 - k, Q.olho);
}

export const CHEFES_E = {
  conselho(s, b, Tm) { zelote(s, b, Tm, b.cen?.quem === 'eleazar' || (b.hp < b.max * 0.66 && !b.cen?.quem) ? 'eleazar' : 'menaem'); },
  zeloteFoice(s, b, Tm) { zelote(s, b, Tm, 'jair'); },
  zelotePunhal(s, b, Tm) { zelote(s, b, Tm, 'menaem'); }
};
