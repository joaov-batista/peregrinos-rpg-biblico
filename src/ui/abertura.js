// As telas de abertura, pintadas pixel a pixel com o núcleo da PixelFX (src/vendor/pixelfx): o buffer de cor,
// o de luz (somada por cima, para sol, lua e vaga-lumes) e rampas de cor com a sombra puxando para o frio.
// Três quadros, um sorteado a cada abertura (sem repetir o último):
//   getsemani  — a noite no jardim das oliveiras, a pedra onde Ele orou e, ao longe, Jerusalém dormindo
//   jerusalem  — o sol baixo atrás das muralhas e do Templo, e a caravana de peregrinos chegando para a festa
// Cada quadro tem uma parte parada (pintada uma vez e guardada) e uma parte viva, pintada a cada quadro por cima.
// Tudo é desenhado em 180 px de altura e ampliado sem suavizar.
import { createFrame, Painter, composite, hex, FONTS } from '../vendor/pixelfx/core/index.js';
import { quadroPessoa } from '../caminho/pixel/humano.js';

const H = 180;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const rampa = l => l.map(hex);

// ---- ruído: valor suave, fbm e células (Worley) ----
function h2(x, y, s) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 982451653)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function ruido(x, y, s) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), a = h2(xi, yi, s), b = h2(xi + 1, yi, s), c = h2(xi, yi + 1, s), d = h2(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbm(x, y, s, o = 3) { let t = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < o; i++) { t += a * ruido(x * f, y * f, s + i * 17); n += a; a *= 0.5; f *= 2; } return t / n; }
const CEL = [0, 0, 0, 0, 0];
function celulas(x, y, s) { const xi = Math.floor(x), yi = Math.floor(y); let d1 = 9, d2 = 9, bx = 0, by = 0, id = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = xi + i + h2(xi + i, yi + j, s), cy = yi + j + h2(xi + i, yi + j, s + 1), ex = x - cx, ey = y - cy, d = ex * ex + ey * ey; if (d < d1) { d2 = d1; d1 = d; bx = ex; by = ey; id = h2(xi + i, yi + j, s + 2); } else if (d < d2) d2 = d; } CEL[0] = Math.sqrt(d1); CEL[1] = Math.sqrt(d2); CEL[2] = bx; CEL[3] = by; CEL[4] = id; return CEL; }
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---- a tela: um quadro da PixelFX com atalhos ----
const ESPUMA = hex('#7AD4E8');
class Tela {
  constructor(w, h) { this.w = w; this.h = h; this.f = createFrame(w, h); this.p = new Painter(this.f); this.C = this.f.color; this.L = this.f.light; }
  set(x, y, c) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h || !c) return; const i = y * this.w + x; this.C[i] = c; if (this.M) this.M[i] = 1; } // M: marca o que foi pintado (para o reflexo saber o que é coisa e o que é água)
  veu(x, y, c, a) { this.p.blendPx(x | 0, y | 0, c, a); if (this.P && c === ESPUMA && x >= 0 && y >= 0 && x < this.w && y < this.h) this.P[(y | 0) * this.w + (x | 0)] = 1; } // translúcido (névoa, sombra); a espuma marca onde uma coisa entra na água
  luz(x, y, c, k) { this.p.add(x | 0, y | 0, c, k); }
  brilho(x, y, r, c, k) { this.p.glow(x, y, r, c, k); }
}
// escolhe o tom de uma rampa, com pontilhado só na passagem entre dois tons (larg = largura da faixa pontilhada)
function tom(r, v, x, y, larg = 0.5) { const n = r.length, f = clamp(v, 0, 0.9999) * n; let i = Math.floor(f); const fr = f - i, th = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16; if (fr > 1 - larg / 2 + (th - 0.5) * larg) i++; return r[Math.min(n - 1, i)]; }

// ---- pincéis ----
// céu em degradê com faixas (como nos jogos de 16 bits): v(x, y) dá a posição na rampa
function ceu(T, r, v, larg = 0.6) { for (let y = 0; y < T.h; y++) for (let x = 0; x < T.w; x++) T.set(x, y, tom(r, v(x, y), x, y, larg)); }

// Copa de árvore, moita ou nuvem: os "blobs" se fundem numa superfície só (a altura de cada ponto é a do domo
// mais alto ali), a luz vem do relevo dessa superfície e de cachos de folhas menores (células) com fresta escura
// entre eles; a borda é recortada por folhas soltas, a sombra fecha embaixo e a borda do lado da luz acende.
function copa(T, blobs, r, o = {}) {
  const { lx = -0.55, ly = -0.7, lz = 0.6, s = 1, folha = 3.4, achata = 0.85, aspero = 0.28, buracos = 0, geral = 0.32, contorno = true, base = 0.1, forca = 0.62, larg = 0.45, borda = 0.12, sombra = null } = o;
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, cx = 0, cy = 0, pe = 0;
  for (const b of blobs) { const a = b.a ?? 1; x0 = Math.min(x0, b.x - b.r * 1.4); x1 = Math.max(x1, b.x + b.r * 1.4); y0 = Math.min(y0, b.y - b.r * a * 1.4); y1 = Math.max(y1, b.y + b.r * a * 1.4); cx += b.x * b.r; cy += b.y * b.r; pe += b.r; }
  cx /= pe; cy /= pe; x0 = Math.floor(x0); y0 = Math.floor(y0); const W = Math.ceil(x1) - x0 + 3, Hh = Math.ceil(y1) - y0 + 3, Rg = Math.max(x1 - x0, (y1 - y0) * 1.4) / 2;
  const A = new Float32Array(W * Hh), Lz = Math.hypot(lx, ly, lz), LX = lx / Lz, LY = ly / Lz, LZ = lz / Lz;
  for (let j = 0; j < Hh; j++) for (let i = 0; i < W; i++) { const x = x0 + i, y = y0 + j; let h = 0; const n = (fbm(x * 0.16, y * 0.2, s) - 0.5) * 2 * aspero; for (const b of blobs) { const dx = x - b.x, dy = (y - b.y) / ((b.a ?? 1) * achata), er = b.r * (1 + n), d2 = dx * dx + dy * dy; if (d2 < er * er) { const v = Math.sqrt(er * er - d2); if (v > h) h = v; } } A[j * W + i] = h; }
  const at = (i, j) => i < 0 || j < 0 || i >= W || j >= Hh ? 0 : A[j * W + i];
  for (let j = 1; j < Hh - 1; j++) for (let i = 1; i < W - 1; i++) {
    const h = A[j * W + i]; if (h <= 0) continue;
    const x = x0 + i, y = y0 + j;
    const gx = (at(i + 1, j) - at(i - 1, j)) / 2, gy = (at(i, j + 1) - at(i, j - 1)) / 2, nl = Math.hypot(gx, gy, 1.4), nx = -gx / nl, ny = -gy / nl, nz = 1.4 / nl;
    const dif = nx * LX + ny * LY + nz * LZ;
    const c = celulas(x / folha, y / (folha * 0.78), s + 5), fol = clamp((c[2] * LX + c[3] * LY) * 1.6, -1, 1), fresta = c[1] - c[0] < 0.16;
    if (buracos && fresta && h < 6 && fbm(x * 0.3, y * 0.3, s + 9) < buracos) continue; // o céu aparece entre as folhas
    const glob = ((x - cx) * LX + (y - cy) * LY) / Rg;
    let v = base + dif * forca + fol * 0.2 + glob * geral - (fresta ? 0.16 : 0) + (c[4] - 0.5) * 0.12;
    if (sombra) v -= sombra(x, y);
    // a borda: embaixo (longe da luz) fecha no tom mais escuro; do lado da luz, um fio aceso
    if (contorno) { const v0 = at(i - 1, j), v1 = at(i + 1, j), v2 = at(i, j - 1), v3 = at(i, j + 1); if (v0 <= 0 || v1 <= 0 || v2 <= 0 || v3 <= 0) { const ox = (v0 <= 0 ? -1 : 0) + (v1 <= 0 ? 1 : 0), oy = (v2 <= 0 ? -1 : 0) + (v3 <= 0 ? 1 : 0), d = ox * LX + oy * LY; v = d > 0.2 ? v + borda * 2.2 : d < -0.2 ? 0 : v - 0.1; } }
    T.set(x, y, tom(r, v, x, y, larg));
  }
  // folhas soltas recortando a borda
  if (o.soltas !== false) for (let j = 1; j < Hh - 1; j++) for (let i = 1; i < W - 1; i++) { if (A[j * W + i] > 0 || !(at(i - 1, j) > 0 || at(i + 1, j) > 0 || at(i, j - 1) > 0 || at(i, j + 1) > 0)) continue; const x = x0 + i, y = y0 + j; if (h2(x, y, s + 3) < 0.34) { const lado = ((x - cx) * LX + (y - cy) * LY) / Rg; T.set(x, y, r[lado > 0.25 ? r.length - 2 : lado < -0.2 ? 0 : 1]); } }
}

// Tronco ou galho: uma faixa que segue uma curva, afinando; a luz cai no lado virado para ela, a casca tem sulcos
// compridos e a borda escura. pts = [[x, y], ...] da base para a ponta.
function galho(T, pts, r0, r1, r, o = {}) {
  const { lx = -0.6, ly = -0.6, s = 3, sulcos = 0.5 } = o, seg = []; let L = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) || 0.01; seg.push(l); L += l; }
  let acc = 0;
  for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i], l = seg[i - 1], tx = (bx - ax) / l, ty = (by - ay) / l, pxx = -ty, pyy = tx, lado = pxx * lx + pyy * ly;
    for (let d = 0; d <= l; d += 0.35) { const sL = acc + d, t = sL / L, rr = r0 + (r1 - r0) * t, X = ax + tx * d, Y = ay + ty * d;
      for (let u = -rr; u <= rr; u += 0.45) { const k = u / rr, cs = fbm(sL * 0.06, (u + rr) * 0.55, s), sul = Math.abs(cs - 0.5) < 0.05 * sulcos + 0.01, PX = X + pxx * u, PY = Y + pyy * u;
        let v = 0.38 + k * lado * 0.55 + Math.sqrt(Math.max(0, 1 - k * k)) * 0.22 - (sul ? 0.28 : 0) + (h2(PX | 0, PY | 0, s) - 0.5) * 0.08; if (Math.abs(k) > 0.86) v = k * lado > 0 ? v + 0.05 : 0.02; T.set(PX, PY, tom(r, v, PX | 0, PY | 0, 0.35)); } }
    acc += l; }
}

// Pedra com facetas: o contorno é um domo achatado e irregular, enterrado embaixo; cada faceta tem a sua inclinação,
// as arestas viradas para a luz acendem, as outras escurecem, e no alto pode crescer musgo.
function pedra(T, cx, cy, rx, ry, r, o = {}) {
  const { lx = -0.6, ly = -0.75, s = 7, faceta = 5, musgo = null, corte = 0.5, rachas = true } = o;
  for (let y = Math.floor(cy - ry - 2); y <= cy + ry; y++) for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
    const dx = (x - cx) / rx, dy = (y - cy) / ry; if (dy > corte) continue;
    const e = Math.pow(Math.abs(dx), 2.2) + Math.pow(Math.abs(dy), 2.2), n = (fbm(x * 0.2, y * 0.2, s) - 0.5) * 0.5; if (e > 1 + n) continue;
    const c = celulas(x / faceta, y / (faceta * 0.8), s), fn = (c[4] - 0.5) * 1.2, nx = dx * 0.8 + fn * 0.6, ny = dy * 0.9 - 0.35 + (h2(Math.floor(x / faceta), 9, s) - 0.5) * 0.4;
    let v = 0.42 + (nx * lx + ny * ly) * 0.55 + (1 - e) * 0.12; const aresta = c[1] - c[0] < 0.1;
    if (aresta) v += (c[2] * lx + c[3] * ly) < 0 ? 0.16 : -0.14;
    if (rachas && Math.abs(fbm(x * 0.12, y * 0.4, s + 4) - 0.5) < 0.018) v -= 0.25;
    if (e > 0.82 + n) v = (dx * lx + dy * ly) > 0.1 ? v + 0.12 : 0.03;
    if (musgo && dy < -0.25 && fbm(x * 0.25, y * 0.25, s + 2) > 0.48 - (-dy - 0.25) * 0.5) { T.set(x, y, tom(musgo, 0.3 + (1 - e) * 0.4 - (c[2] * lx + c[3] * ly) * 0.4, x, y)); continue; }
    T.set(x, y, tom(r, v, x, y, 0.4));
  }
}

// Capim: lâminas finas, curtas no fundo e altas na frente, cada uma com a ponta mais clara; é pintado por faixas
// de profundidade, para passar na frente das raízes e das pedras (desenhar(T, y0, y1, cor)).
function capim(R, w, yT, yB, n, o = {}) {
  const { alt = [1, 7], curva = 0.6 } = o, L = [];
  for (let i = 0; i < n; i++) { const y = yT + Math.pow(R(), 0.8) * (yB - yT), t = (y - yT) / (yB - yT); L.push({ x: R() * w, y, t, h: alt[0] + (alt[1] - alt[0]) * t * (0.5 + R() * 0.7), b: (R() - 0.5) * curva * (1 + t), k: R() }); }
  L.sort((a, b) => a.y - b.y);
  return { L, desenhar(T, y0, y1, cor) { for (const l of L) { if (l.y < y0 || l.y >= y1) continue; const hh = Math.max(1, Math.round(l.h)); for (let j = 0; j < hh; j++) { const q = j / hh, X = l.x + l.b * q * q * hh * 0.5, Y = l.y - j; T.set(X, Y, cor(l, q, X | 0, Y | 0)); } } } };
}

// ---- sprites feitos à mão (cada caractere um pixel) ----
const PEREGRINO = [ // andando: dois quadros. # manto, o rosto e a mão, | cajado, b bolsa
  ['...##....', '..####..|', '..#oo#..|', '...##...|', '..####.o|', '.######.|', '.##b###.|', '.######.|', '..####..|', '..#..#..|', '.##...#.|', '.#....##|'],
  ['...##....', '..####..|', '..#oo#..|', '...##...|', '..####.o|', '.######.|', '.##b###.|', '.######.|', '..####..|', '..#.#...|', '..##.#..|', '..#..##.|']];
const MULHER = [ // com o cântaro na cabeça
  ['..bbb....', '..###....', '.#####...', '.##o#....', '..###....', '.#####...', '.######..', '.######..', '.######..', '.######..', '..####...', '..#..#...', '.##..##..'],
  ['..bbb....', '..###....', '.#####...', '.##o#....', '..###....', '.#####...', '.######..', '.######..', '.######..', '.######..', '..####...', '..#.#....', '..##.#...']];
const CRIANCA = [['.##..', '####.', '#o#..', '.##..', '####.', '####.', '.##..', '.#.#.', '#...#'], ['.##..', '####.', '#o#..', '.##..', '####.', '####.', '.##..', '.##..', '.#.#.']];
const JUMENTO = [ // com a carga no lombo
  ['..........##.', '.........###.', '..bbbb...##o.', '.bbbbbb.###..', '###########..', '##########...', '.########....', '.#..#..#.#...', '.#..#..#.#...', '##.##.##.##..'],
  ['..........##.', '.........###.', '..bbbb...##o.', '.bbbbbb.###..', '###########..', '##########...', '.########....', '..#.#...##...', '..#.#...#.#..', '.##.##.##.##.']];
