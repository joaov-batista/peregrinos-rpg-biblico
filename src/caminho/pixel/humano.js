// O peregrino em pixel art: um humano personalizável (pele, cabelo, barba, corpo, túnica, capa) montado em camadas.
// A cabeça e os cabelos são carimbos desenhados à mão; tronco, membros, capa e arma são pintados pose a pose.
// As poses seguem a cadência de animação quadro a quadro (corrida em 8 quadros, respiração em 4, golpe com
// antecipação, impacto e recuperação) sem mudar os tempos nem as caixas de golpe do combate.
import { Sprite, rampa, cor, TINTA, BRANCO, PX } from './raster.js';

export const AX = 40, AY = 52, LARG = 80, ALT = 60; // âncora (pés) e tamanho do quadro
const CORPOS = { medio: { q: 12, w: 6, t: 9 }, magro: { q: 12, w: 5, t: 9 }, forte: { q: 12, w: 7, t: 9, ombro: 1 }, robusto: { q: 11, w: 7, t: 9, barriga: 1 }, baixo: { q: 10, w: 6, t: 8 }, alto: { q: 14, w: 6, t: 9 } };
const TUNICA_LONGA = new Set(['profeta', 'levita', 'juiz']);

// cabeça olhando para a direita: 11 colunas × 10 linhas (as duas primeiras ficam acima do crânio)
const CABECA = ['...........', '...........', '...SSSSS...', '..SSSSSSS..', '..SSSSSSL..', '..sSSSWES..', '..sSSSSSSL.', '..sSSSSSS..', '...sBBBBB..', '....BBBB...'];
// cabelos e coberturas: H cabelo · h sombra · l brilho · C pano · c pano escuro · k pano claro · G ouro
const CABELOS = {
  curto: ['....HHHH...', '..HHlllHH..', '.HHHHHHHHH.', '.HHHHHH....', '.hHH.......', '.hH........', '.hh........', '..h........', '...........', '...........'],
  franja: ['....HHHH...', '..HHlllHH..', '.HHHHHHHHH.', '.HHHHHHHH..', '.hHH.HH.H..', '.hH........', '.hh........', '..h........', '...........', '...........'],
  espetado: ['..H.H.HH.H.', '.HHHlHlHHH.', '.HHHHHHHHH.', '.HHHHHH....', '.hHH.......', '.hH........', '.hh........', '...........', '...........', '...........'],
  longo: ['....HHHH...', '..HHlllHH..', '.HHHHHHHHH.', '.HHHHHH....', '.hHH.......', '.hHH.......', '.hHH.......', '.hhH.......', 'hhHH.......', 'hhH........'],
  rabo: ['....HHHH...', '..HHlllHH..', '.HHHHHHHHH.', 'HHHHHHH....', 'HhHH.......', 'hh.H.......', 'hh.........', '.h.........', '.hh........', '..h........'],
  coque: ['.HH.HHHH...', 'HllHlllHH..', 'HHHHHHHHHH.', '.HHHHHH....', '.hHH.......', '.hH........', '.hh........', '...........', '...........', '...........'],
  cacheado: ['..HHlHHlH..', '.HlHHHHHHH.', 'HHHHHHHHHH.', 'HHhHHHH.H..', 'HhHH.......', 'hHhH.......', 'HhH........', '.hh........', '...........', '...........'],
  black: ['..HHHHHHH..', '.HHlHHlHHH.', 'HHHHHHHHHHH', 'HHHHHHHHHH.', 'HHhHH......', 'HhHH.......', '.hH........', '...........', '...........', '...........'],
  trancas: ['....HHHH...', '..HhHlHhH..', '.HHhHHhHHH.', '.HhHHHH....', '.hHH.......', '.hH........', 'hH.h.......', 'h..h.......', 'H..H.......', 'h..h.......'],
  careca: ['...........', '...........', '....LLL....', '...........', '...........', '...........', '...........', '...........', '...........', '...........'],
  turbante: ['...kkkk....', '..CCkkCCC..', '.CCCCCCCCC.', '.cCCCCCCkC.', '.cc........', '.c.........', '...........', '...........', '...........', '...........'],
  veu: ['....CCCC...', '..CCkkkCC..', '.CCCCCCCCC.', '.CCCCCCC...', '.cCC.......', '.cCC.......', '.cCC.......', 'ccCC.......', 'ccCC.......', 'cCC........']
};
const LAMPIAO = ['.g.', 'gYg', 'gYg', '.g.'];
const SANDALIA = rampa('#6B4F3A'), ACO = rampa('#9FB0C0'), OURO = rampa('#D9A63C'), COURO = rampa('#7A5236'), MADEIRA = rampa('#8A623C'), MARFIM = rampa('#E4D9BE');

