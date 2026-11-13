// Cenário em pixel art: céu em faixas pontilhadas, três camadas de ruínas em paralaxe, blocos de pedra de 16×16
// com capa iluminada, arquitetura no fundo das salas e a escuridão em degraus de luz.
// Tudo é pintado uma vez por área em telas pequenas e depois só copiado (rápido no celular).
import { hash, clamp } from '../../util.js';
import { T, CW, CH, SOLIDO, PONTE, ESPINHO, OCULTO, FALSA, PORTAO, TRANCA, tileEm, semente } from '../nivel.js';
import { Sprite, rampa, cor, TINTA, PX } from './raster.js';
import { fundoSala } from './salas.js';

const TL = T / PX; // 16
const mistura = (a, b, t) => { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), f = (s) => Math.round((pa >> s & 255) * (1 - t) + (pb >> s & 255) * t); return '#' + (f(16) << 16 | f(8) << 8 | f(0)).toString(16).padStart(6, '0'); };
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const pontilha = (x, y, f) => BAYER[(y & 3) * 4 + (x & 3)] / 16 < f;

/* ---------------- blocos ---------------- */
// 16 formas (vizinhos abertos: cima 1, direita 2, baixo 4, esquerda 8) × 4 variações
function atlasBlocos(tm) {
  const pedra = rampa(mistura(tm.bloco, tm.borda, 0.3)), topo = rampa(mistura(tm.borda, tm.acento, 0.15)), fundo = cor(mistura(tm.bloco, '#000000', 0.25)), musgo = rampa(mistura(tm.acento, '#3F7A52', 0.55));
  const s = new Sprite(TL * 16, TL * 4);
  for (let v = 0; v < 4; v++) for (let m = 0; m < 16; m++) {
    const ox = m * TL, oy = v * TL, r = k => hash(m * 7 + k, v * 13 + k * 3, 5);
    for (let y = 0; y < TL; y++) for (let x = 0; x < TL; x++) {
      // miolo: quase preto, com juntas de tijolo raras; a borda é que desenha a plataforma
      const junta = (y % 8 === 7) || ((x + (y >> 3) * 5 + v * 3) % 11 === 0 && y % 8 !== 7);
      let c = m === 0 ? (junta && r(x >> 2) > 0.55 ? pedra[0] : fundo) : junta ? pedra[0] : pedra[1];
      if (m && !junta && ((x * 3 + y * 5 + v) % 13 === 0)) c = pedra[2];
      s.px(ox + x, oy + y, c);
    }
    if (m & 8) for (let y = 0; y < TL; y++) { s.px(ox, oy + y, pedra[2]); if (y % 5 === v) s.px(ox + 1, oy + y, pedra[2]); }
    if (m & 2) for (let y = 0; y < TL; y++) { s.px(ox + TL - 1, oy + y, pedra[0]); s.px(ox + TL - 2, oy + y, y % 4 ? pedra[1] : pedra[0]); }
    if (m & 4) for (let x = 0; x < TL; x++) { s.px(ox + x, oy + TL - 1, pedra[0]); if (r(x) > 0.6) s.px(ox + x, oy + TL - 2, pedra[0]); }
    if (m & 1) { // capa: laje clara com quina e brilho
      for (let x = 0; x < TL; x++) { s.px(ox + x, oy, topo[3]); s.px(ox + x, oy + 1, topo[2]); s.px(ox + x, oy + 2, x % 8 === 7 ? topo[0] : topo[1]); s.px(ox + x, oy + 3, pedra[0]); if ((x + v * 3) % 7 === 2) s.px(ox + x, oy, topo[4]); }
      if (r(1) > 0.45) { const x = 2 + Math.floor(r(2) * 10); s.px(ox + x, oy + 1, musgo[2]); s.px(ox + x + 1, oy + 1, musgo[1]); s.px(ox + x + 1, oy + 2, musgo[1]); s.px(ox + x + 2, oy + 2, musgo[0]); }
    }
  }
  return s.tela();
}
// plataformas, espinhos e o portão do chefe
function atlasExtras(tm) {
  const mad = rampa(mistura('#7A5A3A', tm.borda, 0.25)), aco = rampa('#B9C2C8'), s = new Sprite(TL * 6, TL), ac = rampa(tm.acento);
  for (let v = 0; v < 2; v++) for (let x = 0; x < TL; x++) { s.px(v * TL + x, 0, mad[3]); s.px(v * TL + x, 1, mad[2]); s.px(v * TL + x, 2, x % 8 === (v ? 3 : 7) ? mad[0] : mad[1]); s.px(v * TL + x, 3, mad[0]); if (x === 2 || x === 13) { s.px(v * TL + x, 4, mad[1]); s.px(v * TL + x, 5, mad[0]); s.px(v * TL + x, 6, mad[0]); } }
  for (let k = 0; k < 4; k++) { const x0 = 2 * TL + k * 4; for (let y = 0; y < 9; y++) { const lg = y < 3 ? 1 : y < 6 ? 2 : 3; for (let i = 0; i < lg; i++) s.px(x0 + 1 - (lg >> 1) + i + (lg === 2 ? 0 : 0), TL - 9 + y, i === 0 ? aco[y < 2 ? 4 : 3] : i === lg - 1 ? aco[1] : aco[2]); } }
  for (let y = 0; y < TL; y++) for (let x = 0; x < TL; x++) { const b = x === 3 || x === 7 || x === 11; s.px(3 * TL + x, y, b ? (y % 5 === 2 ? ac[3] : aco[1]) : y === 7 || y === 8 ? aco[y === 7 ? 2 : 0] : 0); } // grade
  for (let x = 0; x < TL; x++) { s.px(4 * TL + x, 0, BR(ac[4])); s.px(4 * TL + x, 1, ac[3]); if (x % 2) s.px(4 * TL + x, 2, ac[2]); if (x % 4 === 1) s.px(4 * TL + x, 3, ac[1]); } // oculto revelado
  return s.tela();
}
const BR = c => c;