const PASSARO = [['#...#', '.#.#.', '..#..'], ['.....', '##.##', '..#..'], ['.....', '.....', '##.##']];
function sprite(T, rows, x, y, pal, flip = false) { const W = rows[0].length; for (let j = 0; j < rows.length; j++) for (let i = 0; i < W; i++) { const ch = rows[j][i]; if (ch === '.' || !pal[ch]) continue; T.set(x + (flip ? W - 1 - i : i), y + j, pal[ch]); } }

// ======================================================================================================
// 1. GETSÊMANI — a noite azul no jardim das oliveiras
// ======================================================================================================
const NOITE = rampa(['#04061A', '#070B24', '#0A1130', '#0E183C', '#132048', '#1A2A56', '#223662', '#2C446E', '#38537A']);
const FOLHA_N = rampa(['#0A0E24', '#121A3A', '#1A2852', '#23386C', '#2F4C88', '#3E62A2', '#5480BC', '#729ED4', '#9ABEE8', '#CCE0FA']);
const CASCA_N = rampa(['#07060E', '#110E1C', '#1C1628', '#282036', '#362B44', '#463854', '#5A4A68']);
const PEDRA_N = rampa(['#080A18', '#111528', '#1B2038', '#272E4C', '#353E60', '#475276', '#5E6A8E', '#7C88A8', '#A2ACC6']);
const MUSGO_N = rampa(['#0C1630', '#152444', '#1E3458', '#2A466A', '#3A5A7E']);
const CHAO_N = rampa(['#0A0E28', '#101634', '#161E42', '#1E2850', '#26325E', '#30406E']);
const CAPIM_N = rampa(['#0E1434', '#172044', '#202E58', '#2C3E6E', '#3A5086', '#4C64A0', '#6480BC', '#86A0D8']);
const MONTE_N = rampa(['#0E1636', '#121C40', '#17234A', '#1D2B54', '#24345E']);

const getsemani = {
  parada(T, R, f) {
    const w = T.w, chao = 128;
    // céu: degradê, a via láctea atravessando e as estrelas
    ceu(T, NOITE, (x, y) => (y / chao) * 0.95 + fbm(x * 0.02, y * 0.03, 3) * 0.08);
    for (let y = 0; y < chao; y++) for (let x = 0; x < w; x++) { const d = (y - (x - w * 0.1) * 0.38 - 2) / 20, k = Math.exp(-d * d) * (0.35 + fbm(x * 0.06, y * 0.09, 8, 4) * 0.9); if (k > 0.35) T.veu(x, y, hex(k > 0.75 ? '#4A5C9A' : '#2A3A72'), clamp((k - 0.35) * 0.55, 0, 0.4)); if (k > 0.6 && h2(x, y, 31) < 0.06) T.set(x, y, hex('#AFC0F0')); }
    for (let i = 0; i < 340; i++) { const x = R() * w, y = R() * (chao - 12), q = R(); T.set(x, y, hex(q < 0.08 ? '#FFFFFF' : q < 0.4 ? '#9AAEE0' : '#56689E')); }
    // a lua minguante, alta à direita
    const mx = Math.min(w - 26, f + 92), my = 26;
    for (let y = -9; y <= 9; y++) for (let x = -9; x <= 9; x++) { const d = x * x + y * y, d2 = (x + 4) * (x + 4) + (y - 2) * (y - 2); if (d <= 81 && d2 > 52) T.set(mx + x, my + y, hex(d > 64 ? '#B8C6E6' : x > 3 ? '#E8EEFA' : '#D6E0F4')); }
    // ao longe: o monte de Sião com Jerusalém dormindo, umas poucas janelas acesas
    for (let x = 0; x < w; x++) { const y = Math.round(104 - 7 * Math.sin(x * 0.012 + 1) - 4 * fbm(x * 0.05, 0, 4)); for (let yy = y; yy < chao; yy++) T.set(x, yy, tom(MONTE_N, 0.35 + (yy - y) / 60, x, yy)); }
    const cid0 = Math.max(4, f - 210), cid1 = f - 40, chaoC = x => Math.round(103 - 7 * Math.sin(x * 0.012 + 1));
    for (let x = cid0, k = 0; x < cid1; k++) { const l = 5 + Math.floor(h2(k, 1, 5) * 9), a = 3 + Math.floor(h2(k, 2, 5) * 8), b = chaoC(x); for (let yy = b - a; yy < b; yy++) for (let xx = x; xx < x + l; xx++) T.set(xx, yy, hex(yy === b - a ? '#2C3A66' : '#1A2448')); if (h2(k, 3, 5) < 0.45) T.set(x + 2, b - a + 2, hex('#E0B060')); x += l; }
    const tpx = Math.round(cid0 + (cid1 - cid0) * 0.55), tpb = chaoC(tpx); for (let yy = tpb - 16; yy < tpb; yy++) for (let xx = tpx; xx < tpx + 18; xx++) T.set(xx, yy, hex(yy < tpb - 14 ? '#34447A' : '#1E2A50')); for (let i = 0; i < 4; i++) T.set(tpx + 3 + i * 4, tpb - 9, hex('#D8A858')); // o Templo
    for (let i = 0; i < 6; i++) for (let x = 0; x < w; x++) T.veu(x, 100 + i * 3, hex('#3A5288'), 0.08); // névoa no vale do Cedrom
    // o morro das Oliveiras: o chão e um olival ao fundo
    for (let x = 0; x < w; x++) { const y = Math.round(chao - 6 + 5 * Math.sin(x * 0.02 + 2) + 2 * fbm(x * 0.1, 3, 6)); for (let yy = y; yy < H; yy++) T.set(x, yy, tom(CHAO_N, 0.2 + (yy - y) / 70, x, yy, 0.6)); }
    for (let i = 0; i < 9; i++) { const x = 10 + i * w / 9 + R() * 14; if (Math.abs(x - f) < 60) continue; const y = chao - 4 + 5 * Math.sin(x * 0.02 + 2); galho(T, [[x, y + 2], [x + 1, y - 6]], 1.4, 1, CASCA_N, { s: i }); copa(T, [{ x, y: y - 10, r: 7 }, { x: x - 6, y: y - 7, r: 5 }, { x: x + 6, y: y - 8, r: 5 }], rampa(['#0E1636', '#152046', '#1D2C58', '#273A6A']), { s: 40 + i, folha: 2.4, forca: 0.5, base: 0.2, borda: 0.08, lx: 0.5, ly: -0.8 }); }
    // o capim (em faixas, para passar na frente das raízes e das pedras) e a sombra da oliveira no chão
    const cap = capim(R, w, chao - 2, H + 4, Math.round(w * 6.5), { alt: [1, 9] });
    const sombraArv = (x, y) => { const dx = (x - f + 14) / 62, dy = (y - 160) / 9; return Math.max(0, 1 - dx * dx - dy * dy); };
    const corCapim = (l, q, x, y) => tom(CAPIM_N, 0.08 + l.t * 0.5 + q * 0.3 + (l.k - 0.5) * 0.14 - sombraArv(x, y) * 0.34, x, y, 0.3);
    for (let y = 150; y < 172; y++) for (let x = f - 90; x < f + 60; x++) { const k = sombraArv(x, y); if (k > 0) T.veu(x, y, hex('#060A20'), k * 0.55); }
    cap.desenhar(T, 0, 146, corCapim);
    // a pedra grande onde Ele orou, à esquerda da oliveira, e as menores
    pedra(T, f - 100, 148, 28, 18, PEDRA_N, { s: 4, musgo: MUSGO_N, faceta: 7, lx: 0.5, ly: -0.8, corte: 0.6 });
    pedra(T, f - 66, 156, 9, 7, PEDRA_N, { s: 9, faceta: 4, lx: 0.5, ly: -0.8 });
    pedra(T, f + 84, 166, 12, 9, PEDRA_N, { s: 12, musgo: MUSGO_N, lx: 0.5, ly: -0.8 });
    for (const l of cap.L) if (l.y > 146 && l.y < 160 && Math.abs(l.x - (f - 100)) < 26) l.h *= 0.45; // na frente da pedra o capim é baixo: ela aparece inteira
    cap.desenhar(T, 146, 160, corCapim);
    // a oliveira velha: o tronco em três fios que se torcem, com o oco no meio, e as raízes agarradas ao chão
    const tx = f, tb = 162, LN = { lx: 0.6, ly: -0.6 };
    for (const [ox, sw] of [[-9, 0], [8, 2], [0, 4]]) galho(T, [[tx + ox, tb], [tx + ox * 0.8 + 3, tb - 18], [tx + ox * 0.4 - 4, tb - 34], [tx + ox * 0.9 + 2, tb - 50], [tx + ox * 1.6, tb - 60]], 7.5 - sw * 0.5, 3, CASCA_N, { ...LN, s: 20 + sw, sulcos: 0.9 });
    for (let y = -7; y <= 7; y++) for (let x = -4; x <= 4; x++) { const d = (x * x) / 16 + (y * y) / 49; if (d > 1) continue; T.set(tx + 1 + x, tb - 30 + y, hex(d > 0.62 ? (x > 0 ? '#5A4A68' : '#1C1628') : y > 3 ? '#0E0B16' : '#05040A')); } // o oco no tronco, com a borda gasta
    for (const [dx, a, l] of [[-12, 2.7, 22], [-6, 2.25, 16], [10, 0.4, 20], [4, 0.85, 14], [14, 0.15, 12]]) galho(T, [[tx + dx * 0.4, tb - 4], [tx + dx + Math.cos(a) * l * 0.5, tb - 1 + Math.sin(a) * 2], [tx + dx + Math.cos(a) * l, tb + 3]], 3.5, 0.8, CASCA_N, { ...LN, s: 30 + l });
    for (const [px, py, qx, qy, rx2, ry2, r0] of [[tx - 4, tb - 56, tx - 26, tb - 72, tx - 48, tb - 78, 4], [tx + 6, tb - 58, tx + 28, tb - 74, tx + 52, tb - 76, 4], [tx, tb - 60, tx + 2, tb - 80, tx - 6, tb - 92, 3.5], [tx - 2, tb - 58, tx - 14, tb - 82, tx - 30, tb - 94, 3]]) galho(T, [[px, py], [qx, qy], [rx2, ry2]], r0, 1.2, CASCA_N, { ...LN, s: px + py });
    const blobs = [], RR = rng(77);
    for (let i = 0; i < 26; i++) { const a = RR() * Math.PI * 2, d = Math.sqrt(RR()); blobs.push({ x: tx + Math.cos(a) * d * 62, y: tb - 92 + Math.sin(a) * d * 22, r: 9 + RR() * 9, a: 0.8 }); }
    blobs.push({ x: tx - 58, y: tb - 80, r: 11, a: 0.7 }, { x: tx + 62, y: tb - 79, r: 11, a: 0.7 }, { x: tx - 30, y: tb - 106, r: 12 }, { x: tx + 26, y: tb - 108, r: 13 });
    copa(T, blobs, FOLHA_N, { s: 5, folha: 3.2, buracos: 0.42, lx: 0.5, ly: -0.8, forca: 0.6, base: 0.06, geral: 0.38 }); // a luz vem da lua, no alto à direita
    // o capim da frente cobre as raízes; flores azuis (hissopo) aqui e ali
    cap.desenhar(T, 160, H + 5, corCapim);
    for (let i = 0; i < 46; i++) { const x = R() * w, y = 150 + R() * 28; if (sombraArv(x, y) > 0.5) continue; const c = R() < 0.5 ? hex('#5C78E8') : hex('#8AA4FF'); T.set(x, y - 3, c); T.set(x + 1, y - 3, c); T.set(x, y - 4, hex('#C8D6FF')); T.set(x, y - 2, hex('#1E3466')); }
    // moldura de capim alto e escuro, bem na frente, nos cantos
    for (let i = 0; i < 70; i++) { const lado = i % 2, x = lado ? w - R() * 46 : R() * 46, hh = 10 + R() * 22, b = (R() - 0.5) * 6; for (let j = 0; j < hh; j++) { const q = j / hh; T.set(x + b * q * q, H - j, hex(q > 0.85 ? '#1A2650' : '#070A1C')); } }
  },
  viva(T, t, f) {
    const w = T.w;
    for (let i = 0; i < 46; i++) { const x = (i * 7919) % w, y = (i * 3571) % 96, b = Math.sin(t * (0.7 + (i % 5) * 0.3) + i * 1.7); if (b > 0.55) { T.set(x, y, hex('#FFFFFF')); if (b > 0.85 && i % 3 === 0) { T.set(x - 1, y, hex('#7A90D0')); T.set(x + 1, y, hex('#7A90D0')); T.set(x, y - 1, hex('#7A90D0')); T.set(x, y + 1, hex('#7A90D0')); } } }
    T.brilho(Math.min(w - 26, f + 92), 26, 40, hex('#6A84C8'), 0.22);
    // estrela cadente de vez em quando
    const c = (t % 11) / 0.8; if (c < 1) for (let s = 0; s < 16; s++) { const k = c * 70 - s; if (k < 0) continue; const X = w * 0.42 + k * 1.7, Y = 10 + k * 0.55; T.set(X, Y, hex(s < 2 ? '#FFFFFF' : s < 6 ? '#A8BCF0' : '#4C5E9C')); T.luz(X, Y, hex('#8AA0E0'), 0.3); }
    // vaga-lumes no capim e em volta da oliveira
    for (let i = 0; i < 24; i++) { const X = f - 160 + ((i * 53) % 300) + Math.sin(t * 0.5 + i * 2.1) * 12, Y = 118 + ((i * 37) % 54) + Math.sin(t * 0.8 + i) * 7, b = Math.sin(t * 1.8 + i * 1.3); if (b > 0) { T.set(X, Y, hex('#F4F8D0')); T.brilho(X + 0.5, Y + 0.5, 7, hex('#9AB070'), b * 0.5); } }
    // uma folha prateada que se solta
    const k = (t * 0.09) % 1, X = f + 30 - k * 90 + Math.sin(t * 2) * 6, Y = 70 + k * 92; T.set(X, Y, hex('#B8CCF0')); T.set(X + (Math.floor(t * 4) % 2), Y + 1, hex('#5480BC'));
  }
};

// ======================================================================================================
// 2. JERUSALÉM — o sol baixo atrás das muralhas e do Templo
// ======================================================================================================
const POENTE = rampa(['#1A0C2A', '#2A1036', '#3E1440', '#561A46', '#702246', '#8E2C44', '#AE3A3E', '#CC4E38', '#E46A34', '#F28A38', '#F8AA44', '#FCC658', '#FFE08A']);
const NUVEM = rampa(['#2A0E30', '#3E1238', '#58183E', '#741E40', '#962A40', '#B83C3C', '#D8583A', '#EE7C3C', '#F8A246', '#FFC860', '#FFE69A']);
const SOL = rampa(['#F8A040', '#FCB84C', '#FFCC5E', '#FFDE7E', '#FFEEB0', '#FFFAE2']);
const CID_L = hex('#5A2040'), CID_M = hex('#3C1530'), CID_P = hex('#22091E'), CID_F = hex('#12040F');
const ARO = hex('#F8A246'), ARO2 = hex('#C8603A'), JANELA = hex('#FFC860');