const quadro = new Sprite(LARG, ALT), fantasma = new Sprite(LARG, ALT);

// ---- pose: posições em pixels de arte, relativas aos pés (x para a frente, y para cima é negativo) ----
const CORRE_X = [5, 3, 0, -3, -5, -3, 1, 4], CORRE_Y = [0, 0, 0, 0, -1, -3, -4, -2], CORRE_BOB = [0, 1, 0, -1, 0, 1, 0, -1];
// as mãos foram posadas para um corpo de 18 px até o ombro: corpos mais altos ou baixos sobem ou descem junto
function ajusta(P, c) { const d = c.q + c.t - 18; if (P.mao) P.mao.y -= d; if (P.lamp) P.lamp.y -= d; return P; }
export function poseDe(p, Tm, corpo) {
  const P = { bob: 0, incl: 0, agacha: 0, pf: { x: 2, y: 0 }, pt: { x: -2, y: 0 }, mao: null, ang: 1.15, lamp: null, cabX: 0, cabY: 0, respira: 0 };
  const corre = p.chao ? Math.min(1, Math.abs(p.vx) / 252) : 0;
  if (p.morto) { P.agacha = 4; P.incl = -3; P.cabY = 2; return P; }
  if (p.stunT > 0) { P.incl = -2; P.cabX = -1; P.mao = { x: -5, y: -18 }; P.ang = -0.6; P.pf = { x: 3, y: -1 }; P.pt = { x: -3, y: 0 }; return ajusta(P, corpo); }
  if (p.orando > 0) { P.agacha = 4; P.incl = 1; P.cabY = 1; P.cabX = 1; P.pf = { x: 4, y: 0 }; P.pt = { x: -4, y: 0 }; P.joelho = true; P.mao = { x: 5, y: -13 }; P.ang = 1.57; P.lamp = { x: 6, y: -16 }; return ajusta(P, corpo); }
  if (p.dashT > 0 && p.rasteiro) { P.incl = -5; P.agacha = 9; P.cabY = 2; P.pf = { x: 9, y: -1 }; P.pt = { x: 4, y: 0 }; P.mao = { x: -6, y: -8 }; P.ang = 2.9; return ajusta(P, corpo); } // rasteira: desliza quase deitado, pés na frente
  if (p.atk?.dir === 'rasteira') { P.agacha = 7; P.incl = 3; P.cabY = 1; P.pf = { x: 5, y: 0 }; P.pt = { x: -5, y: 0 }; P.joelho = true; P.mao = { x: 9, y: -6 }; P.ang = 1.75; return ajusta(P, corpo); } // golpe agachado
  if (p.dashT > 0) { P.incl = 4; P.agacha = 1; P.pf = { x: 5, y: -2 }; P.pt = { x: -7, y: -1 }; P.mao = { x: -5, y: -14 }; P.ang = 2.7; return ajusta(P, corpo); }
  if (!p.chao) {
    if (p.desliza) { P.pf = { x: 2, y: -4 }; P.pt = { x: 1, y: -1 }; P.incl = -1; P.mao = { x: 3, y: -24 }; P.ang = -1.2; }
    else if (p.vy < -60) { P.pf = { x: 3, y: -5 }; P.pt = { x: -3, y: -1 }; P.incl = 1; P.mao = { x: 5, y: -16 }; P.ang = 0.5; }
    else { P.pf = { x: 4, y: -1 }; P.pt = { x: -4, y: -3 }; P.incl = -1; P.mao = { x: 6, y: -21 }; P.ang = -0.5; P.cabY = -1; }
  } else if (p.sq < 0.93) { P.agacha = 3; P.pf = { x: 4, y: 0 }; P.pt = { x: -4, y: 0 }; P.incl = 2; P.cabY = 1; } // aterrissagem
  else if (corre > 0.25) {
    const f = Math.floor(p.passo * 8) % 8, g = (f + 4) % 8;
    P.pf = { x: CORRE_X[f], y: CORRE_Y[f] }; P.pt = { x: CORRE_X[g], y: CORRE_Y[g] }; P.bob = CORRE_BOB[f]; P.incl = 2;
    P.mao = { x: 4 - CORRE_X[f] * 0.6, y: -13 + (f % 4 === 1 ? 1 : 0) }; P.ang = 1.9 - CORRE_X[f] * 0.06; P.balanco = CORRE_X[f];
  } else { const r = Math.floor(Tm * 2.6) % 4; P.respira = r === 2 || r === 3 ? 1 : 0; P.bob = P.respira; }
  // golpes: antecipação (braço atrás), corte e recuperação
  const a = p.atk;
  if (a) {
    const k = Math.min(1, a.t / a.dur), e = 1 - Math.pow(1 - k, 3), par = a.n % 2 ? -1 : 1;
    if (a.dir === 'lado') {
      const an = k < 0.15 ? -2.5 : -2.2 + e * 3.5; P.ang = par > 0 ? an : -an + 0.4;
      P.mao = { x: Math.round(Math.cos(P.ang) * 6) + 2, y: -17 + Math.round(Math.sin(P.ang) * 5) }; P.incl = k < 0.15 ? -1 : 3;
      if (p.chao) { P.pf = { x: k < 0.15 ? 2 : 6, y: 0 }; P.pt = { x: -4, y: 0 }; P.agacha = k < 0.15 ? 0 : 1; }
    } else if (a.dir === 'cima') { P.ang = -0.2 - e * 2.7; P.mao = { x: Math.round(Math.cos(P.ang) * 4) + 1, y: -22 + Math.round(Math.sin(P.ang) * 4) }; P.cabY = -1; P.incl = -1; }
    else { P.ang = 0.1 + e * 2.3; P.mao = { x: Math.round(Math.cos(P.ang) * 4) + 2, y: -12 + Math.round(Math.sin(P.ang) * 4) }; P.pf = { x: 3, y: -5 }; P.pt = { x: -3, y: -4 }; P.incl = 2; }
  } else if (p.atkCd > 0.08 && p.chao && corre < 0.25 && !p.lamp) { P.ang = 1.35; P.mao = { x: 7, y: -12 }; P.incl = 2; P.pf = { x: 5, y: 0 }; P.pt = { x: -4, y: 0 }; P.agacha = 1; } // recuperação
  else if (p.carga > 0.15) { P.ang = -2.5; P.mao = { x: -4, y: -21 }; P.incl = -1; P.agacha = 1; }
  if (p.lampA > 0.4 && !p.orando) { P.lamp = { x: 6, y: -27 }; if (!a) { P.mao = { x: 3, y: -12 }; P.ang = 1.5; } }
  return ajusta(P, corpo);
}