/* ---------------- fundo ---------------- */
function pintarCeu(tm, w, h, rng) {
  const s = new Sprite(w, h), faixas = [tm.ceu[0], mistura(tm.ceu[0], tm.ceu[1], 0.5), tm.ceu[1], mistura(tm.ceu[1], tm.ceu[2], 0.35), mistura(tm.ceu[1], tm.ceu[2], 0.7), tm.ceu[2]].map(cor), n = faixas.length;
  for (let y = 0; y < h; y++) { const f = Math.pow(y / h, 0.85) * (n - 1), i = Math.min(n - 2, Math.floor(f)), k = f - i; for (let x = 0; x < w; x++) s.px(x, y, pontilha(x, y, clamp((k - 0.25) * 2, 0, 1)) ? faixas[i + 1] : faixas[i]); }
  // astro com halo pontilhado
  const ax = w * 0.7, ay = h * 0.24, luz = rampa(mistura(tm.acento, '#ffffff', 0.55));
  for (let y = -30; y <= 30; y++) for (let x = -30; x <= 30; x++) { const d = Math.hypot(x, y); if (d < 11) s.px(ax + x, ay + y, d < 9 && x + y < 4 ? luz[4] : luz[3]); else if (d < 22 && pontilha(ax + x | 0, ay + y | 0, (1 - d / 22) * 0.4)) s.px(ax + x, ay + y, cor(mistura(tm.ceu[1], tm.acento, 0.35))); }
  for (let i = 0; i < 70; i++) { const x = rng() * w, y = rng() * h * 0.55; s.px(x, y, rng() < 0.2 ? luz[4] : luz[2]); }
  // nuvens em faixas
  const nuv = cor(mistura(tm.ceu[1], tm.ceu[2], 0.55)), nuv2 = cor(mistura(tm.ceu[1], '#ffffff', 0.12));
  for (let k = 0; k < 7; k++) { const cx = rng() * w, cy = h * (0.18 + rng() * 0.45), lg = 30 + rng() * 60; for (let j = 0; j < 4; j++) { const l2 = lg * (1 - j * 0.22), yy = cy - j * 2; for (let x = -l2; x < l2; x++) { const xx = ((cx + x) % w + w) % w; if (Math.abs(x) < l2 - 3 * Math.abs(Math.sin(x * 0.4 + k))) s.px(xx, yy, j === 3 ? nuv2 : nuv); } } }
  return s.tela();
}