const jerusalem = {
  parada(T, R, f) {
    const w = T.w, sx = f + 4, sy = 104;
    // céu: o degradê da noite que chega por cima até o fogo perto do sol
    ceu(T, POENTE, (x, y) => { const d = Math.hypot((x - sx) * 0.7, y - sy) / 190; return clamp(y / 150 * 0.62 + (1 - d) * 0.5 - 0.12, 0, 0.99); }, 0.7);
    // o sol, com as faixas de bruma cortando a parte de baixo
    for (let y = -30; y <= 30; y++) for (let x = -30; x <= 30; x++) { const d = Math.hypot(x, y) / 30; if (d > 1) continue; if (y > 6 && (y % 5 === 0 || (y > 18 && y % 5 === 2))) continue; T.set(sx + x, sy + y, tom(SOL, 1 - d * 0.9 - y / 90, sx + x, sy + y, 0.4)); }
    // nuvens grandes, de base reta, acesas por baixo
    const nuvem = (x0, y0, larg, alt, n, s) => { const RR = rng(s), bl = []; for (let i = 0; i < n; i++) { const u = RR(), x = x0 + (u - 0.5) * larg, y = y0 - Math.sin(u * Math.PI) * alt * (0.4 + RR() * 0.6); bl.push({ x, y, r: 5 + RR() * alt * 0.55, a: 0.62 }); } copa(T, bl, NUVEM, { s, lx: (sx - x0) / 300, ly: 0.95, lz: 0.35, folha: 4.6, achata: 1, aspero: 0.2, forca: 0.55, base: 0.14, geral: 0.2, borda: 0.16, soltas: false }); };
    nuvem(f - 30, 54, 170, 26, 34, 3); nuvem(f + 110, 36, 110, 18, 20, 8); nuvem(w * 0.16, 30, 120, 14, 18, 12); nuvem(f - 120, 84, 90, 8, 12, 21); nuvem(f + 90, 82, 80, 7, 10, 25);
    // montes de Moabe ao longe
    for (let x = 0; x < w; x++) { const y = Math.round(118 - 10 * fbm(x * 0.012, 1, 3) - 4 * Math.sin(x * 0.03)); for (let yy = y; yy < 140; yy++) T.set(x, yy, hex(yy === y ? '#9A3A48' : '#7A2A44')); }
    // a cidade em planos: casario do fundo, o Templo com a Antônia, o casario da frente e a muralha com as portas
    const casas = (base, cor, aro, a0, a1, s) => { const RR = rng(s); let x = -6; while (x < w + 6) { const l = 7 + Math.floor(RR() * 12), a = a0 + Math.floor(RR() * (a1 - a0)), topo = base - a; for (let yy = topo; yy < base; yy++) for (let xx = x; xx < x + l; xx++) T.set(xx, yy, cor); for (let xx = x; xx < x + l; xx++) T.set(xx, topo, aro); if (RR() < 0.5) for (let xx = x; xx < x + l; xx += 2) T.set(xx, topo - 1, cor); if (RR() < 0.55) { const jx = x + 2 + Math.floor(RR() * (l - 4)), jy = topo + 3 + Math.floor(RR() * Math.max(1, a - 7)); T.set(jx, jy, JANELA); T.set(jx, jy + 1, JANELA); T.luz(jx, jy, hex('#FF9A40'), 0.4); } if (RR() < 0.12) { const cx = x + l / 2; for (let k = 0; k < 18; k++) { const ww = Math.max(0, 3 - Math.abs(k - 9) / 3); for (let u = -ww; u <= ww; u++) T.set(cx + u, topo - 18 + k, cor); } } x += l - 1; } for (let yy = base; yy < H; yy++) for (let xx = 0; xx < w; xx++) T.set(xx, yy, cor); };
    casas(132, CID_L, hex('#8A3448'), 4, 14, 4);
    for (let i = 0; i < 4; i++) for (let x = 0; x < w; x++) T.veu(x, 124 + i * 3, hex('#D0603E'), 0.1);
    // o Templo no monte: o muro de arrimo de pedras grandes, o Pórtico Real com as colunas, e o santuário de
    // fachada larga (mais alta que o corpo), a porta grande, os espetos dourados no alto. O sol bate de lado, à direita.
    const tx = Math.max(70, f - 120), tb = 142, PED = hex('#4A1A36'), PEDc = hex('#62243E');
    for (let yy = tb - 16; yy < tb; yy++) for (let xx = tx - 56; xx < tx + 84; xx++) T.set(xx, yy, ((yy - tb) % 4 === 0 || (xx + ((yy - tb) / 4 | 0) * 5) % 10 === 0) ? CID_M : PED); // o muro de arrimo
    for (let xx = tx - 56; xx < tx + 84; xx++) T.set(xx, tb - 16, ARO2); for (let yy = tb - 16; yy < tb; yy++) T.set(tx + 83, yy, ARO2);
    for (let yy = tb - 27; yy < tb - 16; yy++) for (let xx = tx - 54; xx < tx + 82; xx++) T.set(xx, yy, (xx - tx) % 5 === 0 ? PEDc : hex('#2C0E24')); // o pórtico: colunas e a sombra entre elas
    for (let xx = tx - 55; xx < tx + 83; xx++) { T.set(xx, tb - 28, ARO2); T.set(xx, tb - 29, CID_M); T.set(xx, tb - 17, CID_M); }
    for (let yy = tb - 27; yy < tb - 17; yy++) if ((yy & 1) === 0) T.set(tx + 81, yy, ARO);
    // o santuário: o corpo e, na frente, a fachada larga
    for (let yy = tb - 52; yy < tb - 29; yy++) for (let xx = tx + 2; xx < tx + 34; xx++) T.set(xx, yy, CID_M);
    for (let yy = tb - 62; yy < tb - 29; yy++) for (let xx = tx + 8; xx < tx + 28; xx++) T.set(xx, yy, yy < tb - 60 ? ARO : PEDc);
    for (let yy = tb - 60; yy < tb - 29; yy++) { T.set(tx + 27, yy, ARO); T.set(tx + 26, yy, ARO2); T.set(tx + 8, yy, CID_M); }
    for (let yy = tb - 52; yy < tb - 29; yy++) T.set(tx + 33, yy, ARO2);
    for (let yy = tb - 55; yy < tb - 30; yy++) for (let xx = tx + 13; xx < tx + 23; xx++) { const arco = yy < tb - 52 && Math.abs(xx - tx - 17.5) > (yy - (tb - 55)) * 1.6 + 2; if (!arco) T.set(xx, yy, yy < tb - 50 ? hex('#8A3A40') : hex('#1A0616')); }
    for (let yy = tb - 50; yy < tb - 32; yy += 3) { T.set(tx + 14, yy, hex('#E0A040')); T.set(tx + 21, yy + 1, hex('#E0A040')); } // a videira de ouro sobre a porta
    for (let k = 0; k < 7; k++) { T.set(tx + 9 + k * 3, tb - 63, hex('#FFE08A')); T.set(tx + 9 + k * 3, tb - 64, hex('#FFF4C0')); }
    for (let k = 0; k < 6; k++) T.luz(tx + 27, tb - 58 + k * 5, hex('#FFB050'), 0.5); // o ouro da quina pegando o sol
    // a fortaleza Antônia, com as torres
    const ax = tx - 64; for (let yy = tb - 30; yy < tb; yy++) for (let xx = ax; xx < ax + 26; xx++) T.set(xx, yy, CID_M); for (const ox of [0, 20]) { for (let yy = tb - 44; yy < tb - 30; yy++) for (let xx = ax + ox; xx < ax + ox + 6; xx++) T.set(xx, yy, CID_M); for (let xx = ax + ox; xx < ax + ox + 6; xx += 2) T.set(xx, tb - 45, CID_M); for (let yy = tb - 44; yy < tb - 30; yy++) T.set(ax + ox + 5, yy, ARO2); }
    casas(150, CID_P, ARO2, 5, 18, 9);
    for (let x = 0; x < w; x++) { for (let y = 146; y < 158; y++) T.set(x, y, CID_P); if (x % 6 < 3) for (let y = 143; y < 146; y++) T.set(x, y, CID_P); T.set(x, 146, ARO2); }
    for (let k = 0; k < 6; k++) { const x = Math.round(20 + k * (w - 40) / 5); for (let y = 134; y < 158; y++) for (let xx = x; xx < x + 10; xx++) T.set(xx, y, CID_P); for (let xx = x; xx < x + 10; xx += 3) { T.set(xx, 133, CID_P); T.set(xx + 1, 133, CID_P); } for (let y = 134; y < 158; y++) T.set(x + 9, y, ARO2); T.set(x + 4, 140, JANELA); T.luz(x + 4, 140, hex('#FF9A40'), 0.5); }
    const px0 = Math.round(f + 40); for (let y = 148; y < 158; y++) for (let x = px0 - 6; x <= px0 + 6; x++) { const top = 148 + Math.round(6 - Math.sqrt(Math.max(0, 36 - (x - px0) * (x - px0)))); if (y >= top) T.set(x, y, hex('#0A0208')); }
    // o monte das Oliveiras no primeiro plano, com a estrada
    for (let x = 0; x < w; x++) { const y = Math.round(160 + 4 * Math.sin(x * 0.015 + 1)); for (let yy = y; yy < H; yy++) T.set(x, yy, CID_F); T.set(x, y, hex('#3A1228')); }
    for (let x = 0; x < w; x++) { const y = Math.round(164 + 3 * Math.sin(x * 0.015 + 1)); T.set(x, y, hex('#4E1A30')); T.set(x, y + 1, hex('#2A0A1E')); }
    const oli = (x, y, r, s) => { galho(T, [[x, y + 4], [x + 1, y - r * 0.4]], 1.6, 1, rampa(['#0A0208', '#1A0614', '#2A0C1E']), { s }); copa(T, [{ x, y: y - r * 0.8, r }, { x: x - r * 0.8, y: y - r * 0.4, r: r * 0.7 }, { x: x + r * 0.8, y: y - r * 0.5, r: r * 0.7 }], rampa(['#0A0208', '#14040E', '#200818', '#341024', '#5A1E30']), { s, lx: 0.6, ly: 0.2, forca: 0.4, base: 0.15, folha: 2.6, borda: 0.2 }); };
    oli(12, 160, 12, 3); oli(40, 162, 8, 5); oli(w - 18, 158, 14, 7); oli(w - 50, 163, 9, 9);
  },
  viva(T, t, f) {
    const w = T.w, sx = f + 4, sy = 104;
    T.brilho(sx, sy, 80, hex('#FF8A30'), 0.28); T.brilho(sx, sy, 40, hex('#FFD070'), 0.25);
    for (let i = 0; i < 13; i++) { const k = ((t * 0.022 + i * 0.011) % 1), X = w * 1.1 - k * w * 1.35 + Math.abs(i - 6) * 6, Y = 70 - (i % 4) * 3 + Math.abs(i - 6) * 2.2 + Math.sin(t * 1.3 + i) * 1.5; sprite(T, PASSARO[Math.floor(t * 7 + i) % 3], X | 0, Y | 0, { '#': hex('#2A0A22') }); }
    // a caravana pela estrada, rumo à porta
    const pal = { '#': hex('#0A0208'), o: hex('#4E1A30'), '|': hex('#3A1228'), b: hex('#1E0816') }, grupo = [PEREGRINO, JUMENTO, MULHER, CRIANCA, PEREGRINO, MULHER, PEREGRINO];
    grupo.forEach((sp, i) => { const X = ((t * 5 + i * 15) % (w + 120)) - 60, Y = Math.round(164 + 3 * Math.sin(X * 0.015 + 1)), q = Math.floor(t * 3 + i * 0.7) % 2; sprite(T, sp[q], Math.round(X), Y - sp[q].length + 1, pal); });
    for (let i = 0; i < 22; i++) { const k = (t * 0.035 + i / 22) % 1, X = (i * 9973) % w + Math.sin(t + i) * 5, Y = 156 - k * 80; if ((i + Math.floor(t * 2)) % 3) { T.set(X, Y, hex('#FFD878')); T.luz(X, Y, hex('#FF9040'), 0.3); } }
  }
};

// ======================================================================================================
// O CAIS DO REFÚGIO AO ANOITECER — a casa do pescador sobre as pedras, o cais de tábuas com as lanternas, o barco
// de Simão amarrado, as ruínas do mundo antigo na água e a torre do fogo ao longe; o peregrino, de lâmpada acesa,
// espera no cais. Vista de três quartos (de cima, de lado), como um diorama.
// ======================================================================================================
const CEU_C = rampa(['#121838', '#182046', '#1F2954', '#283262', '#323C70', '#3E467C', '#4C4E86', '#5E588C', '#74608E', '#8E6A8C', '#AC7686', '#C8847E', '#E09A76', '#F2B67A', '#FCD48C']);
const MAR_C = rampa(['#0A1430', '#0E1A3C', '#122248', '#172C56', '#1C3664', '#224272', '#2A4E80', '#345C8E', '#406C9C', '#5080AC', '#6696BC']);
const MONTE_C1 = rampa(['#3A3E6E', '#444878', '#505282', '#5E5C8A', '#6E6690', '#86708E']);
const MONTE_C2 = rampa(['#1E2450', '#252C5A', '#2D3464', '#363E6E', '#424878', '#585282']);
const PEDRA_C = rampa(['#0C1024', '#141A34', '#1E2644', '#2A3456', '#384468', '#4A567A', '#5E6A8C', '#7A84A2', '#98A0BA']);
const MUSGO_C = rampa(['#0E2028', '#143030', '#1C4236', '#26563C', '#346C44', '#46844C', '#5E9C56']);
const MADEIRA = rampa(['#120C14', '#1E141C', '#2C1E24', '#3C2A2C', '#4E3832', '#624838', '#7A5A40', '#94704C', '#B08858']);
const TELHA = rampa(['#2A1018', '#3E161C', '#561E20', '#702824', '#8A3428', '#A4442E', '#BE5836', '#D27244']);
const REBOCO = rampa(['#2E2C44', '#3C3A54', '#4C4862', '#5E5870', '#726A7E', '#8A7E8C', '#A4949A', '#C0ACA6', '#DCC6B4']);
const LUZ_Q = rampa(['#6A3A1A', '#A85E22', '#E08C30', '#F8B448', '#FFD878', '#FFF0B8']);
const FOLHA_C = rampa(['#060A16', '#0A1220', '#0E1A2A', '#142434', '#1A2E3E', '#22384A']);
const LANTERNA = hex('#FFD878'), BRASA = hex('#FF9A3A');
const HEROI_LOOK = { skin: '#C68B59', hair: '#3A2314', tunic: '#7A5A3A', cape: '#2F4A7A', style: 'curto', beard: false };