function arma(s, tipo, hx, hy, ang, lendaria, ext = 0) {
  const c = Math.cos(ang), n = Math.sin(ang), A = lendaria ? rampa('#E9E4C8') : ACO;
  const pt = d => [hx + c * d, hy + n * d];
  if (tipo === 'espada' || tipo === 'adaga') {
    const L = tipo === 'adaga' ? 7 : 13, [bx, by] = pt(-2), [gx, gy] = pt(1), [tx, ty] = pt(L), [mx, my] = pt(2);
    s.linha(bx, by, hx, hy, 1, COURO[1]);
    s.linha(mx, my, tx, ty, 2, A[1]); s.linha(mx, my, pt(L - 1)[0], pt(L - 1)[1], 1, A[3]); s.px(tx, ty, A[4]);
    s.linha(gx - n * 2, gy + c * 2, gx + n * 2, gy - c * 2, 1, OURO[2]); s.px(gx, gy, OURO[4]); s.px(pt(-3)[0], pt(-3)[1], OURO[2]);
  } else if (tipo === 'lanca') {
    const [ax, ay] = pt(-9), [tx, ty] = pt(15); s.linha(ax, ay, tx, ty, 1, MADEIRA[2]);
    s.linha(pt(15)[0], pt(15)[1], pt(19)[0], pt(19)[1], 2, A[2]); s.px(pt(20)[0], pt(20)[1], A[4]); s.px(pt(14)[0], pt(14)[1], OURO[2]);
  } else if (tipo === 'cajado') {
    const [ax, ay] = pt(-7), [tx, ty] = pt(14); s.linha(ax, ay, tx, ty, 1, MADEIRA[2]); s.linha(ax, ay + 1, pt(4)[0], pt(4)[1] + 1, 1, MADEIRA[1]);
    const [kx, ky] = pt(16); s.px(kx, ky, MADEIRA[3]); s.px(kx - n * 2 + c, ky + c * 2 + n, MADEIRA[2]); s.px(kx - n * 3, ky + c * 3, MADEIRA[2]); s.px(kx - n * 2 - c, ky + c * 2 - n, MADEIRA[1]);
    s.px(kx - n, ky + c, lendaria ? OURO[4] : cor('#9FE0D6'));
  } else if (tipo === 'funda') {
    const bal = Math.sin(ang * 2) * 2 + ext; s.linha(hx, hy, hx + 2 + bal, hy + 6, 1, COURO[2]); s.linha(hx + 1, hy, hx + 4 + bal, hy + 6, 1, COURO[1]);
    s.ret(hx + 2 + bal, hy + 6, 3, 2, COURO[3]); s.px(hx + 3 + bal, hy + 6, cor('#C9C4B2'));
  } else if (tipo === 'trombeta') {
    for (let d = 0; d <= 9; d++) { const g = d < 3 ? 1 : d < 7 ? 2 : 3, [x, y] = pt(d); s.ret(x - (g >> 1), y - d * 0.35 - (g >> 1), g, g, d > 7 ? MARFIM[4] : d % 3 ? MARFIM[2] : MARFIM[1]); }
  } else if (tipo === 'chicote') {
    s.linha(pt(-2)[0], pt(-2)[1], pt(2)[0], pt(2)[1], 1, COURO[1]); s.px(pt(-2)[0], pt(-2)[1], OURO[2]);
    let px = pt(2)[0], py = pt(2)[1];
    for (let d = 3; d <= 16 + ext; d += 2) { const [x, y] = pt(d), cai = ext ? Math.sin(d * 0.5) * 1.5 : (d - 2) * (d - 2) * 0.06; s.linha(px, py, x, y + cai, 1, d % 4 ? COURO[2] : COURO[3]); px = x; py = y + cai; }
  }
}

