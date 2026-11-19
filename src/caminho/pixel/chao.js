// O chão vivo: o que faz uma coisa parecer pousada no mundo, e não colada numa linha.
// Atrás dos objetos: a face de cima do chão (terra batida da rua ou a grama), vista um pouco de cima, e a sombra
// de contato de cada coisa que toca o chão. Na frente: a beirada irregular, pedrinhas, e os tufos que cobrem a base
// das coisas. Tudo em tiras de 16 px pintadas à mão uma vez (variações por semente), sem ruído solto.
import { hash } from '../../util.js';
import { T, CW, CH, SOLIDO, FALSA, PONTE, tileEm } from '../nivel.js';
import { Sprite, cor, PX } from './raster.js';
import { estilo as estiloParede } from './masmorra.js';

const TL = T / PX; // 16
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const pont = (x, y, f) => BAYER[(y & 3) * 4 + (x & 3)] / 16 < f;
const mix = (a, b, t) => { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), f = s => Math.round((pa >> s & 255) * (1 - t) + (pb >> s & 255) * t); return '#' + (f(16) << 16 | f(8) << 8 | f(0)).toString(16).padStart(6, '0'); };

// paletas: terra batida tirada das cores do próprio tema (bloco → borda), grama de oliveiral
function paleta(G, mat) {
  const tm = G.tm, b = tm.bloco || '#0C141F', d = tm.borda || '#C9B88A';
  if (mat === 'grama') return ['#14241A', '#1F3824', '#2E5230', '#43703A', '#5E8E44', '#86AE58', mix(b, '#2E3A26', 0.6)];
  if (mat === 'laje') return [mix(b, d, 0.12), mix(b, d, 0.3), mix(b, d, 0.45), mix(b, d, 0.6), mix(b, d, 0.74), mix(b, d, 0.92), mix(b, d, 0.05)];
  return [mix(b, '#3A2A20', 0.6), mix(b, d, 0.32), mix(b, d, 0.46), mix(b, d, 0.6), mix(b, d, 0.75), mix(d, '#FFF1D0', 0.25), mix(b, '#2A2018', 0.5)];
}

// onde se pisa: rua (terra batida com lajes gastas), grama (trilha, sítio, olival) ou laje (Sardes)
function materialEm(G, tx, ty) {
  const d = G.def, N = G.N;
  if (d.interior) return null;
  const cel = N.celulas.find(c => c.cx === Math.floor(tx / CW) && c.cy === Math.floor(ty / CH));
  if (!(d.aberto || d.sitio)) { const e = estiloParede(G); return !e || !cel ? null : e === 'caverna' ? 'rua' : 'laje'; } // nas salas fechadas: lajes (ou terra, na caverna)
  if (!cel || cel.cy > 0 || cel.deco) return null; // o subsolo é salão de pedra
  if (cel.trilha || d.sitio || d.tema === 'bosque' || d.tema === 'floresta' || d.tema === 'getsemani' || /Olival/.test(cel.nome || '')) return 'grama';
  if (d.tema === 'sardes' || d.tema === 'sardes2') return 'laje';
  return 'rua';
}