// projeção de três quartos: profundidade (z) sobe e vai para a direita
const PROF = [0.62, -0.42];
function caixa(T, x, y, l, a, p, rf, rl, rt, o = {}) { // um bloco: frente (l x a), lado (p de fundo) e topo
  const [kx, ky] = PROF;
  for (let j = 0; j < a; j++) for (let i = 0; i < l; i++) T.set(x + i, y + j, tom(rf, (o.vf ?? 0.5) + (j === 0 ? 0.2 : 0) - j / a * 0.15 + (o.tex ? (h2(x + i, y + j, 5) - 0.5) * 0.12 : 0), x + i, y + j, 0.4));
  for (let k = 0; k < p; k++) for (let j = 0; j < a; j++) { const X = Math.round(x + l + k * kx), Y = Math.round(y + j + k * ky); T.set(X, Y, tom(rl, (o.vl ?? 0.3) - j / a * 0.12 + (o.tex ? (h2(X, Y, 6) - 0.5) * 0.12 : 0), X, Y, 0.4)); }
  if (rt) for (let k = 0; k < p; k++) for (let i = 0; i < l; i++) { const X = Math.round(x + i + k * kx), Y = Math.round(y - 1 + k * ky); T.set(X, Y, tom(rt, (o.vt ?? 0.7) + (o.tex ? (h2(X, Y, 7) - 0.5) * 0.14 : 0), X, Y, 0.4)); }
}
function linha(T, x0, y0, x1, y1, c) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0; for (let i = 0; i <= n; i++) T.set(x0 + (x1 - x0) * i / (n || 1), y0 + (y1 - y0) * i / (n || 1), c); }
function corda(T, x0, y0, x1, y1, cai, c) { const n = Math.max(2, Math.hypot(x1 - x0, y1 - y0) | 0); for (let i = 0; i <= n; i++) { const t = i / n; T.set(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * cai, c); } }
// lanterna de óleo pendurada (o vidro, a moldura e a argola); a luz entra na parte viva
function lanterna(T, x, y) { const M = hex('#2A1E1A'); T.set(x, y - 1, M); for (let j = 0; j < 5; j++) for (let i = -1; i <= 1; i++) T.set(x + i, y + j, j === 0 || j === 4 ? M : i === 0 ? hex('#FFF0B8') : LANTERNA); T.set(x - 2, y + 1, M); T.set(x + 2, y + 1, M); T.set(x - 2, y + 3, M); T.set(x + 2, y + 3, M); }