// peças de arquitetura para as silhuetas (c: [sombra, base, luz])
const PECAS = {
  coluna(s, x, base, h, c, r) { const w = 6 + (r * 4 | 0); s.ret(x, base - h, w, h, c[1]); for (let y = base - h; y < base; y++) { s.px(x, y, c[0]); s.px(x + w - 1, y, c[2]); if (w > 7) s.px(x + (w >> 1), y, c[0]); } s.ret(x - 2, base - h - 3, w + 4, 3, c[1]); s.ret(x - 2, base - h - 3, w + 4, 1, c[2]); if (r > 0.6) { for (let i = 0; i < w; i++) if ((i * 7) % 3) s.px(x + i, base - h - 4 - (i % 3), c[1]); } },
  templo(s, x, base, h, c, r) { const w = 54 + (r * 30 | 0), n = 4 + (r * 3 | 0); for (let i = 0; i < n; i++) PECAS.coluna(s, x + 3 + i * (w - 10) / (n - 1), base, h, c, 0.2); s.ret(x - 2, base - h - 9, w + 4, 6, c[1]); s.ret(x - 2, base - h - 9, w + 4, 1, c[2]); for (let j = 0; j < 12; j++) s.ret(x - 2 + j * (w / 24), base - h - 10 - j, w + 4 - j * (w / 12), 1, j % 4 ? c[1] : c[0]); if (r > 0.5) s.ret(x + w * 0.6, base - h - 18, w * 0.5, 9, 0); },
  arco(s, x, base, h, c, r) { const w = 30 + (r * 16 | 0), g = 6; s.ret(x, base - h, g, h, c[1]); s.ret(x + w - g, base - h, g, h, c[1]); for (let a = 0; a <= 40; a++) { const an = Math.PI * a / 40, px = x + w / 2 - Math.cos(an) * (w / 2 - g / 2), py = base - h - Math.sin(an) * (w / 2 - 2); s.ret(px - g / 2, py - 2, g, 5, a % 9 === 0 ? c[0] : c[1]); } for (let y = base - h; y < base; y++) { s.px(x, y, c[0]); s.px(x + w - 1, y, c[2]); } if (r > 0.7) s.ret(x + w - g, base - h - 6, g, 8, 0); },
  torre(s, x, base, h, c, r) { const w = 22 + (r * 14 | 0); s.ret(x, base - h, w, h, c[1]); for (let y = base - h; y < base; y++) { s.px(x, y, c[0]); s.px(x + 1, y, c[0]); s.px(x + w - 1, y, c[2]); if (y % 6 === 0) for (let i = 2; i < w - 1; i += 2) s.px(x + i, y, c[0]); } for (let i = 0; i < w; i += 6) s.ret(x + i, base - h - 4, 4, 4, c[1]); for (let k = 0; k < 2 + (r * 3 | 0); k++) { const wx = x + 5 + ((k * 9) % (w - 10)), wy = base - h + 10 + k * 14; s.ret(wx, wy, 3, 5, c[3] || c[2]); s.px(wx + 1, wy - 1, c[3] || c[2]); } },
  // navio antigo de Társis: casco curvo de proa alta, mastro único, verga e vela quadrada com cordame até a amurada
  mastro(s, x, base, h, c, r) {
    h *= 1.25; const cw = 46 + (r * 18 | 0), mx = x + cw / 2, topo = base - h;
    for (let i = 0; i < cw; i++) { const k = i / (cw - 1), sobe = Math.pow(Math.abs(k - 0.5) * 2, 2.4) * 12, alto = 7 + sobe; s.ret(x + i, base - alto, 1, alto, i % 7 === 0 ? c[0] : c[1]); s.px(x + i, base - alto, c[2]); }
    s.ret(x - 2, base - 22, 3, 6, c[1]); s.ret(x + cw - 1, base - 20, 3, 5, c[1]); // proa e popa erguidas
    s.ret(mx - 1, topo, 3, h - 7, c[1]); for (let y = topo; y < base - 7; y++) s.px(mx - 1, y, c[0]);
    // vela: mais larga em cima, barriga de vento e barra em arco; pano claro, com costuras
    const vw = cw * 0.66, vh = h * 0.4, vy = topo + 6; s.ret(mx - vw / 2 - 3, vy - 2, vw + 6, 2, c[0]);
    for (let j = 0; j < vh; j++) { const k = j / vh, lg = vw * (1 - k * 0.22) / 2, fim = k > 0.8 ? Math.sin((1 - k) / 0.2 * 1.57) : 1; for (let i = -lg; i <= lg; i++) { if (Math.abs(i) > lg * (0.55 + 0.45 * fim)) continue; s.px(mx + i + Math.sin(k * 3.1) * 2, vy + j, Math.round(i + lg) % 6 === 0 ? c[1] : i > lg * 0.4 ? (c[3] || c[2]) : c[2]); } }
    for (const sd of [-1, 1]) for (let k = 0; k <= 24; k++) s.px(mx + sd * (cw / 2 - 2) * k / 24, topo + 2 + (h - 12) * k / 24, c[0]);
    s.ret(mx - 1, topo - 5, 6, 3, c[3] || c[2]);
  },
  // casa do Oriente antigo: cubo de adobe de teto plano, parapeito, escada externa e uma porta baixa
  casa(s, x, base, h, c, r) {
    const w = 30 + (r * 20 | 0), hh = Math.max(16, h * 0.5); s.ret(x, base - hh, w, hh, c[1]);
    for (let y = base - hh; y < base; y++) { s.px(x, y, c[0]); s.px(x + w - 1, y, c[2]); } s.ret(x - 1, base - hh - 2, w + 2, 2, c[1]); s.ret(x - 1, base - hh - 2, w + 2, 1, c[2]);
    for (let i = 2; i < w - 2; i += 5) s.ret(x + i, base - hh - 4, 2, 2, c[1]); // vigas do teto
    s.ret(x + w * 0.2, base - 9, 5, 9, c[0]); s.ret(x + w * 0.65, base - hh * 0.62, 3, 4, c[3] || c[0]);
    if (r > 0.45) { const w2 = w * 0.5, h2 = hh * 0.5; s.ret(x + w * 0.4, base - hh - h2, w2, h2, c[1]); s.ret(x + w * 0.4 - 1, base - hh - h2 - 2, w2 + 2, 2, c[2]); s.ret(x + w * 0.55, base - hh - h2 * 0.6, 3, 4, c[0]); }
    for (let k = 0; k < 6; k++) s.ret(x + w + k * 2, base - 3 - k * 2, 2, 3 + k * 2, c[0]); // escada externa
  },
  arvore(s, x, base, h, c, r) { s.ret(x + 8, base - h * 0.7, 4, h * 0.7, c[0]); for (let k = 0; k < 6; k++) { const cx = x + 10 + Math.sin(k * 2.4 + r * 6) * 14, cy = base - h * 0.75 - k * 5 * r - 4, rr = 10 + ((k * 5) % 7); for (let yy = -rr; yy <= rr; yy++) for (let xx = -rr; xx <= rr; xx++) { const d = xx * xx + yy * yy; if (d < rr * rr && (d < (rr - 2) * (rr - 2) || (xx + yy) % 2)) s.px(cx + xx, cy + yy * 0.75, xx + yy < -rr * 0.5 ? c[2] : c[1]); } } },
  duna(s, x, base, h, c, r) { const w = 90 + r * 70; for (let i = 0; i < w; i++) { const hh = Math.sin(i / w * Math.PI) * h * 0.35; s.ret(x + i, base - hh, 1, hh + 1, i < w * 0.45 ? c[1] : c[0]); s.px(x + i, base - hh, c[2]); } if (r > 0.6) { s.ret(x + w * 0.3, base - h * 0.75, 2, h * 0.5, c[0]); for (let k = -6; k <= 6; k++) s.px(x + w * 0.3 + k, base - h * 0.75 - 2 + Math.abs(k) * 0.6, c[1]); } },
  costela(s, x, base, h, c, r) { for (let i = 0; i < 60; i++) { const k = i / 60, px = x + k * 46, py = base - Math.sin(k * 1.5) * h * 1.6; s.ret(px, py, 4 - k * 2, 5, k < 0.5 ? c[1] : c[0]); s.px(px, py, c[2]); } },
  tenda(s, x, base, h, c, r) { const w = 50 + r * 30, hh = h * 0.6; for (let j = 0; j < hh; j++) { const lg = w * (j / hh) / 2; s.ret(x + w / 2 - lg, base - hh + j, lg * 2, 1, (j + (lg | 0)) % 6 < 1 ? c[0] : c[1]); s.px(x + w / 2 + lg - 1, base - hh + j, c[2]); } s.ret(x + w / 2, base - hh - 5, 1, 6, c[0]); s.ret(x + w / 2 + 1, base - hh - 5, 4, 2, c[3] || c[2]); }
};
const SKYLINE = { colunas: ['coluna', 'templo', 'coluna', 'arco', 'templo'], arcos: ['arco', 'torre', 'arco', 'templo'], tendas: ['tenda', 'casa', 'tenda', 'coluna'], mastros: ['mastro', 'casa', 'mastro'], costelas: ['costela', 'costela'], muralha: ['torre', 'torre', 'arco', 'templo'], arvores: ['arvore', 'arvore', 'coluna'], dunas: ['duna', 'duna', 'coluna'], casas: ['casa', 'torre', 'casa', 'arvore'] };