const tiras = new Map();
// a face de cima (16 x 8, desenhada logo acima da linha do chão)
const y0Junta = (x, v, f) => { const p = f ? 11 : 7, o = f ? (v * 5) % p : (v * 3 + 2) % p; return ((x + o) % p + p) % p === 0; };
function tiraAtras(G, mat, v) {
  const P = paleta(G, mat), k = 'a' + mat + v + P[2]; let s = tiras.get(k); if (s) return s;
  s = new Sprite(TL, 8); const C = P.map(cor);
  for (let x = 0; x < TL; x++) {
    const r = hash(x + v * 17, v * 31 + 3);
    if (mat === 'grama') {
      // massa de grama com pontas em tufos: cada tufo é um 'v' de 3 a 5 px, não um pente de fios iguais
      const tf = Math.floor((x + v * 3) / 4), dx = (x + v * 3) % 4, alto = 2 + Math.floor(hash(tf, v + 1) * 3), h = 3 + (dx === 1 || dx === 2 ? alto : alto >> 1);
      for (let y = 8 - h; y < 8; y++) { const t = (y - (8 - h)) / h; s.px(x, y, C[t < 0.25 ? 4 : t < 0.6 ? 3 : 2]); }
      if (dx === 1 && hash(tf, v) > 0.55) s.px(x, 8 - h, C[5]); // a ponta que pega luz
      if (hash(x, v * 13 + 5) > 0.95) s.px(x, 8 - h - 1, cor(hash(x, v) > 0.5 ? '#E9D97A' : '#E8E0F0')); // uma florzinha rara
    } else {
      // lajes vistas um pouco de cima: duas fiadas, juntas desencontradas, a de trás mais escura (está mais longe da luz)
      const topo = 2 + (hash(Math.floor((x + v * 3) / 5), v + 9) > 0.7 ? 1 : 0);
      for (let y = topo; y < 8; y++) s.px(x, y, C[y < 5 ? 2 : 3]);
      s.px(x, topo, C[1]); s.px(x, 5, C[mat === 'laje' ? 1 : 2]); // a junta entre as fiadas
      if (y0Junta(x, v, 0)) { s.px(x, 3, C[1]); s.px(x, 4, C[1]); } if (y0Junta(x, v, 1)) { s.px(x, 6, C[1]); s.px(x, 7, C[1]); }
      if (y0Junta(x - 1, v, 0)) s.px(x, 3, C[3]); if (y0Junta(x - 1, v, 1)) s.px(x, 6, C[4]); // a quina de cada laje pega luz
      if (hash(x, v * 5 + 2) > 0.9) s.px(x, 7, C[2]); // desgaste
    }
  }
  if (mat !== 'grama') { // pedrinhas: uma luz em cima, uma sombra embaixo
    for (let n = 0; n < 1; n++) { if (hash(v, n * 9) < 0.6) continue; const px = 2 + Math.floor(hash(v * 3, n) * (TL - 5)); s.px(px, 6, C[4]); s.px(px + 1, 6, C[3]); s.px(px, 7, C[1]); s.px(px + 1, 7, C[1]); }
  }
  tiras.set(k, s); s.tela(); return s;
}
// a beirada (16 x 5, de y-2 a y+3): cobre a linha reta do bloco com uma borda viva
function tiraFrente(G, mat, v) {
  const P = paleta(G, mat), k = 'f' + mat + v + P[2]; let s = tiras.get(k); if (s) return s;
  s = new Sprite(TL, 6); const C = P.map(cor);
  for (let x = 0; x < TL; x++) {
    const r = hash(x * 5 + v * 3, 21 + v);
    if (mat === 'grama') {
      s.px(x, 2, C[3]); s.px(x, 3, C[r > 0.3 ? 2 : 1]); if (r > 0.55) s.px(x, 4, C[1]); if (r > 0.86) s.px(x, 5, C[0]); // a grama pende sobre a beira
      if (hash(x + v * 11, 2) > 0.8) { s.px(x, 1, C[4]); if (hash(x, v + 40) > 0.5) s.px(x, 0, C[5]); } // fios soltos na frente
    } else {
      s.px(x, 2, C[r > 0.18 ? 5 : 4]); s.px(x, 3, C[r > 0.5 ? 3 : 2]); s.px(x, 4, C[r > 0.7 ? 1 : 6]); // o meio-fio gasto: luz, corpo, sombra
      if (r < 0.07) s.px(x, 2, C[3]); // lascas
    }
  }
  if (mat !== 'grama' && hash(v, 77) > 0.55) { const px = 2 + Math.floor(hash(v, 5) * 11); s.px(px, 1, C[4]); s.px(px + 1, 1, C[3]); s.px(px, 0, C[5]); } // um seixo na beira
  tiras.set(k, s); s.tela(); return s;
}

// a largura (em px de arte) de quem pisa o chão: a sombra de contato e os tufos seguem a base de cada coisa
const PEGADA = { casa: 62, planta: 18, arvore: 34, poco: 22, portaoCidade: 66, ebenezer: 22, vaso: 11, banco: 26, npc: 11, morador: 11, pessoa: 11, discipulo: 11, jesus: 11, boneco: 12, placa: 7, flor: 7,
  bote: 40, galinheiro: 44, espantalho: 8, cesto: 18, cocho: 24, pomar: 26, amendoeira: 44, fogueira: 40, lagar: 58, essencias: 38, rocha: 50, festa: 0, estacao: 14, rolo: 18, portal: 30, lugarOracao: 30, canteiro: 30, cerca: 0, maquina: 36, animal: 18, covil: 40, querubim: 40, menora: 16, lamparina: 8, tocha: 6, retorno: 20, selado: 26 };