const cais = {
  luzes: [], // lanternas e janelas: posição da luz (a parte viva acende e treme)
  parada(T, R, f) {
    const w = T.w, yh = 76, sx = w - 58, sy = yh - 6; this.luzes = [];
    this.yh = yh;
    // ---- o céu do anoitecer, com o sol se pondo atrás dos montes à direita ----
    ceu(T, CEU_C, (x, y) => { const d = Math.hypot((x - sx) * 0.55, (y - sy) * 1.3) / 160; return clamp((y / yh) * 0.55 + (1 - d) * 0.55 - 0.08 + fbm(x * 0.02, y * 0.05, 4) * 0.06, 0, 0.99); }, 0.7);
    for (let i = 0; i < 120; i++) { const x = R() * w, y = R() * 36; if (x > sx - 90) continue; T.set(x, y, hex(R() < 0.15 ? '#FFFFFF' : '#8A92C4')); }
    // nuvens compridas, acesas por baixo pelo sol
    const NV = rampa(['#262C5A', '#323866', '#424474', '#56507E', '#6E5A84', '#8A6686', '#A87484', '#C88880', '#E8A47E', '#FCC88A']);
    const faixa = (x0, y0, larg, alt, n, s) => { const RR = rng(s), bl = []; for (let i = 0; i < n; i++) { const u = RR(); bl.push({ x: x0 + (u - 0.5) * larg, y: y0 - Math.sin(u * Math.PI) * alt * RR(), r: 4 + RR() * alt * 0.9, a: 0.4 }); } copa(T, bl, NV, { s, lx: (sx - x0) / 260, ly: 0.9, lz: 0.4, folha: 5, achata: 1, aspero: 0.25, forca: 0.5, base: 0.18 + (1 - Math.abs(x0 - sx) / w) * 0.25, geral: 0.15, borda: 0.18, soltas: false }); };
    faixa(w * 0.3, 20, 200, 13, 30, 9); faixa(sx - 70, 38, 210, 16, 34, 2); faixa(w * 0.1, 46, 150, 9, 16, 13); faixa(sx + 40, 58, 130, 7, 12, 5); faixa(sx - 150, 62, 140, 5, 10, 17);
    // o sol meio escondido
    for (let y = -14; y <= 14; y++) for (let x = -14; x <= 14; x++) { const d = Math.hypot(x, y) / 14; if (d <= 1) T.set(sx + x, sy + y, tom(rampa(['#F8B868', '#FCCC7C', '#FFDE98', '#FFEEC0', '#FFFAE6']), 1 - d * 0.8, sx + x, sy + y, 0.4)); }
    // ---- montes ao longe, em duas camadas, com a borda virada para o sol acesa ----
    const montes = (base, amp, r, s, rugas) => { for (let x = 0; x < w; x++) { const n = fbm(x * 0.012, 0, s, 4), y = Math.round(base - amp * Math.pow(n, 1.6) * 2.2); const y2 = Math.round(base - amp * Math.pow(fbm((x + 1) * 0.012, 0, s, 4), 1.6) * 2.2), sol = (y2 - y) * (x < sx ? -1 : 1); for (let yy = y; yy < yh + 2; yy++) { const k = (yy - y) / (yh - y + 2); let v = 0.35 - k * 0.25 + (fbm(x * rugas, yy * rugas * 2, s + 3) - 0.5) * 0.3; if (yy - y < 2 && sol < 0) v += 0.35; T.set(x, yy, tom(r, v, x, yy, 0.4)); } } };
    montes(yh, 22, MONTE_C1, 11, 0.08); for (let i = 0; i < 4; i++) for (let x = 0; x < w; x++) T.veu(x, yh - 8 + i * 2, hex('#8A7A9A'), 0.12);
    montes(yh + 1, 12, MONTE_C2, 23, 0.1);
    // ---- o mar: o céu espelhado e ondulado, as faixas de reflexo, o brilho do sol ----
    const ceuAcima = new Uint32Array(T.C.subarray(0, yh * w));
    for (let y = yh; y < H; y++) { const k = (y - yh) / (H - yh); for (let x = 0; x < w; x++) {
      const ond = Math.round(Math.sin(y * 0.7 + x * 0.04) * (0.6 + k * 2) + (fbm(x * 0.05, y * 0.4, 6) - 0.5) * 4 * k), yr = clamp(Math.round(yh - 1 - (y - yh) * 0.9), 0, yh - 1), xr = clamp(x + ond, 0, w - 1);
      const base = tom(MAR_C, 0.52 - k * 0.2 + (fbm(x * 0.02, y * 0.08, 8) - 0.5) * 0.1, x, y, 0.6);
      let c = ceuAcima[yr * w + xr]; T.set(x, y, base); T.veu(x, y, c, 0.5 - k * 0.32);
      const ri = fbm(x * 0.05 / (0.4 + k), y * 0.5, 9); if (ri > 0.7) T.set(x, y, tom(MAR_C, 0.74 + k * 0.12, x, y)); else if (ri < 0.27) T.veu(x, y, MAR_C[0], 0.28);
    } }
    for (let i = 0; i < 5; i++) for (let x = 0; x < w; x++) T.veu(x, yh + i, hex('#9A86A4'), 0.3 - i * 0.05); // a linha clara do horizonte
    for (let y = yh + 1; y < H; y++) { const k = (y - yh) / (H - yh), meia = 2 + k * 12; for (let x = sx - meia; x < sx + meia; x++) if (fbm(x * 0.12, y * 0.9, 31) > 0.6 - (1 - Math.abs(x - sx) / meia) * 0.18) T.set(x, y, tom(LUZ_Q, 0.75 - k * 0.5, x | 0, y)); }
    T.M = new Uint8Array(w * H); T.P = new Uint8Array(w * H); // daqui em diante, tudo o que se pinta é coisa sobre a água
    // ---- a torre do fogo, num rochedo ao longe, e os rochedos no mar ----
    const torreX = Math.round(w * 0.36), torreY = yh + 10;
    pedra(T, torreX, torreY, 16, 7, PEDRA_C, { s: 51, faceta: 4, corte: 0.3, lx: 0.7, ly: -0.6, rachas: false });
    { const yb = Math.round(torreY + 7 * 0.3) + 1; for (let i = -15; i <= 15; i++) { const X = torreX + i; let topo = yb; while (topo > torreY - 8 && !T.M[topo * w + X]) topo--; if (topo > yb - 3) T.veu(X, topo + 1, ESPUMA, 0.45); } }
    for (let y = torreY - 22; y < torreY - 5; y++) for (let x = torreX - 3; x <= torreX + 3; x++) T.set(x, y, tom(PEDRA_C, x > torreX + 1 ? 0.6 : x < torreX - 1 ? 0.2 : 0.4, x, y));
    for (let x = torreX - 4; x <= torreX + 4; x++) { T.set(x, torreY - 22, PEDRA_C[6]); T.set(x, torreY - 23, PEDRA_C[3]); }
    for (let x = torreX - 4; x <= torreX + 4; x += 2) T.set(x, torreY - 24, PEDRA_C[3]);
    T.set(torreX, torreY - 15, LANTERNA); T.set(torreX, torreY - 14, LANTERNA); this.luzes.push({ x: torreX, y: torreY - 26, r: 14, k: 0.6, fogo: true });
    const espuma = (x, y, rx, ry, corte) => { const yb = Math.round(y + ry * corte) + 1; for (let i = -rx; i <= rx; i++) { const X = Math.round(x + i); let topo = yb - 1; while (topo > y - ry - 2 && !T.M[topo * w + X]) topo--; if (topo > yb - 3) { T.veu(X, topo + 1, ESPUMA, 0.5); } } };
    for (const [x, y, rx, ry, s] of [[w * 0.62, yh + 7, 10, 9, 61], [w * 0.66, yh + 9, 6, 5, 62], [w * 0.2, yh + 8, 8, 6, 63]]) { pedra(T, x, y, rx, ry, PEDRA_C, { s, faceta: 3, corte: 0.35, lx: 0.7, ly: -0.6, musgo: MUSGO_C }); espuma(x, y, rx, ry, 0.35); }
    // ---- as ruínas do mundo antigo, na água: blocos e colunas partidas, com musgo e flores ----
    const ruina = (x, y, l, a, p) => { caixa(T, x, y, l, a, p, PEDRA_C, PEDRA_C, PEDRA_C, { vf: 0.42, vl: 0.25, vt: 0.62, tex: true }); for (let i = 0; i < l + p * 0.62; i++) if (h2(x + i, y, 3) < 0.55) { const X = Math.round(x + i), Y = Math.round(y - 1 - Math.max(0, i - l) * 0.42 + (i < l ? 0 : 0)); T.set(X, Y, MUSGO_C[3 + (h2(X, 1, 2) * 3 | 0)]); if (h2(X, 2, 2) < 0.25) T.set(X, Y + 1, MUSGO_C[2]); if (h2(X, 3, 2) < 0.1) T.set(X, Y - 1, hex('#E07AA0')); } for (let i = 0; i < l; i++) { T.veu(x + i, y + a, ESPUMA, 0.55); T.veu(x + i, y + a + 1, hex('#0A1430'), 0.45); } };
    const rx0 = Math.round(w * 0.44);
    // um arco partido, de um aqueduto ou de uma porta antiga
    { const ax = Math.round(w * 0.36), ay = 136; caixa(T, ax, ay - 30, 6, 30, 5, PEDRA_C, PEDRA_C, PEDRA_C, { vf: 0.45, vl: 0.25, vt: 0.6, tex: true }); caixa(T, ax + 24, ay - 22, 6, 22, 5, PEDRA_C, PEDRA_C, PEDRA_C, { vf: 0.45, vl: 0.25, vt: 0.6, tex: true });
      for (let a = 0; a <= 40; a++) { const t = Math.PI - a / 40 * Math.PI * 0.82, X = ax + 15 + Math.cos(t) * 13, Y = ay - 30 - Math.sin(t) * 10; for (let k = 0; k < 4; k++) T.set(X, Y - k, tom(PEDRA_C, k === 3 ? 0.75 : 0.45 - k * 0.04, X | 0, (Y - k) | 0)); if (a % 6 === 0) T.set(X, Y - 1, PEDRA_C[1]); }
      for (let i = 0; i < 18; i++) { const X = ax + h2(i, 1, 8) * 28, Y = ay - 30 - h2(i, 2, 8) * 10; T.set(X, Y - 4, MUSGO_C[4]); T.set(X, Y - 3, MUSGO_C[3]); if (h2(i, 3, 8) < 0.4) for (let j = 0; j < 6; j++) T.set(X, Y + j, MUSGO_C[2]); }
      for (const [x0, l] of [[ax, 6], [ax + 24, 6]]) for (let i = 0; i < l; i++) { T.veu(x0 + i, ay, ESPUMA, 0.55); for (let j = 1; j < 10; j++) T.veu(x0 + i, ay + j, PEDRA_C[1], 0.4 - j * 0.04); } }
    ruina(rx0, 124, 8, 14, 5); ruina(rx0 + 10, 132, 6, 7, 4); ruina(rx0 - 16, 140, 9, 8, 5); ruina(rx0 + 2, 104, 5, 16, 4); ruina(rx0 + 24, 118, 4, 6, 3); ruina(Math.round(w * 0.3), 150, 10, 6, 6); ruina(Math.round(w * 0.3) + 12, 158, 6, 5, 4);
    // ---- a casa do pescador, sobre a base de pedra ----
    const cx0 = w - 92, cx1 = w - 20, cb = 122; // frente da casa: de cx0 a cx1; cb = chão do terraço
    caixa(T, cx0 - 6, cb, cx1 - cx0 + 12, 14, 14, PEDRA_C, PEDRA_C, null, { vf: 0.45, vl: 0.25, tex: true }); // a base de pedra
    for (let j = 0; j < 14; j += 4) for (let i = (j / 4 % 2) * 4; i < cx1 - cx0 + 12; i += 8) T.set(cx0 - 6 + i, cb + j, PEDRA_C[1]);
    for (let i = 0; i < cx1 - cx0 + 12; i++) { T.veu(cx0 - 6 + i, cb + 14, ESPUMA, 0.5); T.veu(cx0 - 6 + i, cb + 15, hex('#0A1430'), 0.4); }
    // o terraço de tábuas em cima da base
    for (let k = 0; k < 14; k++) for (let i = 0; i < cx1 - cx0 + 12; i++) { const X = Math.round(cx0 - 6 + i + k * PROF[0]), Y = Math.round(cb - 1 + k * PROF[1]); T.set(X, Y, tom(MADEIRA, (i % 4 === 0 ? 0.35 : 0.6) + (h2(X, Y, 3) - 0.5) * 0.1, X, Y)); }
    // as paredes: reboco claro com a armação de madeira
    const pt = cb - 42;
    for (let y = pt; y < cb - 1; y++) for (let x = cx0; x < cx1; x++) { const borda = x === cx0 || x === cx1 - 1 || x === cx0 + 26 || x === cx0 + 50 || y === pt || y === cb - 2 || y === pt + 19; T.set(x, y, borda ? tom(MADEIRA, 0.3 + (x === cx0 ? 0 : 0.1), x, y) : tom(REBOCO, 0.4 + (y - pt) / 42 * -0.12 + (fbm(x * 0.12, y * 0.16, 5) - 0.5) * 0.2 + (x > cx1 - 8 ? 0.06 : 0), x, y, 0.22)); } // reboco em manchas largas (gasto, remendado), não em chuvisco
    for (let k = 0; k < 10; k++) for (let y = pt; y < cb - 1; y++) { const X = Math.round(cx1 + k * PROF[0]), Y = Math.round(y + k * PROF[1]); T.set(X, Y, mixc2(tom(REBOCO, 0.5 + k * 0.025 + (fbm(X * 0.12, Y * 0.16, 6) - 0.5) * 0.14, X, Y, 0.22), hex('#E8946A'), 0.22 + k * 0.02)); if (k === 9) T.set(X, Y, hex('#F2B07A')); } // o lado virado para o poente pega a luz quente do sol
    // as janelas acesas, com as grades de madeira e a floreira
    const janela = (x, y, l, a) => { for (let j = 0; j < a; j++) for (let i = 0; i < l; i++) T.set(x + i, y + j, tom(LUZ_Q, 0.95 - j / a * 0.35 - (i === 0 ? 0.2 : 0), x + i, y + j)); for (let j = -1; j <= a; j++) { T.set(x - 1, y + j, MADEIRA[2]); T.set(x + l, y + j, MADEIRA[2]); T.set(x + (l >> 1), y + j, MADEIRA[3]); } for (let i = -1; i <= l; i++) { T.set(x + i, y - 1, MADEIRA[4]); T.set(x + i, y + a, MADEIRA[2]); T.set(x + i, y + (a >> 1), MADEIRA[3]); } this.luzes.push({ x: x + l / 2, y: y + a / 2, r: 16, k: 0.35 }); };
    janela(cx0 + 7, pt + 5, 11, 10); janela(cx0 + 32, pt + 5, 11, 10); janela(cx0 + 56, pt + 24, 7, 9);
    for (const jx of [cx0 + 6, cx0 + 31]) for (let i = -1; i < 14; i++) { T.set(jx + i, pt + 16, MADEIRA[3]); T.set(jx + i, pt + 17, MADEIRA[2]); if (h2(i, jx, 1) < 0.8) { T.set(jx + i, pt + 15, i % 3 ? MUSGO_C[4] : hex('#E06A8A')); if (h2(i, jx, 2) < 0.4) T.set(jx + i, pt + 14, i % 4 ? MUSGO_C[5] : hex('#F09AB0')); } if (h2(i, jx, 3) < 0.3) T.set(jx + i, pt + 18, MUSGO_C[3]); }
    // a porta, entreaberta, com a luz de dentro
    const dx0 = cx0 + 34; for (let y = cb - 17; y < cb - 1; y++) for (let x = dx0; x < dx0 + 9; x++) T.set(x, y, x < dx0 + 4 ? tom(LUZ_Q, 0.8 - (cb - y) / 40, x, y) : tom(MADEIRA, 0.45 - (x - dx0 - 4) * 0.05, x, y));
    for (let y = cb - 18; y < cb - 1; y++) { T.set(dx0 - 1, y, MADEIRA[2]); T.set(dx0 + 9, y, MADEIRA[2]); } for (let x = dx0 - 1; x <= dx0 + 9; x++) T.set(x, cb - 18, MADEIRA[4]);
    this.luzes.push({ x: dx0 + 2, y: cb - 6, r: 24, k: 0.32 });
    lanterna(T, dx0 + 13, cb - 25); linha(T, dx0 + 11, cb - 27, dx0 + 15, cb - 27, MADEIRA[2]); this.luzes.push({ x: dx0 + 13, y: cb - 23, r: 28, k: 0.55, tremer: true });
    // a parreira subindo pela quina da casa
    for (let y = pt + 2; y < cb - 1; y++) { const X = cx0 + 1 + Math.round(Math.sin(y * 0.4) * 1.5); T.set(X, y, MUSGO_C[2]); if (y % 3 === 0) { T.set(X + 1, y, MUSGO_C[4]); T.set(X - 1, y + 1, MUSGO_C[3]); } if (y % 7 === 0) T.set(X + 2, y + 1, hex('#5A2A5A')); }
    // a rede de pesca pendurada na parede e o cântaro e o cesto de peixes no terraço
    for (let j = 0; j < 9; j++) for (let i = 0; i < 7; i++) if ((i + j) % 2 === 0) T.set(cx0 + 16 + i - (j > 6 ? j - 6 : 0) * 0.5, pt + 24 + j, hex('#8A7A64'));
    for (let j = 0; j < 7; j++) { const l = j < 2 ? 1 : j < 5 ? 3 : 2; for (let i = -l; i <= l; i++) T.set(cx0 + 2 + i, cb - 8 + j, tom(TELHA, 0.55 + i / 6 - j / 14, cx0 + 2 + i, cb - 8 + j)); } T.set(cx0 + 2, cb - 9, TELHA[2]);
    for (let i = -3; i <= 3; i++) { T.set(cx0 + 62 + i, cb - 3, MADEIRA[5]); T.set(cx0 + 62 + i, cb - 2, MADEIRA[3]); T.set(cx0 + 62 + i, cb - 4, i % 2 ? hex('#9AB0C8') : hex('#C8D4E0')); }
    // o telhado de telhas, com a empena na frente e a água do lado
    const rt = pt - 2, apice = rt - 22, meio = (cx0 + cx1) / 2;
    for (let y = apice; y <= rt; y++) { const a = (y - apice) / (rt - apice), mx = (cx1 - cx0 + 8) / 2 * a; for (let x = Math.round(meio - mx); x <= meio + mx; x++) T.set(x, y, tom(REBOCO, 0.3 + (fbm(x * 0.14, y * 0.14, 9) - 0.5) * 0.12, x, y, 0.2)); }
    for (let k = 0; k < 18; k++) for (let i = 0; i <= 44; i++) { const t = i / 44, X = Math.round(meio + (cx1 + 5 - meio) * t + k * PROF[0] * 1.15), Y = Math.round(apice + (rt + 1 - apice) * t + k * PROF[1] * 1.15); const fileira = (i % 4 === 0), dente = ((k + (i >> 2)) % 3 === 0); T.set(X, Y, tom(TELHA, 0.5 + (fileira ? -0.25 : 0) + (dente ? 0.12 : 0) - t * 0.15 + (h2(X, Y, 4) - 0.5) * 0.1, X, Y, 0.3)); T.set(X, Y + 1, tom(TELHA, 0.3 - t * 0.1, X, Y + 1)); }
    for (let i = 0; i <= 44; i++) { const t = i / 44; T.set(meio - (meio - cx0 + 5) * t, apice + (rt + 1 - apice) * t, TELHA[6]); T.set(meio - (meio - cx0 + 5) * t, apice + (rt + 2 - apice) * t, TELHA[2]); T.set(meio + (cx1 + 5 - meio) * t, apice + (rt + 1 - apice) * t, TELHA[7]); }
    for (let k = 0; k < 18; k++) T.set(meio + k * PROF[0] * 1.15, apice + k * PROF[1] * 1.15, TELHA[7]);
    T.set(meio, apice + 6, LUZ_Q[3]); T.set(meio, apice + 7, LUZ_Q[2]); // a janelinha da empena
    for (let y = apice - 4; y < apice + 8; y++) for (let x = 0; x < 4; x++) T.set(meio + 10 + x, y, tom(PEDRA_C, x < 2 ? 0.55 : 0.3, meio + 10 + x, y)); // a chaminé
    this.chamine = [meio + 12, apice - 5];
    // a escada de pedra descendo para a água, à direita
    for (let k = 0; k < 5; k++) caixa(T, cx1 - 2 + k * 3, cb + 15 + k * 3, 16, 3, 5, PEDRA_C, PEDRA_C, PEDRA_C, { vf: 0.4, vl: 0.2, vt: 0.62 - k * 0.05, tex: true });
    // ---- o cais de tábuas, saindo do terraço e descendo para a esquerda ----
    const A = [Math.round(w * 0.49), 142], B = [cx0 - 6, cb + 2], V = [9, 11], N = Math.round(Math.hypot(B[0] - A[0], B[1] - A[1]));
    const borda = t => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
    this.cais = { A, B, V, borda };
    // as estacas embaixo, com o reflexo e o brilho da água em volta
    for (let k = 0; k <= 5; k++) for (const lado of [0, 1]) { const [x, y] = borda(k / 5), X = Math.round(x + V[0] * lado), Y = Math.round(y + V[1] * lado); for (let j = 0; j < 10; j++) for (let i = 0; i < 2; i++) T.set(X + i, Y + 2 + j, tom(MADEIRA, 0.25 + i * 0.25, X + i, Y + 2 + j)); for (let j = 0; j < 6; j++) T.veu(X, Y + 12 + j, MADEIRA[1], 0.5 - j * 0.07); T.veu(X - 1, Y + 11, ESPUMA, 0.6); T.veu(X + 2, Y + 11, ESPUMA, 0.6); }
    // o tabuado: tábuas atravessadas, uma clara e uma escura, com as frestas
    for (let i = 0; i <= N * 2; i++) { const t = i / (N * 2), [x, y] = borda(t), q = i % 9, tab = Math.floor(i / 9), fresta = q === 8; for (let u = 0; u <= 1; u += 0.05) { const X = Math.round(x + V[0] * u), Y = Math.round(y + V[1] * u), veio = fbm(tab * 3.1, u * 9, 3); T.set(X, Y, fresta ? MADEIRA[1] : tom(MADEIRA, 0.48 + (h2(tab, 1, 3) - 0.5) * 0.22 + (veio - 0.5) * 0.25 + (q === 0 ? 0.12 : 0) - u * 0.1, X, Y, 0.25)); } if (h2(tab, 7, 3) < 0.3 && q === 4) { const X = Math.round(x + V[0] * 0.5), Y = Math.round(y + V[1] * 0.5); T.set(X, Y, MADEIRA[2]); } }
    for (let i = 0; i <= N; i++) { const [x, y] = borda(i / N); for (let j = 1; j <= 3; j++) T.set(x + V[0], y + V[1] + j, tom(MADEIRA, 0.3 - j * 0.06, Math.round(x), Math.round(y) + j)); }
    // os postes do parapeito, a corda entre eles e as lanternas em dois deles
    const postes = [0, 0.25, 0.5, 0.75, 1].map(t => borda(t));
    postes.forEach(([x, y], i) => { const X = Math.round(x), Y = Math.round(y); for (let j = 0; j < 11; j++) { T.set(X, Y - j, MADEIRA[j > 8 ? 6 : 3]); T.set(X + 1, Y - j, MADEIRA[j > 8 ? 5 : 2]); } if (i < postes.length - 1) { const [x2, y2] = postes[i + 1]; corda(T, X + 1, Y - 8, Math.round(x2), Math.round(y2) - 8, 2.5, hex('#7A6A52')); } });
    for (const i of [1, 3]) { const [x, y] = postes[i]; lanterna(T, Math.round(x) + 3, Math.round(y) - 12); T.set(Math.round(x) + 2, Math.round(y) - 13, MADEIRA[4]); this.luzes.push({ x: Math.round(x) + 3, y: Math.round(y) - 10, r: 22, k: 0.55, tremer: true, reflexo: true }); }
    // o varal entre a casa e o poste, com os panos secando (linho, índigo, um vermelho), pendurados em pé
    { const [x, y] = postes[3], X0 = Math.round(x) + 1, Y0 = Math.round(y) - 10, X1 = cx0, Y1 = pt + 8, cai = 4, ry = u => Y0 + (Y1 - Y0) * u + Math.sin(u * Math.PI) * cai;
      corda(T, X0, Y0, X1, Y1, cai, hex('#A89A80'));
      const panos = [['#E8DCC0', 5, 8, 0.18], ['#3A4A8A', 4, 10, 0.38], ['#E8DCC0', 4, 6, 0.56], ['#A8442E', 4, 8, 0.74]];
      for (const [c, l, a, u] of panos) { const cc = hex(c); for (let i = 0; i < l; i++) { const uu = u + i / (X1 - X0), PX = Math.round(X0 + (X1 - X0) * uu), PY = Math.round(ry(uu)); for (let j = 1; j <= a - (i === l - 1 ? 1 : 0); j++) T.set(PX, PY + j, j === a || i === l - 1 ? mixc(cc, 0.62) : i === 0 ? mixc(cc, 0.85) : cc); T.set(PX, PY, hex('#5A4A3A')); } } }
    // ---- o reflexo: tudo o que toca a água se espelha nela, ondulado e escurecido, partido em riscos ----
    refletir(T, yh); T.M = null; T.P = null;
    // a sombra do peregrino nas tábuas (ele entra na parte viva; a sombra é do chão)
    { const [hx, hy] = borda(0.56), X = Math.round(hx + V[0] * 0.5), Y = Math.round(hy + V[1] * 0.5) + 1; for (let i = -6; i <= 6; i++) for (let j = -1; j <= 1; j++) { const d = (i * i) / 36 + j * j; if (d < 1) T.veu(X + i + 2, Y + j, hex('#0C0810'), 0.5 * (1 - d)); } }
    // ---- o primeiro plano: folhagem escura na esquerda (onde fica o menu) e capim de praia ----
    const bl = []; for (let i = 0; i < 9; i++) bl.push({ x: R() * 70 - 10, y: H - R() * 34, r: 10 + R() * 12 });
    T.M = new Uint8Array(w * H); copa(T, bl, FOLHA_C, { s: 71, folha: 3, forca: 0.45, base: 0.08, lx: 0.6, ly: -0.7, borda: 0.05 });
    { const M = T.M; for (let y = 1; y < H - 1; y++) for (let x = 1; x < w - 1; x++) { const i = y * w + x; if (!M[i]) continue; if (!M[i + 1] && y < H - 8) T.set(x, y, h2(x, y, 4) > 0.3 ? hex('#5A4A6E') : hex('#7A5A70')); else if (!M[i - w] && !M[i + 1 - w]) T.set(x, y, hex('#3E3A5A')); } T.M = null; } // o contorno do lado do sol acende: a moita ganha forma contra a água
    for (let i = 0; i < 26; i++) { const x = R() * 90, hh = 14 + R() * 30, b = 4 + R() * 10; for (let j = 0; j < hh; j++) { const q = j / hh; T.set(x + b * q * q, H - 2 - j, FOLHA_C[q > 0.8 ? 3 : 1]); } }
    for (let i = 0; i < 6; i++) { const x = w - 8 - R() * 30, hh = 10 + R() * 14; for (let j = 0; j < hh; j++) { const q = j / hh; T.set(x - 6 * q * q, H - j, FOLHA_C[q > 0.8 ? 3 : 1]); } }
  },
  viva(T, t, f) {
    const w = T.w, yh = this.yh, { A, B, V, borda } = this.cais;
    // estrelas acendendo
    for (let i = 0; i < 26; i++) { const x = (i * 7919) % Math.max(1, w - 150), y = (i * 3571) % 34; if (Math.sin(t * (0.6 + i % 4 * 0.3) + i) > 0.6) T.set(x, y, hex('#FFFFFF')); }
    T.brilho(w - 58, yh - 6, 70, hex('#FF9A50'), 0.22);
    // as luzes: halo quente, reflexo tremendo na água
    for (const l of this.luzes) { const tr = l.tremer ? Math.sin(t * 9 + l.x) * 0.06 + Math.sin(t * 23 + l.y) * 0.04 : 0; T.brilho(l.x, l.y, l.r * (1 + tr), l.fogo ? BRASA : hex('#FFB050'), l.k + tr); if (l.reflexo) for (let j = 0; j < 22; j += 2) { const yy = l.y + 22 + j, xx = l.x + Math.round(Math.sin(t * 3 + j * 0.8) * (1 + j * 0.08)); if (yy < H && (j + Math.floor(t * 6)) % 4 < 3) { T.set(xx, yy, LUZ_Q[3 - Math.min(2, j / 8 | 0)]); T.set(xx + 1, yy, LUZ_Q[2]); } } if (l.fogo) { const fy = l.y + 2, fl = Math.floor(t * 10) % 3; T.set(l.x, fy, hex('#FFF0B8')); T.set(l.x - 1, fy + 1, BRASA); T.set(l.x + 1, fy + 1, BRASA); T.set(l.x, fy - 1 - (fl > 0 ? 1 : 0), hex('#FFD878')); for (let j = 0; j < 12; j += 2) T.set(l.x + Math.round(Math.sin(t * 2 + j)), yh + 16 + j, j % 4 ? BRASA : hex('#FFD878')); } }
    // brilhos que correm na água
    for (let i = 0; i < 40; i++) { const x = (i * 9973 + Math.floor(t * 8 + i) * 13) % w, y = yh + 4 + (i * 3571) % (H - yh - 6); if (Math.sin(t * 2.4 + i * 1.7) > 0.7) { T.set(x, y, hex('#B8D8F0')); T.set(x + 1, y, hex('#7AA4D0')); } }
    // a fumaça da chaminé
    const [mx, my] = this.chamine; for (let i = 0; i < 7; i++) { const k = (t * 0.12 + i / 7) % 1, X = mx + Math.sin(t * 0.8 + k * 5) * 2 + k * 14, Y = my - k * 34; T.veu(X, Y, hex('#6A6A8A'), (1 - k) * 0.45); T.veu(X + 1, Y, hex('#6A6A8A'), (1 - k) * 0.35); }
    // o barco de Simão, amarrado na ponta do cais, balançando
    const bob = Math.sin(t * 1.4) * 0.8, bx = A[0] - 34, by = A[1] + 8 + Math.round(bob);
    for (let i = 0; i < 40; i++) { const u = i / 39, larg = Math.sin(u * Math.PI) * 6 + 1.5, X = bx + i, cY = by - u * 10; for (let j = -larg; j <= larg; j++) { const Y = Math.round(cY + j * 0.55), dentro = Math.abs(j) < larg - 1.4; T.set(X, Y, dentro ? tom(MADEIRA, 0.28 + (i % 9 === 0 ? 0.3 : 0), X, Y) : tom(MADEIRA, j < 0 ? 0.75 : 0.5, X, Y)); } for (let j = 1; j <= 4; j++) T.set(X, Math.round(cY + larg * 0.55 + j), tom(MADEIRA, 0.45 - j * 0.07 + (j === 2 ? 0.12 : 0), X, Math.round(cY + larg * 0.55 + j))); T.veu(X, Math.round(cY + larg * 0.55 + 5), ESPUMA, 0.5); for (let j = 6; j < 10; j++) T.veu(X, Math.round(cY + larg * 0.55 + j), MADEIRA[1], 0.3); }
    for (let i = 4; i < 36; i += 10) { const X = bx + i, cY = by - i / 39 * 10; for (let j = -3; j <= 3; j++) T.set(X, Math.round(cY + j * 0.55), MADEIRA[6]); } // os bancos
    for (let j = 0; j < 9; j++) T.set(bx + 37, by - 10 - j, MADEIRA[3]); lanterna(T, bx + 38, by - 22); T.brilho(bx + 38, by - 19, 20, hex('#FFB050'), 0.5 + Math.sin(t * 8) * 0.05);
    for (let j = 0; j < 14; j += 2) { const yy = by + 2 + j; T.set(bx + 38 + Math.round(Math.sin(t * 3 + j)), yy, LUZ_Q[3 - Math.min(2, j / 5 | 0)]); }
    corda(T, bx + 38, by - 8, A[0] + 1, A[1] - 7, 3, hex('#8A7A62'));
    for (let i = 0; i < 6; i++) T.set(bx + 18 + i, by - 7 + (i % 2), hex('#8A7A64')); // a rede dobrada no fundo do barco
    // as gaivotas voltando
    for (let i = 0; i < 4; i++) { const k = (t * 0.03 + i * 0.27) % 1, X = w * 1.05 - k * w * 0.9, Y = 20 + i * 7 + Math.sin(t * 1.2 + i) * 3; sprite(T, PASSARO[Math.floor(t * 6 + i) % 3], X | 0, Y | 0, { '#': hex('#E8E4F0') }); }
    // vaga-lumes na folhagem da frente
    for (let i = 0; i < 8; i++) { const X = 10 + (i * 37) % 70 + Math.sin(t * 0.6 + i) * 6, Y = H - 10 - (i * 23) % 40 + Math.sin(t + i * 2) * 4, b = Math.sin(t * 2 + i * 1.4); if (b > 0) { T.set(X, Y, hex('#F0F8C0')); T.brilho(X, Y, 6, hex('#B0C870'), b * 0.45); } }
    // o peregrino no cais, de lâmpada acesa, olhando o mar
    const [hx, hy] = borda(0.56), HX = Math.round(hx + V[0] * 0.5), HY = Math.round(hy + V[1] * 0.5);
    const s = quadroPessoa(HEROI_LOOK, t, 'abertura-cais');
    if (s?.b) { const tinta = hex('#1A2250'); for (let j = 0; j < s.h; j++) for (let i = 0; i < s.w; i++) { const c = s.b[j * s.w + i]; if (!(c >>> 24)) continue; const X = HX - 24 + (s.w - 1 - i), Y = HY - 40 + j; T.set(X, Y, mixc2(c, tinta, 0.28)); } }
    lanterna(T, HX - 7, HY - 18); T.brilho(HX - 7, HY - 15, 30, hex('#FFC060'), 0.6 + Math.sin(t * 7) * 0.05);
  }
};
// o espelho d'água: para cada coluna, onde uma coisa termina e a água começa, a coisa se repete de cabeça para baixo
function refletir(T, yh) {
  const w = T.w, M = T.M, C = T.C, fonte = C.slice(), escuro = hex('#0A1430');
  for (let x = 0; x < w; x++) {
    for (let y = yh + 1; y < H - 1; y++) {
      const i = y * w + x; if (!M[i] || M[i + w] || !(T.P[i + w] || T.P[i + 2 * w] || T.P[i])) continue; // o pé de uma coisa que entra na água (onde há espuma): o que pende no ar não se espelha
      let alt = 0; while (alt < 46 && y - alt > yh && M[(y - alt) * w + x]) alt++;
      if (alt < 2) continue;
      for (let d = 1; d <= alt && y + d < H; d++) {
        const yy = y + d, k = yy * w + x; if (M[k]) break; // outra coisa na frente: o reflexo para
        if ((yy + (x >> 3)) % 6 === 0 && d > 3) continue; // a marola parte o reflexo em riscos
        const ond = Math.round(Math.sin(yy * 0.9 + x * 0.05) * (0.5 + d * 0.06)), xs = clamp(x + ond, 0, w - 1), src = fonte[(y - d + 1) * w + xs];
        if (!M[(y - d + 1) * w + xs]) continue;
        const a = (0.8 - d / alt * 0.45) * (d === 1 ? 0.75 : 1);
        C[k] = mixc2(C[k], mixc2(src, escuro, 0.3), a);
      }
      C[(y + 1) * w + x] = mixc2(C[(y + 1) * w + x], hex('#9FD8E8'), 0.45); // a linha de espuma onde a coisa entra na água
    }
  }
}
function mixc(c, k) { return ((255 << 24) | ((((c >>> 16) & 255) * k) << 16) | ((((c >>> 8) & 255) * k) << 8) | ((c & 255) * k)) >>> 0; }
function mixc2(a, b, k) { const ch = s => Math.round(((a >>> s) & 255) * (1 - k) + ((b >>> s) & 255) * k); return ((255 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)) >>> 0; }

