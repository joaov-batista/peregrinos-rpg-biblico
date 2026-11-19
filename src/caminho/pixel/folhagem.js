// Folhagem de verdade, para sprites: a copa é uma superfície só (os cachos se fundem), a luz vem do relevo dela e de
// cachos menores de folhas (células) com fresta escura entre eles; a borda é recortada por folhas soltas, a sombra
// fecha embaixo e o lado da luz acende. Galhos e troncos seguem curvas, afinando, com sulcos na casca.
// R é uma rampa de cores já prontas (uint32), do escuro para o claro.
const h2 = (x, y, s) => { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 982451653)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const ruido = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), a = h2(xi, yi, s), b = h2(xi + 1, yi, s), c = h2(xi, yi + 1, s), d = h2(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
const fbm = (x, y, s) => (ruido(x, y, s) * 0.6 + ruido(x * 2, y * 2, s + 7) * 0.3 + ruido(x * 4, y * 4, s + 13) * 0.1);
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const tom = (R, v, x, y) => { const n = R.length, f = Math.max(0, Math.min(0.9999, v)) * n; let i = Math.floor(f); if (f - i > 0.78 + ((BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16 - 0.5) * 0.4) i++; return R[Math.min(n - 1, i)]; };
function celula(x, y, s) { const xi = Math.floor(x), yi = Math.floor(y); let d1 = 9, d2 = 9, bx = 0, by = 0, id = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = xi + i + h2(xi + i, yi + j, s), cy = yi + j + h2(xi + i, yi + j, s + 1), ex = x - cx, ey = y - cy, d = ex * ex + ey * ey; if (d < d1) { d2 = d1; d1 = d; bx = ex; by = ey; id = h2(xi + i, yi + j, s + 2); } else if (d < d2) d2 = d; } return [Math.sqrt(d1), Math.sqrt(d2), bx, by, id]; }

// a copa: blobs = [{x, y, r}], em pixels do sprite
export function copa(s, blobs, R, o = {}) {
  const { lx = -0.6, ly = -0.75, sd = 1, folha = 3, aspero = 0.3, buracos = 0.25, soltas = true } = o;
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const b of blobs) { x0 = Math.min(x0, b.x - b.r * 1.3); x1 = Math.max(x1, b.x + b.r * 1.3); y0 = Math.min(y0, b.y - b.r * 1.3); y1 = Math.max(y1, b.y + b.r * 1.3); }
  x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(s.w - 1, Math.ceil(x1)); y1 = Math.min(s.h - 1, Math.ceil(y1));
  const W = x1 - x0 + 1, H = y1 - y0 + 1, A = new Float32Array(W * H), cx = blobs.reduce((a, b) => a + b.x, 0) / blobs.length, cy = blobs.reduce((a, b) => a + b.y, 0) / blobs.length, Rg = Math.max(W, H) / 2;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const x = x0 + i, y = y0 + j, n = (fbm(x * 0.18, y * 0.22, sd) - 0.5) * 2 * aspero; let hh = 0; for (const b of blobs) { const dx = x - b.x, dy = (y - b.y) * 1.12, er = b.r * (1 + n), d2 = dx * dx + dy * dy; if (d2 < er * er) hh = Math.max(hh, Math.sqrt(er * er - d2)); } A[j * W + i] = hh; }
  const at = (i, j) => i < 0 || j < 0 || i >= W || j >= H ? 0 : A[j * W + i], L = Math.hypot(lx, ly, 0.6), LX = lx / L, LY = ly / L, LZ = 0.6 / L;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const hh = A[j * W + i]; if (hh <= 0) continue; const x = x0 + i, y = y0 + j;
    const gx = (at(i + 1, j) - at(i - 1, j)) / 2, gy = (at(i, j + 1) - at(i, j - 1)) / 2, nl = Math.hypot(gx, gy, 1.4), dif = (-gx * LX - gy * LY + 1.4 * LZ) / nl;
    const c = celula(x / folha, y / (folha * 0.8), sd + 5), fol = Math.max(-1, Math.min(1, (c[2] * LX + c[3] * LY) * 1.7)), fresta = c[1] - c[0] < 0.17;
    if (buracos && fresta && hh < 4 && fbm(x * 0.3, y * 0.3, sd + 9) < buracos) continue; // o céu aparece entre os cachos
    let v = 0.12 + dif * 0.55 + fol * 0.22 + ((x - cx) * LX + (y - cy) * LY) / Rg * 0.3 - (fresta ? 0.2 : 0) + (c[4] - 0.5) * 0.1;
    const borda = at(i - 1, j) <= 0 || at(i + 1, j) <= 0 || at(i, j - 1) <= 0 || at(i, j + 1) <= 0;
    if (borda) { const ox = (at(i - 1, j) <= 0 ? -1 : 0) + (at(i + 1, j) <= 0 ? 1 : 0), oy = (at(i, j - 1) <= 0 ? -1 : 0) + (at(i, j + 1) <= 0 ? 1 : 0), d = ox * LX + oy * LY; v = d > 0.2 ? v + 0.25 : d < -0.2 ? 0 : v - 0.1; }
    s.px(x, y, tom(R, v, x, y));
  }
  if (soltas) for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { if (A[j * W + i] > 0 || !(at(i - 1, j) > 0 || at(i + 1, j) > 0 || at(i, j - 1) > 0 || at(i, j + 1) > 0)) continue; const x = x0 + i, y = y0 + j; if (h2(x, y, sd + 3) < 0.3) { const lado = ((x - cx) * LX + (y - cy) * LY) / Rg; s.px(x, y, R[lado > 0.2 ? R.length - 2 : lado < -0.2 ? 0 : 1]); } } // folhas soltas recortando a borda
}