function pintarCamada(tm, w, h, rng, nivel) {
  // nivel 0 = longe (quase da cor do céu), 1 = meio, 2 = perto
  const s = new Sprite(w, h), ceu = mistura(tm.ceu[1], tm.ceu[2], 0.5), base = [mistura(ceu, tm.longe, 0.55), mistura(tm.longe, tm.meio, 0.5), mistura(tm.meio, tm.bloco, 0.55)][nivel];
  const c = [cor(mistura(base, '#05060c', 0.3)), cor(base), cor(mistura(base, tm.borda, nivel ? 0.2 : 0.1)), cor(mistura(base, tm.acento, nivel === 1 ? 0.7 : 0.3))];
  const chao = h * [0.66, 0.78, 0.93][nivel], lista = SKYLINE[tm.deco] || SKYLINE.casas, esc = [0.6, 0.95, 1.25][nivel];
  let x = -10;
  while (x < w) { const r = rng(), nome = lista[Math.floor(rng() * lista.length)], alt = (26 + rng() * 60) * esc; PECAS[nome](s, x, chao, alt, c, r); x += (nome === 'templo' ? 70 : nome === 'duna' ? 80 : nome === 'mastro' ? 74 : 26) * esc + rng() * 40 * esc; }
  // terreno da camada, com perfil irregular e um fio de luz no topo
  for (let xx = 0; xx < w; xx++) { const hh = chao - 2 - Math.round(Math.sin(xx * 0.05 + nivel) * 2 + Math.sin(xx * 0.013) * 3); s.ret(xx, hh, 1, h - hh, c[1]); s.px(xx, hh, c[2]); if (nivel === 2 && (xx * 7) % 5 === 0) s.px(xx, hh - 1 - ((xx * 3) % 3), c[1]); }
  // névoa pontilhada na base (perspectiva atmosférica)
  if (nivel < 2) { const nv = cor(mistura(base, ceu, 0.6)); for (let y = Math.round(chao - 26); y < h; y++) for (let xx = 0; xx < w; xx++) if (pontilha(xx, y, clamp((y - chao + 26) / 60, 0, 0.5))) s.px(xx, y, nv); }
  return s.tela();
}