function perna(s, qx, qy, pe, R, sand, frente, joelho) {
  const jx = (qx + pe.x) / 2 + (joelho ? 2 : 1.5), jy = joelho && !frente ? pe.y - 1 : (qy + pe.y) / 2;
  const rr = frente ? R : [R[0], R[0], R[1], R[2], R[3]];
  s.membro(qx, qy, jx, jy, 2, rr, frente); s.membro(jx, jy, pe.x, pe.y - 2, 2, rr, frente);
  s.ret(pe.x - 1, pe.y - 1, 4, 1, sand[frente ? 2 : 1]); s.px(pe.x + 2, pe.y - 2, sand[frente ? 3 : 2]); s.px(pe.x, pe.y - 2, sand[1]);
}

// Desenha o humano no buffer (origem nos pés). o: { look, cls, tipoArma, P (pose), capa, hab, lampiao, oleo, semArma }
export function pintarHumano(s, ox, oy, o) {
  const L = o.look || {}, C = CORPOS[L.body] || CORPOS.medio, P = o.P, hab = o.hab || {};
  const pele = rampa(L.skin || '#C68B59'), cab = rampa(L.hair || '#3A2314'), tun = rampa(L.tunic || '#526C78'), temCapa = L.cape && L.cape !== 'none', cap = rampa(temCapa ? L.cape : L.tunic || '#526C78');
  const sand = hab.calcados ? rampa('#C9A45C') : SANDALIA, cinto = hab.firmeza ? OURO : COURO;
  const X = x => ox + Math.round(x), Y = y => oy + Math.round(y);
  const qy = -C.q + P.agacha + P.bob, topo = qy - C.t, w = C.w, incl = P.incl;
  const tx = j => Math.round(incl * (1 - j / C.t)); // deslocamento do tronco por linha (j = 0 no pescoço)
  const ombro = { x: tx(1) + 1, y: topo + 2 }, pesc = { x: tx(0), y: topo };

  // capa: fita que parte dos ombros (pontos já em pixels de arte, relativos aos pés)
  if (o.capa && o.capa.length > 2) {
    const c = o.capa, n = temCapa ? c.length : 4, esq = [], dir = [];
    for (let i = 0; i < n; i++) {
      const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, lg = temCapa ? 1.8 + i * 0.75 : 1.2;
      esq.push([X(c[i].x - dy / d * lg), Y(c[i].y + dx / d * lg)]); dir.push([X(c[i].x + dy / d * lg), Y(c[i].y - dx / d * lg)]);
    }
    s.poli([...esq, ...dir.reverse()], cap[1]);
    for (let i = 1; i < n; i++) s.linha(X(c[i - 1].x), Y(c[i - 1].y), X(c[i].x), Y(c[i].y), temCapa ? 2 : 1, cap[2]);
    for (let i = 1; i < n; i++) s.px(dir[n - 1 - i][0], dir[n - 1 - i][1], cap[i > n - 3 ? 3 : 2]);
    if (temCapa) { s.px(esq[n - 1][0], esq[n - 1][1], cap[0]); s.px(dir[0][0], dir[0][1], cap[0]); }
  }
  // braço de trás (segura o lampião)
  const lp = P.lamp || { x: -3 + (P.balanco ? -P.balanco * 0.4 : 0), y: qy - 1 + P.respira };
  if (!o.semLampiao) {
    const R2 = [pele[0], pele[0], pele[1], pele[2], pele[3]];
    s.membro(X(ombro.x - 2), Y(ombro.y), X((ombro.x - 2 + lp.x) / 2 - 1), Y((ombro.y + lp.y) / 2 + 1), 2, [tun[0], tun[0], tun[1], tun[2], tun[3]], false);
    s.linha(X((ombro.x - 2 + lp.x) / 2 - 1), Y((ombro.y + lp.y) / 2 + 1), X(lp.x), Y(lp.y), 1, R2[2]);
    const brasa = (o.oleo ?? 1) > 0.05;
    s.carimbo(LAMPIAO, X(lp.x) - 1, Y(lp.y) + 1, { g: OURO[brasa ? 2 : 1], Y: brasa ? cor(Math.floor(o.t * 9) % 3 ? '#FFE9A8' : '#FFD06A') : cor('#5C5646') });
  }
  // pernas e saia da túnica
  const q = { x: Math.round(incl * 0.15), y: qy };
  perna(s, X(q.x - 1), Y(q.y), { x: X(P.pt.x), y: Y(P.pt.y) }, pele, sand, false, P.joelho);
  const longa = TUNICA_LONGA.has(o.cls), barra = longa ? Math.min(-2, qy + C.q - 3) : qy + 4;
  perna(s, X(q.x + 1), Y(q.y), { x: X(P.pf.x), y: Y(P.pf.y) }, pele, sand, true, false);
  for (let y = qy - 1; y <= barra; y++) {
    const k = (y - qy + 1) / Math.max(1, barra - qy + 1), abre = Math.round(k * (longa ? 2.2 : 1.4)), x0 = q.x - (w >> 1) - abre + Math.round(Math.min(0, P.pt.x) * k * 0.25), x1 = q.x + (w >> 1) + abre - (w % 2 ? 0 : 1) + Math.round(Math.max(0, P.pf.x) * k * 0.3);
    for (let x = x0; x <= x1; x++) s.px(X(x), Y(y), x === x0 ? tun[1] : x === x1 ? tun[3] : (x + y) % 5 === 0 && k > 0.4 ? tun[1] : tun[2]);
    if (y === barra) for (let x = x0; x <= x1; x++) s.px(X(x), Y(y), tun[x % 3 ? 1 : 0]);
  }
  // tronco
  for (let j = 0; j <= C.t; j++) {
    const lg = w + (j < 3 && C.ombro ? 1 : 0) + (j > C.t - 4 && C.barriga ? 1 : 0), x0 = tx(j) - (lg >> 1), y = topo + j;
    for (let i = 0; i < lg; i++) s.px(X(x0 + i), Y(y), i === 0 ? tun[1] : i === lg - 1 ? tun[3] : tun[2]);
    if (j === 0) { s.px(X(x0 + (lg >> 1)), Y(y), pele[1]); s.px(X(x0 + (lg >> 1) + 1), Y(y), pele[2]); } // decote
  }
  const peito = (j, i, c) => s.px(X(tx(j) - (w >> 1) + i), Y(topo + j), c);
  switch (o.cls) {
    case 'guerreiro': for (let j = 1; j <= 4; j++) for (let i = 1; i < w; i++) peito(j, i, ACO[i === w - 1 ? 4 : j === 4 ? 1 : i === 1 ? 1 : 2 + ((i + j) % 3 === 0 ? 1 : 0)]); s.bola(X(ombro.x - 2), Y(ombro.y - 1), 2, 1.6, ACO); break;
    case 'valente': for (let j = 1; j <= 5; j++) for (let i = 1; i < w; i++) peito(j, i, COURO[i === w - 1 ? 3 : j % 2 ? 2 : 1]); peito(3, w - 2, OURO[3]); break;
    case 'pastor': for (let j = 1; j <= C.t - 2; j++) peito(j, Math.min(w - 1, j), COURO[2]); for (let i = 0; i < w; i++) peito(1, i, cap[3]); break;
    case 'profeta': for (let j = 1; j <= C.t; j++) { peito(j, w - 2, cap[2]); peito(j, w - 1, cap[3]); } break;
    case 'levita': for (let i = 0; i < w; i++) { peito(1, i, OURO[2]); } peito(3, w - 3, OURO[3]); peito(3, w - 2, cor('#6FD0C8')); peito(4, w - 3, cor('#D0566A')); peito(4, w - 2, OURO[3]); break;
    case 'zelote': for (let j = 2; j <= 5; j++) peito(j, j - 1, tun[0]); break;
    case 'juiz': for (let i = 0; i < w; i++) { peito(1, i, cap[2]); peito(2, i, cap[i % 2 ? 2 : 1]); } break;
  }
  if (hab.couraca) { peito(2, w - 2, BRANCO); peito(3, w - 3, ACO[4]); }
  for (let i = 0; i < w + (C.barriga ? 1 : 0); i++) s.px(X(tx(C.t - 1) - (w >> 1) + i), Y(qy - 1), i === w - 2 ? OURO[3] : cinto[i ? 2 : 1]);
  if (o.cls === 'zelote') { s.px(X(q.x + (w >> 1)), Y(qy), cor('#B5483A')); s.px(X(q.x + (w >> 1)), Y(qy + 1), cor('#8E2F2A')); }
  // capuz caído nos ombros
  if (temCapa) { s.ret(X(pesc.x - (w >> 1) - 1), Y(topo), 3, 2, cap[2]); s.px(X(pesc.x - (w >> 1) - 1), Y(topo + 2), cap[1]); s.px(X(pesc.x - (w >> 1)), Y(topo - 1), cap[3]); for (let i = 0; i < w; i++) s.px(X(pesc.x - (w >> 1) + i), Y(topo), i > w - 3 ? cap[3] : cap[2]); }
  // cabeça
  const hx = X(pesc.x - 5 + P.cabX), hy = Y(topo - 9 + P.cabY - (P.respira && !P.bob ? 0 : 0));
  const barba = L.beard ? cab[1] : pele[2];
  s.carimbo(CABECA, hx, hy, { S: pele[2], s: pele[1], L: pele[3], E: TINTA, W: BRANCO, B: barba });
  if (L.beard) { s.px(hx + 7, hy + 8, cab[2]); s.px(hx + 6, hy + 9, cab[0]); }
  else { s.px(hx + 7, hy + 8, pele[1]); s.px(hx + 4, hy + 9, pele[1]); s.px(hx + 5, hy + 9, pele[1]); }
  if (o.pisca) { s.px(hx + 6, hy + 5, pele[1]); s.px(hx + 7, hy + 5, pele[1]); }
  s.carimbo(CABELOS[L.style] || CABELOS.curto, hx, hy, { H: cab[2], h: cab[1], l: cab[3], C: cap[2], c: cap[1], k: cap[3], G: OURO[3], L: pele[4] });
  // o que vai na cabeça (Dorcas, no Refúgio): capuz, capuz pontudo, faixa ou elmo de couro
  const ac = L.acessorio;
  if (ac === 'capuz' || ac === 'pontudo') {
    for (let y = -1; y <= 10; y++) for (let x = 0; x <= 9; x++) { const topoC = y < 3 && !(y === -1 && (x < 2 || x > 8)) && !(y === 0 && x < 1), tras = y >= 3 && x <= 2; if (topoC || tras) s.px(hx + x, hy + y, x === 0 || (y > 8 && tras) ? cap[1] : y <= 0 ? cap[3] : x >= 8 && y < 3 ? cap[1] : cap[2]); }
    s.px(hx + 3, hy + 3, cap[1]); s.px(hx + 3, hy + 4, cap[0]);
    if (ac === 'pontudo') { s.px(hx + 1, hy - 2, cap[2]); s.px(hx, hy - 2, cap[2]); s.px(hx - 1, hy - 3, cap[3]); s.px(hx, hy - 3, cap[2]); s.px(hx - 2, hy - 3, cap[1]); }
  } else if (ac === 'faixa') { for (let x = 1; x <= 9; x++) s.px(hx + x, hy + 3, cap[x > 6 ? 3 : 2]); s.px(hx, hy + 4, cap[2]); s.px(hx - 1, hy + 5, cap[1]); s.px(hx - 1, hy + 6, cap[2]); }
  else if (ac === 'elmo') { for (let y = -1; y <= 2; y++) for (let x = (y < 0 ? 2 : 1); x <= (y < 0 ? 8 : 9); x++) s.px(hx + x, hy + y, y === -1 ? COURO[3] : x > 7 ? COURO[1] : COURO[2]); for (let x = 1; x <= 9; x++) s.px(hx + x, hy + 3, OURO[x % 3 ? 2 : 3]); s.px(hx + 8, hy + 4, COURO[1]); s.px(hx + 8, hy + 5, COURO[1]); }
  if (hab.asas) for (let i = 2; i <= 8; i++) s.px(hx + i, hy + 3, i === 6 ? BRANCO : ACO[i % 2 ? 3 : 2]); // capacete da salvação: um aro de prata
  if (o.cls === 'zelote') for (let i = 2; i <= 8; i++) s.px(hx + i, hy + 3, cor(i % 3 ? '#B5483A' : '#8E2F2A'));
  // braço da frente e arma
  const m = P.mao || { x: 3 + (P.balanco ? P.balanco * 0.5 : 0), y: qy - 1 + P.respira };
  const cot = { x: (ombro.x + 1 + m.x) / 2 + (m.y < ombro.y ? 1 : -1), y: (ombro.y + m.y) / 2 + (m.y < ombro.y ? 0 : 1.5) };
  if (!o.semArma && o.tipoArma) arma(s, o.tipoArma, X(m.x), Y(m.y), P.ang, !!hab.espada, o.ext || 0);
  s.membro(X(ombro.x + 1), Y(ombro.y), X(cot.x), Y(cot.y), 2, tun); s.membro(X(cot.x), Y(cot.y), X(m.x), Y(m.y), 2, pele, false);
  s.px(X(m.x), Y(m.y), pele[3]); s.px(X(m.x) + 1, Y(m.y), pele[2]);
  if (C.ombro || o.cls === 'guerreiro') s.px(X(ombro.x + 1), Y(ombro.y - 1), o.cls === 'guerreiro' ? ACO[4] : tun[3]);
}