const CENARIO = { banca: 46, padaria: 64, forja: 42, armas: 42, tear: 30, arca: 92, redes: 32, descida: 0, sinagoga: 0, quadro: 26, templo: 0, balcao: 40, cofre: 26, andares: 0 };
export const pegada = o => o.tipo === 'cenario' ? (CENARIO[o.qual] ?? 30) : (PEGADA[o.tipo] ?? 0);

const cheio = (N, tx, ty) => { const t = tileEm(N, tx, ty); return t === SOLIDO || (t === FALSA && !N.desfeita.has(ty * N.w + tx)); };
// é chão de verdade aqui? (bloco cheio com ar por cima e com material)
function pisoEm(G, wx, wy) { const N = G.N, tx = Math.floor(wx / T), ty = Math.floor((wy + 2) / T); if (!cheio(N, tx, ty) || cheio(N, tx, ty - 1)) return null; return materialEm(G, tx, ty) && { tx, ty, mat: materialEm(G, tx, ty) }; }

function cadaPiso(G, vw, vh, cx, cy, fn) {
  const N = G.N, x0 = Math.max(0, Math.floor(cx / TL)), x1 = Math.min(N.w - 1, Math.floor((cx + vw) / TL)), y0 = Math.max(1, Math.floor(cy / TL)), y1 = Math.min(N.h - 1, Math.floor((cy + vh) / TL));
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (!cheio(N, tx, ty) || cheio(N, tx, ty - 1) || tileEm(N, tx, ty - 1) === PONTE) continue;
    const mat = materialEm(G, tx, ty); if (mat) fn(tx, ty, mat, tx * TL - cx, ty * TL - cy);
  }
}

// sombra de contato: uma elipse pontilhada, mais funda no meio, que escurece o chão sob a base
// as sombras são carimbos guardados por largura (um drawImage por coisa, em vez de centenas de pontinhos por quadro)
const carimbos = new Map();
function carimbo(chave, w, h, ox, oy, pinta) { let c = carimbos.get(chave); if (!c) { c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.fillStyle = '#0A0710'; pinta((px, py) => x.fillRect(px + ox, py + oy, 1, 1)); c.ox = ox; c.oy = oy; carimbos.set(chave, c); } return c; }
function sombra(g, x, y, w, forca = 1) {
  if (w < 4) return; w = Math.round(w); const f = Math.round(forca * 10) / 10, hw = w / 2 + 4 + w * 0.14, dx = Math.round(w * 0.1), L = Math.ceil(hw) + Math.abs(dx) + 1;
  const c = carimbo('s' + w + ':' + f, L * 2 + 1, 5, L, 4, put => {
    for (let r = 0; r < 4; r++) { const k = [1, 0.9, 0.74, 0.5][r], dens = [0.9, 0.7, 0.45, 0.22][r] * f, l = Math.round(hw * k), yy = -1 - r;
      for (let i = -l; i <= l; i++) { const borda = Math.abs(i) / (l + 1); if (pont(dx + i, yy, dens * (1 - borda * borda * borda))) put(dx + i, yy); } } }); // a sombra passa da base e corre um pouco para a direita, longe da luz
  g.drawImage(c, x - c.ox, y - c.oy);
}
// na beirada, logo abaixo da base: o chão escurece onde a coisa encosta (é isto que tira o 'colado')
function sombraBeira(g, x, y, w, forca = 1) {
  w = Math.round(w); const f = Math.round(forca * 10) / 10, l = Math.round(w * 0.46);
  const c = carimbo('b' + w + ':' + f, l * 2 + 1, 2, l, 0, put => { for (let i = -l; i <= l; i++) { const b = Math.abs(i) / (l + 1); if (pont(i, 0, 0.7 * f * (1 - b * b))) put(i, 0); if (pont(i, 1, 0.4 * f * (1 - b))) put(i, 1); } });
  g.drawImage(c, x - c.ox, y);
}