// pilar e estandarte do fundo das salas
function pintarPilar(tm) {
  const alt = (CH - 2) * TL, s = new Sprite(40, alt), c = [cor(mistura(tm.bloco, '#000', 0.1)), cor(mistura(tm.bloco, tm.meio, 0.6)), cor(mistura(tm.meio, tm.borda, 0.16))], d = tm.deco;
  if (d === 'arvores') { for (let y = 0; y < alt; y++) { const lg = 5 + Math.round(Math.sin(y * 0.05) * 1.5), x0 = 20 - lg + Math.round(Math.sin(y * 0.03) * 2); s.ret(x0, y, lg * 2, 1, c[1]); s.px(x0, y, c[0]); s.px(x0 + lg * 2 - 1, y, c[2]); if (y % 9 === 0) s.px(x0 + 3 + (y % 5), y, c[0]); } }
  else if (d === 'costelas') { for (let y = 0; y < alt; y++) { const x0 = 6 + Math.round(Math.pow(1 - y / alt, 2) * 26); s.ret(x0, y, 6, 1, c[1]); s.px(x0, y, c[2]); s.px(x0 + 5, y, c[0]); } }
  else if (d === 'nenhum') { // (sem uso: todos os temas usam colunas de pedra) tronco grosso de madeira, amarrado com cordas e com um pano rasgado
    for (let y = 0; y < alt; y++) { const lg = 4 + (y > alt * 0.7 ? 1 : 0), x0 = 20 - lg; s.ret(x0, y, lg * 2, 1, c[1]); s.px(x0, y, c[0]); s.px(x0 + 1, y, c[0]); s.px(x0 + lg * 2 - 1, y, c[2]); if ((y * 7) % 13 === 0) s.px(x0 + 3 + (y % 3), y, c[0]); }
    for (const y of [alt * 0.22, alt * 0.5, alt * 0.78]) { s.ret(14, y, 12, 3, c[0]); s.ret(14, y + 1, 12, 1, c[2]); }
    for (let j = 0; j < 30; j++) { const lg = 9 - j * 0.28; for (let i = 0; i < lg; i++) if ((i + j) % 7) s.px(25 + i, alt * 0.22 + 4 + j, j > 22 && i % 2 ? c[0] : c[1]); } }
  else { const w = d === 'muralha' ? 18 : 14, x0 = 20 - w / 2; s.ret(x0, 0, w, alt, c[1]); for (let y = 0; y < alt; y++) { s.px(x0, y, c[0]); s.px(x0 + w - 1, y, c[2]); for (let i = 3; i < w - 2; i += 3) s.px(x0 + i, y, c[0]); if (d === 'muralha' && y % 8 === 0) s.ret(x0, y, w, 1, c[0]); } s.ret(x0 - 3, 0, w + 6, 5, c[1]); s.ret(x0 - 3, 4, w + 6, 1, c[0]); s.ret(x0 - 3, alt - 6, w + 6, 6, c[1]); s.ret(x0 - 3, alt - 6, w + 6, 1, c[2]); }
  return s.tela();
}
function pintarEstandarte(tm) {
  const s = new Sprite(14, 44), r = rampa(mistura(tm.acento, tm.meio, 0.45));
  for (let y = 0; y < 44; y++) for (let x = 0; x < 14; x++) { if (y > 36 && Math.abs(x - 6.5) < (y - 36) * 0.9) continue; s.px(x, y, x === 0 ? r[1] : x === 13 ? r[3] : y < 2 ? r[4] : (y === 12 || y === 13) ? r[3] : r[2]); }
  for (let k = 0; k < 9; k++) s.px(7 + Math.round(Math.cos(k * 0.7) * 3), 24 + Math.round(Math.sin(k * 0.7) * 3), r[4]); s.px(7, 24, r[4]);
  return s.tela();
}
function pintarLampiao(tm) { const s = new Sprite(9, 12), o = rampa('#C9A45C'), f = rampa(tm.acento); s.ret(3, 0, 3, 1, o[1]); s.ret(2, 1, 5, 1, o[2]); for (let y = 2; y < 9; y++) { s.px(1, y, o[1]); s.px(7, y, o[3]); for (let x = 2; x < 7; x++) s.px(x, y, y > 3 && y < 8 && x > 2 && x < 6 ? f[4] : f[3]); } s.ret(1, 9, 7, 1, o[2]); s.ret(3, 10, 3, 1, o[1]); return s.contorno(TINTA).tela(); }