// Quadro pronto do herói para um corpo de jogo (p). Devolve a tela do sprite e a âncora.
export function quadroHeroi(p, look, cls, tipoArma, Tm, hab, extra = {}) {
  const C = CORPOS[look?.body] || CORPOS.medio, P = poseDe(p, Tm, C);
  let capa = null;
  if (p.capa) capa = p.capa.map(q => ({ x: (q.x - p.x) / PX * p.face, y: (q.y - p.y) / PX + (P.agacha + P.bob) * 0.6 }));
  const s = quadro.limpa();
  pintarHumano(s, AX, AY, { look, cls, tipoArma, P, capa, hab, oleo: p.oleoFrac, t: Tm, pisca: !(p.pisca > 0), ext: p.atk && p.atk.dir === 'lado' ? 8 : 0, ...extra });
  if (p.flashT > 0) s.tinge(BRANCO);
  s.contorno(TINTA);
  return s;
}
// silhueta de uma cor (rastro do passo pronto)
export function vulto(base, c) { fantasma.b.set(base.b); return fantasma.tinge(c); }

// Personagem parado (NPCs e prévias): sem arma, de frente para "vira"
const npcs = new Map();
export function quadroPessoa(look, Tm, chave) {
  let e = npcs.get(chave); if (!e) npcs.set(chave, e = { s: new Sprite(48, 44), f: -1 });
  const f = Math.floor(Tm * 2.2 + (chave.length % 4)) % 4;
  if (e.f !== f) {
    e.f = f; const r = f >= 2 ? 1 : 0, C = CORPOS[look?.body] || CORPOS.medio;
    pintarHumano(e.s.limpa(), 24, 40, { look, cls: look?.cls, P: { bob: r, incl: 0, agacha: 0, pf: { x: 2, y: 0 }, pt: { x: -2, y: 0 }, mao: null, ang: 1.2, lamp: null, cabX: 0, cabY: 0, respira: r }, semArma: true, semLampiao: true, t: Tm, capa: look?.cape && look.cape !== 'none' ? [0, 1, 2, 3, 4, 5].map(i => ({ x: -2 - i * 0.5 - (r && i > 2 ? 0.5 : 0), y: -C.q - C.t + 2 + i * 2.6 })) : null });
    e.s.contorno(TINTA);
  }
  return e.s;
}