export function pintarChaoAtras(g, G, vw, vh, cx, cy) {
  if (globalThis.__semChao) return;
  if (G.def.interior || !(G.def.aberto || G.def.sitio || estiloParede(G))) return;
  cadaPiso(G, vw, vh, cx, cy, (tx, ty, mat, x, y) => g.drawImage(tiraAtras(G, mat, Math.floor(hash(tx, 3) * 8)).tela(), x, y - 8));
  // as sombras de contato de tudo o que toca o chão
  g.fillStyle = '#0A0710'; g.globalAlpha = 0.6;
  const X = wx => Math.round(wx / PX - cx), Y = wy => Math.round(wy / PX - cy);
  for (const o of G.objs) { const w = pegada(o); if (!w) continue; const xx = X(o.vv ? o.vv.x : o.x); if (xx < -60 || xx > vw + 60) continue; const yy = o.vv ? o.vv.y : o.y; if (!pisoEm(G, o.vv ? o.vv.x : o.x, yy)) continue; sombra(g, xx, Y(yy), w); }
  const pes = (c, w) => { if (!c || c.morto) return; const pi = pisoEm(G, c.x, c.y); if (pi) { const alt = (pi.ty * T - c.y) / PX; if (alt < 18) sombra(g, X(c.x), pi.ty * TL - cy, w * (1 - alt / 24), 1 - alt / 20); } }; // quem pula leva a sombra menor
  pes(G.p, 12); for (const o of G.outros || []) pes(o.corpo, 12);
  g.globalAlpha = 1;
}

export function pintarChaoFrente(g, G, vw, vh, cx, cy) {
  if (globalThis.__semChao) return;
  if (G.def.interior || !(G.def.aberto || G.def.sitio || estiloParede(G))) return;
  cadaPiso(G, vw, vh, cx, cy, (tx, ty, mat, x, y) => {
    g.drawImage(tiraFrente(G, mat, Math.floor(hash(tx, 9) * 8)).tela(), x, y - 2);
    // a ponta do chão (beira de plataforma ou de muro) arredonda em vez de cortar reto
    if (!cheio(G.N, tx - 1, ty)) { g.clearRect(x, y - 2, 1, 2); } if (!cheio(G.N, tx + 1, ty)) { g.clearRect(x + TL - 1, y - 2, 1, 2); }
  });
  const X = wx => Math.round(wx / PX - cx), Y = wy => Math.round(wy / PX - cy);
  g.fillStyle = '#0A0710'; g.globalAlpha = 0.5;
  for (const o of G.objs) { const w = pegada(o); if (!w) continue; const wx = o.vv ? o.vv.x : o.x, xx = X(wx); if (xx < -60 || xx > vw + 60) continue; const pi = pisoEm(G, wx, o.vv ? o.vv.y : o.y); if (pi) sombraBeira(g, xx, pi.ty * TL - cy, w); }
  for (const c of [G.p, ...[...(G.outros || [])].map(o => o.corpo)]) { if (!c || c.morto) continue; const pi = pisoEm(G, c.x, c.y), alt = pi ? (pi.ty * T - c.y) / PX : 99; if (alt < 16) sombraBeira(g, X(c.x), pi.ty * TL - cy, 12, 1 - alt / 18); }
  g.globalAlpha = 1;
  // tufos e poeira na base de cada coisa: a pedra, a casa e a árvore entram no chão
  for (const o of G.objs) {
    const w = pegada(o); if (w < 14 || o.tipo === 'npc' || o.tipo === 'morador') continue; const xx = X(o.x); if (xx < -60 || xx > vw + 60) continue;
    const pi = pisoEm(G, o.x, o.y); if (!pi) continue; const y = pi.ty * TL - cy, P = paleta(G, pi.mat), sd = Math.floor(o.x);
    for (const lado of [-1, 1]) { const bx = xx + lado * Math.round(w / 2 - 1); tufo(g, bx, y, pi.mat, P, sd + lado); }
    if (w > 40) tufo(g, xx + Math.round((hash(sd, 4) - 0.5) * w * 0.5), y, pi.mat, P, sd + 7);
  }
}
function tufo(g, x, y, mat, P, sd) {
  if (mat === 'grama') { const n = 3 + Math.floor(hash(sd, 1) * 3);
    for (let i = 0; i < n; i++) { const dx = i - (n >> 1), h = 2 + Math.floor(hash(sd, i + 2) * 3) - Math.abs(dx); if (h < 1) continue; for (let k = 0; k < h; k++) { g.fillStyle = k === h - 1 ? P[5] : k > h / 2 ? P[4] : P[3]; g.fillRect(x + dx + (k === h - 1 && hash(sd, i) > 0.5 ? (dx < 0 ? -1 : 1) : 0), y - 1 - k, 1, 1); } }
  } else { // poeira e cascalho junto ao pé da parede
    g.fillStyle = P[3]; g.fillRect(x - 2, y - 1, 5, 1); g.fillStyle = P[4]; g.fillRect(x - 1, y - 2, 2, 1); g.fillStyle = P[5]; g.fillRect(x + 2, y - 2, 1, 1); g.fillStyle = P[1]; g.fillRect(x + 3, y - 1, 1, 1);
  }
}