const cache = new Map();
export function cenaPixel(tm, chave) {
  let c = cache.get(chave);
  if (!c) {
    const rng = semente('cena' + chave), W = 640, H = CH * TL;
    c = { blocos: atlasBlocos(tm), extras: atlasExtras(tm), ceu: pintarCeu(tm, W, H, rng), longe: pintarCamada(tm, W, H, rng, 0), meio: pintarCamada(tm, W, H, rng, 1), perto: pintarCamada(tm, W, H, rng, 2), pilar: pintarPilar(tm), estandarte: pintarEstandarte(tm), lampiao: pintarLampiao(tm), W, H, veu: cor(tm.bloco) };
    if (cache.size > 6) cache.delete(cache.keys().next().value);
    cache.set(chave, c);
  }
  return c;
}

const faixa = (g, img, off, y, vw) => { const w = img.width; let x = -(((Math.round(off) % w) + w) % w); for (; x < vw; x += w) g.drawImage(img, x, y); };

const SUBSOLO = '#0d1019';
// nuvens em pixel, que derivam devagar (só nas áreas a céu aberto)
let nuvemCv = null;
function nuvens(tm) { if (nuvemCv) return nuvemCv; const s = new Sprite(520, 70), c = [cor(mistura(tm.ceu[1], '#FFFFFF', 0.16)), cor(mistura(tm.ceu[1], '#FFFFFF', 0.3)), cor(mistura(tm.ceu[2], '#FFFFFF', 0.4))]; const rng = semente('nuvens');
  for (let n = 0; n < 7; n++) { const x = 20 + rng() * 460, y = 14 + rng() * 40, w = 30 + rng() * 50; for (let k = 0; k < 6; k++) { const bx = x + (k - 2.5) * w / 6, r = 4 + rng() * 5; for (let yy = -r; yy <= 0; yy++) for (let xx = -r * 1.6; xx <= r * 1.6; xx++) if (xx * xx / 2.56 + yy * yy < r * r) s.px(bx + xx, y + yy, yy < -r * 0.5 ? c[1] : c[0]); } s.ret(x - w / 2, y, w, 2, c[0]); s.ret(x - w / 2 + 4, y + 2, w - 8, 1, c[2]); }
  return nuvemCv = s.tela(); }