// ======================================================================================================
// A PRAÇA DO POÇO À NOITE — a chegada ao Refúgio: a lua sobre a muralha, as casas de teto plano com as janelas acesas,
// a torre da sinagoga, o poço no meio da praça de lajes e o peregrino de lâmpada acesa. A aldeia dorme; a luz fica.
// ======================================================================================================
const CEU_P = rampa(['#050818', '#081024', '#0C1630', '#101C3C', '#152448', '#1C2C54', '#24365E', '#2E4068', '#3A4A72', '#4A547A']);
const MURO_P = rampa(['#0A0E20', '#10162A', '#171E36', '#1F2842', '#28324E', '#323C5A']);
const BARRO = rampa(['#14121E', '#1C1A2A', '#262236', '#302A42', '#3C344E', '#4A405A', '#5C4E68', '#726078', '#8C768A']);
const LAJE = rampa(['#0E0E1A', '#151624', '#1D1E2E', '#262838', '#303244', '#3C3E52', '#4C4C60', '#605E70']);
const praca = {
  luzes: [],
  parada(T, R, f) {
    const w = T.w, yh = 122, mx = Math.round(w * 0.8), my = 32; this.luzes = []; this.yh = yh;
    // o céu: noite funda em cima, mais clara perto da muralha; a lua cheia com o halo em degraus
    ceu(T, CEU_P, (x, y) => clamp(0.08 + (y / yh) * 0.62 + (1 - Math.min(1, Math.hypot(x - mx, (y - my) * 1.3) / 120)) * 0.22 + (fbm(x * 0.02, y * 0.04, 3) - 0.5) * 0.05, 0, 0.99), 0.7);
    for (let i = 0; i < 160; i++) { const x = Math.floor(R() * w), y = Math.floor(R() * (yh - 30)); if (Math.hypot(x - mx, y - my) < 30) continue; T.set(x, y, hex(R() < 0.12 ? '#FFFFFF' : R() < 0.5 ? '#9AA8D8' : '#5E6AA0')); }
    for (let y = -11; y <= 11; y++) for (let x = -11; x <= 11; x++) { const d = Math.hypot(x, y) / 11; if (d > 1) continue; const mar = fbm((x + 20) * 0.25, (y + 20) * 0.25, 41); T.set(mx + x, my + y, tom(rampa(['#B8BCC8', '#CFD2DA', '#E2E2E6', '#F2F0EA', '#FFFDF4']), 0.95 - d * 0.35 - (x + y > 6 ? 0.25 : 0) - (mar > 0.6 ? 0.2 : 0), mx + x, my + y, 0.3)); }
    const NV = rampa(['#1A2244', '#232C52', '#2E3860', '#3C466E', '#525C80', '#6E7894', '#9098AE']);
    for (const [x0, y0, larg, n, sd] of [[mx - 40, 44, 120, 14, 3], [w * 0.35, 26, 150, 16, 7], [w * 0.12, 54, 90, 9, 11]]) { const RR = rng(sd), bl = []; for (let i = 0; i < n; i++) { const u = RR(); bl.push({ x: x0 + (u - 0.5) * larg, y: y0 - Math.sin(u * Math.PI) * 5 * RR(), r: 3 + RR() * 5, a: 0.4 }); } copa(T, bl, NV, { s: sd, lx: (mx - x0) / 200, ly: -0.8, lz: 0.4, folha: 5, achata: 1, aspero: 0.25, forca: 0.5, base: 0.2, geral: 0.1, borda: 0.25, soltas: false }); }
    // os montes e a muralha da cidade ao longe, com as ameias e as torres
    for (let x = 0; x < w; x++) { const y = Math.round(yh - 30 - fbm(x * 0.015, 0, 13, 4) * 22); for (let yy = y; yy < yh; yy++) T.set(x, yy, tom(MURO_P, 0.2 - (yy - y) / 60, x, yy)); }
    const muroY = yh - 22; for (let x = 0; x < w; x++) { const torre = (x % 70) < 12, topo = muroY - (torre ? 12 : 0) - ((x % 70 < 12 ? x % 4 : x % 6) < 2 ? 2 : 0); for (let y = topo; y < yh; y++) T.set(x, y, tom(MURO_P, 0.5 + (y === topo ? 0.3 : 0) - (y - topo) / 70 + (x % 70 === 11 ? -0.2 : 0), x, y, 0.3)); if (torre && x % 70 === 5) { T.set(x, topo + 5, LUZ_Q[3]); T.set(x, topo + 6, LUZ_Q[2]); this.luzes.push({ x, y: topo + 5, r: 6, k: 0.3 }); } }
    // as casas de teto plano (barro e pedra), com parapeito, escada por fora, janelas acesas e lamparinas
    const casa = (x, y, l, a, p, o = {}) => {
      caixa(T, x, y, l, a, p, BARRO, BARRO, BARRO, { vf: 0.48, vl: 0.26, vt: 0.62 });
      for (let j = 2; j < a; j++) for (let i = 0; i < l; i++) { const n = fbm((x + i) * 0.09, (y + j) * 0.12, 33); if (n > 0.62) T.set(x + i, y + j, BARRO[n > 0.7 ? 2 : 3]); else if (n < 0.3 && (j % 4 === 0 || (i + (j >> 2) * 5) % 9 === 0)) T.set(x + i, y + j, BARRO[2]); } // o reboco gasto mostra as pedras por baixo
      for (let i = 3; i < l - 2; i += 7) { T.set(x + i, y + 3, MADEIRA[6]); T.set(x + i + 1, y + 3, MADEIRA[4]); T.set(x + i, y + 4, MADEIRA[2]); T.veu(x + i, y + 5, hex('#05060C'), 0.5); T.veu(x + i + 1, y + 5, hex('#05060C'), 0.3); } // as pontas das vigas do teto
      for (let i = 0; i < l + p * 0.62; i += 3) { const X = Math.round(x + i), Y = Math.round(y - 2 - Math.max(0, i - l) * 0.42); T.set(X, Y, BARRO[6]); T.set(X + 1, Y, BARRO[5]); } // o parapeito
      for (const [jx, jy] of o.jan || []) { for (let j = 0; j < 5; j++) for (let i = 0; i < 4; i++) T.set(x + jx + i, y + jy + j, tom(LUZ_Q, 0.9 - j * 0.1, x + jx + i, y + jy + j)); for (let i = -1; i <= 4; i++) T.set(x + jx + i, y + jy + 5, BARRO[6]); this.luzes.push({ x: x + jx + 2, y: y + jy + 2, r: 12, k: 0.3 }); }
      if (o.porta != null) { for (let j = 0; j < 11; j++) for (let i = 0; i < 7; i++) { if (j < 3 && Math.hypot(i - 3, j - 3) > 3.4) continue; T.set(x + o.porta + i, y + a - 11 + j, i === 3 ? MADEIRA[1] : tom(MADEIRA, 0.42 - Math.abs(i - 3) * 0.03 + (j % 4 === 0 ? -0.08 : 0), x + o.porta + i, y + a - 11 + j)); } for (let i = -1; i <= 7; i++) T.set(x + o.porta + i, y + a, BARRO[6]); T.set(x + o.porta + 5, y + a - 5, hex('#C9A44A')); } // a porta de tábuas, em arco, com a soleira e a argola
      if (o.escada) for (let k = 0; k < Math.floor(a / 3); k++) for (let i = 0; i < 6; i++) T.set(x + l - 6 - k * 2 + i - 10, y + a - 3 - k * 3, BARRO[k % 2 ? 6 : 5]); // a escada de pedra subindo para o terraço
      if (o.toldo) for (let i = 0; i < 18; i++) { T.set(x + o.toldo + i, y + 8 + (i % 6 === 0 ? 1 : 0), hex(i % 6 < 3 ? '#7A2E4A' : '#C8B89A')); T.set(x + o.toldo + i, y + 9, hex('#3A1A24')); }
    };
    // a torre da sinagoga, de pedra clara, com a janela da vigília acesa
    { const tx = Math.round(w * 0.42), ty = yh - 66; caixa(T, tx, ty, 16, 66, 8, BARRO, BARRO, BARRO, { vf: 0.62, vl: 0.34, vt: 0.78, tex: true }); for (let i = 0; i < 16; i += 3) { T.set(tx + i, ty - 3, BARRO[7]); T.set(tx + i + 1, ty - 3, BARRO[7]); T.set(tx + i, ty - 2, BARRO[6]); }
      for (let j = 0; j < 9; j++) for (let i = 0; i < 6; i++) { const arco = j < 3 && Math.hypot(i - 2.5, j - 3) > 3; if (!arco) T.set(tx + 5 + i, ty + 10 + j, tom(LUZ_Q, 0.95 - j * 0.06, tx + 5 + i, ty + 10 + j)); } this.luzes.push({ x: tx + 8, y: ty + 14, r: 18, k: 0.45, tremer: true });
      for (let k = 0; k < 4; k++) for (let i = 0; i < 16; i++) T.set(tx + i, ty + 22 + k * 11, BARRO[2]); }
    casa(Math.round(w * 0.06), yh - 34, 44, 34, 12, { jan: [[8, 10], [28, 10]], porta: 18, toldo: 4 });
    casa(Math.round(w * 0.27), yh - 26, 30, 26, 10, { jan: [[6, 8]], porta: 18 });
    casa(Math.round(w * 0.55), yh - 30, 40, 30, 12, { jan: [[6, 9], [26, 9]], porta: 15, escada: true });
    casa(Math.round(w * 0.8), yh - 40, 50, 40, 14, { jan: [[8, 10], [34, 10], [20, 24]], porta: 36 });
    // uma palmeira e uma oliveira entre as casas
    galho(T, [[w * 0.5, yh + 2], [w * 0.505, yh - 20], [w * 0.512, yh - 40]], 1.8, 1.1, CASCA_N, { s: 4 });
    for (let k = 0; k < 7; k++) { const a = -2.6 + k * 0.42, L = 16 + (k % 3) * 3; for (let i = 0; i < L; i++) { const t = i / L, X = w * 0.512 + Math.cos(a) * i, Y = yh - 40 + Math.sin(a) * i + t * t * 9; T.set(X, Y, FOLHA_C[i % 3 === 0 ? 2 : 4]); if (i % 2) T.set(X, Y + 1, FOLHA_C[1]); } }
    copa(T, [{ x: w * 0.7, y: yh - 22, r: 12 }, { x: w * 0.73, y: yh - 28, r: 10 }, { x: w * 0.75, y: yh - 20, r: 9 }], rampa(['#0A1218', '#101C22', '#16262C', '#1E3236', '#283E40', '#36504C', '#4A6458']), { s: 8, lx: 0.7, ly: -0.6, buracos: 0.3, forca: 0.5, base: 0.05 });
    galho(T, [[w * 0.72, yh + 2], [w * 0.725, yh - 14]], 2.2, 1.6, CASCA_N, { s: 9 });
    // a praça: lajes em perspectiva (as juntas correm para o fundo), gastas no caminho do poço, mais escuras longe da luz
    for (let y = yh; y < H; y++) { const d = 26 / (y - yh + 5), Z = d * 10;
      for (let x = 0; x < w; x++) { const X = (x - f) * d * 0.09, fz = Z - Math.floor(Z), lin = Math.floor(Z), fx = X + (lin % 2) * 0.5, jx = fx - Math.floor(fx), id = Math.floor(fx) * 31 + lin * 7;
        const junta = fz < 0.07 + (1 - d) * 0.02 || jx < 0.05 / Math.max(0.3, d), gasto = Math.exp(-(((x - f) / 50) ** 2)) * 0.12;
        const perto = Math.min(1, (y - yh) / 22); let v = 0.34 + (h2(id, 1, 5) - 0.5) * 0.18 * perto + (y - yh) / (H - yh) * 0.08 + gasto + (fbm(x * 0.06, y * 0.12, 21) - 0.5) * 0.08 - (junta ? 0.26 * perto : 0) + (!junta && fz < 0.2 ? 0.05 * perto : 0); // ao longe as juntas somem (sem chuvisco no fundo)
        T.set(x, y, tom(LAJE, v, x, y, 0.25)); } }
    for (let x = 0; x < w; x++) { T.set(x, yh, MURO_P[1]); T.veu(x, yh + 1, hex('#05060C'), 0.4); } // o pé das casas encontra a praça
    // o poço: o bocal redondo de pedra, a armação de madeira, a corda e o balde
    const px = Math.round(f + 6), py = 152; this.poco = [px, py];
    for (let y = py - 14; y <= py + 2; y++) for (let x = px - 15; x <= px + 15; x++) { const dx = (x - px) / 15; if (Math.abs(dx) > 1) continue; const topo = py - 14 + Math.round((1 - Math.sqrt(1 - dx * dx)) * -4 + 4); if (y < topo) continue; const fi = Math.floor((y - topo) / 4); T.set(x, y, tom(PEDRA_C, 0.55 - dx * 0.25 - (y - topo) / 30 - ((y - topo) % 4 === 0 || ((x + fi * 3) % 7 === 0) ? 0.2 : 0), x, y, 0.3)); }
    for (let x = px - 15; x <= px + 15; x++) { const dx = (x - px) / 15, a = Math.sqrt(Math.max(0, 1 - dx * dx)) * 4; T.set(x, Math.round(py - 10 - a), PEDRA_C[7]); T.set(x, Math.round(py - 10 + a), PEDRA_C[4]); for (let y = Math.round(py - 9 - a); y < py - 10 + a; y++) T.set(x, y, hex('#05070F')); } // a borda de cima e a boca escura
    for (const sx of [-13, 12]) for (let y = py - 40; y < py - 10; y++) { T.set(px + sx, y, MADEIRA[5]); T.set(px + sx + 1, y, MADEIRA[3]); }
    for (let x = px - 15; x <= px + 15; x++) { T.set(x, py - 41, MADEIRA[6]); T.set(x, py - 40, MADEIRA[3]); } for (let y = py - 40; y < py - 24; y++) T.set(px, y, hex('#8A7A60'));
    for (let j = 0; j < 6; j++) for (let i = -3; i <= 3; i++) T.set(px + i, py - 24 + j, tom(MADEIRA, 0.6 - j * 0.05 + i * 0.03, px + i, py - 24 + j)); for (let i = -3; i <= 3; i++) T.set(px + i, py - 24, MADEIRA[7]);
    // a sombra do poço na praça e a pedra de Ebenézer ao lado
    for (let i = -18; i <= 22; i++) for (let j = 0; j < 4; j++) if (h2(i, j, 3) < 0.7 - j * 0.15) T.veu(px + i + 4, py + 2 + j, hex('#05060C'), 0.4);
    pedra(T, px + 36, py - 4, 6, 12, PEDRA_C, { s: 77, faceta: 3, corte: 0.75, lx: -0.5, ly: -0.7, musgo: MUSGO_C, rachas: false }); for (let i = -7; i <= 8; i++) T.veu(px + 37 + i, py + 6, hex('#05060C'), 0.45);
    // os braseiros de pedra da praça (colunas baixas com a bacia de fogo em cima) e a luz que deixam no chão
    for (const [lx, ly] of [[Math.round(w * 0.35), 158], [Math.round(w * 0.94), 166]]) { caixa(T, lx - 3, ly - 22, 7, 22, 3, PEDRA_C, PEDRA_C, PEDRA_C, { vf: 0.5, vl: 0.28, vt: 0.7 }); for (let i = -6; i <= 7; i++) { T.set(lx + i, ly - 24, hex('#2A1E1A')); T.set(lx + i, ly - 23, i === -6 || i === 7 ? hex('#2A1E1A') : hex('#5A3A24')); } for (let i = -5; i <= 6; i++) T.set(lx + i, ly - 25, BRASA);
      for (let i = -9; i <= 12; i++) T.veu(lx + i + 2, ly + 1, hex('#05060C'), 0.45 * (1 - Math.abs(i) / 13));
      for (let y = ly - 6; y < H; y++) for (let x = lx - 50; x < lx + 50; x++) { const dd = Math.hypot((x - lx) / 50, (y - ly) / 16); if (dd < 1) T.luz(x, y, hex('#FF9A40'), (1 - dd) * 0.35); }
      this.luzes.push({ x: lx, y: ly - 27, r: 26, k: 0.55, tremer: true, fogo: true }); }
    // os cântaros junto ao poço, um banco de pedra e a jumenta descansando perto da casa
    for (const [cx, cy, c] of [[this.poco[0] + 21, this.poco[1] + 4, '#8A4A2E'], [this.poco[0] + 26, this.poco[1] + 6, '#A85E3A']]) { for (let j = 0; j < 8; j++) { const l = j < 2 ? 1 : j < 6 ? 2.5 : 1.5; for (let i = -l; i <= l; i++) T.set(cx + i, cy - 8 + j, tom(rampa(['#3A1A10', '#5A2A1A', c, '#C8805A', '#E0A47A']), 0.55 + i / 6 - j / 18, cx + i | 0, cy - 8 + j)); } T.set(cx, cy - 9, hex('#3A1A10')); T.veu(cx + 1, cy + 1, hex('#05060C'), 0.5); }
    caixa(T, Math.round(w * 0.44), 164, 24, 5, 5, PEDRA_C, PEDRA_C, PEDRA_C, { vf: 0.45, vl: 0.25, vt: 0.68 }); for (let i = -1; i < 28; i++) T.veu(Math.round(w * 0.44) + i, 170, hex('#05060C'), 0.45); // o banco de pedra
    // primeiro plano: a sombra de um telhado e um vaso, à esquerda (onde está o menu)
    for (let y = 0; y < H; y++) for (let x = 0; x < 34 - Math.max(0, y - 120) * 0.2; x++) T.veu(x, y, hex('#03040A'), 0.55 - x / 80);
  },
  viva(T, t, f) {
    const w = T.w;
    for (let i = 0; i < 30; i++) { const x = (i * 7919) % w, y = (i * 3571) % 80; if (Math.sin(t * (0.5 + i % 5 * 0.3) + i) > 0.7) T.set(x, y, hex('#FFFFFF')); }
    T.brilho(Math.round(w * 0.8), 32, 50, hex('#8EA0D8'), 0.25);
    for (const l of this.luzes) { const tr = l.tremer ? Math.sin(t * 9 + l.x) * 0.06 + Math.sin(t * 23 + l.y) * 0.04 : 0; T.brilho(l.x, l.y, l.r * (1 + tr), hex('#FFB050'), l.k + tr); if (l.chao) T.brilho(l.x, 160, l.r * 0.9, hex('#FFA040'), 0.28 + tr); }
    for (let i = 0; i < 5; i++) { const l = this.luzes[this.luzes.length - 1 - (i % 2)], a = t * (2 + i * 0.4) + i * 2; T.set(l.x + Math.round(Math.cos(a) * (4 + i)), l.y + Math.round(Math.sin(a * 1.3) * 3), hex('#E8E0C8')); } // mariposas em volta das lamparinas
    // um gato andando no muro de trás e a fumaça de uma chaminé
    { const k = (t * 0.02) % 1, X = Math.round(w * 0.1 + k * w * 0.8), Y = 118 - 22 - 3; sprite(T, [['#..#', '####', '.##.'], ['#..#', '####', '#..#']][Math.floor(t * 4) % 2], X, Y, { '#': hex('#05060C') }); }
    // o peregrino junto ao poço, de lâmpada acesa
    const [px, py] = this.poco, HX = px - 30, HY = py + 14, s = quadroPessoa(HEROI_LOOK, t, 'abertura-praca');
    for (let i = -6; i <= 6; i++) T.veu(HX + i - 4, HY + 1, hex('#05060C'), 0.5 * (1 - Math.abs(i) / 7));
    if (s?.b) { const tinta = hex('#141A40'); for (let j = 0; j < s.h; j++) for (let i = 0; i < s.w; i++) { const c = s.b[j * s.w + i]; if (!(c >>> 24)) continue; T.set(HX - 24 + i, HY - 40 + j, mixc2(c, tinta, 0.3)); } }
    lanterna(T, HX + 7, HY - 18); T.brilho(HX + 7, HY - 15, 34, hex('#FFC060'), 0.62 + Math.sin(t * 7) * 0.05);
  }
};


