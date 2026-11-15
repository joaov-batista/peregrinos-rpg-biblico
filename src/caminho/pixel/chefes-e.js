// O Conselho Zelote: três lutadores magros, de capuz, cada um com a sua arma e o seu jeito.
// Menaém (punhais, faixa vermelha, o menor e mais rápido), Eleazar (lança, peitoral de bronze, o mais alto)
// e Jair (foice de ceifeiro, um olho vendado, curvado). Cada tipo de golpe tem a sua pose: rasante, mergulho e parede.
import { R, C, OX as ox, OY as oy, est, TINTA } from './kit.js';

const QUEM = {
  menaem: { capa: R('#4A2A2A'), tunica: R('#6B5A4A'), faixa: R('#B8322E'), olho: C('#FFD23F'), alt: 0, arma: 'punhais' },
  eleazar: { capa: R('#34405A'), tunica: R('#5A5A66'), faixa: R('#C9963C'), olho: C('#BFE6F2'), alt: 6, arma: 'lanca' },
  jair: { capa: R('#6A5A30'), tunica: R('#5E4E3A'), faixa: R('#7A6A4A'), olho: C('#FF8A3C'), alt: -3, arma: 'foice' }
};
const PELE = R('#A0704A'), ACO = R('#C9D2E0'), MADEIRA = R('#7A5A36'), BRONZE = R('#C9963C'), BREU = C('#120C10'), BR = C('#FFFFFF'), FAIXA_OLHO = C('#E9E6DC');

function lamina(s, x0, y0, x1, y1) { s.linha(x0, y0, x1, y1, 2, ACO[3]); s.linha(x0, y0, x1, y1, 1, ACO[4]); }
function foice(s, x, y, a, r = 9) { for (let k = 0; k <= 8; k++) { const an = a + k * 0.32; s.px(x + Math.cos(an) * r, y + Math.sin(an) * r, ACO[4]); s.px(x + Math.cos(an) * (r - 1), y + Math.sin(an) * (r - 1), ACO[2]); } }