// tronco ou galho: segue os pontos da base para a ponta, afinando; luz de um lado, sulcos compridos na casca
export function galho(s, pts, r0, r1, R, o = {}) {
  const { lx = -0.6, ly = -0.6, sd = 3 } = o; let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) || 0.01; seg.push(l); L += l; }
  let acc = 0;
  for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i], l = seg[i - 1], tx = (bx - ax) / l, ty = (by - ay) / l, px = -ty, py = tx, lado = px * lx + py * ly;
    for (let d = 0; d <= l; d += 0.4) { const t = (acc + d) / L, rr = r0 + (r1 - r0) * t, X = ax + tx * d, Y = ay + ty * d;
      for (let u = -rr; u <= rr; u += 0.5) { const k = u / rr, sulco = Math.abs(fbm((acc + d) * 0.07, (u + rr) * 0.6, sd) - 0.5) < 0.05; let v = 0.4 + k * lado * 0.6 + Math.sqrt(Math.max(0, 1 - k * k)) * 0.2 - (sulco ? 0.3 : 0); if (Math.abs(k) > 0.8) v = k * lado > 0 ? v + 0.05 : 0.02; s.px(X + px * u, Y + py * u, tom(R, v, Math.round(X + px * u), Math.round(Y + py * u))); } }
    acc += l; }
}

// uma árvore inteira num sprite: tronco que se abre em galhos e a copa em cachos em cima de cada galho
export function arvore(s, { base, alt, larg, Rt, Rf, sd = 1, torto = 0.3, tronco = 3, cachos = 7 }) {
  const [bx, by] = base, R = (n) => h2(sd, n, 77);
  const topo = [bx + (R(1) - 0.5) * larg * torto, by - alt * 0.42];
  galho(s, [[bx, by], [bx + (R(2) - 0.5) * 3, by - alt * 0.25], topo], tronco, tronco * 0.6, Rt, { sd });
  const blobs = [];
  for (let k = 0; k < cachos; k++) { const a = -Math.PI / 2 + (k / (cachos - 1) - 0.5) * 2.4, comp = alt * (0.32 + R(k + 10) * 0.2), ex = topo[0] + Math.cos(a) * comp * (larg / alt) * 1.35, ey = topo[1] + Math.sin(a) * comp * 0.85;
    galho(s, [topo, [(topo[0] + ex) / 2, (topo[1] + ey) / 2 - 2], [ex, ey]], tronco * 0.55, 0.8, Rt, { sd: sd + k });
    blobs.push({ x: ex, y: ey - 2, r: larg * (0.13 + R(k + 30) * 0.07) }); if (R(k + 60) > 0.4) blobs.push({ x: (topo[0] + ex) / 2 + (R(k + 70) - 0.5) * 6, y: (topo[1] + ey) / 2 - 3, r: larg * 0.09 }); } // cachos nas pontas e no meio dos galhos, com vão entre eles
  blobs.push({ x: topo[0], y: topo[1] - alt * 0.3, r: larg * 0.17 });
  copa(s, blobs, Rf, { sd: sd + 50, folha: 2.4, buracos: 0.42, aspero: 0.45 });
}