// ======================================================================================================
// A GALILEIA AO ENTARDECER — a tela da fase da célula ("Jesus me escolheu", /celula). É o cais da beira do lago,
// com o que o estudo da semana conta: a videira subindo pela casa e passando por cima do terraço, carregada de cachos
// ("eu os escolhi para darem fruto", Jo 15:16), o barco de Pedro com a rede, e a fogueira de brasas na beira, onde a
// turma da célula está sentada em volta (Jo 21:9). O peregrino de lâmpada acesa chega pelo cais.
const VIDE = rampa(['#08141C', '#0E2028', '#163030', '#1E4236', '#28563C', '#366C44', '#4A844C', '#62A056', '#86BE6A']);
const UVA = rampa(['#1A0A26', '#2E1240', '#481C5C', '#662878', '#863A92', '#A854AA', '#CC7AC4']);
const OURO_U = rampa(['#6A3A12', '#9A5E1C', '#C88A2C', '#ECB84A', '#FFE07A', '#FFF6C8']);
const TURMA = [
  { skin: '#8A5A3A', hair: '#1C120A', tunic: '#A8442E', cape: 'none', style: 'cacheado', beard: false },
  { skin: '#D9A273', hair: '#6B4423', tunic: '#3A6A8A', cape: 'none', style: 'longo', beard: false },
  { skin: '#C68B59', hair: '#2B1A10', tunic: '#5E7A4A', cape: 'none', style: 'veu', beard: false },
  { skin: '#A0673E', hair: '#3A2314', tunic: '#E3DED2', cape: '#7A5A3A', style: 'curto', beard: false }
];
function cacho(T, x, y, R, n = 4) { // um cacho em triângulo: bagos de 2x2 com brilho no alto
  for (let j = 0; j < n; j++) for (let i = 0; i < n - j; i++) { const X = x + i * 2 - (n - j) + 1 + (j % 2), Y = y + j * 2; T.set(X, Y, R[3]); T.set(X + 1, Y, R[2]); T.set(X, Y + 1, R[2]); T.set(X + 1, Y + 1, R[1]); if ((i + j) % 2 === 0) T.set(X, Y, R[5] || R[4]); }
  T.set(x, y - 1, VIDE[3]); T.set(x + 1, y - 2, VIDE[4]);
}
const galileia = Object.assign(Object.create(cais), {
  parada(T, R, f) {
    cais.parada.call(this, T, R, f);
    const w = T.w, cx0 = w - 92, cx1 = w - 20, cb = 122, pt = cb - 42;
    // o tronco retorcido da videira, saindo do terraço na quina da casa
    galho(T, [[cx0 - 3, cb - 1], [cx0 - 5, cb - 14], [cx0 - 2, cb - 26], [cx0 - 4, pt + 2], [cx0 + 4, pt - 4]], 2.4, 1.2, CASCA_N, { s: 41 });
    // a latada: um caibro saindo da casa por cima do terraço, e a folhagem pesada por cima dele e da parede
    for (let x = cx0 - 34; x < cx0; x++) { T.set(x, pt + 4, MADEIRA[4]); T.set(x, pt + 5, MADEIRA[2]); }
    for (const x of [cx0 - 33, cx0 - 18]) for (let y = pt + 5; y < cb - 1; y++) { T.set(x, y, MADEIRA[3]); T.set(x + 1, y, MADEIRA[2]); }
    const bl = []; for (let i = 0; i < 26; i++) { const u = i / 25; bl.push({ x: cx0 - 36 + u * 110, y: pt + 1 - Math.sin(u * 9) * 2 + (u > 0.33 ? -4 : 0), r: 4 + (i % 3) * 1.6, a: 0.75 }); }
    copa(T, bl, VIDE, { s: 83, folha: 2.6, forca: 0.55, base: 0.12, lx: 0.75, ly: -0.6, borda: 0.12, buracos: 0.22 });
    // os cachos: roxos, e três dourados (o fruto que permanece) que brilham na parte viva
    this.uvas = [];
    for (const [x, y, ouro] of [[cx0 - 30, pt + 7, 0], [cx0 - 22, pt + 8, 1], [cx0 - 12, pt + 6, 0], [cx0 + 3, pt + 5, 0], [cx0 + 22, pt + 4, 1], [cx0 + 44, pt + 3, 0], [cx0 + 63, pt + 4, 1], [cx0 - 6, pt + 9, 0]]) {
      cacho(T, x, y, ouro ? OURO_U : UVA, ouro ? 4 : 3 + (x % 2)); if (ouro) this.uvas.push([x, y + 3]); }
    // a fogueira de brasas no terraço, em roda de pedras, com o peixe no braseiro (Jo 21:9)
    // a prainha de areia no canto, na frente da escada de pedra, onde a turma acendeu o fogo
    const fx = w - 46, fy = H - 12; this.fogo = [fx, fy];
    const AREIA = rampa(['#2A2236', '#3E3040', '#584446', '#76604E', '#94785A', '#B08E68']);
    for (let y = fy - 9; y < H; y++) for (let x = fx - 46; x < w; x++) { const d = Math.pow((x - fx - 4) / 50, 2) + Math.pow((y - fy - 6) / 12, 2); if (d > 1) continue; T.set(x, y, tom(AREIA, 0.62 - d * 0.35 + (h2(x, y, 9) - 0.5) * 0.12 - (y - fy + 9) * 0.012, x, y, 0.4)); if (d > 0.86) T.veu(x, y, ESPUMA, 0.55); }
    for (let i = -6; i <= 6; i += 2) { const Y = fy + (Math.abs(i) > 4 ? -1 : 0); T.set(fx + i, Y, PEDRA_C[5]); T.set(fx + i + 1, Y, PEDRA_C[3]); T.set(fx + i, Y + 1, PEDRA_C[2]); }
    for (let i = -4; i <= 4; i++) { T.set(fx + i, fy - 1, i % 2 ? hex('#5A1A0A') : hex('#8A2A0A')); }
    for (let i = -5; i <= 5; i++) T.set(fx + i, fy - 7, hex('#3A3A44')); // a grelha
    for (let i = -3; i <= 2; i++) { T.set(fx + i, fy - 8, hex('#B8C8D0')); } T.set(fx + 3, fy - 8, hex('#7A8A98')); T.set(fx - 4, fy - 9, hex('#B8C8D0')); // o peixe
    this.luzes.push({ x: fx, y: fy - 6, r: 34, k: 0.7, tremer: true });
  },
  viva(T, t, f) {
    cais.viva.call(this, T, t, f);
    const [fx, fy] = this.fogo;
    // a chama, as fagulhas subindo e a luz dançando nas paredes
    for (let i = -3; i <= 3; i++) { const alt = 3 + Math.round(Math.abs(Math.sin(t * 9 + i * 1.7)) * (5 - Math.abs(i))); for (let j = 0; j < alt; j++) T.set(fx + i, fy - 2 - j, j > alt - 2 ? hex('#FFF0B8') : j > alt / 2 ? hex('#FFC040') : BRASA); }
    for (let i = 0; i < 9; i++) { const k = (t * 0.6 + i / 9) % 1, X = fx + Math.sin(t * 2 + i * 3) * (2 + k * 5), Y = fy - 8 - k * 34; if (k < 0.85) T.set(X, Y, k < 0.4 ? hex('#FFD878') : BRASA); }
    T.brilho(fx, fy - 6, 34, hex('#FF8A30'), 0.5 + Math.sin(t * 11) * 0.06 + Math.sin(t * 5.3) * 0.05);
    // os frutos dourados acendem devagar
    for (const [x, y] of this.uvas) T.brilho(x, y, 7, hex('#FFD860'), 0.35 + Math.sin(t * 1.6 + x) * 0.15);
    // a turma sentada em volta do fogo
    const tinta = hex('#20183A');
    [[-17, 1], [13, -1], [-28, 1], [25, -1]].forEach(([dx, vira], i) => { const s = quadroPessoa(TURMA[i], t + i * 0.7, 'abertura-turma-' + i, 'ceu'); if (!s?.b) return;
      for (let j = 0; j < s.h; j++) for (let k = 0; k < s.w; k++) { const c = s.b[j * s.w + k]; if (!(c >>> 24)) continue; T.set(fx + dx - 24 + (vira < 0 ? s.w - 1 - k : k), fy - 38 + j + (i >= 2 ? 3 : 0), mixc2(mixc2(c, tinta, 0.18), hex('#FF9A40'), Math.max(0, 0.22 - Math.abs(dx) * 0.006))); } });
  }
});