export function pintarFundoPixel(g, G, C, vw, vh, cx, cy) {
  const dy = Math.round((vh - C.H) / 2);
  faixa(g, C.ceu, cx * 0.02, dy, vw);
  if (G.N.def.aberto) { g.globalAlpha = 0.8; faixa(g, nuvens(G.tm), cx * 0.05 + G.T * 3, dy + 8 + Math.round(-cy * 0.02), vw); g.globalAlpha = 1; }
  faixa(g, C.longe, cx * 0.1, dy + Math.round(-cy * 0.02), vw);
  faixa(g, C.meio, cx * 0.24, dy + Math.round(-cy * 0.05) + 4, vw);
  faixa(g, C.perto, cx * 0.45, dy + Math.round(-cy * 0.1) + 10, vw);
}

// fundo das salas (véu pontilhado + pilares + estandartes) e os blocos
export function pintarSalasPixel(g, G, C, vw, vh, cx, cy) {
  const N = G.N, salaW = CW * TL, salaH = CH * TL, tm = G.tm;
  for (const cel of N.celulas) {
    const x0 = cel.cx * salaW - cx, y0 = cel.cy * salaH - cy;
    if (x0 > vw || x0 + salaW < 0 || y0 > vh || y0 + salaH < 0) continue;
    if (cel.ceu) continue; // praça a céu aberto: nada de véu, pilar ou estandarte
    if (N.def.aberto) { g.fillStyle = SUBSOLO; g.fillRect(x0, y0, salaW, salaH); } // o subsolo não deixa ver o céu
    const fs = cel.deco && fundoSala(cel.deco); if (fs) { g.drawImage(fs, x0, y0); continue; } // salões com cenário próprio
    g.fillStyle = tm.bloco; g.globalAlpha = 0.26; g.fillRect(x0 + TL, y0 + TL, salaW - 2 * TL, salaH - 2 * TL); g.globalAlpha = 1;
    for (let k = 0; k < 3; k++) {
      if (k === 1 && cel.mask & 12) continue;
      const r = hash(cel.cx * 7 + k, cel.cy * 13 + 3), px = x0 + Math.round((5 + k * 10 + r * 3) * TL) - 20;
      g.drawImage(C.pilar, px, y0 + TL);
      if (hash(cel.cx * 5 + k, cel.cy * 3 + 9) > 0.4 && tm.deco !== 'costelas' && tm.deco !== 'arvores') g.drawImage(C.estandarte, px + 44 + Math.round(r * 20), y0 + TL + (Math.floor(G.T * 2 + k) % 4 === 0 ? 1 : 0));
    }
  }
  for (const l of N.luzes) { const x = Math.round(l.x / PX - cx), y = Math.round(l.y / PX - cy); if (x < -10 || x > vw + 10) continue; if (l.poste) { const pe = Math.round(l.poste / PX - cy); g.fillStyle = '#17121f'; g.fillRect(x - 1, y + 5, 3, pe - y - 5); g.fillRect(x - 3, pe - 3, 7, 3); g.fillStyle = '#4A4658'; g.fillRect(x, y + 5, 1, pe - y - 8); g.drawImage(C.lampiao, x - 4, y - 6); continue; } const topo = Math.floor(l.y / T / CH) * salaH + TL - cy; g.fillStyle = tm.bloco; g.fillRect(x, topo, 1, y - 6 - topo); g.drawImage(C.lampiao, x - 4, y - 6); }
}