function zelote(s, b, Tm, nome) {
  const Q = QUEM[nome], E = est(b, Tm), t = E.tipo || '', cai = E.caido ? 8 : 0;
  const mergulho = /adente|ote|giro/.test(t) && !E.caido, parede = !mergulho && /arede|oiceR|oiceA|chuva/.test(t) && !E.caido, rasante = !mergulho && !parede && !!t && !E.caido, vai = rasante && (E.ataca || b.corre);
  const cx = ox + (vai ? -4 : 0), chao = oy - 2, quadril = chao - 22 + cai - (mergulho ? 8 : 0) - (parede ? 4 : 0), ombro = quadril - 20 - Q.alt + (vai ? 6 : 0) + (nome === 'jair' ? 2 : 0), incl = vai ? -9 : parede ? 4 : nome === 'jair' ? -2 : 0;
  const sx = cx + incl; // ombros deslocados: o corpo se inclina para onde vai
  // a capa, atrás (à direita: o desenho olha para a esquerda)
  const bal = vai ? 16 : Math.round(Math.sin(Tm * 3) * 2) + (mergulho ? 0 : 2), sobe = mergulho ? -22 : vai ? -6 : 0;
  s.poli([[sx - 3, ombro], [sx + 6, ombro], [cx + 12 + bal, quadril + 14 + sobe], [cx + 2 + bal * 0.5, quadril + 16 + sobe]], Q.capa[1]);
  s.poli([[sx + 2, ombro], [sx + 6, ombro], [cx + 12 + bal, quadril + 14 + sobe], [cx + 8 + bal, quadril + 12 + sobe]], Q.capa[3]);
  for (let k = 0; k < 4; k++) s.px(cx + 4 + bal * 0.6 + k * 2, quadril + 15 + sobe + (k % 2), Q.capa[0]);
  // pernas
  const pes = mergulho ? [[cx + 4, quadril + 8], [cx + 8, quadril + 5]] : parede ? [[cx + 9, quadril + 10], [cx + 10, quadril + 2]] : vai ? [[cx - 13, chao], [cx + 14, chao - 2]] : E.caido ? [[cx - 8, chao], [cx + 9, chao]] : [[cx - 4 - (E.anda && E.passo ? 2 : 0), chao], [cx + 4 + (E.anda && !E.passo ? 2 : 0), chao]];
  pes.forEach(([px, py], i) => { const jx = (cx + px) / 2 + (i ? 2 : -2) * (vai ? 2 : 1), jy = (quadril + py) / 2 - (mergulho || parede ? 0 : 1); s.membro(cx + (i ? 2 : -2), quadril, jx, jy, 3, Q.tunica); s.membro(jx, jy, px, py, 2, PELE); s.ret(px - (i ? 1 : 3), py, 4, 2, R('#3A2A1E')[2]); });
  // tronco: túnica curta e a faixa
  s.poli([[sx - 6, ombro], [sx + 6, ombro], [cx + 5, quadril + 3], [cx - 5, quadril + 3]], Q.tunica[2]); s.poli([[sx - 6, ombro], [sx - 2, ombro], [cx - 2, quadril + 3], [cx - 5, quadril + 3]], Q.tunica[1]);
  s.ret(cx - 5 + incl * 0.3, quadril - 3, 11, 3, Q.faixa[2]); s.ret(cx - 5 + incl * 0.3, quadril - 3, 11, 1, Q.faixa[4]); s.linha(cx + 5, quadril - 2, cx + 9 + (vai ? 8 : 0), quadril + 5, 1, Q.faixa[3]);
  if (nome === 'eleazar') { s.ret(sx - 5, ombro + 2, 10, 7, BRONZE[2]); s.ret(sx - 5, ombro + 2, 10, 1, BRONZE[4]); s.px(sx, ombro + 5, BRONZE[4]); } // peitoral
  // braços e arma
  const frente = { x: sx - 6, y: ombro + 2 }, tras = { x: sx + 5, y: ombro + 2 };
  let mf, mt;
  if (E.caido) { mf = { x: cx - 9, y: chao - 2 }; mt = { x: cx + 9, y: chao - 3 }; }
  else if (mergulho) { mf = { x: sx - 3, y: ombro + 15 }; mt = { x: sx + 3, y: ombro + 15 }; }
  else if (parede) { mf = { x: sx - 14, y: ombro - 9 - (E.pisca && E.prep ? 1 : 0) }; mt = { x: sx + 9, y: ombro + 6 }; }
  else if (rasante) { mf = vai ? { x: sx - 19, y: ombro + 6 } : { x: sx - 4, y: ombro + 12 }; mt = vai ? { x: sx - 12, y: ombro + 9 } : { x: sx + 10, y: ombro + 2 - (E.pisca ? 1 : 0) }; }
  else { mf = { x: sx - 8, y: ombro + 15 + E.resp }; mt = { x: sx + 7, y: ombro + 15 + E.resp }; }
  for (const [o, m] of [[tras, mt], [frente, mf]]) { const c = { x: (o.x + m.x) / 2 + 1, y: (o.y + m.y) / 2 + 2 }; s.membro(o.x, o.y, c.x, c.y, 3, Q.tunica); s.membro(c.x, c.y, m.x, m.y, 2, PELE); }
  if (Q.arma === 'punhais') { for (const [m, k] of [[mf, 0], [mt, 1]]) { const d = mergulho ? [0, 10] : vai ? [-11, k ? 2 : -2] : parede && !k ? [-7, -7] : E.caido ? [k ? 8 : -8, 0] : rasante ? [-6, k ? -8 : 6] : [k ? 3 : -3, 9]; lamina(s, m.x, m.y, m.x + d[0], m.y + d[1]); s.ret(m.x - 1, m.y - 1, 3, 2, BRONZE[2]); } }
  else if (Q.arma === 'lanca') { const m = mf, d = mergulho ? [0, 1] : vai || rasante ? [-1, 0.06] : parede ? [-0.9, 0.35] : E.caido ? [-1, 0] : [-0.12, -1], L = 34; const x0 = m.x - d[0] * 14, y0 = m.y - d[1] * 14, x1 = m.x + d[0] * L, y1 = m.y + d[1] * L; s.linha(x0, y0, x1, y1, 1, MADEIRA[3]); s.linha(x0, y0 + 1, x1, y1 + 1, 1, MADEIRA[1]); lamina(s, x1, y1, x1 + d[0] * 8, y1 + d[1] * 8); s.px(x1 - d[1] * 2, y1 + d[0] * 2, ACO[3]); s.px(x1 + d[1] * 2, y1 - d[0] * 2, ACO[3]); }
  else { const m = mf, gira = parede ? Tm * 14 : vai ? Math.PI * 0.9 : mergulho ? Math.PI * 0.2 : Math.PI * 1.1; const hx = m.x + (mergulho ? 0 : -3), hy = m.y + (mergulho ? 8 : -2); s.linha(m.x, m.y, hx, hy, 1, MADEIRA[3]); foice(s, hx, hy, gira, parede ? 10 : 9); for (let k = 1; k < 5; k++) s.px(m.x + k * 2, m.y + 2 + Math.round(Math.sin(Tm * 5 + k) * 1.5) + k, ACO[1]); }
  // cabeça: capuz em ponta, o rosto na sombra, só os olhos
  const hx = sx - 1 + (vai ? -3 : 0), hy = ombro - 8 + (E.caido ? 3 : 0) + (mergulho ? 2 : 0);
  s.poli([[hx - 6, hy + 6], [hx + 6, hy + 6], [hx + 9 + (vai ? 4 : 0), hy - 2], [hx + 3, hy - 9], [hx - 5, hy - 5]], Q.capa[2]); s.poli([[hx - 6, hy + 6], [hx - 3, hy + 6], [hx - 2, hy - 4], [hx - 5, hy - 5]], Q.capa[1]);
  s.poli([[hx - 5, hy + 5], [hx + 2, hy + 5], [hx + 2, hy - 2], [hx - 4, hy - 3]], BREU);
  if (nome === 'eleazar') { s.ret(hx - 4, hy + 3, 5, 4, R('#5A4A3A')[2]); s.px(hx - 3, hy + 7, R('#5A4A3A')[1]); } // barba
  if (nome === 'menaem') { s.ret(hx - 5, hy - 4, 8, 1, Q.faixa[3]); s.linha(hx - 3, hy - 2, hx - 1, hy + 3, 1, C('#8E2B45')); } // faixa na testa e a cicatriz
  const o = E.caido ? null : E.prep && E.pisca ? BR : Q.olho;
  if (o) { s.px(hx - 3, hy, o); if (nome !== 'jair') s.px(hx, hy, o); if (E.prep) { s.px(hx - 4, hy, o); } } else { s.ret(hx - 4, hy, 2, 1, PELE[1]); s.ret(hx - 1, hy, 2, 1, PELE[1]); }
  if (nome === 'jair') s.linha(hx - 1, hy - 3, hx + 2, hy + 2, 2, FAIXA_OLHO); // o olho vendado
  if (vai) for (let k = 0; k < 4; k++) s.ret(cx + 20 + k * 5, quadril - 10 + k * 5, 6 - k, 1, Q.olho); // riscos de velocidade
}

export const CHEFES_E = {
  conselho(s, b, Tm) { zelote(s, b, Tm, b.cen?.quem === 'eleazar' || (b.hp < b.max * 0.66 && !b.cen?.quem) ? 'eleazar' : 'menaem'); },
  zeloteFoice(s, b, Tm) { zelote(s, b, Tm, 'jair'); },
  zelotePunhal(s, b, Tm) { zelote(s, b, Tm, 'menaem'); }
};