// O logo da célula, em pixel, para pôr no canto da tela (como um carimbo): letras creme com contorno de tinta e sombra,
// o ramo de videira com o cacho dourado e a referência. Devolve um canvas pequeno (o CSS amplia sem suavizar).
export function logoCelula(linhas = ['JESUS ME', 'ESCOLHEU'], sub = 'JOÃO 15:16 · CÉLULA') {
  const F = FONTE, k = 2, larg = Math.max(...linhas.map(l => largura(l))) * k + 20, alt = linhas.length * 9 * k + 26, T = new Tela(larg, alt);
  const CREME = rampa(['#8A6A4A', '#C8A878', '#EAD6AE', '#F6EBD0', '#FFFAEC']), TINT = hex('#120C1C');
  const px = [];
  linhas.forEach((l, li) => { let x = 10; for (const ch of l) { const nfd = ch.normalize('NFD'), g = F.glyphs[nfd[0].toUpperCase()]; if (!g) { x += (F.space + F.gap) * k; continue; }
    g.rows.forEach((row, y) => row.forEach((on, gx) => { if (on) px.push([x + gx * k, 4 + li * 9 * k + y * k + (li ? 2 : 0) - (gx % 2 && li === 0 ? 0 : 0)]); })); x += (g.w + F.gap) * k; } });
  for (const [x, y] of px) for (let j = -1; j <= k; j++) for (let i = -1; i <= k; i++) T.set(x + i + 1, y + j + 2, TINT); // sombra
  for (const [x, y] of px) for (let j = -1; j <= k; j++) for (let i = -1; i <= k; i++) T.set(x + i, y + j, TINT); // contorno
  for (const [x, y] of px) for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) T.set(x + i, y + j, CREME[(y % (9 * k)) < 5 ? 4 : (y % (9 * k)) < 10 ? 3 : 2]);
  // o ramo de videira por baixo, com folhas e o cacho dourado na ponta
  const y0 = alt - 14; for (let x = 8; x < larg - 18; x++) { const Y = y0 + Math.round(Math.sin(x * 0.18) * 1.5); T.set(x, Y, CASCA_N[5]); T.set(x, Y + 1, TINT); if (x % 11 === 0) { for (let i = 0; i < 4; i++) { T.set(x + i, Y - 1 - (i % 2), VIDE[6]); T.set(x + i, Y - 2, VIDE[7]); } } }
  cacho(T, larg - 16, y0 - 1, OURO_U, 4);
  // a referência em letra pequena
  let x = 12; const MINI = FONTS.mini; for (const ch of sub) { const nfd = ch.normalize('NFD'), g = MINI.glyphs[nfd[0].toUpperCase()]; if (!g) { x += MINI.space + MINI.gap; continue; } g.rows.forEach((row, yy) => row.forEach((on, gx) => { if (on) { T.set(x + gx, y0 + 4 + yy, CREME[3]); T.set(x + gx + 1, y0 + 5 + yy, TINT); } })); const m = nfd.slice(1), mx = x + (g.w >> 1); if (m.includes('\u0303')) { T.set(mx - 1, y0 + 2, CREME[3]); T.set(mx, y0 + 1, CREME[3]); T.set(mx + 1, y0 + 2, CREME[3]); } if (m.includes('\u0301')) T.set(mx + 1, y0 + 2, CREME[3]); x += g.w + MINI.gap; }
  const cv = document.createElement('canvas'); cv.width = larg; cv.height = alt; const im = new ImageData(larg, alt); composite(T.f, im.data, null, 1); cv.getContext('2d').putImageData(im, 0, 0); return cv;
}
const FONTE = FONTS.big, largura = l => { let w = 0; for (const ch of l) { const g = FONTE.glyphs[ch.normalize('NFD')[0].toUpperCase()]; w += (g ? g.w : FONTE.space) + FONTE.gap; } return w; };

const CENAS = { cais, praca, getsemani, jerusalem, galileia };
const SORTEIO = ['cais', 'praca']; // as telas entram no sorteio quando estão prontas
export const NOMES_CENAS = Object.keys(CENAS);

// sorteia a cena sem repetir a da última vez (?abertura=nome força uma)
export function sortearCena() {
  const q = new URLSearchParams(location.search).get('abertura'); if (q && CENAS[q]) return q;
  let ult = ''; try { ult = localStorage.getItem('peregrinos.abertura') || ''; } catch {}
  const op = SORTEIO.length > 1 ? SORTEIO.filter(n => n !== ult) : SORTEIO, n = op[Math.floor(Math.random() * op.length)];
  try { localStorage.setItem('peregrinos.abertura', n); } catch {}
  return n;
}

const cache = new Map();
// as cores das beiradas da cena (para o céu de cima e o chão de baixo continuarem a pintura, no celular em pé)
const coresCache = new Map();
function cores(cv, nome, w) { const k = nome + w; let c = coresCache.get(k); if (c) return c; const g = cv.getContext('2d'), med = y => { const d = g.getImageData(0, y, w, 1).data; let r = 0, gg = 0, b = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; } const n = d.length / 4; return [r / n, gg / n, b / n]; };
  const a = med(0), b0 = med(H - 1), hx = (v, f = 1) => '#' + v.map(x => Math.max(0, Math.min(255, Math.round(x * f))).toString(16).padStart(2, '0')).join('');
  c = { ceu0: hx(a, 0.55), ceu1: hx(a), chao: hx(b0), noite: (a[0] + a[1] + a[2]) / 3 < 90 }; coresCache.set(k, c); return c; }
let quadro = null, baixa = null, img = null;
export function desenharAbertura(c, t, nome) {
  const cena = CENAS[nome] || cais;
  const dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, Hh = innerHeight;
  if (!W || !Hh) return;
  if (c.width !== Math.round(W * dpr) || c.height !== Math.round(Hh * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(Hh * dpr); }
  // a cena tem 180 de altura; a largura acompanha a janela. Em pé (celular), a cena fica mais larga e se centra no foco
  const retrato = W < Hh, w = retrato ? 260 : Math.max(260, Math.ceil(H * W / Hh)), foco = retrato ? 160 : Math.round(clamp(w * 0.68, 180, w - 100));
  const chave = nome + ':' + w;
  let fundo = cache.get(chave);
  if (!fundo) { const T = new Tela(w, H); cena.parada(T, rng(nome.length * 977 + 13), foco); fundo = { C: T.C.slice(), L: T.L.slice() }; cache.set(chave, fundo); }
  if (!quadro || quadro.w !== w) { quadro = new Tela(w, H); baixa = document.createElement('canvas'); baixa.width = w; baixa.height = H; img = new ImageData(w, H); }
  quadro.C.set(fundo.C); quadro.L.set(fundo.L); quadro.p.reset();
  cena.viva(quadro, t, foco);
  composite(quadro.f, img.data, null, 1); baixa.getContext('2d').putImageData(img, 0, 0);
  const G2 = c.getContext('2d'); G2.imageSmoothingEnabled = false;
  if (retrato) { // celular em pé: céu com o título em cima, a cena inteira enquadrada no meio, e o chão escuro com o menu embaixo
    const topo = Math.round(c.height * 0.27), alt = Math.round(c.height * 0.47), k = alt / H, larg = w * k, x0 = Math.min(0, Math.max(c.width - larg, Math.round(c.width / 2 - foco * k)));
    const cor = cores(baixa, nome, w), gr1 = G2.createLinearGradient(0, 0, 0, topo + 2); gr1.addColorStop(0, cor.ceu0); gr1.addColorStop(1, cor.ceu1); G2.fillStyle = gr1; G2.fillRect(0, 0, c.width, topo + 2);
    const px = Math.max(2, Math.round(k)); for (let i = 0; i < 46; i++) { const sx = (i * 7919) % c.width, sy = (i * 3571) % Math.max(1, topo - 10); if (cor.noite && Math.sin(t * (0.6 + (i % 5) * 0.3) + i) > -0.3) { G2.fillStyle = i % 7 ? '#9AA8D8' : '#FFFFFF'; G2.fillRect(sx - sx % px, sy - sy % px, px, px); } } // estrelas no céu de cima, do tamanho do pixel da cena
    G2.drawImage(baixa, 0, 0, w, H, x0, topo, larg, alt);
    const fim = topo + alt, gr2 = G2.createLinearGradient(0, fim - 2, 0, c.height); gr2.addColorStop(0, cor.chao); gr2.addColorStop(0.35, '#0D0806'); gr2.addColorStop(1, '#0D0806'); G2.fillStyle = gr2; G2.fillRect(0, fim - 1, c.width, c.height - fim + 1);
    G2.fillStyle = 'rgba(13,8,6,.55)'; G2.fillRect(0, fim - Math.round(alt * 0.12), c.width, Math.round(alt * 0.12)); // a cena afunda devagar no escuro do menu
    return; }
  else G2.drawImage(baixa, 0, 0, w, H, 0, 0, c.width, c.height);
  // sombra à esquerda, para o título e o menu lerem bem sobre qualquer cena
  const gr = retrato ? G2.createLinearGradient(0, 0, 0, c.height) : G2.createLinearGradient(0, 0, c.width * 0.5, 0);
  if (retrato) { gr.addColorStop(0, 'rgba(0,0,0,.5)'); gr.addColorStop(0.3, 'rgba(0,0,0,0)'); gr.addColorStop(0.65, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.6)'); }
  else { gr.addColorStop(0, 'rgba(0,0,0,.42)'); gr.addColorStop(0.7, 'rgba(0,0,0,.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); }
  G2.fillStyle = gr; G2.fillRect(0, 0, c.width, c.height);
}