export function pintarBlocosPixel(g, G, C, vw, vh, cx, cy) {
  const N = G.N, x0 = Math.max(0, Math.floor(cx / TL)), x1 = Math.min(N.w - 1, Math.floor((cx + vw) / TL)), y0 = Math.max(0, Math.floor(cy / TL)), y1 = Math.min(N.h - 1, Math.floor((cy + vh) / TL));
  const cheio = (tx, ty) => { const t = tileEm(N, tx, ty); return t === SOLIDO || (t === FALSA && !N.desfeita.has(ty * N.w + tx)); };
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const t = tileEm(N, tx, ty), x = tx * TL - cx, y = ty * TL - cy, i = ty * N.w + tx;
    if (cheio(tx, ty)) {
      const m = (cheio(tx, ty - 1) ? 0 : 1) | (cheio(tx + 1, ty) ? 0 : 2) | (cheio(tx, ty + 1) ? 0 : 4) | (cheio(tx - 1, ty) ? 0 : 8);
      g.drawImage(C.blocos, m * TL, ((tx * 3 + ty * 5) & 3) * TL, TL, TL, x, y, TL, TL);
      if (t === FALSA && G.p.lamp && (tx + ty + Math.floor(G.T * 8)) % 3 === 0) { g.fillStyle = G.tm.acento; g.globalAlpha = 0.35; g.fillRect(x + ((tx * 5) % 12), y + ((ty * 7) % 12), 2, 2); g.globalAlpha = 1; }
    } else if (t === PONTE) g.drawImage(C.extras, ((tx & 1)) * TL, 0, TL, 8, x, y, TL, 8);
    else if (t === ESPINHO) g.drawImage(C.extras, 2 * TL, 0, TL, TL, x, y, TL, TL);
    else if ((t === PORTAO && !N.portaAberta) || t === TRANCA) g.drawImage(C.extras, 3 * TL, 0, TL, TL, x, y, TL, TL);
    else if (t === OCULTO) {
      if ((N.revel[i] || 0) > 0) { g.globalAlpha = Math.min(1, N.revel[i]) > 0.5 || Math.floor(G.T * 12) % 2 ? 1 : 0.4; g.drawImage(C.extras, 4 * TL, 0, TL, 5, x, y, TL, 5); g.globalAlpha = 1; }
      else if (hash(tx, ty, Math.floor(G.T * 1.5)) > 0.9) { g.fillStyle = G.tm.acento; g.fillRect(x + Math.floor(hash(tx, ty, 7) * 14), y + 1, 1, 1); }
    }
  }
}

// escuridão em degraus: um véu com furos de luz em três anéis (sem degradê liso)
export function pintarLuzPixel(g, G, vw, vh, cx, cy, luzCv) {
  const e = clamp(G.escuro, 0, 0.92); if (e <= 0.03) return;
  if (luzCv.width !== vw || luzCv.height !== vh) { luzCv.width = vw; luzCv.height = vh; }
  const l = luzCv.getContext('2d');
  l.globalCompositeOperation = 'source-over'; l.clearRect(0, 0, vw, vh); l.fillStyle = `rgba(6,7,16,${e})`; l.fillRect(0, 0, vw, vh);
  l.globalCompositeOperation = 'destination-out';
  const furo = (wx, wy, r, f = 1) => { const x = Math.round(wx / PX - cx), y = Math.round(wy / PX - cy), rr = r / PX; if (x < -rr || y < -rr || x > vw + rr || y > vh + rr) return; for (const [k, a] of [[1, 0.3], [0.78, 0.45], [0.52, 1]]) { l.fillStyle = `rgba(0,0,0,${a * f})`; l.beginPath(); l.arc(x, y, Math.round(rr * k), 0, 6.2832); l.fill(); } };
  furo(G.p.x, G.p.y - 26, G.raioLuz() + (Math.floor(G.T * 8) % 2 ? 2 : 0), 1);
  for (const o of G.N.luzes) furo(o.x, o.y, o.r, 0.8);
  for (const o of G.objs) if (o.luz) furo(o.x, o.y - 20, o.luz, 0.9);
  for (const t of G.tiros) furo(t.x, t.y, t.r * 5, 0.6);
  for (const b of G.inimigos) if (b.kind === 'chefe') furo(b.x, b.y - b.h / 2, b.r * 3.4, 0.6);
  for (const o of G.outros?.values?.() || []) furo(o.x, o.y - 26, 150, 0.9);
  g.drawImage(luzCv, 0, 0);
}
export { TL, mistura, pontilha };