// a oliveira: tronco grosso, retorcido e oco, que se divide em dois braços; a copa larga e baixa, prateada por cima e
// verde-escura por baixo, em camadas de cachos com o céu passando entre elas (64 x 80, pé em 32,79)
export function oliveira(s, sd = 11) {
  const Tr = [0xff1a2230, 0xff22303e, 0xff2e4458, 0xff40607a, 0xff5c8098].map(c => c); // casca cinza-parda (ABGR)
  const casca = [cor('#2A2420'), cor('#3E342C'), cor('#56483C'), cor('#706050'), cor('#8C7C68')];
  const folha = [cor('#1E2A1C'), cor('#2E3E28'), cor('#425636'), cor('#5C6E48'), cor('#7E8C64'), cor('#A4AE88'), cor('#C4CCAA')];
  // o tronco: dois troncos torcidos que sobem juntos, com o oco escuro entre eles e as raízes abrindo no chão
  galho(s, [[27, 79], [25, 70], [28, 60], [24, 50], [18, 40]], 4.2, 2.2, casca, { sd: sd + 1, lx: -0.7, ly: -0.4 });
  galho(s, [[37, 79], [38, 70], [35, 61], [39, 50], [46, 38]], 3.8, 2, casca, { sd: sd + 2, lx: -0.7, ly: -0.4 });
  for (let y = 62; y < 74; y++) for (let x = 30; x < 34; x++) if (Math.abs(x - 32) < (y - 60) / 5) s.px(x, y, casca[0]); // o oco
  for (const [a, b] of [[[22, 79], [16, 79]], [[42, 79], [49, 79]]]) galho(s, [a, b], 1.6, 0.6, casca, { sd: sd + 3 });
  // os galhos que saem dos dois braços
  for (const pts of [[[18, 40], [10, 34], [5, 30]], [[18, 40], [20, 30], [16, 22]], [[46, 38], [54, 33], [59, 30]], [[46, 38], [44, 28], [48, 20]], [[24, 50], [32, 40], [32, 28]]]) galho(s, pts, 1.6, 0.7, casca, { sd: sd + pts[2][0] });
  // a copa: cachos em três camadas (de baixo, escura; do meio; de cima, prateada), largos e baixos
  const camada = (bl, R, o) => copa(s, bl, R, { sd: sd + o, folha: 2.2, buracos: 0.4, aspero: 0.5, lx: -0.5, ly: -0.85 });
  camada([{ x: 8, y: 34, r: 7 }, { x: 20, y: 36, r: 7 }, { x: 44, y: 35, r: 7 }, { x: 56, y: 33, r: 7 }, { x: 32, y: 34, r: 6 }], folha.slice(0, 5), 1);
  camada([{ x: 13, y: 26, r: 8 }, { x: 27, y: 24, r: 8 }, { x: 40, y: 25, r: 8 }, { x: 52, y: 26, r: 7 }], folha.slice(1, 6), 2);
  camada([{ x: 20, y: 16, r: 7 }, { x: 33, y: 13, r: 8 }, { x: 45, y: 16, r: 7 }], folha.slice(2, 7), 3);
  for (let i = 0; i < 40; i++) { const x = 4 + Math.floor(h2(i, sd, 5) * 56), y = 8 + Math.floor(h2(sd, i, 6) * 32); if (s.le(x, y) && s.le(x, y - 1) === 0) s.px(x, y, folha[6]); } // o prateado do avesso das folhas, na borda de cima
}
import { cor } from './raster.js';
